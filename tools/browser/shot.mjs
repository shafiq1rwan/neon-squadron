// Screenshots at exact viewport sizes after N seconds of simulated play (dev overlay hidden).
// usage: node tools/browser/shot.mjs <simSeconds> name:WIDTHxHEIGHT:dpr:mobile(0|1) [...] [--url=...]
// e.g.   node tools/browser/shot.mjs 13 desk:1280x720:1:0 phone:390x844:2:1
import { DEFAULT_URL, GAME_STATE_EXPR, launch } from './lib.mjs';

const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith('--url='))?.slice(6) ?? DEFAULT_URL;
const [secs = '10', ...targets] = args.filter((a) => !a.startsWith('--'));
if (targets.length === 0) targets.push('desk:1280x720:1:0', 'phone:390x844:2:1');

const b = await launch('shot');
try {
  for (const t of targets) {
    const [name, size, dpr = '1', mobile = '0'] = t.split(':');
    const [w, h] = size.split('x').map(Number);
    await b.emulate(w, h, Number(dpr), mobile === '1');
    await b.openGame(url);
    await b.evaluate(`(() => { const el = document.querySelector('.perf-overlay'); if (el) el.style.display = 'none'; return true; })()`);
    await b.waitForSimTime(Number(secs));
    const path = await b.screenshot(`${name}.png`);
    const s = await b.evaluate(GAME_STATE_EXPR);
    console.log(`${path}  t=${s.t}s kills=${s.kills} hp=${s.hp} enemies=${s.enemies} drawCalls=${s.drawCalls}`);
  }
  if (b.errors.length) console.log('page errors:', b.errors);
} finally {
  await b.close();
}
