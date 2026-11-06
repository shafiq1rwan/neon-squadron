# Dev Log

Newest entries first. Each entry covers what was done, what was verified, bugs found, and what's
next. Keep entries short; detail belongs in the other docs.

---

## 2026-11-06: Phase 2 (core combat) complete

**Built:** player stats (health, shield, regen, invulnerability), data-driven weapons (Pulse, Spread),
typed-array projectile pools rendered with `SpriteBatch`, 4 enemy archetypes with deterministic
movement and attack patterns, swept collision with a spatial grid, damage system, effects (sparks,
explosions, shield hits, death, muzzle flash, camera shake), HUD, game over with retry, interim
seeded `EncounterSpawner`, `GameSession` (the per-run owner), `GameEvents` contract.

**Verified:** typecheck clean, 62 unit tests, build at 298 KB gzipped. Browser (CDP harness): kills
start within 10 s with no input, pools flat over a 60 s soak (0 rejected spawns, entities level off at
about 100), the real bullet-death path works (death delay, then game over, then Enter retry), the
mobile run is stable for 30 s, and there were no console errors.

**Bugs found and fixed:**
- Ramming shredded tanks: an invulnerable player overlapping a tank dealt damage every step. Ramming
  now applies only when the player actually takes the hit.
- Telegraph flashing without shooting: blocked enemies re-armed straight into the warning window and
  blinked about 60% of the time. Fixed with the pure `advanceAttackTimer`, which only telegraphs when
  the shot is allowed. Tests added.
- Death detection depended on an event. It's now driven from `PlayerStats.alive`.
- Slow first kills: drone HP lowered from 3 to 2, fire rate raised from 7.5 to 8.5, and bigger bolts
  and enemy orbs for readability.

**Notes:** `TaskStop` doesn't kill Vite child processes (see CLAUDE.md). A test whose window ended
exactly on a volley boundary was flaky, so tests now avoid exact boundaries.

**Next:** Phase 3, the squadron system (see ROADMAP).

---

## 2026-11-06: Phase 1 (foundation) complete

**Built:** Vite + TS7 + PlayCanvas 2.23.3 project, `AppBase`/WebGL2 boot, CSS-driven responsive
canvas, camera framing solver for a fixed 18×30 combat area (pure, tested at 6 aspect ratios),
procedural neon geometry builder (faceted surfaces, camera-facing ribbons), mesh cache, scrolling grid
shader, chunked deterministic scenery, state machine, fixed-timestep clock, seeded RNG with streams,
keyboard / mouse / touch input, player controller and renderer, quality profiles, dev perf overlay.

**Verified:** 38 tests, build working, CDP harness checks for keyboard (17 u/s, stops in under ¼ s),
mouse follow with clamping, pause freezing the sim clock, touch drag including anchor sliding at the
edges, rotation, and production preview.

**Bug found and fixed:** pointer-follow overshot by 1.6 units because the deceleration limit wasn't
respected. Added "arrive" braking (√(2·a·d) at 75% margin). Caught by a unit test.

**Tweaks after visual review:** ship visual scale 1.0 → 1.3, lane rails dimmed.
