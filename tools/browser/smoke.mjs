// End-to-end smoke test against the dev server. Exit code 0 = all checks passed.
// usage: node tools/browser/smoke.mjs [url]
import { checklist, DEFAULT_URL, GAME_STATE_EXPR, launch, sleep } from './lib.mjs';

const url = process.argv[2] ?? DEFAULT_URL;
const b = await launch('smoke');
const c = checklist();
const state = () => b.evaluate(GAME_STATE_EXPR);

try {
  // ---------- Desktop ----------
  await b.emulate(1280, 720, 1, false);
  await b.openGame(url);
  const start = await state();
  c.check('boots into PLAYING', start.state === 'PLAYING', start.state);

  await b.waitForSimTime(15);
  const early = await state();
  c.check('multiple kills within 15 s with no input', early.kills >= 2, `kills=${early.kills}`);
  await b.screenshot('desktop-combat.png');

  // Keyboard: hold left, then release.
  await b.key('keyDown', 'ArrowLeft', 37);
  await sleep(350);
  const moving = await state();
  await b.key('keyUp', 'ArrowLeft', 37);
  await sleep(350);
  const stopped = await state();
  c.check('keyboard moves left at speed', moving.vx < -10 && moving.input === 'keyboard', `vx=${moving.vx}`);
  c.check('releasing keys stops the ship', Math.abs(stopped.vx) < 0.01, `vx=${stopped.vx}`);

  // Mouse follow towards the upper right (clamped to the lane).
  await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 900, y: 250 });
  await sleep(1200);
  const mouse = await state();
  c.check('mouse follow moves towards the cursor', mouse.input === 'mouse' && mouse.x > 5 && mouse.y > stopped.y, `x=${mouse.x} y=${mouse.y}`);

  // Pause freezes simulated time.
  await b.press('Escape', 27);
  await sleep(150);
  const p1 = await state();
  await sleep(700);
  const p2 = await state();
  c.check('Esc pauses', p1.state === 'PAUSED', p1.state);
  c.check('pause freezes the simulation', p1.t === p2.t, `${p1.t} -> ${p2.t}`);
  await b.press('Escape', 27);
  await sleep(200);
  c.check('Esc resumes', (await state()).state === 'PLAYING');

  // Soak: immortal player sweeping for ~20 s; pools must not grow without bound.
  await b.evaluate('window.game.session.stats.health = window.game.session.stats.maxHealth = 999; true');
  const soakStart = await state();
  for (let i = 0; i < 10; i++) {
    const left = i % 2 === 0;
    await b.key('keyDown', left ? 'ArrowLeft' : 'ArrowRight', left ? 37 : 39);
    await sleep(800);
    await b.key('keyUp', left ? 'ArrowLeft' : 'ArrowRight', left ? 37 : 39);
    await sleep(1200);
  }
  const soakEnd = await state();
  c.check('no projectile spawns refused', soakEnd.rejected === 0, `rejected=${soakEnd.rejected}`);
  c.check('entity count stays bounded', soakEnd.entities - soakStart.entities < 40, `${soakStart.entities} -> ${soakEnd.entities}`);
  c.check('kills keep coming during the soak', soakEnd.kills > soakStart.kills, `${soakStart.kills} -> ${soakEnd.kills}`);

  // Death through the real path: an enemy bullet dropped onto the player.
  await b.evaluate(`(() => { const s = window.game.session.stats; s.maxHealth = 5; s.health = 1; s.shield = 0; s.invulnerable = 0; return true; })()`);
  await b.evaluate(`(() => { const g = window.game.session, p = g.player.position;
    return g.enemyProjectiles.spawn({ x: p.x, y: p.y + 0.6, vx: 0, vy: -8, damage: 1, radius: 0.2, life: 2, pierce: 0,
      areaRadius: 0, length: 0.6, width: 0.6, r: 1, g: 0.2, b: 0.3, shape: 3 }); })()`);
  await sleep(400);
  const dying = await state();
  c.check('player dies from an enemy bullet', !dying.alive, `hp=${dying.hp}`);
  c.check('death delay before game over', dying.state === 'PLAYING', dying.state);
  await sleep(2000);
  const over = await state();
  const overlay = await b.evaluate(`document.querySelector('.overlay')?.classList.contains('is-visible') ?? false`);
  c.check('game over state and screen', over.state === 'GAME_OVER' && overlay, `${over.state} overlay=${overlay}`);
  await b.screenshot('desktop-gameover.png');

  await b.press('Enter', 13);
  await sleep(1200);
  const retry = await state();
  c.check('Enter retries into a fresh run', retry.state === 'PLAYING' && retry.kills === 0 && retry.hp === 5, JSON.stringify({ s: retry.state, k: retry.kills, hp: retry.hp }));

  // ---------- Mobile portrait ----------
  await b.emulate(390, 844, 3, true);
  await b.openGame(url);
  await sleep(1500);
  const m0 = await state();
  await b.touch('touchStart', [[195, 760]]);
  for (let i = 1; i <= 12; i++) {
    await b.touch('touchMove', [[195 + i * 10, 760 - i * 13]]);
    await sleep(30);
  }
  await sleep(700);
  const m1 = await state();
  await b.screenshot('mobile-drag.png');
  await b.touch('touchEnd', []);
  c.check('touch drag moves right and up', m1.x - m0.x > 3 && m1.y - m0.y > 3 && m1.input === 'touch', `dx=${(m1.x - m0.x).toFixed(2)} dy=${(m1.y - m0.y).toFixed(2)}`);

  await b.emulate(844, 390, 3, true);
  await sleep(800);
  const land = await state();
  c.check('rotation resizes the canvas', land.canvas[0] > land.canvas[1], land.canvas.join('x'));
  await b.screenshot('mobile-landscape.png');

  c.check('no page errors', b.errors.length === 0, b.errors.slice(0, 3).join(' | '));
} catch (err) {
  c.check('harness ran to completion', false, String(err));
} finally {
  await b.close();
}

const ok = c.summary();
console.log('screenshots in tools/browser/out/');
process.exit(ok ? 0 : 1);
