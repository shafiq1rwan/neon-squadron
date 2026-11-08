# Neon Squadron

A pixel-art roguelike vertical shooter for the web, built for [Poki](https://poki.com).
Fly through five alien canyons, survive 14 waves on each, beat the boss, and bolt every upgrade onto your ship.

**Play:** https://shafiq1rwan.github.io/neon-squadron/ (GitHub Pages, deployed from `main`; see [Deploying](#deploying))

Built with Phaser 3, TypeScript and Vite. Sprites are drawn as code with [pxl](https://github.com/crsolver/claude-pxl),
effects come from [pixelfx](https://github.com/patch-gg/pixelfx). Third-party credits: [CREDITS.md](CREDITS.md).

## The game

- **Runs:** pick a planet, fight 14 scripted waves (elites at waves 5 and 10), then the boss at wave 15.
  Clearing a planet unlocks the next one.
- **Level-ups:** grab XP crystals, pick 1 of 3 upgrade cards. Weapons have CORE upgrades at levels 3 and 6 that change
  how they work. Every upgrade shows on the ship: the Pulse Cannon grows wing guns, Hull Plating adds armour,
  missile racks and a laser cannon get bolted on.
- **Weapons and passives:** Pulse Cannon, Seeker Darts, Arc Blade, Prism Laser; Overclock, Payload, Hull Plating, Tractor Field.
- **Pickups:** shields (absorb 2 hits), hearts, magnets. Shoot supply crates for loot and fuel tanks for chain explosions.
- **Hangar ("FLIGHT"):** spend scrap from runs on new ships.

### Planets

| Planet | Setting | Boss |
|---|---|---|
| KARR-7 | Ember Canyon: red rock, lava river | WARDEN-9 |
| VELA | Frost Rift: ice canyon | RIMEJAW |
| NOXA | Toxic Gorge: acid river, bio-insects | VEXA, HIVE QUEEN |
| THALOS | Storm Mesa: plasma river, storm robots | TEMPEST ENGINE (telegraphed lightning lanes) |
| OBSIDIAN | The Core: black glass, void rift | THE SOVEREIGN (escorts, bullet curtains) |

### Ships

| Ship | Unlock | Perk |
|---|---|---|
| NS-1 VANGUARD | starter | balanced |
| NS-2 VIPER | 400 scrap | +25% fire rate, -20 hull |
| NS-3 BASTION | 900 scrap | +50 hull, starts with Arc Blade |
| NS-4 PHANTOM | 1600 scrap, clear VELA | +20% damage, starts with Seeker Darts |
| NS-5 HALO | 2400 scrap, clear NOXA | starts with a 2-hit shield and Tractor Field |
| NS-6 RAPTOR | 3500 scrap, clear THALOS | +15% damage and fire rate, starts with Prism Laser, -30 hull |
| NS-7 PALADIN | 2000 scrap, clear KARR-7 | transforms into a robot: -35% damage taken, +30% damage, twin arm cannons, slower |

### Controls

| | Desktop | Touch |
|---|---|---|
| Fly | move the mouse (no click), or WASD / arrow keys | drag anywhere |
| Pause | Esc or Space | pause button |
| Pick a card | 1 / 2 / 3 or click | tap |
| Transform (PALADIN) | E, Q or right-click | TRANSFORM button |
| Menu | ← → planet, Enter play, F hangar | tap |

## Development

Requires Node 22 or newer (the pxl art tool needs 22.18+).

```sh
npm install
npm run dev        # http://localhost:5173
```

npm 11 may skip the `prepare` script of the `pxl-pixelart` git dependency. The game itself doesn't need it.
`npm run art` does: it uses that package's build when present, otherwise the pxl skill clone (see
[Art tools](#art-tools-claude-code-skills)). To build the package instead, run `npm install-scripts approve pxl-pixelart`
and `npm install` again.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the built `dist/` |
| `npm run art` | Rebuild every pxl art file into `public/assets/atlas*.png/.json` (`npm run art -- ui` for one) |
| `npm run fx` | Re-export the pixelfx effects to `public/assets/fx/` and `src/data/fx-manifest.json` |
| `npm run audit` | With `npm run dev` running: checks every referenced sprite frame exists and fast-forwards a run on every planet in headless Edge/Chrome, failing on pop-in spawns, missing textures, stray sprites or page errors |

Dev-only URL switches (stripped from production builds): `?planet=2` (1-5) skips the menu, `?wave=15` jumps to a
wave (15 = boss, with a level-up per skipped wave), `?god` makes you invincible. `window.__game` is the Phaser game.

### Project layout

```
art/*.px.js              pxl sprite sources: sprites (ships, robot, planet-1 enemies), planets (2-3), planet4, planet5,
                         ground (turrets, buildings, mines), deco (props), ui (icons). Built atlases: public/assets/
scripts/build-art.mjs    builds every art file and copies the atlases into public/assets
scripts/export-fx.mjs    renders, trims and downsamples the pixelfx effects the game uses
scripts/audit.mjs        the automated gameplay audit (npm run audit)
src/main.ts              font loading, Phaser config, resize handling
src/layout.ts            240-unit playfield at 3x zoom; full height on phones, side panels on wide screens
src/canyon.ts            canyon wall/river shape shared by the background texture and ground-object placement
src/art.ts               frame name -> atlas lookup
src/poki.ts              Poki SDK wrapper
src/sfx.ts               synthesized sound effects (no audio files)
src/save.ts              localStorage save (unlocked planets, best scores, scrap, ships)
src/data/planets.ts      planets, enemies, waves, difficulty
src/data/ships.ts        hangar ships and the transform (ROBOT) stats
src/data/upgrades.ts     upgrade cards, CORE levels, which sprite each upgrade level shows
src/scenes/Boot.ts       loading; generates canyon textures, dust and the banking frames
src/scenes/Game.ts       the run: waves, enemies, bosses, weapons, ground layer, transform
src/scenes/Hud.ts        main menu, hangar, HUD, level-up cards, pause / revive / results
```

### Art tools (Claude Code skills)

The art is authored with two Claude Code skills. `pixelfx` is committed in `.claude/skills/pixelfx` and uses the
`node_modules/pixelfx` checkout. The pxl skill is a git clone and isn't committed; install it with:

```sh
git clone https://github.com/crsolver/claude-pxl.git .claude/skills/pxl-pixel-art
```

## Deploying

### GitHub Pages

`.github/workflows/deploy-pages.yml` type-checks, builds and publishes `dist/` on every push to `main` (and on demand
from the Actions tab). One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The site is served from `https://<user>.github.io/neon-squadron/`; the build uses relative paths (`base: "./"`), so
no path configuration is needed. Ads don't play outside Poki; the Poki SDK just logs its calls.

### Poki

Run `npm run build`, zip the contents of `dist/`, and upload it in Poki for Developers. Built in for Poki's rules:
no external requests besides the Poki SDK (the font is bundled), no in-app purchases, optional rewarded videos
(revive, card reroll, double scrap) each next to a same-size plain button, `commercialBreak` only between runs,
`gameplayStart/Stop` never sent twice in a row, audio muted and input disabled during ads, and saving that keeps
working (unsaved) in incognito.
