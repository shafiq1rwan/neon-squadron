# Architecture

## Layers and ownership

```
main.ts ─ boot, theme tokens → CSS, fatal-error fallback
  └─ GameApp (app/GameApp.ts)               engine, state machine, camera, input, environment, UI
       ├─ GameStateMachine (app/GameState)  the only authority on "does time advance?"
       ├─ TimeManager (core)                fixed 60 Hz steps, ≤5 catch-up steps, interpolation alpha
       ├─ CameraManager (rendering)         solves framing on resize, picking, shake
       ├─ InputManager (input)              keyboard / mouse / touch → one MoveIntent
       ├─ EnvironmentManager (environment)  grid shader + chunked pooled scenery
       ├─ GameSession (app/GameSession.ts)  EVERYTHING belonging to one run (reset = start(seed))
       │    ├─ PlayerController + PlayerStats + PlayerRenderer
       │    ├─ Weapon (combat/WeaponSystem) ← WeaponDefinitions
       │    ├─ ProjectileManager ×2 (player, enemy)
       │    ├─ EnemyManager ← EnemyDefinitions, EnemyBehaviors
       │    ├─ EncounterSpawner (interim, replaced by WaveGenerator in Phase 4)
       │    ├─ CollisionSystem (+ SpatialGrid) → DamageSystem → EffectsManager / EventBus
       │    ├─ ParticleManager → SpriteBatch (effects)
       │    └─ SpriteBatch ×2 (player shots: World layer, enemy shots: EnemyBullets layer)
       └─ UI (ui/screens): Hud, PauseOverlay, GameOverOverlay, PerformanceOverlay (dev only)
```

## Frame loop (`GameApp.frame`)

1. `steps = time.advance(dt, state.isSimulationActive)`. Zero steps in PAUSED, UPGRADE_SELECTION,
   GAME_OVER and AD_BREAK, so every gameplay timer freezes together.
2. `intent = input.update(player.position, bounds)`, sampled once per frame.
3. Per step: `session.step(fixedDt, intent)` and `environment.simulate(fixedDt)`. The loop breaks if a
   step changed the state (for example the run ended).
4. Render: `session.render(alpha, dt, renderTime)`, `environment.render(...)`, `camera.update(dt)`
   (shake), then the HUD. The HUD only touches the DOM when its values change.

### `GameSession.step` order

player move → stats (invulnerability, shield regen) → weapon fires → spawner → enemies move and attack
→ projectiles move and expire → collisions (player shots vs enemies via grid, enemy shots vs player,
ramming) → death check → remove dead enemies → particles.

## Coordinate system

- Gameplay plane: `x` right, `y` up the screen. Combat area `[-9, 9] × [-15, 15]`.
- World: `(x, height, -y)`. Aircraft hover at height 0.4, projectiles at about 0.45, and the floor is
  at -3.5.
- The camera looks along `(0, -sin p, -cos p)` with p = 68°, and is fixed. It never rotates. Neon
  ribbons are oriented once against this constant view direction.
- Picking uses the same maths as framing (`CameraFraming.ndcToPlane`), so a pointer maps exactly to
  the gameplay plane.

## State machine

`BOOT → LOADING → (MAIN_MENU) → PLAYING ⇄ PAUSED`, `PLAYING → UPGRADE_SELECTION / BOSS_BATTLE /
GAME_OVER / RESULTS`, `GAME_OVER → PLAYING` (retry). The full table is in `app/GameState.ts`.
`pause()` remembers the state to resume into. Simulation runs in `PLAYING` and `BOSS_BATTLE`, and
player input in the same two. The game currently boots `LOADING → PLAYING` directly (the menu comes
in Phase 7).

## Events (`app/GameEvents.ts`)

`pauseRequested`, `resized`, `enemyKilled {type, x, y, reward}`,
`playerDamaged {outcome, health, shield}`, `playerDied`, `runEnded RunSummary`. Future systems such
as audio, stats and progression subscribe instead of reaching into combat code.

## Determinism

`createRunStreams(seed)` forks `environment`, `enemy`, `wave`, `upgrade` and `cosmetic` streams. A
fork depends only on the parent seed and the label, never on how much the parent stream has been used.

- Scenery: `generateChunkLayout(chunkIndex, seed)`, independent of order.
- Enemy timing jitter: `enemy` stream. Formation choice: `wave` stream. Effects: `cosmetic` stream.
- Movement is closed-form or locked at well-defined moments (the dive vector).
- Verified in the browser: the same seed with the same (zero) input reproduced identical kill counts
  across runs whose frame timing differed.

## Rendering

| What | How | Draw calls |
|---|---|---|
| Floor | 1 quad + `neon-grid` shader (fwidth anti-aliased lines, fades, rails, pulse) | 1 |
| Ships, props | Cached procedural meshes (`ProceduralMeshCache`), 2 mesh instances each: `neon-solid` (opaque, baked shading) and `neon-glow` (additive ribbons and halos) | 2 per object |
| Projectiles, particles | `SpriteBatch`: dynamic VB, static IB, `neon-sprite` shader with bolt / dot / ring / enemy-orb shapes, premultiplied blend | 1 per batch |
| Enemy bullets | `SpriteBatch` on the `EnemyBullets` layer, no depth test | 1 |

Per-object variation uses `meshInstance.setParameter('uFlash' | 'uTint')`, set only when the value changes.

## Pools and limits

| Pool | Capacity |
|---|---|
| Player projectiles | 700 (typed arrays) |
| Enemy projectiles | 700 (fairness cap 160 alive) |
| Particles | 900 capacity; budget by quality 250 / 500 / 900 |
| Enemies | `ObjectPool` per archetype, prewarmed with 8 (tanks: 2), grows as needed. About 40 total after a long soak |
| Scenery props | `ObjectPool` per type and colourway |
| Spatial grid | cell 3 units over the combat area plus margins; intrusive linked lists |

## Adding things (recipes)

- **New enemy:** add an `EnemyDefinition` in `EnemyDefinitions.ts` (stats, movement, attack, design).
  The pool and mesh are created automatically. Add it to a spawner or wave template.
- **New movement pattern:** add a `MovementKind` and a case in `stepMovement`. Keep it deterministic,
  and add a test.
- **New bullet pattern:** add an `AttackPattern` case in `fireAttack`. Respect the speed clamp and the
  density cap.
- **New weapon:** add a `WeaponDefinition`. If it needs new behaviour (homing, beam, chain), add a
  `kind` and handle it in `WeaponSystem` / `ProjectileManager`. Don't branch on the id.
- **New colour:** add it to `Palette` first.
- **New tunable:** add it to `GameConfig`.

## Testing seams

Pure modules with unit tests: `CameraFraming`, `TimeManager`, `SeededRandom`, `GameState`,
`PlayerController`, `PlayerStats`, `ProjectileManager`, `WeaponSystem`, `SpatialGrid`,
`CollisionSystem.segmentPointDistSq`, `EnemyBehaviors` (movement, attacks, telegraph timer),
`EnvironmentGenerator`, `ObjectPool`. Rendering and DOM are verified in the browser with
`tools/browser/`.
