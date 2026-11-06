# NEON SQUADRON

A 2.5D neon roguelike squadron shooter for the browser, built with the PlayCanvas Engine
(code-first, no editor), TypeScript and Vite. Target platform: Poki (static HTML5 build).

## Commands

| Command             | What it does                                         |
| ------------------- | ---------------------------------------------------- |
| `npm install`       | Install dependencies                                 |
| `npm run dev`       | Dev server at http://localhost:5173 (LAN-accessible) |
| `npm run build`     | Type-check, then build static files into `dist/`     |
| `npm run preview`   | Serve the production build locally                   |
| `npm test`          | Run unit tests (Vitest)                              |
| `npm run typecheck` | Type-check only                                      |

The build uses relative paths (`base: './'`) so `dist/` works from any sub-folder.

## Controls

- **Desktop:** WASD / arrow keys, or move the mouse (the ship follows the cursor). `Esc`, `P` or the pause button pauses. Enter retries after a defeat.
- **Mobile:** touch anywhere and drag. Movement is relative to where your finger lands, so your finger never covers the ship. The top-right button pauses.
- Weapons fire automatically.

## URL parameters (testing aids)

- `?seed=ABC123`: reproduce a run's procedural content.
- `?quality=low|medium|high`: force a graphics profile (until the settings screen exists).

In dev builds, a performance overlay appears in the bottom-left corner (toggle with `` ` `` or `F3`). It shows
FPS, frame time, draw calls, render resolution, pools, state and the run seed. `window.game` exposes the
running game in the console. Neither is included in production builds.

## Architecture

```
src/
  main.ts                  boot + fatal-error fallback
  app/
    GameApp.ts             PlayCanvas AppBase setup, frame loop, UI and state wiring
    GameSession.ts         one run: player, weapons, enemies, projectiles, collisions, effects
    GameEvents.ts          typed event contract (kills, damage, death, run end)
    GameState.ts           explicit state machine (illegal transitions throw)
    GameConfig.ts          all tunable values (player, camera, world, quality profiles)
    EventBus.ts            typed pub/sub
  core/
    TimeManager.ts         fixed 60 Hz timestep, bounded catch-up, interpolation alpha
    SeededRandom.ts        sfc32 + cyrb128, forkable named streams per run
    ObjectPool.ts          free-list pooling
  input/
    InputManager.ts        merges devices into one movement intent
    KeyboardInput.ts / MouseInput.ts / TouchInput.ts
  combat/
    WeaponDefinitions.ts   data-driven weapons (Pulse Cannon, Spread Cannon)
    WeaponSystem.ts        volleys from definitions + modifiers (fire-rate cap via cooldown)
    ProjectileManager.ts   structure-of-arrays projectile pool, swap-remove, zero allocation
    CollisionSystem.ts     swept circle tests (no tunnelling) + spatial-grid broad phase
    SpatialGrid.ts         uniform grid with intrusive linked lists in typed arrays
    DamageSystem.ts        damage, splash, ramming, kills, rewards, feedback requests
    EncounterSpawner.ts    interim seeded formation spawner (replaced by the wave director in Phase 4)
  enemies/
    EnemyDefinitions.ts    drone / interceptor / shooter / tank as data
    EnemyBehaviors.ts      deterministic movement patterns, attack patterns, telegraph timing
    EnemyManager.ts        pooled enemies, fairness gates, interpolated rendering
  player/
    PlayerController.ts    pure movement simulation (accel/decel, "arrive" pointer follow, clamping)
    PlayerStats.ts         health, shield (absorbs first, regenerates), invulnerability frames
    PlayerRenderer.ts      interpolation, visual-only banking, hover bob
  rendering/
    CameraFraming.ts       pure maths: fits the combat area to any aspect ratio
    CameraManager.ts       fixed 2.5D camera, screen → gameplay-plane picking
    NeonShaders.ts         GLSL for neon solid/glow/grid materials
    MaterialManager.ts     shared materials
    NeonGeometryBuilder.ts procedural faceted surfaces + camera-facing neon ribbons
    ProceduralMeshCache.ts build-once GPU mesh cache
    NeonRenderable.ts      entity wrapper with per-instance tint/flash
    QualityManager.ts      low/medium/high profiles (pixel-ratio cap, glow, particle budget)
    SpriteBatch.ts         one draw call for all projectiles / particles of a kind
    ParticleManager.ts     pooled particles, fixed-step, interpolated
    EffectsManager.ts      hit sparks, explosions, shield hits, death; camera shake requests
    WorldSpace.ts          gameplay (x, y) ↔ world (x, h, -y)
  procedural/
    AircraftGenerator.ts   aircraft from body/wing/engine/core/fin templates
    EnvironmentGenerator.ts deterministic per-chunk scenery layout
  environment/
    EnvironmentManager.ts  chunk streaming + pooled props
    GridRenderer.ts        scrolling grid (one quad, one shader)
    PropMeshes.ts          scenery meshes
  ui/
    Theme.ts               design tokens → CSS custom properties
    screens/Hud.ts, PauseOverlay.ts, GameOverOverlay.ts
  debug/PerformanceOverlay.ts
tests/                     Vitest unit tests for deterministic systems
```

### Key decisions

- **One logical combat area (18 × 30 units) on every device.** The camera solves its distance so
  the whole area fits the screen, with HUD reserves. Wider or taller screens see extra decorative
  space, never extra combat space.
- **Gameplay is 2D.** Simulation lives on the X/Y plane, and rendering maps it into 3D. Banking and
  hovering are visual only.
- **Fixed-timestep simulation.** The state machine gates simulation. Paused, upgrade-selection and
  ad states advance zero steps, so every gameplay timer freezes together.
- **No textures and no runtime lights.** Lighting is baked into vertex colours. Neon lines are
  additive ribbons with soft halos, so the look holds up without bloom.
- **Determinism.** Each run seed forks independent streams (environment, enemy, wave, upgrade,
  cosmetic). Scenery depends only on the seed and chunk index. Effects use the cosmetic stream, so
  they can never change gameplay.
- **Batched projectiles and particles.** Typed-array pools rendered through one dynamic vertex
  buffer per kind, so hundreds of bullets cost one draw call.
- **Readable enemy fire.** Enemy bullets have their own layer, drawn last with no depth test and a
  dark rim, so effects and scenery can never hide them. Their speeds are clamped, enemies hold fire
  when point-blank or below the player, there is a cap on bullet density, and every shot is
  preceded by a telegraph. A telegraph only shows when a shot will follow.
- **Forgiving hitbox.** The player's collision radius (0.38) is much smaller than the ship's
  visual size, as is conventional for bullet-hell games.

## Roadmap

1. ✅ Foundation: app, camera, grid, state machine, input
2. ✅ Core combat: auto-fire, pooled projectiles, enemies, collisions, damage
3. Squadron: wingmen and formation
4. Procedural generation: enemy variants, wave director, bullet patterns
5. Roguelike upgrades
6. Bosses and the full 10-wave run
7. Complete UI/UX
8. Permanent progression and saves
9. Visual and audio polish
10. Poki integration and release
