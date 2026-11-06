# Browser verification tools

These scripts have no dependencies. They drive headless Chrome or Edge over the DevTools protocol
against the **dev server** (they use `window.game`, which only exists in dev builds). They need Node 22+.

```bash
npm run dev                         # in another terminal
node tools/browser/smoke.mjs        # pass/fail checks, exit code 0 = all passed
node tools/browser/shot.mjs 13 desk:1280x720:1:0 phone:390x844:2:1
node tools/browser/probe.mjs 30 390x844 2 1
```

| Script | Purpose |
|---|---|
| `smoke.mjs` | Boot, kills within 15 s, keyboard, mouse follow, pause freezes time, 20 s soak (pools bounded, no refused spawns), death by a real bullet, game over, Enter retry, mobile touch drag, rotation, no page errors |
| `shot.mjs` | Screenshots at exact viewport and DPR after N seconds of simulated play, with the dev overlay hidden |
| `probe.mjs` | Per-second state line with timeouts, for finding hangs, crashes or growth |

- **Output** goes to `tools/browser/out/` (screenshots plus throwaway browser profiles). It's gitignored.
- **Browser:** auto-detected (Chrome, then Edge). Override with `BROWSER_PATH=/path/to/chrome`.
- **URL:** defaults to `http://localhost:5173/?seed=DEMO`. Override with `GAME_URL=...` or
  `--url=...` for shot and probe, or a positional argument for smoke.
- **Look at the screenshots.** Some bugs only show visually.

Notes:
- Rendering uses SwiftShader (software), so the FPS numbers here say nothing about real devices.
  Use the dev overlay on real hardware.
- Use CDP device emulation for phone sizes, because headless windows have a 500 px minimum width.
  `--virtual-time-budget` does not drive `requestAnimationFrame`. The scripts wait on
  `game.session.elapsed` instead.
- `close()` shuts the browser down over CDP. On Windows the launched process exits immediately and
  the real browser outlives it.
