# Roadmap

Ten phases from the spec ([MASTER_PROMPT.md §31](MASTER_PROMPT.md)). Each phase must end with a
working, tested, browser-verified build. ✅ = done, 🔜 = next, ⬜ = not started.

| # | Phase | Status |
|---|---|---|
| 1 | Project foundation | ✅ 2026-11-06 |
| 2 | Core combat | ✅ 2026-11-06 |
| 3 | Squadron system | 🔜 next |
| 4 | Procedural generation | ⬜ |
| 5 | Roguelike upgrades | ⬜ |
| 6 | Boss and full run | ⬜ |
| 7 | Complete UI/UX | ⬜ |
| 8 | Permanent progression | ⬜ |
| 9 | Visual and audio polish | ⬜ |
| 10 | Poki integration and release | ⬜ |

---

## Phase 1: Project foundation ✅

- [x] PlayCanvas `AppBase` + WebGL2 device, TypeScript 7, Vite 8, Vitest 5
- [x] Responsive canvas (CSS-sized, backbuffer follows, DPR cap per quality)
- [x] Fixed 2.5D camera that fits the 18×30 combat area to any aspect ratio (pure, tested maths)
- [x] Scrolling grid shader, combat-lane rails, chunked and pooled deterministic scenery
- [x] Game-state machine with explicit transitions and pause/resume
- [x] Keyboard, mouse-follow and relative touch-drag input (multitouch-safe, anchor sliding at edges)

**Acceptance:** opens in a browser ✔, canvas resizes ✔, desktop movement ✔, mobile movement ✔,
no runtime errors ✔, dev and prod builds ✔.

## Phase 2: Core combat ✅

- [x] Player stats: health, shield (absorbs first, regenerates), invulnerability frames with blink
- [x] Auto-fire Pulse Cannon from data-driven `WeaponDefinition` + modifiers (Spread Cannon defined)
- [x] Typed-array projectile pools, one batched draw call per team
- [x] 4 enemy archetypes with deterministic movement and attack patterns, telegraphs
- [x] Swept circle collision + spatial grid; ramming
- [x] Damage system, kills, coins, events
- [x] Effects: sparks, explosions, shield hits, death, muzzle flash, camera shake
- [x] HUD (health, shield, time, kills, pause button) and a minimal game over with one-tap retry
- [x] Interim seeded `EncounterSpawner`

**Acceptance:** player shoots enemies ✔, enemies take damage ✔, enemies damage player ✔, projectiles
recycled ✔ (0 rejected, pools flat over a 60 s soak), frame-rate independent ✔ (same seed reproduced
identical kill counts across browser runs), no unbounded growth ✔.

## Phase 3: Squadron system 🔜

Goal: the game's signature mechanic. Wingmen follow in formation and fight on their own.

- [ ] `squadron/WingmanDefinitions.ts`: Gunner, Missile, Laser as data (spec §7 `WingmanDefinition`)
- [ ] `squadron/FormationManager.ts`: 4 fixed slots relative to the player. The slot layout must stay
      inside the combat lane on narrow phones (offsets scale or clamp, and slots never leave the lane).
- [ ] Smooth following: critically damped spring, framerate independent, no jitter at rest
- [ ] `combat/TargetingSystem.ts`: queries over the spatial grid, with priorities: Gunner = nearest
      ahead, Missile = highest HP, Laser = densest column
- [ ] Homing missile projectile kind (limited turn rate, area damage on hit) in `ProjectileManager`
      (needs a target id and turn-rate fields)
- [ ] Laser beam weapon kind (piercing line, short-lived beam sprite, damage per tick)
- [ ] `squadron/SquadronManager.ts`: owns wingmen, levels, per-wingman weapon instances, reset per run
- [ ] Wingman meshes from `AircraftGenerator` (wingman purple palette, smaller than the player)
- [ ] Wingmen are invulnerable (spec), not hit by enemy bullets
- [ ] Temporary way to gain wingmen until Phase 5 upgrades: e.g. one every N kills, or a debug key
- [ ] First squadron modifiers (squadron damage %, wingman fire rate %), wired through the same
      modifier pattern as `WeaponModifiers`
- [ ] Tests: formation offsets in bounds, spring converges without overshoot, targeting priorities,
      homing turn-rate limit
- [ ] Browser verify at 390×844 and 1280×720, plus pools stable with 4 wingmen firing

**Acceptance (spec):** follow smoothly, attack independently, stable formation, no manual control,
works on narrow mobile screens.

## Phase 4: Procedural generation ⬜

- [ ] Seeded enemy design variants (`AircraftGenerator` templates + controlled variation per class),
      meshes built at load or wave start, then cached
- [ ] `procedural/WaveGenerator.ts`: difficulty-budget director (costs 1/2/3/5/10), 10-wave pacing
      table, health and density scaling that doesn't just multiply HP
- [ ] `procedural/FormationGenerator.ts`: line, V, column/snake, pincer, circle, formation-following
- [ ] `procedural/PatternGenerator.ts`: spiral, rotating spiral, sine, crossfire, delayed burst,
      rotating laser; minimum safe gaps and a density cap
- [ ] Circular and formation-following movement patterns
- [ ] Elite enemy (magenta, multi-phase)
- [ ] Debug: seed entry and a wave parameter inspector in the dev overlay
- [ ] Replace `EncounterSpawner`
- [ ] Tests: budget never exceeded, same seed gives the same waves, safe-gap rule

## Phase 5: Roguelike upgrades ⬜

- [ ] `upgrades/UpgradeDefinitions.ts`: at least 12 upgrades (spec §13 list), rarities with weights in config
- [ ] `upgrades/UpgradeEffects.ts`: generic effect application (stat add, stat mult, summon, unlock)
- [ ] `upgrades/UpgradeManager.ts`: filter → prerequisites → stacks → weighted pick of 3 unique,
      with a guaranteed fallback
- [ ] `upgrades/EvolutionManager.ts`: data recipes (Assault Wingman, Tesla Shield, Plasma Barrage)
- [ ] Tesla weapon (chain lightning) and explosive rounds (area damage already supported)
- [ ] Upgrade selection screen (3 cards; horizontal on desktop, vertical on mobile), state
      `UPGRADE_SELECTION`
- [ ] Tests: eligibility, stacking caps, no empty screen, determinism via the upgrade stream

## Phase 6: Boss and full run ⬜

- [ ] 10-wave run structure, wave label and progress in the HUD
- [ ] Mini-boss (wave 5) and the Crimson Overlord (wave 10): 2 phases, health bar, telegraphs, death
      sequence
- [ ] `BOSS_BATTLE` state, victory and defeat → `RESULTS` / `GAME_OVER`
- [ ] Results screen (final wave, kills, bosses, time, coins)

## Phase 7: Complete UI/UX ⬜

- [ ] Bundle fonts (OFL), UI component set (buttons, toggle, slider, modal, tooltip, notification,
      confirm), main menu, full pause menu, settings (audio, quality, screen shake), hangar shell,
      responsive layouts, safe areas, reduced motion

## Phase 8: Permanent progression ⬜

- [ ] `core/SaveManager.ts` (schema version, validation, migration, defaults, works when storage
      is unavailable), coins, hangar upgrades (max health, damage, attack speed, starting shield),
      aircraft unlocks, reset progress

## Phase 9: Visual and audio polish ⬜

- [ ] Bloom (high quality only), engine trails, better explosions, boss destruction, enemy instancing,
      adaptive quality with hysteresis, SFX and music via an `AudioManager`

## Phase 10: Poki integration and release ⬜

- [ ] `platform/PlatformService` + `LocalPlatform` + `PokiPlatform` (verify the current Poki SDK docs
      first), gameplay start/stop, commercial breaks at natural breakpoints, rewarded revive, audio
      muting during ads, loading optimisation, device and browser test matrix
