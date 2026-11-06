# CLAUDE.md: Neon Squadron

A 2.5D neon roguelike squadron shooter for the browser (Poki target). PlayCanvas Engine (code-first,
no editor), TypeScript, Vite, Vitest. The game is developed in 10 phases defined by the spec.

## Start here

1. Read [docs/ROADMAP.md](docs/ROADMAP.md) to see which phase is current and what's next.
2. Read [docs/DEVLOG.md](docs/DEVLOG.md), latest entry first, to see what happened last session.
3. Look up requirements in [docs/MASTER_PROMPT.md](docs/MASTER_PROMPT.md), the original spec and
   source of truth for scope.
4. Look up design decisions and tuning numbers in [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md), and visual
   rules in [docs/ART_STYLE.md](docs/ART_STYLE.md).
5. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the code fits together.
6. Check [docs/BACKLOG.md](docs/BACKLOG.md) for known issues, debt and deferred work.

At the **end of every phase**: update ROADMAP (status and checkboxes), add a DEVLOG entry, move items in
BACKLOG, and update GAME_DESIGN if tuning changed. Report to the user with: implemented features, key
architectural decisions, how to run and test, test and build results, known limitations, and the next
phase (the spec requires this format).

## Commands

```bash
npm install
npm run dev        # http://localhost:5173 (also on LAN)
npm test           # vitest, node environment, tests/*.test.ts
npm run typecheck  # tsc --noEmit (TypeScript 7 native compiler)
npm run build      # typecheck + vite build -> dist/ (relative paths)
npm run preview    # serve dist/
```

Run `npm run typecheck`, `npm test` and `npm run build` after every major change. Fix all errors
before moving on. Browser verification tools live in [tools/browser/](tools/browser/README.md).

URL params: `?seed=ABC` (reproducible run, reused on retry) and `?quality=low|medium|high`.
In dev builds `window.game` is the live `GameApp`, and private fields are reachable at runtime, e.g.
`game.session.stats.health`. The perf overlay toggles with `` ` `` or F3.

## Non-negotiable conventions

- **Simulation and rendering are separate.** All gameplay happens in fixed 60 Hz steps
  (`GameSession.step`). Renderers interpolate `prev → current` with `alpha` and never mutate gameplay
  state. Visual-only motion (bank, bob, shake) may use the real frame `dt`.
- **The state machine gates time.** `GameStateMachine.isSimulationActive` decides whether steps run.
  Never add a separate "paused" flag to a system. Illegal transitions throw.
- **Coordinates:** gameplay is 2D `(x, y)` with y pointing up the screen. World is `(x, height, -y)`. Use
  `rendering/WorldSpace.ts`. The combat area is fixed at 18 × 30 on every device (`GameConfig.world`).
  Collision is 2D circles only.
- **All tunable numbers go in `src/app/GameConfig.ts`** or data definition files (`WeaponDefinitions`,
  `EnemyDefinitions`). No magic numbers in systems.
- **All colours come from `src/ui/Theme.ts` (`Palette`).** CSS uses the generated `var(--color-*)`
  variables. Never hardcode hex values elsewhere.
- **Randomness only through the run streams** (`createRunStreams(seed)`: environment, enemy, wave,
  upgrade, cosmetic). Effects use `cosmetic`. Never use `Math.random()` in gameplay. Same seed and same
  inputs must give the same run.
- **Data-driven, no name checks.** Weapons, enemies, upgrades and evolutions are data plus generic
  systems. Never write `if (upgrade.id === 'rapidFire')`.
- **Pool everything that spawns.** Projectiles and particles are typed-array pools rendered through
  `SpriteBatch` (one draw call each). Enemies and props use `ObjectPool`. Nothing allocates per shot or
  per frame in hot paths.
- **Fairness is a feature.** Enemy bullets are clamped in speed, capped in density, telegraphed, drawn
  on top (own layer, no depth test, dark rim), and never fired point-blank or from below the player.
  The player's hitbox (0.38) is smaller than the visual. Keep all of this when adding patterns and bosses.
- **Original work only.** The spec is "inspired by" other games. Never copy names, art, levels or the
  look of an existing game.
- **No placeholder modules.** Every file must have a working responsibility. Interim systems must say
  so in their header comment (e.g. `EncounterSpawner` until the Phase 4 wave director).
- Keep files focused (roughly under 400 lines). Each module starts with a header comment explaining its
  responsibility and how it connects to other modules.

## PlayCanvas 2.23 facts (verified against node_modules; re-verify after upgrades)

- Boot uses `createGraphicsDevice(canvas, { deviceTypes: [DEVICETYPE_WEBGL2] })`, then
  `new AppBase(canvas)`, then `app.init(AppOptions)` with only `RenderComponentSystem` and
  `CameraComponentSystem`. `Application` is legacy.
- Custom shaders use `new ShaderMaterial({ uniqueName, vertexGLSL, fragmentGLSL, attributes })`.
  GLSL is written ES1-style (`attribute`, `varying`, `gl_FragColor`) and the engine converts it.
  `#include "gammaPS"` gives you `decodeGamma` and `gammaCorrectOutput`. The `attributes` map
  (`vertex_position: SEMANTIC_POSITION`, …) is required.
- `ShaderDesc` is **not exported**. Use the derived type in `rendering/NeonShaders.ts`.
- WebGPU would need WGSL versions of our shaders, or glslang/twgsl URLs. We are WebGL2-only for now.
- Instancing with `ShaderMaterial` is manual. Declare `instance_line1..4` (`SEMANTIC_ATTR11..14`) and
  branch on `#ifdef INSTANCING`. See `transformInstancing` in the engine chunks.
- Canvas sizing: CSS controls the canvas size. Call `app.updateCanvasSize()` on resize. Do **not**
  call `app.resizeCanvas` or `setCanvasFillMode`, because they write inline pixel sizes.
- Dynamic geometry: `VertexBuffer(..., { usage: BUFFER_DYNAMIC })`, write into `lock()` storage, then
  `unlock()`, and set `mesh.primitive[0].count`. Set `meshInstance.cull = false` for batches.
- Layers: create with `new Layer({ name })`, add with `app.scene.layers.push(layer)`, and append
  `layer.id` to `camera.layers`. Composition order is draw order.
- `app.stats.drawCalls.total` works in both dev and release builds. Vite dev resolves the engine's
  `development` export (the debug build, which is slower and has asserts). Production builds get the
  release engine.

## Environment gotchas (Windows dev machine)

- The shell is Git Bash plus PowerShell. Backticks inside `node -e "..."` heredocs get eaten by bash
  command substitution. Use the Write/Edit tools for file edits instead of inline node scripts.
- `TaskStop` on a backgrounded `npx vite` only stops the npx wrapper, and the Vite child keeps
  holding the port. Kill the tree with `taskkill //PID <pid> //T //F`. Check with
  `Get-CimInstance Win32_Process -Filter "Name='node.exe'"`.
- Another project (`chain-reaction`) may run Vite on port 5185. Leave it alone.
- Headless Edge has a minimum window width of 500 px, and `--virtual-time-budget` does not drive
  `requestAnimationFrame`. For phone sizes and mid-game frames, use CDP
  `Emulation.setDeviceMetricsOverride` and wait on `game.session.elapsed`
  (see `tools/browser/`).
- The Edge launcher process exits immediately after handing off. That's normal, so don't treat
  it as a crash.

## Verification standard

A feature is done only when it is **functional in the browser**. Check desktop at 1280×720 and a phone
at 390×844 (DPR 2–3), with no console errors and stable pool sizes during a soak. Use
`tools/browser/smoke.mjs`, then look at the screenshots. Unit-test every deterministic system
(RNG, timers, damage, upgrades, waves, saves). Prefer extracting pure functions so they're testable
without PlayCanvas.
