// Export pixelfx effects as compact sprite sheets for Phaser.
// pixelfx effects are authored at large sizes (100-300 px). Our playfield is 360 px wide, so each
// effect is rendered, trimmed to the pixels it actually uses (symmetrically around its origin),
// downsampled by `down`, and packed into a grid.
// Output: public/assets/fx/<key>.png, plus src/data/fx-manifest.json (frame sizes, fps).
//
//   npm run fx

import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEffect, renderFrames, canvas } from "../node_modules/pixelfx/tools/lib/fxlib.mjs";
import { PAL } from "../node_modules/pixelfx/src/core/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "assets", "fx");

// key: name used in the game. id: pixelfx effect. down: downsample factor. fps: export rate.
const EFFECTS = [
  { key: "boom", id: "explosions/plasma-explosion", down: 3, fps: 20 },
  { key: "boom_pink", id: "explosions/plasma-explosion", down: 3, fps: 20,
    opts: { palette: ["#1a0614", "#5a0a38", "#a0145a", "#ff3d9a", "#ff8cc8", "#ffe0f0", "#ffffff"], accent: PAL.fire } },
  { key: "boom_big", id: "explosions/plasma-explosion", down: 2, fps: 20,
    opts: { palette: ["#1a0614", "#5a0a38", "#a0145a", "#ff3d9a", "#ff8cc8", "#ffe0f0", "#ffffff"], accent: PAL.fire } },
  { key: "spark", id: "impacts/hit-spark", down: 3, fps: 24, opts: { palette: PAL.ice } },
  { key: "collect", id: "pickups/collect-burst", down: 2, fps: 20 },
  { key: "levelup", id: "arcane/mana-burst", down: 2, fps: 20, opts: { palette: PAL.neon } },
  { key: "emp", id: "scifi/emp-blast", down: 2, fps: 20 },
  // shield bubble around the ship (a looping effect authored around a character; centre on the bubble itself)
  { key: "bubble", id: "holy/divine-shield", down: 1, fps: 15, center: true,
    opts: { palette: ["#0b2a4a", "#0f5d8a", "#18a8c9", "#2df4ff", "#b8fbff", "#ffffff"], radius: 22 } },
  { key: "shield_hit", id: "impacts/shield-block", down: 2, fps: 24, center: true, opts: { palette: PAL.ice } },
];

mkdirSync(OUT, { recursive: true });
const manifest = {};

for (const e of EFFECTS) {
  const fx = await loadEffect(e.id);
  const r = renderFrames(fx, { fps: e.fps, bg: "none", actor: false, options: e.opts });
  let [ox, oy] = fx.meta.origin;
  if (e.center) {
    // effects authored around a character's feet: centre on the drawn pixels instead
    let x0 = r.w, y0 = r.h, x1 = 0, y1 = 0;
    for (const f of r.frames)
      for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++)
        if (f.clear[(y * r.w + x) * 4 + 3] >= 10) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    ox = Math.round((x0 + x1 + 1) / 2);
    oy = Math.round((y0 + y1 + 1) / 2);
  }

  // Union of opaque pixels over all frames, expressed as distance from the origin.
  let L = 0, R = 0, T = 0, B = 0;
  for (const f of r.frames) {
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
      if (f.clear[(y * r.w + x) * 4 + 3] < 10) continue;
      L = Math.max(L, ox - x); R = Math.max(R, x - ox + 1);
      T = Math.max(T, oy - y); B = Math.max(B, y - oy + 1);
    }
  }
  // Keep the origin centred so the sprite's origin (0.5, 0.5) lands where the effect starts.
  const hx = Math.max(L, R), hy = Math.max(T, B);
  const d = e.down;
  const fw = Math.ceil((hx * 2) / d), fh = Math.ceil((hy * 2) / d);
  const x0 = ox - hx, y0 = oy - hy;

  // Drop fully empty trailing frames.
  const frames = r.frames.filter((f, i) => i === 0 || f.clear.some((v, j) => j % 4 === 3 && v > 10));

  const cols = Math.min(frames.length, Math.max(1, Math.round(Math.sqrt((frames.length * fh) / fw))));
  const rows = Math.ceil(frames.length / cols);
  const img = canvas(cols * fw, rows * fh, [0, 0, 0, 0]);

  frames.forEach((f, i) => {
    const small = new Uint8ClampedArray(fw * fh * 4);
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
      // Premultiplied box filter over a d x d block; keeps glow soft and edges clean.
      let pr = 0, pg = 0, pb = 0, pa = 0, n = 0;
      for (let dy = 0; dy < d; dy++) for (let dx = 0; dx < d; dx++) {
        const sx = x0 + x * d + dx, sy = y0 + y * d + dy;
        n++;
        if (sx < 0 || sy < 0 || sx >= r.w || sy >= r.h) continue;
        const k = (sy * r.w + sx) * 4, a = f.clear[k + 3] / 255;
        pr += f.clear[k] * a; pg += f.clear[k + 1] * a; pb += f.clear[k + 2] * a; pa += a;
      }
      const k = (y * fw + x) * 4;
      if (pa > 0) {
        small[k] = pr / pa; small[k + 1] = pg / pa; small[k + 2] = pb / pa;
        small[k + 3] = Math.min(255, (pa / n) * 255 * 1.15);
      }
    }
    img.paste(small, fw, fh, (i % cols) * fw, Math.floor(i / cols) * fh);
  });

  writeFileSync(join(OUT, `${e.key}.png`), img.png());
  manifest[e.key] = { frameWidth: fw, frameHeight: fh, frames: frames.length, fps: e.fps, loop: fx.meta.loop, source: e.id };
  console.log(`${e.key.padEnd(10)} ${e.id.padEnd(30)} ${frames.length} frames  ${fw}x${fh}`);
}

// The manifest is imported by the game code, so it lives in src/.
writeFileSync(join(ROOT, "src", "data", "fx-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`-> ${OUT}  (manifest: src/data/fx-manifest.json)`);
