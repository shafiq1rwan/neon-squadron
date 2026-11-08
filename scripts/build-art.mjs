// Build every pxl art file and copy the atlases into public/assets.
//   npm run art            all files
//   npm run art -- ui      only art/ui.px.js
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// The npm copy of pxl runs its dist/ build, which only exists if npm ran the package's `prepare` script
// (npm 11 may skip it). The skill clone in .claude/skills runs straight from TypeScript sources instead.
const npmPxl = join(ROOT, "node_modules", "pxl-pixelart");
const skillPxl = join(ROOT, ".claude", "skills", "pxl-pixel-art", "bin", "pxl.js");
const pxl = existsSync(join(npmPxl, "dist", "node", "cli.js")) ? join(npmPxl, "bin", "pxl.js")
  : existsSync(skillPxl) ? skillPxl
  : (console.error("pxl not found: run `npm install-scripts approve pxl-pixelart && npm install`, or clone the skill (see README)"), process.exit(1));

// source file -> output dir -> atlas name
const FILES = [
  { name: "sprites", src: "art/sprites.px.js", out: "art/out", atlas: "atlas" }, // ship, attachments, planet-1 enemies, pickups
  { name: "planets", src: "art/planets.px.js", out: "art/out_planets", atlas: "atlas_planets" }, // planet 2-3 enemies, bosses, landmarks, bullets
  { name: "ui", src: "art/ui.px.js", out: "art/out_ui", atlas: "atlas_ui" }, // upgrade + HUD icons, emblem
  { name: "ground", src: "art/ground.px.js", out: "art/out_ground", atlas: "atlas_ground" }, // turrets, structures, mines
  { name: "deco", src: "art/deco.px.js", out: "art/out_deco", atlas: "atlas_deco" }, // per-planet ground props
  { name: "p4", src: "art/planet4.px.js", out: "art/out_p4", atlas: "atlas_p4" }, // THALOS: enemies, boss, turret, props
  { name: "p5", src: "art/planet5.px.js", out: "art/out_p5", atlas: "atlas_p5" }, // OBSIDIAN: enemies, boss, turret, props
];

const only = process.argv[2];
const dest = join(ROOT, "public", "assets");
mkdirSync(dest, { recursive: true });

for (const f of FILES) {
  if (only && f.name !== only) continue;
  if (!existsSync(join(ROOT, f.src))) { console.warn(`skip ${f.src} (missing)`); continue; }
  const res = spawnSync(process.execPath, [pxl, "build", join(ROOT, f.src), "--out", join(ROOT, f.out), "--no-preview"], { stdio: ["ignore", "ignore", "inherit"] });
  if (res.status !== 0) process.exit(res.status ?? 1);
  for (const ext of ["png", "json"]) copyFileSync(join(ROOT, f.out, `${f.atlas}.${ext}`), join(dest, `${f.atlas}.${ext}`));
  console.log(`${f.src} -> public/assets/${f.atlas}.png`);
}
