# Art Style Guide

**Minimalist neon vector 2.5D.** Glowing geometric shapes over a dark, scrolling grid, seen from a
fixed, mostly top-down camera with slight perspective. This guide covers the original look
of Neon Squadron. Never imitate a specific existing game's art.

Readability beats spectacle: a player must always be able to see enemy bullets and their own ship.

## Palette

All colours live in `src/ui/Theme.ts` (`Palette`) and are exposed to CSS as `--color-<kebab-name>`.
**Never hardcode a hex value anywhere else.**

| Token | Hex | Use |
|---|---|---|
| `bgPrimary` | `#080C18` | Clear colour, page background, grid base |
| `bgSecondary` | `#111A2E` | Hull base (mixed with neon), panels |
| `player` | `#00E5FF` | Player ship, lane rails, primary UI accent, health pips |
| `wingman` | `#A855F7` | Wingmen, shield pips, accent scenery |
| `enemy` | `#FF365E` | Standard enemies, enemy bullets, explosions |
| `elite` | `#FF00D4` | Elite enemies (Phase 4) |
| `projectile` | `#00FFFF` | Player projectiles, muzzle flash, hit sparks |
| `legendary` | `#FFB800` | Legendary rarity, area-damage rings |
| `textPrimary` | `#F2F6FF` | Main text |
| `textSecondary` | `#92A4C0` | Labels, hints |
| `gridMinor` / `gridMajor` | `#16243F` / `#1D6F8C` | Floor grid lines |
| `engineCore` | `#E8FDFF` | Player engine cores |
| `enemyCore` | `#FFE1E8` | Enemy cores, white-hot spark tint |
| `shieldHit` | `#7DF9FF` | Shield impact ring |
| `danger` | `#FF365E` | Game over, destructive UI |
| `rarityCommon/Rare/Epic/Legendary` | cyan / `#3B82F6` / purple / gold | Upgrade cards (Phase 5) |

**Colour meaning is consistent.** Cyan is the player and friendly fire. Purple is the squadron. Red
means hostile. Magenta is elite. Gold is legendary or special. A new element must take its colour from
its role.

## Aircraft

Built procedurally by `procedural/AircraftGenerator.ts` from templates. Never use random unconstrained
geometry.

- **Parts:** body (triangle, diamond, hexagon, arrowhead, spearhead), mirrored wings (straight,
  swept, split, delta, angular), engines (1–3 glowing discs), glowing core, energy fins, weapon mounts.
- **Surfaces:** low faceted pyramids (an apex raised over each convex part) with lighting **baked into
  vertex colours**. There are no runtime lights or textures. The hull is dark: `mix(bgSecondary, neon,
  ~0.3)`.
- **Outlines:** every part edge gets a bright core ribbon (width 0.05, neon brightened 45% towards
  white) plus a soft additive halo (width ~0.34, alpha ~0.32). Ribbons face the fixed camera, because
  GL lines are 1 px.
- **Silhouette first:** each enemy class must be recognisable by outline alone at phone size.
  Drone = small diamond. Interceptor = narrow arrowhead. Shooter = hexagon with angular wings. Tank =
  big hexagon with delta wings.
- **Orientation:** the player's nose points up the screen. Enemies point down (yaw 180°).
- **Motion:** visual-only bank when strafing (player up to 0.55 rad), a slight nose pitch, and a gentle
  hover bob. None of it touches collision.
- **Scale:** player visual scale 1.3 (about 2.3 units long). Enemies 1.1–1.2. Sizes are tuned so the
  ship is about 6% of the screen height on desktop and about 13% of the width on a phone.

## Projectiles: readability rules

| | Player shots | Enemy bullets |
|---|---|---|
| Shape | Elongated bolt: white-hot core inside a cyan halo | Round orb: white core, red body, **dark rim** |
| Blend | Additive | Premultiplied "over" (the dark rim occludes what's behind it) |
| Layer | World, depth-tested | Own `EnemyBullets` layer, drawn last, **no depth test** |
| Visual size | 1.3 × 0.5 | 0.64–0.72 diameter |
| Hitbox | radius 0.22 | radius 0.20–0.24 (smaller than the visual) |

Enemy bullets must stay visible over explosions, scenery and ships. Any new enemy projectile type
must use the overlay layer and keep the dark rim.

**Hitboxes are smaller than visuals:** the player's collision radius is 0.38 against a ship about
1.4 units wide.

## Effects

All effects go through `rendering/EffectsManager.ts` → pooled particles → one `SpriteBatch`.

- Effects are short-lived (0.05–1.1 s) and sized so they never blanket the lane.
- Shapes: bolt (stretched spark), dot (flash), ring (shockwave).
- Hit spark: a tiny flash plus 3 sparks kicked back towards the shooter.
- Explosion: white flash, coloured flash, a ring expanding to about 4× scale, and 12+ streak sparks
  plus slow embers. Tanks scale up to 1.7×.
- **Screen shake** is subtle. It's trauma-based: the offset grows with trauma², capped at 0.35 units.
  It happens only for player damage, heavy explosions and death, never for routine hits. It respects
  `shakeScale`, and a setting for it is planned.
- Effects use the **cosmetic** RNG stream only.

## Environment

- The floor grid sits 3.5 units below the gameplay plane, which gives parallax depth for free. Minor
  cells are 2 units, with a major line every 4 cells and a slow travelling pulse. The grid outside the
  combat lane is dimmed to 45%. Soft cyan rails mark the lane edges.
- The far edge fades into `bgPrimary`.
- Scenery (pillar, tower, pyramid, pad, arch) is always outside the lane, at least 1.6 units from
  its edge, and always **below the gameplay plane**, so it can never cover ships or bullets. It's
  mostly dim cyan, with about 18% purple accent pieces.
- On desktop the extra horizontal space shows scenery. On phones the lane fills the width.

## Glow and quality tiers

The look must hold up **without bloom**: neon comes from bright core ribbons plus additive halos.

| | Low | Medium (phone default) | High (desktop default) |
|---|---|---|---|
| Max pixel ratio | 1 | 1.5 | 2 |
| MSAA | off | on | on |
| Glow intensity | 0.7 | 0.9 | 1.0 |
| Props per chunk | 3 | 5 | 8 |
| Particle budget | 250 | 500 | 900 |

Bloom, trails and post-processing (Phase 9) are added to High only.

## UI

- **Tokens** in `Theme.ts`: spacing on an 8 px grid (`xs 4 · sm 8 · md 16 · lg 24 · xl 32`), motion
  (`fast 120 · normal 220 · slow 400 ms`), and fonts (display / body / numeric).
- **Panels:** dark gradient (`bgSecondary → bgPrimary`, 95% opacity), a 1 px neon border at about
  50%, 10 px radius, and a soft outer glow in the panel's accent colour. Danger panels swap to red.
- **Primary button:** filled cyan with dark text, display font, wide letter-spacing, glow, scales to
  0.97 on press, white focus ring. Minimum 52 px tall.
- **Icon button:** 44 × 44 px minimum, translucent dark fill, neon border.
- **HUD:** health pips (skewed cyan bars), shield pips (smaller purple). The timer and kills use the
  numeric font, and pips shake briefly when damaged. The HUD sits inside the safe area and only real
  controls take input.
- **Typography plan (Phase 7):** Orbitron for display, Rajdhani for body, Share Tech Mono for
  numbers. All three are OFL, bundled locally, and need a licence check before shipping.
- Respect `prefers-reduced-motion`: no shake animations, no panel transitions.
- Combat pauses behind every overlay. The background stays visible but dimmed (`rgba(8,12,24,0.7)`).

## Don'ts

- No textures, PBR, realistic lighting or photographic elements.
- No particles on UI cards and no full-screen flashes.
- No colours outside the palette, and no reuse of red for friendly things.
- No decoration inside the combat lane, and nothing above the gameplay plane except ships, bullets
  and effects.
- No copying of logos, ships, fonts or UI from other games.
