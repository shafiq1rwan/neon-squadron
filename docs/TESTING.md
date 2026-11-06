# Testing

## Automated (unit)

`npm test` runs Vitest in a node environment on `tests/*.test.ts`. Rule: every deterministic system
gets tests. Extract pure functions so they can be tested without PlayCanvas (importing `playcanvas`
for constants works in node; constructing an app does not).

| File | Covers |
|---|---|
| `SeededRandom.test.ts` | reproducibility, ranges, forks independent of parent use, stream isolation |
| `GameState.test.ts` | illegal transitions throw, simulation/input gating, pause/resume target, listeners |
| `TimeManager.test.ts` | 60 Hz stepping, 30/144 Hz equivalence, no advance while paused, catch-up cap |
| `CameraFraming.test.ts` | combat area fully visible at 16:9, 16:10, 4:3, 9:16, 9:19.5, 21:9; tight fit; picking inverts projection |
| `PlayerController.test.ts` | top speed, quick stop, clamping, pointer arrive without overshoot |
| `ObjectPool.test.ts` | reuse, max size, prewarm |
| `EnvironmentGenerator.test.ts` | per-chunk determinism, variation, nothing inside the lane |
| `Combat.test.ts` | projectiles (move, expire, bounds, swap-remove, capacity), weapons (rate independent of step size, modifiers, cooldown cap, fan symmetry), player stats (shield first, invulnerability, death, regen), swept collision, spatial grid, movement determinism, dive lock, hover in lane, bullet speed clamp, radial symmetry, telegraph rules |

Avoid asserting exactly on time boundaries (for example "16 volleys at t = 2.0 s"), because floating
point makes them flaky. Pick windows between events, or derive expectations from the config.

## Browser verification

Tools in `tools/browser/` (see its README) drive headless Edge or Chrome over CDP against the dev server.

```bash
npm run dev                                   # terminal 1
node tools/browser/smoke.mjs                  # input, combat soak, death → game over → retry, mobile
node tools/browser/shot.mjs 13 desk:1280x720:1:0 phone:390x844:2:1   # screenshots at 13 s of play
node tools/browser/probe.mjs                  # per-second state on mobile emulation (hang/crash finder)
```

Outputs go to `tools/browser/out/` (gitignored). **Look at the screenshots.** Numbers alone missed
the telegraph bug, and the screenshot caught it.

## Manual checklist (real devices, per phase)

- [ ] Desktop Chrome / Edge / Firefox / Safari: keyboard, mouse follow, switching between them,
      Esc pause, resize the window mid-game
- [ ] Phone (iOS Safari, Android Chrome): one-finger drag, second finger doesn't break steering,
      rotate mid-game, browser UI show/hide, notch / safe area, pause button
- [ ] Tab away and back pauses. Focus loss pauses.
- [ ] 60 s of heavy combat: FPS and frame time in the dev overlay, pools stable
- [ ] `?quality=low` still looks good
- [ ] No console errors
