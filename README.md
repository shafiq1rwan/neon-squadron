# NEON SQUADRON

A 2.5D neon roguelike squadron shooter for the browser, built with the PlayCanvas Engine
(code-first, no editor), TypeScript and Vite. Target platform: Poki (static HTML5 build).

**Status:** Phases 1–2 of 10 are done (foundation and core combat). Next is Phase 3, the
squadron/wingmen. See [docs/ROADMAP.md](docs/ROADMAP.md).

**Play:** https://shafiq1rwan.github.io/neon-squadron/. Every push to `main` is tested, built and
deployed by [.github/workflows/deploy.yml](.github/workflows/deploy.yml). One-time repo setting:
*Settings → Pages → Source: GitHub Actions*.

## Setup on a new machine

Requirements: **Node 22.12+** (developed on Node 26), npm, and Chrome or Edge for the browser tools.

```bash
npm install          # uses package-lock.json for exact versions
npm run dev          # http://localhost:5173
npm test             # unit tests
npm run build        # typecheck + production build into dist/
npm run smoke        # end-to-end browser checks (needs `npm run dev` running)
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (LAN-accessible, for testing on a phone) |
| `npm run build` | Type-check, then build static files into `dist/` (relative paths) |
| `npm run preview` | Serve the production build |
| `npm test` | Vitest unit tests |
| `npm run typecheck` | Type-check only |
| `npm run smoke` | Headless browser smoke test (pass/fail) |
| `npm run shots -- 13 desk:1280x720:1:0 phone:390x844:2:1` | Screenshots after N seconds of play |

## Controls

- **Desktop:** WASD or arrow keys, or move the mouse (the ship follows the cursor). `Esc`, `P` or the
  pause button pauses. Enter retries after a defeat.
- **Mobile:** touch anywhere and drag. Movement is relative to where your finger lands, so your
  finger never covers the ship. The top-right button pauses.
- Weapons fire automatically.

## Testing aids

- `?seed=ABC123` reproduces a run (also reused on retry).
- `?quality=low|medium|high` forces a graphics profile.
- In dev builds a performance overlay appears in the bottom-left (toggle with `` ` `` or F3), and
  `window.game` exposes the running game in the console. Neither ships in production.

## Documentation

| Doc | Contents |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Working rules, conventions and gotchas for AI-assisted development |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phase status, checklists, acceptance criteria |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Known issues, tech debt, deferred features, ideas |
| [docs/DEVLOG.md](docs/DEVLOG.md) | Per-session history: what was built, verified and fixed |
| [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) | Current mechanics, tuning tables, fairness rules, design decisions |
| [docs/ART_STYLE.md](docs/ART_STYLE.md) | Palette, geometry, readability rules, effects, UI style |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System map, frame loop, coordinates, rendering, pools, recipes |
| [docs/TESTING.md](docs/TESTING.md) | Unit test coverage, browser tools, manual device checklist |
| [docs/MASTER_PROMPT.md](docs/MASTER_PROMPT.md) | The original full project specification (source of truth) |
| [tools/browser/README.md](tools/browser/README.md) | Browser verification scripts |

## Project layout

```
src/
  app/          GameApp (engine + UI wiring), GameSession (one run), state machine, config, events
  core/         fixed timestep, seeded RNG, object pool
  input/        keyboard, mouse, touch → one movement intent
  player/       controller (movement), stats (health/shield), renderer
  combat/       weapons, projectiles, collision, damage, interim spawner
  enemies/      definitions, behaviours (movement/attacks), manager
  procedural/   aircraft generator, scenery layout
  rendering/    camera, shaders, materials, mesh cache, sprite batches, particles, effects, quality
  environment/  grid + chunked scenery
  ui/           theme tokens, HUD, pause and game-over overlays
  debug/        dev-only performance overlay
tests/          Vitest unit tests
tools/browser/  headless browser verification
docs/           project documentation
```
