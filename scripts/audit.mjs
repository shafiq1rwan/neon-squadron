// Gameplay audit: fast-forwards a full run on every planet in a headless browser and fails on
//  - POP-INS: an enemy spawned inside the visible playfield without an entrance (`GameScene.emerge`),
//  - sprites showing a missing texture,
//  - orphan sprites (visible but owned by no system) and zombies (dead pool entries still visible),
//  - page errors.
// Usage: start `npm run dev`, then `npm run audit`. Needs Edge or Chrome installed
// (AUDIT_BROWSER=chrome to switch, AUDIT_URL to point elsewhere).
import { chromium } from "playwright-core";

const URL = process.env.AUDIT_URL ?? "http://localhost:5173/";
const channel = process.env.AUDIT_BROWSER === "chrome" ? "chrome" : "msedge";
const browser = await chromium.launch({ channel, headless: true });
const errors = [];
let failed = false;

// 1) every frame the data refers to must exist in some atlas
{
  const p = await (await browser.newContext()).newPage();
  p.on("pageerror", (e) => errors.push(`[assets] ${e.message}`));
  await p.route("**/poki-sdk.js", (r) => r.abort());
  await p.goto(URL);
  await p.waitForFunction(() => window.__game?.scene?.isActive("hud"), null, { timeout: 30000 });
  const missing = await p.evaluate(async () => {
    const { ENEMIES, PLANETS } = await import("/src/data/planets.ts");
    const { SHIPS } = await import("/src/data/ships.ts");
    const { UPGRADES } = await import("/src/data/upgrades.ts");
    const tex = window.__game.textures, have = new Set();
    for (const k of tex.getTextureKeys()) for (const f of tex.get(k).getFrameNames()) have.add(f);
    const need = new Set();
    for (const e of Object.values(ENEMIES)) { need.add(e.frame); if (e.head) need.add(e.head); }
    for (const pl of PLANETS) { need.add(pl.icon); need.add(pl.bullet); pl.landmarks.forEach((f) => need.add(f)); pl.deco.forEach((f) => need.add(f)); }
    for (const s of SHIPS) for (let c = 0; c <= 3; c++) for (let a = 0; a <= 2; a++) {
      const forms = s.transform ? ["ship", "mech"] : ["ship"];
      for (const f of forms) { need.add(`${f}_${s.id}_${c}${a}`); need.add(`${f}_${s.id}_${c}${a}@1`); need.add(`${f}_${s.id}_${c}${a}@2`); }
      if (s.transform) need.add(`${s.id}_morph_5`);
    }
    for (const u of Object.values(UPGRADES)) need.add(u.icon);
    for (const f of ["eshard", "emissile", "seeker", "blade", "bullet", "puff", "shield", "heart", "magnet", "xp", "xp_big", "flame", "scorch", "mine", "mine_lit", "crate", "fuel_tank", "bunker", "fx_launch_0", "fx_hatch_0"]) need.add(f);
    return [...need].filter((f) => !have.has(f));
  });
  if (missing.length) { failed = true; console.log("FAIL assets: frames referenced but missing:", missing); }
  else console.log("ok   assets: every referenced frame exists");
  await p.context().close();
}

// 2) fast-forward a run on every planet
for (const planet of [1, 2, 3, 4, 5]) {
  const p = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  p.on("pageerror", (e) => errors.push(`[planet ${planet}] ${e.message}`));
  await p.route("**/poki-sdk.js", (r) => r.abort());
  await p.goto(`${URL}?planet=${planet}&god`);
  await p.waitForFunction(() => window.__game?.scene?.getScene("game")?.state === "play", null, { timeout: 30000 });
  const report = await p.evaluate(() => {
    const g = window.__game.scene.getScene("game"), hud = window.__game.scene.getScene("hud");
    const inView = [], popIns = [], missing = new Set(), orphans = new Map(), zombies = new Map();
    let pending = [];
    const orig = g.spawnEnemy.bind(g);
    g.spawnEnemy = (def, x, y) => {
      const e = orig(def, x, y);
      if (y > 2 && g.state === "play") {
        const via = (new Error().stack || "").split("\n").slice(2, 4).map((l) => l.trim().replace(/\(.*\/src\//, "(").replace(/\?t=\d+/, "")).join(" <- ");
        pending.push({ e, line: `${def.id} via ${via}` });
      }
      return e;
    };
    const owned = () => {
      const s = new Set([g.ship, g.flame, g.bubble, ...g.attUnder, ...g.attOver, ...g.blades, ...g.fxPool]);
      for (const list of [g.enemies, g.shots, g.eshots, g.orbs, g.chunks, g.landmarks, g.puffs]) for (const o of list) s.add(o.s);
      for (const e of g.enemies) if (e.head) s.add(e.head);
      return s;
    };
    const check = () => {
      const own = owned();
      for (const o of g.children.list) {
        if (o.type !== "Sprite" || !o.visible || o.alpha === 0) continue;
        if (o.texture.key === "__MISSING") missing.add(o.frame.name);
        if (!own.has(o)) orphans.set(o.frame.name, (orphans.get(o.frame.name) ?? 0) + 1);
      }
      for (const list of [g.enemies, g.shots, g.eshots, g.orbs, g.chunks, g.landmarks, g.puffs])
        for (const o of list) if (!o.alive && o.s.visible) zombies.set(o.s.frame.name, (zombies.get(o.s.frame.name) ?? 0) + 1);
      for (const e of g.enemies) if (!e.alive && e.head?.visible) zombies.set("head:" + e.head.frame.name, 1);
    };
    // fast-forward at 30 steps per game second: auto-pick cards, fly a figure-eight
    let steps = 0;
    // 640 s of game time: enough to clear all 14 waves and spend a good while in the boss fight
    while (steps < 30 * 640 && g.state !== "clear" && g.state !== "over") {
      if (g.state === "levelup") { hud.keyHandler?.({ code: "Digit1" }); continue; }
      g.ship.x = 120 + Math.sin(steps / 90) * 80;
      g.ship.y = g.worldH - 70 + Math.sin(steps / 45) * 30;
      g.update(0, 33.3);
      for (const pc of pending) { inView.push(pc.line); if (!pc.e.emerged) popIns.push(pc.line); }
      pending = [];
      if (steps % 3 === 0) check();
      steps++;
    }
    const grouped = {};
    for (const l of inView) grouped[l] = (grouped[l] ?? 0) + 1;
    return { end: g.state, wave: g.wave, time: Math.round(g.runT), inView: grouped, popIns, missing: [...missing], orphans: [...orphans], zombies: [...zombies] };
  });
  const bad = report.popIns.length || report.missing.length || report.orphans.length || report.zombies.length;
  failed ||= !!bad;
  console.log(`\n${bad ? "FAIL" : "ok  "} planet ${planet}: reached wave ${report.wave} (${report.time}s of game time, ended "${report.end}")`);
  for (const [line, n] of Object.entries(report.inView)) console.log(`     on-screen spawn ${n}x ${line}`);
  if (report.popIns.length) console.log("     POP-INS without an entrance:", report.popIns.slice(0, 8));
  if (report.missing.length) console.log("     missing textures:", report.missing);
  if (report.orphans.length) console.log("     orphan sprites:", report.orphans);
  if (report.zombies.length) console.log("     zombie sprites:", report.zombies);
  await p.context().close();
}
if (errors.length) { failed = true; console.log("\npage errors:\n" + errors.join("\n")); }
console.log(failed ? "\nAUDIT FAILED" : "\naudit passed");
await browser.close();
process.exit(failed ? 1 : 0);
