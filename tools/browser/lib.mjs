// Shared helpers for driving a headless Chromium browser (Chrome or Edge) over the DevTools
// protocol. No dependencies: uses Node's built-in fetch and WebSocket (Node >= 22).
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'out');
export const DEFAULT_URL = process.env.GAME_URL ?? 'http://localhost:5173/?seed=DEMO';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Finds a Chromium-based browser. Override with BROWSER_PATH. */
export function findBrowser() {
  if (process.env.BROWSER_PATH) return process.env.BROWSER_PATH;
  const candidates = {
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ],
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ],
    linux: ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'],
  }[process.platform] ?? [];
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error('No Chrome/Edge found. Set BROWSER_PATH to a Chromium-based browser.');
  return found;
}

/**
 * Launches a headless browser with its own profile and connects to its first page.
 * Always call `close()` — it shuts the browser down over CDP (the Windows launcher process exits
 * immediately, so killing the spawned process would leave the real browser running).
 */
export async function launch(name = 'run', port = 9400 + Math.floor(Math.random() * 400)) {
  mkdirSync(OUT_DIR, { recursive: true });
  const profile = join(OUT_DIR, `profile-${name}`);
  spawn(
    findBrowser(),
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore', detached: false },
  );

  let pageWs;
  let browserWs;
  for (let i = 0; i < 150 && !pageWs; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      pageWs = list.find((t) => t.type === 'page')?.webSocketDebuggerUrl;
      browserWs = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl;
    } catch {
      // not up yet
    }
    if (!pageWs) await sleep(200);
  }
  if (!pageWs) throw new Error('Browser did not expose a page target');

  const ws = new WebSocket(pageWs);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  const logs = [];
  const errors = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      p(m);
    } else if (m.method === 'Runtime.exceptionThrown') {
      errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
    } else if (m.method === 'Runtime.consoleAPICalled') {
      const text = m.params.args.map((a) => a.value ?? a.description).join(' ');
      if (m.params.type === 'error') errors.push(text);
      else if (m.params.type !== 'debug') logs.push(`[${m.params.type}] ${text}`);
    }
  });

  /** Sends a CDP command; rejects on protocol error or after `timeout` ms. */
  const send = (method, params = {}, timeout = 10000) =>
    Promise.race([
      new Promise((resolve, reject) => {
        const id = ++nextId;
        pending.set(id, (m) => (m.error ? reject(new Error(`${method}: ${JSON.stringify(m.error)}`)) : resolve(m.result)));
        ws.send(JSON.stringify({ id, method, params }));
      }),
      sleep(timeout).then(() => {
        throw new Error(`${method} timed out after ${timeout} ms (page hung or crashed?)`);
      }),
    ]);

  /** Evaluates an expression in the page and returns its JSON value. */
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (r.exceptionDetails) throw new Error(`evaluate failed: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
    return r.result.value;
  };

  const screenshot = async (file) => {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const path = join(OUT_DIR, file);
    writeFileSync(path, Buffer.from(data, 'base64'));
    return path;
  };

  const emulate = async (width, height, dpr = 1, mobile = false) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile });
    await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 });
  };

  const key = async (type, code, keyCode) =>
    send('Input.dispatchKeyEvent', { type, code, key: code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });

  const press = async (code, keyCode) => {
    await key('keyDown', code, keyCode);
    await key('keyUp', code, keyCode);
  };

  const touch = (type, points) =>
    send('Input.dispatchTouchEvent', {
      type,
      touchPoints: points.map(([x, y], id) => ({ x, y, id, radiusX: 5, radiusY: 5, force: 1 })),
    });

  /** Navigates and waits until `window.game` exists. */
  const openGame = async (url = DEFAULT_URL) => {
    await send('Page.navigate', { url });
    for (let i = 0; i < 150; i++) {
      try {
        if (await evaluate('!!window.game')) return;
      } catch {
        // context not ready during navigation
      }
      await sleep(200);
    }
    throw new Error('window.game never appeared — is `npm run dev` running? (window.game exists in dev builds only)');
  };

  /** Waits until the run's simulated time reaches `seconds`. */
  const waitForSimTime = async (seconds, maxMs = 60000) => {
    const start = Date.now();
    while ((await evaluate('window.game.session.elapsed')) < seconds) {
      if (Date.now() - start > maxMs) throw new Error(`sim time did not reach ${seconds}s`);
      await sleep(100);
    }
  };

  const close = async () => {
    try {
      ws.close();
      if (browserWs) {
        const bws = new WebSocket(browserWs);
        await new Promise((r) => bws.addEventListener('open', r, { once: true }));
        bws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
        await sleep(300);
        bws.close();
      }
    } catch {
      // already gone
    }
  };

  await send('Runtime.enable');
  await send('Page.enable');
  return { send, evaluate, screenshot, emulate, key, press, touch, openGame, waitForSimTime, close, logs, errors };
}

/** Snapshot of the running game (dev build). */
export const GAME_STATE_EXPR = `(() => {
  const g = window.game, s = g.session;
  const count = (n) => { let k = 1; for (const c of n.children) k += count(c); return k; };
  return {
    state: g.state.state, t: +s.elapsed.toFixed(2), kills: s.kills, coins: s.coins,
    hp: s.stats.health, shield: s.stats.shield, alive: s.stats.alive,
    x: +s.player.position.x.toFixed(2), y: +s.player.position.y.toFixed(2),
    vx: +s.player.velocity.x.toFixed(2), vy: +s.player.velocity.y.toFixed(2),
    input: g.input.mode, enemies: s.enemies.active.length, pooledEnemies: s.enemies.pooledTotal,
    playerShots: s.playerProjectiles.count, enemyShots: s.enemyProjectiles.count,
    rejected: s.playerProjectiles.rejected + s.enemyProjectiles.rejected,
    particles: s.particles.count, drawCalls: g.app.stats.drawCalls.total, entities: count(g.app.root),
    canvas: [g.app.graphicsDevice.width, g.app.graphicsDevice.height],
  };
})()`;

/** Tiny assertion collector so a run reports every failure, not just the first. */
export function checklist() {
  const results = [];
  return {
    check(name, ok, detail = '') {
      results.push({ name, ok: !!ok, detail });
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
    },
    summary() {
      const failed = results.filter((r) => !r.ok);
      console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
      return failed.length === 0;
    },
  };
}

