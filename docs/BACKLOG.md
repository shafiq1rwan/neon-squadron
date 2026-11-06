# Backlog

Known issues, tech debt and deferred work that doesn't belong to a phase's main checklist yet.
Priority: **P1** = fix before release / soon, **P2** = should do, **P3** = nice to have.
When an item is done, delete it here and mention it in the DEVLOG.

## Known issues

| P | Item | Notes |
|---|---|---|
| P2 | Fonts not bundled | Theme names Orbitron / Rajdhani / Share Tech Mono, but text falls back to system fonts. Bundle OFL web fonts in `public/fonts/` (Phase 7). |
| P2 | Pause screen is minimal | "Tap to resume" only. The full pause menu (resume / restart / settings / main menu) comes in Phase 7. |
| P2 | Game boots straight into play | No main menu yet (`LOADING → PLAYING`). Phase 7 adds `MAIN_MENU`. |
| P2 | Mobile quality detection is a heuristic | `isLikelyMobile()` = coarse pointer and small screen. Under some emulation it picks `high`. Add a settings override (Phase 7) and adaptive quality (Phase 9). |
| P3 | Lane rails sit on the floor plane | Rails are drawn on the grid 3.5 units below the gameplay plane, so with perspective they only approximately match the true combat edges. The player is clamped 0.9 inside anyway. |
| P3 | Dev perf overlay overlaps UI | Bottom-left on phones. Dev-only and toggleable (`` ` `` / F3). |
| P3 | HUD timer overlaps the enemy entry zone | The top-centre timer sits over where enemies enter. It has a text shadow, so it's readable. Revisit with the Phase 6 wave HUD. |

## Tech debt / performance

| P | Item | Notes |
|---|---|---|
| P2 | Enemies are per-entity draw calls | 2 mesh instances per enemy (about 50–65 draw calls in busy moments). Move to hardware instancing per design (custom `INSTANCING` branch in the neon shaders, with a per-instance flash attribute). Phase 9, or earlier if mobile profiling demands it. |
| P2 | `SpriteBatch` uploads its whole buffer | `unlock()` uploads the full capacity every frame. Switch to uploading only the used range if profiling shows a cost. |
| P3 | Closure allocation per enemy step | `EnemyManager.step` creates `() => this.canFire(e, ctx)` per armed enemy per step. Pass a reusable predicate object instead. |
| P3 | One enemy bullet hit per step | `CollisionSystem` stops checking enemy bullets after the first hit (invulnerability follows anyway). Fine for now; revisit if non-damaging bullet types appear. |
| P3 | Bundle size | About 298 KB gzipped, almost all engine. If needed: check what `AppBase` still pulls in, and lazy-load later systems. |
| P3 | WebGPU path | Needs WGSL versions of `neon-solid`, `neon-glow`, `neon-grid` and `neon-sprite`, or glslang/twgsl. Optional per spec. |

## Deferred features (from spec, not yet scheduled in detail)

- Rewarded "revive" via Poki ad (Phase 10). The design must keep it user-initiated.
- Debug seed entry UI and wave inspector (Phase 4).
- Screen-shake setting in UI (config exists: `GameConfig.effects.screenShakeScale`, `CameraManager.shakeScale`).
- Engine trails and projectile trails (Phase 9).
- Elite enemy type (Phase 4).
- "Circular" and "formation following" movement patterns (Phase 4).
- Remaining bullet patterns: spiral, rotating spiral, sine, crossfire, delayed burst, rotating laser (Phase 4).
- Laser Beam, Homing Missile and Tesla weapons (Phases 3 and 5).
- Interactive first-session tutorial (spec §17: "may launch directly into a short interactive tutorial").

## Ideas (unscheduled, need design approval)

- Seed-of-the-day challenge using the deterministic seed system.
- Accessibility: colour-blind-safe enemy bullet variant (shape cue in addition to colour), high-contrast mode.
- Haptic feedback on mobile hits (`navigator.vibrate`, respect settings).
- Pickup magnet / coin pickups instead of instant coin credit.
