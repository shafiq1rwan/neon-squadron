# Game Design: current state and decisions

This document covers what the game does today, the numbers it uses, and the decisions that refine
the spec. The full requirements are in [MASTER_PROMPT.md](MASTER_PROMPT.md). When tuning changes,
update the tables here (the source values live in `src/app/GameConfig.ts` and the definition files).

## Core loop (target)

Fly → auto-fire → survive waves → after each wave pick 1 of 3 upgrades → build a squadron of up to 4
wingmen → evolve weapons → mini-boss (wave 5) → Crimson Overlord (wave 10) → coins → hangar
upgrades → next run. A run should take about 5–8 minutes. Retry is one tap.

**Today (after Phase 2):** endless survival against an interim seeded spawner with gentle ramp-up.
It ends on death, then game over, then retry.

## First-session targets (spec §33) and status

| Target | Status |
|---|---|
| Control within 5 s | ✅ the game boots straight into play |
| Multiple kills within 15 s | ✅ 5 kills by 10 s and 6 by 15 s with **no input** (seed DEMO) |
| First upgrade within 30 s | ⬜ Phase 5 (end of wave 1) |
| Wingman within 60 s | ⬜ Phases 3 and 5 |
| Complex encounter within 2 min | 🟡 the spawner unlocks tanks at 40 s; the wave director comes in Phase 4 |
| Full run in 5–8 min | ⬜ Phase 6 |

## World and camera

| Value | Setting |
|---|---|
| Combat area | 18 × 30 units on **every** device |
| Player clamp margin | 0.9 inside the edges |
| Camera | 68° pitch, 36° vertical FOV, re-fitted on resize. HUD reserve 56 px top, 16 px bottom |
| Spawn line | 3 units above the combat top. Enemies never spawn on screen or on the player |
| Despawn | 4 units outside the area (no reward) |

## Player

| Stat | Value |
|---|---|
| Health / shield | 5 / 2 |
| Speed / accel / decel | 17 u/s / 140 / 110 u/s² |
| Pointer follow | up to 1.9× speed. "Arrive" braking (√(2·0.75·decel·d)) means no overshoot |
| Touch | relative drag, sensitivity 1.15. The anchor slides at the edges |
| Hitbox | radius 0.38 (the visual is much bigger) |
| Invulnerability | 1.2 s after any hit (blinks) |
| Shield regen | +1 every 2.5 s after 5 s without damage |
| Death → game over | 1.4 s delay. The world keeps moving while you watch the explosion |

## Weapons

| Weapon | Damage | Rate | Speed | Count | Notes |
|---|---|---|---|---|---|
| Pulse Cannon (default) | 1 | 8.5/s | 38 | 1 | Parallel streams 0.38 apart when +projectiles. Cooldown floor 0.05 s |
| Spread Cannon (defined, unused) | 0.8 | 4/s | 30 | 5 | 40° fan |

`fireRate` is volleys per second. **`cooldown` is the minimum interval after modifiers**, so it caps
attack-speed upgrades. This is our interpretation of the spec's two fields. Modifiers:
`damageMult, fireRateMult, projectileSpeedMult, extraProjectiles, extraPiercing, areaRadiusBonus`.

## Enemies

| Type | Cost | HP | Radius | Move | Attack | Reward |
|---|---|---|---|---|---|---|
| Basic Drone | 1 | 2 | 0.55 | straight 3.4 (or sine / zigzag in formations) | 1 straight shot, 6.5 u/s, every 3.4 s | 1 |
| Fast Interceptor | 2 | 2 | 0.50 | dive: approach a hold Y, wind up 0.6 s, lock a vector at the player, accelerate to 2.4× | none (ramming threat) | 2 |
| Shooter Drone | 3 | 7 | 0.70 | hover at y ≈ 9.5, strafe ±2.2 for 8 s, leave | aimed, 8.5 u/s, every 1.7 s | 3 |
| Heavy Tank | 5 | 28 | 1.15 | straight 1.7 | 5-way aimed spread over 54°, 6.8 u/s, every 2.5 s | 6 |

Ramming does 6 damage to the enemy and contact damage (1, or 2 for the tank) to the player, **once**.
Nothing happens while the player is invulnerable.

### Fairness rules (implemented, keep them)

- Enemy bullet speed is clamped to 4–12 u/s.
- Enemies hold fire if: off screen (within 1.2 of the top edge), at or below the player's height +1,
  closer than 4.5 units, the player is dead, or 160+ enemy bullets are alive.
- **Telegraph:** a 0.4 s pulsing flash before every shot. It only starts if the shot is allowed at
  that moment, and fairness is re-checked when the shot fires. Every attack, including the first,
  gets the full warning.
- Dive vectors lock once and never home, so dives can be dodged.
- Enemy bullets render on top with a dark rim (see ART_STYLE).

## Interim encounter spawner (until Phase 4)

Weighted formations unlock over time, with no back-to-back repeats (weight × 0.25):

| Formation | Unlocks at | Contents |
|---|---|---|
| drone-line | 0 s | 4–6 drones across the lane |
| drone-snake | 4 s | 5 drones in a sine column |
| drone-zigzag | 10 s | 4 drones zigzagging diagonally |
| interceptor-v | 12 s | 3–5 interceptors in a V, staggered dives |
| shooter-pair | 18 s | 2 hovering shooters |
| interceptor-sweep | 25 s | 5 interceptors crossing diagonally |
| tank-escort | 40 s | tank + 2 drones |

Interval 3.0 s → 1.6 s over 150 s (±0.3). Max alive 14 → 24. HP ×(1 + t/240).

## Design decisions log

| Decision | Why |
|---|---|
| Fixed 18×30 combat area, with the camera fitted per aspect ratio | Screen shape gives no gameplay advantage (spec §4) |
| Relative touch drag rather than "ship under finger" | The finger never covers the ship, and there's no teleport |
| Keyboard overrides mouse, and the mouse needs fresh movement to retake control | No sudden jumps when switching devices or resuming |
| Bullets pass through the player during invulnerability (not consumed) | Standard for the genre. It avoids the "shield of bullets" exploit |
| Telegraph only when a shot will follow | A flashing enemy must always mean "incoming" (bug found in Phase 2) |
| Death detected from `PlayerStats.alive`, not from an event | One source of truth. The run ends reliably whatever path caused the death |
| Coins credited instantly on kill | Simple for now. Pickups are an unscheduled idea |
| HTML/CSS for UI rather than PlayCanvas UI | Crisp text at any render scale, accessibility, fast iteration (spec allows HTML/CSS) |

## Planned systems: design notes for the next phases

- **Wingmen (Phase 3):** 4 fixed slots (front-left, front-right, rear-left, rear-right) relative to
  the player. They follow with a critically damped spring and are invulnerable. Gunner = fast
  projectiles at the nearest enemy ahead. Missile = homing, targets the highest-HP enemy, splash.
  Laser = piercing beam at the densest column. Slot offsets must fit on a 390 px phone.
- **Upgrades (Phase 5):** 3 cards after each wave, with rarity weights in config. Effects are data
  (`{ stat, op: 'add' | 'mult', value }`, `summonWingman`, `unlockEvolution`).
- **Evolutions:** recipes as data, e.g. Plasma Barrage = Rapid Fire L3 + Double Shot L2.
- **Bosses (Phase 6):** the Crimson Overlord switches to phase 2 at 50% HP (radial bursts, a
  rotating laser, faster movement). Camera shake must stay subtle while dodging.
