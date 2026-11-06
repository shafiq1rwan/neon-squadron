// Prints a one-line game state every second, with per-call timeouts. Use it to find hangs,
// crashes or runaway growth on a given viewport.
// usage: node tools/browser/probe.mjs [seconds=30] [WIDTHxHEIGHT=390x844] [dpr=2] [mobile=1] [--url=...]
import { DEFAULT_URL, GAME_STATE_EXPR, launch, sleep } from './lib.mjs';

const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith('--url='))?.slice(6) ?? DEFAULT_URL;
const [seconds = '30', size = '390x844', dpr = '2', mobile = '1'] = args.filter((a) => !a.startsWith('--'));
const [w, h] = size.split('x').map(Number);

const b = await launch('probe');
try {
  await b.emulate(w, h, Number(dpr), mobile === '1');
  await b.openGame(url);
  for (let i = 0; i < Number(seconds); i++) {
    await sleep(1000);
    try {
      const s = await b.evaluate(GAME_STATE_EXPR);
      console.log(
        `${String(i).padStart(3)}s  ${s.state.padEnd(9)} t=${s.t.toFixed(1).padStart(5)} kills=${s.kills} hp=${s.hp}` +
          ` enemies=${s.enemies}/${s.pooledEnemies} shots=${s.playerShots}+${s.enemyShots} particles=${s.particles}` +
          ` entities=${s.entities} draws=${s.drawCalls}`,
      );
    } catch (err) {
      console.log(`${String(i).padStart(3)}s  ERROR ${err.message}`);
    }
  }
  if (b.errors.length) console.log('page errors:', b.errors);
} finally {
  await b.close();
}
