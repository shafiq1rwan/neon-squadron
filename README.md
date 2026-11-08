# Neon Squadron

A vertical roguelike shooter for the web (target: Poki). Phaser 3 + TypeScript + Vite.
Three planets, each a scrolling canyon with 9 waves and a boss. Every upgrade bolts something visible onto the ship.
Sprites are drawn as code with [pxl](https://github.com/crsolver/claude-pxl); effects come from
[pixelfx](https://github.com/patch-gg/pixelfx); the UI font is Silkscreen (SIL OFL, `public/fonts/OFL.txt`).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at http://localhost:5173 |
| `npm run build` | Type-check and build to `dist/` (zip this folder to upload to Poki) |
| `npm run art` | Rebuild all pxl art → `public/assets/atlas*.png/.json` (`npm run art -- ui` for one file) |
| `npm run fx` | Re-export pixelfx effects → `public/assets/fx/*.png` + `src/data/fx-manifest.json` |

Dev-only URL switches (removed from production builds): `?planet=2` (1-3) skips the menu, `?wave=10` jumps to a wave
(10 = boss, with a level-up per skipped wave), `?god` makes you invincible. Without the Poki SDK (e.g. blocked),
dev builds simulate rewarded ads as successful.

## Controls

- Touch: drag anywhere to fly (relative drag). Guns fire on their own.
- Desktop: just move the mouse (the ship flies to the cursor, no click; the cursor hides while steering),
  or WASD / arrows. Esc / Space pauses. 1 2 3 picks a card. Menu: ← → picks a planet, Enter plays,
  F opens FLIGHT (hangar: ← → browse, Enter unlock/equip, Esc back).

## Hangar (FLIGHT)

Scrap earned from runs unlocks new ship versions; the equipped ship is flown in every run. All ships share the
player sprite's 25x28 layout, so upgrade attachments fit each of them.

| Ship | Unlock | Perk |
|---|---|---|
| NS-1 VANGUARD | starter | balanced |
| NS-2 VIPER | 400 scrap | +25% fire rate, -20 hull |
| NS-3 BASTION | 900 scrap | +50 hull, starts with Arc Blade |
| NS-4 PHANTOM | 1600 scrap, clear VELA first | +20% damage, starts with Seeker Darts |
| NS-5 HALO | 2400 scrap, clear NOXA first | starts with a 2-hit shield and Tractor Field |
| NS-6 RAPTOR | 3500 scrap, clear THALOS first | +15% damage and fire rate, starts with Prism Laser, -30 hull |
| NS-7 PALADIN | 2000 scrap, clear KARR-7 first | transforms into a robot (E / right-click / TRANSFORM button): robot = -35% damage taken, +30% damage, twin arm cannons, slower (160 u/s), bigger hitbox |

## Planets

Each planet is 14 scripted waves (elites at 5 and 10) plus a boss at wave 15; clearing one unlocks the next.
KARR-7 (Ember Canyon, WARDEN-9) · VELA (Frost Rift, RIMEJAW) · NOXA (Toxic Gorge, VEXA HIVE QUEEN) ·
THALOS (Storm Mesa, TEMPEST ENGINE: telegraphed lightning lanes) · OBSIDIAN (The Core, THE SOVEREIGN: escorts and bullet curtains).

## Layout

```
art/sprites.px.js        ship, ship attachments (att_*), planet-1 enemies + boss, projectiles, pickups → atlas
art/planets.px.js        planet 2-3 enemies + bosses, enemy bullets, planet icons, landmarks → atlas_planets
art/ui.px.js             upgrade icons, HUD/menu icons, title emblem → atlas_ui
art/ground.px.js         ground turrets (base + gun), crate, fuel tank, bunker, scorch, mine → atlas_ground
art/deco.px.js           per-planet ground decorations → atlas_deco
art/planet4.px.js        THALOS enemies, boss, bullet, icon, turret, landmarks, decorations → atlas_p4
art/planet5.px.js        OBSIDIAN enemies, boss, bullet, icon, turret, landmarks, decorations → atlas_p5
scripts/audit.mjs        `npm run audit`: asset references + fast-forwarded run on every planet (needs `npm run dev`)
src/canyon.ts            canyon wall/river shape shared by the texture and ground-object placement
scripts/export-fx.mjs    which pixelfx effects to ship, how much to downscale them
src/main.ts              font loading, Phaser config, resize handling
src/layout.ts            240-unit playfield at 3x zoom; phone = full height, wide screen = 240x426 + side panels
src/art.ts               frame name → atlas lookup (Art.set)
src/poki.ts              Poki SDK wrapper (safe without SDK, de-duplicated gameplayStart/Stop)
src/sfx.ts               synthesized sound effects (no audio files)
src/save.ts              localStorage save (unlocked planets, best per planet, scrap), wrapped for incognito
src/data/planets.ts      planets, canyon palettes, enemies + their fire patterns, the 9-wave script, xp curve
src/data/upgrades.ts     weapons/passives, CORE levels, card rolling, which attachment each level shows
src/data/ships.ts        hangar ("FLIGHT") ships: cost in scrap, unlock requirement, perks, stat bars
src/scenes/Boot.ts       loading; generates canyon + dust textures per planet and the rolled (banking) ship frames
src/scenes/Game.ts       menu background, runs: waves, enemies, 3 bosses, weapons, level-ups, banking, debris, landmarks
src/scenes/Hud.ts        main menu, HUD, side panels, cards, pause / revive / results, banners
```

## Poki checklist (built in)

- `gameLoadingFinished` after loading; `gameplayStart` when a run starts (the PLAY tap); `gameplayStop` on pause, death, results, quit.
- `commercialBreak` before each run (PLAY, retry, next planet); `rewardedBreak` for revive, card reroll and x2 scrap, all optional.
- Rewarded buttons are violet with a video icon; a same-size plain button sits next to each one.
- Audio muted and input disabled while an ad plays. Arrow keys / space / wheel don't scroll the page.
- No external requests besides the SDK (font is bundled), no IAP, one currency, saving works in incognito (just not persisted).
