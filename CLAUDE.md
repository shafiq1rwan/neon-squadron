# Neon Squadron

Web roguelike vertical shooter for Poki. See README.md for commands and file layout.

**Verify before handing over** (the user asked for this): `npx tsc --noEmit`, `npm run build`, and with `npm run dev`
running, `npm run audit` (fast-forwards a run on every planet; fails on pop-in spawns, missing textures, orphan or
zombie sprites, page errors). Also screenshot the specific change in a headless browser and look at it.
- Nothing may appear out of nowhere: spawn off-screen, or mid-screen through `GameScene.emerge()` ("launch" = cannon
  blast `fx_launch`, "hatch" = brood-sac burst `fx_hatch`), which grows it in and makes it harmless until it's out.
- New mechanics get their own art (the user asked for dedicated assets, not reused effects).
- Don't edit source files with PowerShell `Get-Content`/`Set-Content`: it double-encoded UTF-8 ("·" became "Â·" in
  visible UI text) and added BOMs. Use the Edit tool or a Node script.
- Content: 5 planets (src/data/planets.ts), 7 hangar ships (src/data/ships.ts), 14 waves + boss (`WAVES`, `WAVE_COUNT`).
  Adding a planet = enemies + `PLANETS` entry + an art file/atlas (build-art.mjs FILES, art.ts ATLASES) + save.ts
  PLANET_COUNT + PLANET_COLOR in Hud.ts; `npm run audit` then checks every referenced frame exists.
- Transforming ship (PALADIN, `ShipDef.transform`): art/sprites.px.js `paladinParts(t)` is one parametric shape,
  t = 0 fighter .. 1 robot; it generates `ship_paladin_*` (fighter tiers), `mech_paladin_*` (robot tiers: `robotCannon`,
  `robotArmour`) and the 6-frame `paladin_morph` anim. Game: `tryTransform()` (E / Q / right-click / HUD button),
  stats in `ROBOT` (src/data/ships.ts). Robot stows the att_* hardware and fires from `ROBOT.arm`.
- Homing (seekers, ricochets) uses `nearestEnemy` with a priority tier (`targetTier`): combatants first, then mines,
  buildings only when nothing else is in range. Buildings skip the planet hp multiplier (only +5%/wave), otherwise
  bunkers soaked missiles and read as indestructible props.
- Readability rules: rivers stay dimmer than that planet's enemy bullets; bosses/elites blush red on hit (a white
  fill hid boss art most of the fight).

- Original game in the genre of Survivor: Ace-style shooters. Never copy names, characters, art or story from existing games.
- Poki rules matter: no IAP, no external requests (bundle everything, including fonts), rewarded ads optional with a
  same-size plain button next to them, no green rewarded buttons, `gameplayStart/Stop` never fired twice in a row
  (src/poki.ts guards this).
- No slow-motion mechanic: the user removed it on purpose.
- Controls: desktop mouse = ship eases toward the cursor without clicking. The mouse is POLLED every frame
  (`input.mousePointer` in update), not read from pointermove events (the HUD scene can swallow those); banking
  uses a smoothed speed + hysteresis (`bankStep`) so roll frames don't flicker. Touch = relative drag
  (`pointer.wasTouch`); keys = WASD/arrows. Never preventDefault keys in a window listener: Phaser ignores
  defaultPrevented events. Use `keyboard.addCapture` instead (already set for arrows + Space).
- World units: playfield is 240 wide (PLAY_W), rendered at ZOOM 3; all gameplay distances/speeds in
  src/scenes/Game.ts and src/data/planets.ts are in these units. HUD code uses screen units (720-wide playfield).
- Structure: main menu → pick planet → 14 scripted waves (`WAVES` in planets.ts, elites at waves 5 and 10) → wave 15
  boss → results with NEXT PLANET. Enemies are defined per planet by role (swarm/chaser/gunner/heavy); bosses have
  per-id patterns in `GameScene.stepBoss`.
- Phaser containers: hit areas are offset by the display origin. Centred content → `Rectangle(0, 0, w, h)`;
  top-left content → `Rectangle(w/2, h/2, w, h)`. Don't make full-screen backdrops interactive inside
  overlays (they steal clicks from nested buttons). HUD z-order: create containers after the panels they sit on, or set depth.
- Hangar ships (src/data/ships.ts, art `ship_*` in art/sprites.px.js) must keep the player's 25x28 frame, wing roots
  and engine pod positions so the att_* overlays fit; Boot generates their rolled frames automatically (`ship_` prefix).
- Frames live in seven atlases (`ATLASES` in src/art.ts) + the generated "bank" texture: always go through
  `Art.set(sprite, frame)` / `Art.key(frame)`.
- Repo: built atlases in public/assets/ are committed (CI doesn't run the art tools); art/out*/ previews are ignored.
  GitHub Pages deploys `dist/` from `main` via .github/workflows/deploy-pages.yml (`npm ci --ignore-scripts && npm run build`).
  Third-party attributions live in CREDITS.md; keep it current when adding assets or libraries.
- Silkscreen pixel font: use sizes that are multiples of 8.

## Art

- Upgrades that belong to the ship are drawn INTO the hull (user feedback: pasted-on overlays looked wrong).
  art/sprites.px.js generates `ship_<id>_<cannonTier><armourTier>` for every hangar ship from `BASES` +
  `cannonParts`/`armourParts`, in each ship's own colours (`SHIP_STYLE`, incl. where its wing gun sits);
  `shipFrame()` in upgrades.ts picks the sprite. `ShipDef.gun` must match the drawn muzzle (shots fire from it).
  Only separate hardware is an overlay (`att_seeker_*` racks, `att_laser_*` prism; 37x32 centred, ship-art (x, y) =
  overlay (x + 6, y + 2)). Overclock/Payload/Tractor are shown in code (flames, bullet size/tint, range ring).
  Preview scenes (not in the atlas): `evo_<id>` (all tiers), `loadout_max/mid`, `projectiles`.
- Seeker Darts are slim dark-bodied rockets (normal blend, fire puffs). Don't give them a white body or swept fins:
  the user saw that as a "ghost ship". Arc Blades are swords (normal blend so the hilt shows, slash arcs in `bladeG`).
  Prism Laser hardware is a barrel-and-coil laser cannon on the nose (the earlier pink crystal read as a "Rudolph nose").
- Shield pickup (`shield` orb): `SHIELD_HITS` charges, shown as the pixelfx `bubble` around the ship and cyan cells in
  the HUD; a hit consumes a charge (`shield_hit` fx) instead of hull. Drops from elites and ~4-8% of enemies.
- Ground layer: turrets (base + rotating `head` gun, one per planet), structures (crate = loot, fuel_tank = chain
  blast, bunker = xp) and scorch decals scroll at CANYON_SPEED and never ram or hold up a wave (`GROUND_ROLES`).
  Mines are airborne obstacles (blink, ram for 20, blast when shot). Ground objects are placed with
  `groundSpot()` -> `src/canyon.ts`, which shares the exact wall/river shape with the canyon texture (never in the river).
  Decorations (`deco_*`, art/deco.px.js) and landmarks are painted via `paintGround`; glowing ones pulse (`PULSING`).
  Art: art/ground.px.js -> atlas_ground, art/deco.px.js -> atlas_deco.
- Difficulty: WARDEN-9 (planet 1) was tuned down on user feedback (1500 hp, sparse rings, 2-arm spiral).
- Keep enemy bullets bright with a white core and the canyon backgrounds dark so bullets stay readable.
  Avoid mirrored white pixels on mechs (they read as eyes).
- Sprites: edit an art file, then `npm run art`. The pxl skill is in `.claude/skills/pxl-pixel-art`
  (`node .claude/skills/pxl-pixel-art/bin/pxl.js build art/<file>.px.js --out <dir> --only a,b`, then look at `<dir>/_preview`).
- Effects: the pixelfx skill is in `.claude/skills/pixelfx`; its checkout is `node_modules/pixelfx`. Ship an effect by adding
  it to `EFFECTS` in `scripts/export-fx.mjs` and running `npm run fx`.
- Verify in a browser: `npm run dev`, then drive it. In dev builds `window.__game` is the Phaser game.
