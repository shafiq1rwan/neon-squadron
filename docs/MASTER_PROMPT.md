# NEON SQUADRON
## Complete Game Development Master Prompt
### PlayCanvas + TypeScript + HTML5 + Poki

> This is the original project specification, preserved verbatim. It is the source of truth for
> scope and requirements. Decisions that refine or deviate from it are recorded in
> [GAME_DESIGN.md](GAME_DESIGN.md), [ARCHITECTURE.md](ARCHITECTURE.md) and [DEVLOG.md](DEVLOG.md).

---

# 1. PROJECT OVERVIEW

You are a senior game developer, technical architect, gameplay designer, UI/UX designer, and graphics programmer specializing in browser-based games.

Your task is to develop a complete, polished, playable HTML5 game called:

**NEON SQUADRON**

The game is a fast-paced, procedurally generated, 2.5D vertical scrolling roguelike shooter inspired by the accessible gameplay loop of Survivor: Ace, with the visual language of Geometry Wars and TRON.

The game must have its own original identity, artwork, aircraft designs, upgrade mechanics, and presentation.

The player controls a futuristic neon aircraft that automatically attacks incoming enemies.

Throughout each run, the player unlocks and upgrades companion aircraft called Wingmen, gradually building a powerful squadron.

The game combines:

- Vertical scrolling arcade shooting
- Automatic weapon firing
- Bullet-hell combat
- Procedural enemies and environments
- Procedural wave generation
- Roguelike upgrades
- Squadron formation mechanics
- Weapon evolutions
- Permanent progression
- Boss encounters
- Responsive desktop and mobile gameplay

The target publishing platform is Poki.

The game must run directly in modern desktop and mobile browsers without requiring downloads or installation.

## Primary Objectives

1. Create immediately satisfying arcade gameplay.
2. Provide a premium-looking neon vector aesthetic.
3. Maintain a 60 FPS performance target.
4. Support desktop and mobile devices.
5. Keep the initial download small.
6. Make procedural generation deterministic and reproducible.
7. Create a polished, consistent UI/UX system.
8. Provide engaging progression and replayability.
9. Follow current Poki technical and integration requirements.
10. Use a modular, maintainable TypeScript architecture.

**Important:** Do not attempt to implement every feature simultaneously. Build a playable vertical slice first, verify it, and then expand the game in clearly defined development phases.

---

# 2. TECHNOLOGY STACK

Use the following technologies.

| Component | Technology |
|---|---|
| Game engine | PlayCanvas Engine |
| Programming language | TypeScript |
| Rendering | WebGL 2 |
| Optional rendering | WebGPU |
| Graphics | Procedural low-poly 3D geometry |
| Camera | Fixed 2.5D perspective |
| Gameplay physics | Custom 2D collision system |
| Visual effects | Shaders, particles, instancing |
| User interface | PlayCanvas UI, with HTML/CSS where beneficial |
| Audio | Browser-compatible audio through PlayCanvas |
| Build system | Vite |
| Package manager | npm |
| Publishing | Poki HTML5 |
| Persistence | Local storage abstraction |
| Random generation | Seeded PRNG |

Use the current stable compatible versions of all dependencies.

Verify the official PlayCanvas and Poki documentation before implementing version-specific APIs.

Prefer the PlayCanvas Engine npm package with a code-first TypeScript architecture.

Do not require the PlayCanvas online editor to run or build the project.

The development workflow should support:

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`

Produce a static web build suitable for hosting and Poki submission.

Use relative asset paths.

Do not depend on a backend server for normal gameplay.

---

# 3. VISUAL ART DIRECTION

## Style: Minimalist Neon Vector 2.5D

Create a futuristic cyber-arcade aesthetic.

Visual references include:

- Glowing geometric shapes
- Dark futuristic environments
- Neon grid surfaces
- Holographic interfaces
- Angular spacecraft
- Energy projectiles
- Geometric explosions
- Subtle perspective and depth

The overall appearance should resemble a highly polished modern arcade shooter.

Avoid realistic graphics, photorealistic materials, and expensive physically based lighting.

Prioritize clean geometry, readability, and efficient rendering.

## Color Palette

Use the following primary palette.

| Element | Color | Hex |
|---|---|---|
| Primary background | Deep navy | #080C18 |
| Secondary background | Dark blue | #111A2E |
| Player aircraft | Electric cyan | #00E5FF |
| Wingmen | Neon purple | #A855F7 |
| Standard enemies | Neon red | #FF365E |
| Elite enemies | Magenta | #FF00D4 |
| Energy projectiles | Bright cyan | #00FFFF |
| Legendary upgrades | Gold | #FFB800 |
| Main text | Soft white | #F2F6FF |
| Secondary text | Muted blue-gray | #92A4C0 |

All colors should be defined centrally in a theme configuration.

Avoid scattering hardcoded colors throughout the project.

## Geometry Requirements

Create aircraft using lightweight procedural meshes.

Aircraft should have:

- Angular bodies
- Symmetrical wings
- Glowing outlines
- Distinct engine cores
- Simple geometric surface details
- Optional animated engine trails

Use low polygon counts.

Prefer flat shading or simple custom materials.

Avoid unnecessary textures.

Cache generated meshes and reuse geometry wherever possible.

## Glow and Bloom

Neon effects are important, but performance is more important than excessive glow.

Implement two approaches:

**High-quality mode**

- Low-resolution bloom
- Soft emissive glow
- Lightweight particle effects
- Animated energy trails

**Performance mode**

- Bright unlit materials
- Simple glow geometry
- Minimal or disabled bloom
- Reduced particle counts

The game must remain visually appealing even when bloom is disabled.

---

# 4. CAMERA AND 2.5D WORLD

The game uses a fixed camera.

The world is rendered using 3D graphics, but gameplay occurs on a two-dimensional movement plane.

## Camera Requirements

- Mostly top-down viewing angle
- Slight perspective for visual depth
- No free camera rotation
- No manual camera controls
- Smooth camera behavior
- Stable framing during gameplay

Aircraft should bank slightly when moving horizontally.

This banking animation is visual only and must not affect collision detection.

## Gameplay Coordinates

Use a consistent logical coordinate system.

The player and enemies move on a defined X/Y gameplay plane.

Visual height and Z-depth may be used for:

- Aircraft elevation
- Engine effects
- Background structures
- Explosions
- Decorative geometry

Gameplay collision calculations should remain two-dimensional.

## Responsive Camera

Support:

- 16:9 desktop
- 16:10 desktop
- 4:3 desktop/tablet
- 9:16 mobile portrait
- 9:19.5 mobile portrait
- Other common browser aspect ratios

Do not stretch the game scene to fit the viewport.

Instead, adapt the camera's visible world area.

Maintain a consistent logical combat area so players do not gain an unfair advantage from screen dimensions.

On desktop, extra horizontal space may display decorative scenery.

On mobile, prioritize visibility of incoming enemies and bullets.

Avoid enemy spawning from invisible or unfair positions.

---

# 5. PLAYER CONTROLLER

The player controls a single main aircraft.

## Player Features

The player must support:

- Smooth movement
- Automatic shooting
- Health
- Shield
- Damage
- Temporary invulnerability
- Visual hit feedback
- Death animation
- Weapon upgrades
- Wingman companions
- Collision with enemies and projectiles

## Desktop Controls

Support:

- WASD movement
- Arrow-key movement
- Mouse movement
- Escape to pause

Automatic shooting must not require mouse clicks or keyboard input.

For mouse controls, implement an intuitive follow-cursor system.

Prevent sudden teleportation when switching between keyboard and mouse controls.

## Mobile Controls

Use touch-and-drag movement.

Requirements:

- Touch anywhere in the gameplay region to begin movement.
- Move the aircraft based on touch displacement.
- Maintain a configurable finger offset.
- Prevent the finger from covering the aircraft where practical.
- Avoid sudden aircraft teleportation.
- Clamp movement within gameplay boundaries.
- Ignore gameplay movement while interacting with menus.
- Support multitouch safely.

Do not require a virtual joystick.

The player must remain controllable with one finger.

## Player Movement

Use smooth, responsive acceleration and deceleration.

Avoid overly slippery movement.

Player movement must feel precise enough for bullet-hell dodging.

Implement configurable values:

```typescript
interface PlayerConfig {
  maxHealth: number;
  maxShield: number;
  movementSpeed: number;
  acceleration: number;
  deceleration: number;
  collisionRadius: number;
  invulnerabilityDuration: number;
}
```

All movement must use frame-rate-independent timing.

---

# 6. AUTOMATIC COMBAT SYSTEM

The player automatically fires weapons while gameplay is active.

Weapons must be modular and data-driven.

## Initial Weapons

Implement:

### Pulse Cannon

The default weapon.

- Fires straight projectiles.
- Moderate attack speed.
- Moderate damage.
- No ammunition limit.

### Spread Cannon

- Fires multiple projectiles.
- Adjustable spread angle.
- Effective against multiple enemies.

### Laser Beam

- Fires a piercing energy beam.
- Can damage multiple aligned enemies.
- Uses lightweight visual effects.

### Homing Missile

- Automatically tracks enemies.
- Deals area damage.
- Has limited turning speed.

### Tesla Weapon

- Attacks nearby enemies.
- Can chain damage between targets.
- Has configurable chain count.

## Weapon Architecture

Use a common weapon interface.

```typescript
interface WeaponDefinition {
  id: string;
  name: string;
  damage: number;
  fireRate: number;
  projectileSpeed: number;
  projectileCount: number;
  spreadAngle: number;
  piercing: number;
  cooldown: number;
}
```

Create separate systems for:

- Weapon configuration
- Target acquisition
- Firing
- Projectile simulation
- Damage calculation
- Visual effects

Avoid coupling weapon logic directly to rendering.

## Projectile System

Implement centralized projectile management.

Requirements:

- Object pooling
- Lightweight projectile data
- Efficient movement
- Collision detection
- Lifetime expiration
- Configurable damage
- Configurable speed
- Piercing behavior
- Area damage
- Homing behavior

Do not instantiate expensive independent entities for every bullet if a more efficient centralized approach is available.

---

# 7. WINGMAN SQUADRON SYSTEM

The Wingman system is the game's primary distinguishing feature.

Players gradually build a squadron during a run.

Wingmen automatically follow the player and attack enemies.

## Formation Rules

Initially allow a maximum of four wingmen.

Use fixed formation slots.

Example:

```text
       W1          W2

             PLAYER

       W3          W4
```

Formation positions are relative to the main aircraft.

Wingmen must follow smoothly.

Use interpolation or critically damped movement.

Avoid rigid-body physics for formation movement.

## Starting Wingmen

Implement three initial types.

### Gunner Wingman

Role: Consistent damage.

Behavior:

- Fires rapid projectiles.
- Prioritizes enemies ahead.
- Moderate damage.
- High fire rate.

### Missile Wingman

Role: Target elimination.

Behavior:

- Launches homing missiles.
- Prioritizes stronger enemies.
- Lower fire rate.
- Higher damage.

### Laser Wingman

Role: Piercing damage.

Behavior:

- Fires concentrated energy beams.
- Can damage multiple enemies.
- Effective against formations.

## Wingman Data

```typescript
interface WingmanDefinition {
  id: string;
  name: string;
  role: string;
  weaponId: string;
  baseDamage: number;
  attackSpeed: number;
  targetRange: number;
  formationSlot: number;
  maxLevel: number;
}
```

## Wingman Upgrades

Wingmen can gain:

- Increased damage
- Increased attack speed
- Additional projectiles
- Additional targeting range
- Improved homing
- Piercing attacks
- Area damage
- Special abilities

## Formation Behavior

Wingmen should:

- Maintain their assigned position.
- Avoid visual jitter.
- Stay visible on different screen sizes.
- Not obstruct the player unnecessarily.
- Continue attacking automatically.
- Respond smoothly to rapid player movement.

Wingmen should not require individual controls.

For the initial implementation, wingmen are not vulnerable to enemy bullets.

This keeps the game easy to understand and prevents excessive micromanagement.

---

# 8. PROCEDURAL AIRCRAFT GENERATION

All standard enemy aircraft should be generated from reusable geometric components.

Use deterministic procedural generation.

Each generated aircraft should have a seed.

## Aircraft Components

### Body Types

- Triangle
- Diamond
- Hexagon
- Arrowhead
- Spearhead

### Wing Types

- Straight
- Swept
- Split
- Delta
- Angular

### Additional Details

- Engine count
- Weapon mounts
- Glowing cores
- Energy fins
- Decorative geometric accents

## Generation Rules

Aircraft must remain:

- Symmetrical where appropriate
- Visually recognizable
- Consistent with their enemy class
- Lightweight to render
- Readable at mobile screen sizes

Do not generate geometry randomly without constraints.

Use predefined templates with controlled procedural variation.

## Performance

Generate meshes:

- During loading
- Before waves
- During safe transition moments
- On first use, followed by caching

Do not regenerate complex meshes every frame.

Reuse mesh variants where possible.

---

# 9. ENEMY SYSTEM

Implement modular enemy behaviors.

## Enemy Types

### Basic Drone

- Low health
- Slow movement
- Simple attacks

### Fast Interceptor

- Low health
- High movement speed
- Quick attack patterns

### Shooter Drone

- Moderate health
- Fires aimed projectiles
- Maintains distance

### Heavy Tank

- High health
- Slow movement
- Fires multiple projectiles

### Elite Enemy

- Increased health
- Multiple attack phases
- More complex patterns
- Higher rewards

## Enemy Architecture

Each enemy should have:

- Enemy definition
- Health
- Movement behavior
- Attack behavior
- Collision shape
- Reward value
- Visual configuration

Use reusable movement patterns:

- Straight
- Zigzag
- Sine wave
- Diagonal
- Circular
- Diving
- Formation following

Enemy movement should be deterministic for a given seed and gameplay state.

---

# 10. PROCEDURAL WAVE GENERATION

Create a procedural wave director.

Do not manually script every wave.

Use a difficulty-budget system.

## Difficulty Budget

Example:

| Enemy Type | Cost |
|---|---|
| Basic Drone | 1 |
| Fast Interceptor | 2 |
| Shooter Drone | 3 |
| Heavy Tank | 5 |
| Elite Enemy | 10 |

Each wave receives a difficulty budget.

The director chooses enemy combinations that fit the budget.

## Difficulty Progression

Increase difficulty through:

- Enemy count
- Enemy health
- Projectile density
- Enemy speed
- Attack variety
- Elite encounters
- Formation complexity

Avoid simply multiplying enemy health indefinitely.

## Wave Structure

A standard run initially contains ten waves.

Suggested pacing:

| Wave | Purpose |
|---|---|
| 1 | Introduce movement and shooting |
| 2 | Introduce new enemies |
| 3 | Increase attack complexity |
| 4 | Introduce mixed formations |
| 5 | Mini-boss |
| 6 | Increased projectile density |
| 7 | Elite enemies |
| 8 | More complex formations |
| 9 | Final preparation |
| 10 | Boss |

The target full-run duration is approximately 5–8 minutes.

This is an initial design goal and should be tuned through playtesting.

## Fairness Rules

The wave director must prevent:

- Enemies spawning directly on the player.
- Impossible bullet patterns.
- Unavoidable collisions.
- Excessive simultaneous threats.
- Sudden unfair difficulty spikes.

Enemy patterns must remain readable on narrow mobile screens.

---

# 11. BULLET-HELL PATTERN GENERATOR

Implement reusable projectile patterns.

## Patterns

- Straight shot
- Aimed shot
- Spread shot
- Radial burst
- Spiral
- Rotating spiral
- Sine wave
- Crossfire
- Delayed burst
- Rotating laser

Each pattern must be parameterized.

Example:

```typescript
interface BulletPatternConfig {
  type: string;
  projectileCount: number;
  projectileSpeed: number;
  fireInterval: number;
  spreadAngle: number;
  rotationSpeed: number;
  damage: number;
  color: string;
}
```

## Pattern Fairness

Provide:

- Projectile speed limits
- Minimum safe gaps
- Clear attack telegraphs
- Attack cooldowns
- Maximum projectile density
- Safe spawning distances

Test patterns at different viewport sizes.

The player must have a reasonable opportunity to dodge.

---

# 12. PROCEDURAL ENVIRONMENT

Create an infinite futuristic neon battlefield.

The environment must appear to scroll continuously.

## Environment Features

- Dark grid floor
- Glowing grid lines
- Neon geometric structures
- Decorative pillars
- Distant structures
- Subtle parallax
- Occasional energy elements

## Implementation

Use a scrolling grid shader where possible.

Decorative structures should be generated from reusable low-poly meshes.

Use chunk-based procedural generation.

Example:

```text
Environment Manager
       |
       ├── Active Chunk
       ├── Incoming Chunk
       ├── Recycled Chunk Pool
       └── Environment Theme
```

Do not generate an unlimited number of active objects.

Recycle old chunks.

Decorative scenery must not obscure enemy projectiles.

For the first version, environmental obstacles are visual only.

---

# 13. ROGUELIKE UPGRADE SYSTEM

Players choose upgrades during a run.

After completing a wave, pause gameplay and display three upgrade cards.

The player selects one upgrade.

After selection, the game resumes.

## Upgrade Categories

### Player Upgrades

- Increased damage
- Increased attack speed
- Increased movement speed
- Additional projectiles
- Critical hit chance
- Shield enhancement

### Wingman Upgrades

- Summon a wingman
- Increase wingman damage
- Increase wingman attack speed
- Upgrade wingman weapon
- Improve targeting

### Squadron Upgrades

- Coordinated fire
- Increased squadron damage
- Improved target acquisition
- Formation attack bonuses
- Weapon synergy

## Upgrade Rarities

Implement four rarity levels.

| Rarity | UI Color |
|---|---|
| Common | Cyan |
| Rare | Blue |
| Epic | Purple |
| Legendary | Gold |

Rarity affects upgrade strength and appearance.

Do not make rarity probabilities hardcoded throughout the project.

Store rarity weights in configuration.

## Upgrade Data

```typescript
interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  category: string;
  maxStacks: number;
  prerequisites: string[];
  effects: UpgradeEffect[];
}
```

Upgrade effects must be data-driven.

Avoid giant conditional statements that directly check specific upgrade names.

Create a reusable effect application system.

## Upgrade Selection Rules

The generator must:

1. Filter unavailable upgrades.
2. Check prerequisites.
3. Check maximum stacks.
4. Apply rarity weights.
5. Avoid duplicate choices.
6. Generate three valid options.
7. Provide sensible fallback options.

The system must not produce an empty selection screen.

## Initial Upgrades

Implement at least twelve upgrades.

Examples:

1. Rapid Fire — +20% attack speed
2. Power Core — +15% damage
3. Double Shot — +1 projectile
4. Reinforced Hull — +1 maximum health
5. Energy Shield — Improve shield capacity
6. Thruster Boost — Increase movement speed
7. Gunner Wingman — Summon Gunner
8. Missile Wingman — Summon Missile Wingman
9. Laser Wingman — Summon Laser Wingman
10. Coordinated Fire — Improve squadron damage
11. Explosive Rounds — Add area damage
12. Tesla Link — Add chain lightning

---

# 14. WEAPON EVOLUTION AND SYNERGY

Create a modular evolution system.

Certain upgrade combinations unlock stronger abilities.

## Example Evolutions

### Assault Wingman

Requirements:

- Gunner Wingman Level 3
- Missile Wingman Level 2

Effect:

- Increased projectile output
- Periodic explosive attacks

### Tesla Shield

Requirements:

- Energy Shield
- Tesla Link

Effect:

- Damaging nearby enemies through electrical pulses

### Plasma Barrage

Requirements:

- Rapid Fire Level 3
- Double Shot Level 2

Effect:

- Fires a concentrated multi-projectile barrage

## Evolution Architecture

Store evolution recipes as data.

Do not hardcode recipes into the player controller.

Evolution availability should be calculated from the player's current upgrade state.

All evolutions need:

- Unique icon
- Name
- Description
- Visual effect
- Gameplay effect
- Clear unlock conditions

---

# 15. BOSS SYSTEM

Implement a modular boss framework.

The initial game requires one complete boss.

## First Boss: Crimson Overlord

Visual appearance:

- Large red geometric aircraft
- Glowing central energy core
- Angular wings
- Animated weapon components

## Boss Attacks

### Phase 1

- Spread projectile attacks
- Aimed shots
- Summon basic enemies

### Phase 2

Triggered at approximately 50% health.

- Radial projectile bursts
- Rotating laser attack
- Increased movement speed

## Boss Requirements

- Health bar
- Clear attack telegraphs
- Distinct phases
- Readable projectile patterns
- Death animation
- Reward sequence

Boss attacks must remain fair on mobile screens.

Avoid excessive camera shake that interferes with dodging.

---

# 16. COMPLETE UI/UX DESIGN SYSTEM

The game must use a unified visual design system.

Use the provided desktop and mobile mockups as primary visual references.

Implement a dark futuristic interface with:

- Thin neon outlines
- Rounded or angular rectangular panels
- Subtle holographic backgrounds
- Minimalist icons
- Strong typography
- Consistent spacing
- Clear interactive states

Do not copy every decorative element literally if it reduces usability or performance.

## Design Tokens

Create centralized tokens for:

- Colors
- Typography
- Spacing
- Borders
- Corner treatments
- Animation durations
- Button sizes
- Panel padding
- Shadows and glow intensity

Use an 8-pixel spacing system where practical.

## Typography

Use a readable futuristic font.

Prefer a lightweight font with a suitable web license.

Avoid excessively decorative fonts for paragraphs or descriptions.

Use:

- Bold display font for headings
- Readable font for descriptions
- Clear numeric font for counters

## UI Components

Create reusable components for:

- Primary button
- Secondary button
- Icon button
- Progress bar
- Health display
- Upgrade card
- Modal panel
- Tooltip
- Notification
- Toggle
- Slider
- Confirmation dialog

Each interactive component should support:

- Normal state
- Hover state on desktop
- Pressed state
- Disabled state
- Keyboard focus state where appropriate

Maintain accessible contrast and readable text.

---

# 17. MAIN MENU

The main menu must be clean and minimal.

## Layout

Show:

- Game logo
- Animated player aircraft
- Subtle scrolling neon grid
- Play button
- Hangar button
- Settings button

## Desktop

Use a centered composition.

The aircraft may appear on one side with a subtle idle animation.

## Mobile

Stack elements vertically.

Ensure buttons are comfortable to tap.

## Main Menu Behavior

The Play button starts the game quickly.

Avoid long introductory animations.

The first session may launch directly into a short interactive tutorial.

Do not show unnecessary instructions before the player can interact.

---

# 18. GAMEPLAY HUD

Keep the HUD minimal.

Display:

- Player health
- Shield status
- Current wave
- Wave progress
- Pause button
- Boss health when applicable

## Desktop Layout

Top-left:

- Health
- Shield

Top-center:

- Wave label
- Progress bar

Top-right:

- Pause button

## Mobile Layout

Use a compact layout.

Respect device safe areas and screen cutouts.

Ensure HUD elements do not cover important gameplay regions.

The HUD must not capture touch input intended for aircraft movement except over actual UI controls.

## Performance

Update HUD values only when the underlying data changes.

Do not rebuild text and UI geometry every frame.

---

# 19. UPGRADE SELECTION SCREEN

The upgrade selection screen is a critical gameplay interaction.

It must match the neon holographic style shown in the provided mockups.

## Desktop Layout

Display three upgrade cards horizontally.

Each card contains:

- Rarity label
- Icon
- Upgrade name
- Short description
- Visual rarity treatment

## Mobile Layout

Display three cards vertically.

Cards should be wide and easy to tap.

Avoid tiny text.

## Upgrade Interaction

When the screen opens:

1. Pause combat simulation.
2. Stop gameplay input.
3. Display the upgrade choices.
4. Highlight the selected card.
5. Apply the upgrade.
6. Play a short confirmation animation.
7. Resume gameplay.

The background should remain visible but dimmed.

**Important:** The mockups show combat and upgrade selection simultaneously to demonstrate the design. In the actual game, combat must pause while the player chooses an upgrade.

## Animation

Use:

- Scale interpolation
- Opacity fades
- Simple border highlights
- Short color transitions

Avoid expensive particles on every card.

Respect reduced-motion preferences where practical.

---

# 20. PAUSE MENU

Display:

- Resume
- Restart
- Settings
- Main Menu

Pausing must stop:

- Enemy movement
- Player movement
- Projectiles
- Damage
- Wave progression
- Gameplay timers

UI animations may continue.

Do not rely on setting every independent animation or timer manually.

Use a centralized game-state system.

---

# 21. GAME OVER SCREEN

Display:

- Final wave
- Enemies defeated
- Bosses defeated
- Run duration
- Coins earned
- Retry button
- Main Menu button

Use concise visual feedback.

Make restarting extremely easy.

The Retry button should begin a new run without unnecessary menu navigation.

---

# 22. HANGAR AND PERMANENT PROGRESSION

Create a permanent progression system.

Players earn coins during runs.

Coins can be used to unlock or upgrade aircraft.

## Hangar Features

- Aircraft preview
- Aircraft selection
- Upgrade buttons
- Available currency
- Unlock requirements
- Aircraft statistics

## Permanent Upgrades

Initially implement:

- Maximum health
- Base damage
- Attack speed
- Starting shield

Keep permanent bonuses moderate.

Avoid making early progression feel overly slow.

## Persistence

Save progress locally.

Implement a save manager with:

- Save schema version
- Validation
- Error handling
- Default values
- Migration support
- Reset progress option

Handle private browsing or unavailable local storage gracefully.

Do not assume that browser storage is always available.

---

# 23. AUDIO SYSTEM

Implement lightweight audio feedback.

## Sound Effects

- Player shooting
- Enemy hit
- Enemy destroyed
- Upgrade selected
- Wingman summoned
- Shield impact
- Boss warning
- Boss defeated
- UI button press

## Music

Use energetic electronic arcade music.

Prefer lightweight looping music.

Use original or properly licensed audio.

## Audio Controls

Provide:

- Master volume
- Music volume
- Sound effects volume
- Mute toggle

Respect browser autoplay restrictions.

Audio should begin only after an appropriate user interaction.

Handle tab visibility changes and Poki advertisement events correctly.

---

# 24. PARTICLE AND SPECIAL EFFECTS

Create a centralized visual-effects manager.

Implement:

- Engine trails
- Projectile trails
- Hit sparks
- Enemy explosions
- Shield impact
- Laser glow
- Upgrade acquisition effect
- Boss destruction effect

## Particle Performance

Use pooled particle systems.

Limit simultaneous particles.

Avoid creating large numbers of independent entities.

Prioritize:

- GPU-friendly effects
- Reusable materials
- Instanced geometry
- Lightweight animation
- Short-lived effects

## Screen Shake

Use subtle screen shake for:

- Player damage
- Heavy explosions
- Boss destruction

Do not shake the screen for every projectile hit.

Provide a setting to reduce or disable screen shake.

---

# 25. PERFORMANCE OPTIMIZATION

Performance is a core requirement.

Target 60 FPS on capable desktop and mobile devices.

Do not claim that 60 FPS can be guaranteed on every device.

Provide graceful degradation for weaker hardware.

## Target Frame Budget

At 60 FPS, the game has approximately 16.67 milliseconds per frame.

Use profiling to allocate time between:

- Gameplay simulation
- Collision detection
- Rendering
- UI updates
- Browser overhead

Avoid unnecessary work during the frame loop.

## Optimization Techniques

Implement:

### Object Pooling

Use pooling for:

- Projectiles
- Enemies
- Explosions
- Temporary effects
- Reusable decorative objects

### Hardware Instancing

Use instancing for repeated geometry where supported and beneficial.

### Mesh Caching

Generate procedural meshes once, then reuse them.

### Spatial Partitioning

Use a spatial grid or another suitable broad-phase algorithm for collision detection.

Avoid checking every projectile against every enemy unnecessarily.

### Fixed-Timestep Simulation

Use a fixed simulation timestep with bounded catch-up steps.

Rendering should interpolate between simulation states where needed.

### Chunk-Based Environment Generation

Only keep nearby environment chunks active.

### Adaptive Graphics

Provide:

- Low
- Medium
- High

Settings should control:

- Internal render resolution
- Bloom
- Particle count
- Trails
- Decorative geometry
- Post-processing

Keep UI text sharp regardless of render resolution.

## Graphics Defaults

Start mobile devices with a conservative quality profile.

Allow automatic or manual quality adjustments.

Avoid repeatedly changing render resolution because of short frame-time spikes.

Use sustained performance measurements and hysteresis.

## Performance Monitoring

Implement a development-only debug overlay showing:

- FPS
- Frame time
- Draw calls
- Active enemies
- Active projectiles
- Active particles
- Active pooled objects
- Render resolution scale

Do not show this overlay in production.

---

# 26. RESPONSIVE DESIGN REQUIREMENTS

The game must work on desktop and mobile browsers.

Do not create separate gameplay implementations for each device.

Use one gameplay simulation with device-specific input and UI layouts.

## Desktop

- Landscape-oriented presentation
- Keyboard and mouse controls
- Horizontal upgrade cards
- HUD distributed along the top
- Decorative space around the combat area

## Mobile

- Portrait-friendly presentation
- Touch drag controls
- Vertical upgrade cards
- Compact HUD
- Larger touch targets
- Safe-area support

Handle:

- Browser resizing
- Device rotation
- High-DPI displays
- Browser UI changing viewport height
- Touch cancellation
- Window focus changes

Do not stretch or distort the UI.

Prevent unwanted browser scrolling or text selection over the game canvas where appropriate.

Test browser input handling carefully.

---

# 27. POKI SDK INTEGRATION

Integrate the current official Poki SDK according to its documentation.

Do not invent SDK method names or assume outdated APIs.

Build a platform abstraction so gameplay code does not depend directly on Poki SDK calls.

Example architecture:

```text
PlatformService
       |
       ├── LocalDevelopmentAdapter
       |
       └── PokiPlatformAdapter
```

## Required Integration Areas

Verify and implement the current supported APIs for:

- SDK initialization
- Gameplay start events
- Gameplay stop events
- Commercial breaks
- Rewarded advertisements
- Audio behavior during ads
- Browser focus changes

## Advertisements

Advertisements must not interrupt active bullet-hell combat unexpectedly.

Use appropriate natural breakpoints, subject to Poki's current requirements.

Potential breakpoints:

- After a run ends
- Between runs
- Optional revival

Rewarded advertisements must be user-initiated.

Do not assume a reward has been earned unless the SDK confirms successful completion.

Handle unavailable ads gracefully.

## Development Mode

The game must run without Poki SDK connectivity during local development.

Use a mock platform adapter.

Do not let an unavailable advertising SDK prevent the game from starting.

---

# 28. GAME STATE MANAGEMENT

Implement a centralized state machine.

Required states:

```text
BOOT
  ↓
LOADING
  ↓
MAIN_MENU
  ↓
PLAYING
  ↓
UPGRADE_SELECTION
  ↓
PLAYING
  ↓
BOSS_BATTLE
  ↓
RESULTS
```

Additional states:

- PAUSED
- HANGAR
- SETTINGS
- GAME_OVER
- AD_BREAK

Do not allow contradictory states.

For example:

- Player movement cannot occur during upgrade selection.
- Combat cannot continue while an advertisement is active.
- Enemy spawning cannot continue after game over.
- Pausing must not allow gameplay timers to advance.

Use explicit state transitions.

---

# 29. PROCEDURAL GENERATION ARCHITECTURE

Use seeded random number generation.

The same seed and equivalent gameplay decisions should produce equivalent procedural content.

Keep separate random streams where useful.

Example:

```text
Run Seed
   |
   ├── Environment RNG
   ├── Enemy RNG
   ├── Wave RNG
   ├── Upgrade RNG
   └── Cosmetic RNG
```

Cosmetic randomness should not affect gameplay generation.

## Reproducibility

Allow developers to:

- Enter a custom seed
- Replay the same starting conditions
- Inspect generated wave parameters
- Reproduce difficult situations

Provide a debug option to display the current run seed.

## Generation Philosophy

Fully procedural does not mean uncontrolled randomness.

Use procedural systems guided by handcrafted design rules.

The objective is variety without compromising fairness or readability.

---

# 30. CODE ARCHITECTURE

Use modular TypeScript.

Avoid placing every system in one large file.

Suggested structure:

```text
neon-squadron/
│
├── public/
│   ├── assets/
│   ├── fonts/
│   └── audio/
│
├── src/
│   │
│   ├── main.ts
│   │
│   ├── app/
│   │   ├── GameApp.ts
│   │   ├── GameState.ts
│   │   ├── GameConfig.ts
│   │   └── EventBus.ts
│   │
│   ├── core/
│   │   ├── TimeManager.ts
│   │   ├── ObjectPool.ts
│   │   ├── SeededRandom.ts
│   │   └── SaveManager.ts
│   │
│   ├── input/
│   │   ├── InputManager.ts
│   │   ├── KeyboardInput.ts
│   │   ├── MouseInput.ts
│   │   └── TouchInput.ts
│   │
│   ├── player/
│   │   ├── PlayerController.ts
│   │   ├── PlayerStats.ts
│   │   └── PlayerRenderer.ts
│   │
│   ├── combat/
│   │   ├── CombatManager.ts
│   │   ├── WeaponSystem.ts
│   │   ├── ProjectileManager.ts
│   │   ├── DamageSystem.ts
│   │   ├── CollisionSystem.ts
│   │   └── TargetingSystem.ts
│   │
│   ├── squadron/
│   │   ├── SquadronManager.ts
│   │   ├── WingmanController.ts
│   │   ├── FormationManager.ts
│   │   └── WingmanDefinitions.ts
│   │
│   ├── enemies/
│   │   ├── EnemyManager.ts
│   │   ├── EnemyController.ts
│   │   ├── EnemyDefinitions.ts
│   │   └── EnemyBehaviors.ts
│   │
│   ├── procedural/
│   │   ├── AircraftGenerator.ts
│   │   ├── WaveGenerator.ts
│   │   ├── FormationGenerator.ts
│   │   ├── PatternGenerator.ts
│   │   └── EnvironmentGenerator.ts
│   │
│   ├── bosses/
│   │   ├── BossManager.ts
│   │   ├── BossController.ts
│   │   └── BossPhases.ts
│   │
│   ├── upgrades/
│   │   ├── UpgradeManager.ts
│   │   ├── UpgradeDefinitions.ts
│   │   ├── UpgradeEffects.ts
│   │   └── EvolutionManager.ts
│   │
│   ├── rendering/
│   │   ├── CameraManager.ts
│   │   ├── MaterialManager.ts
│   │   ├── ProceduralMeshCache.ts
│   │   ├── ParticleManager.ts
│   │   ├── EffectsManager.ts
│   │   └── QualityManager.ts
│   │
│   ├── environment/
│   │   ├── EnvironmentManager.ts
│   │   └── GridRenderer.ts
│   │
│   ├── ui/
│   │   ├── UIManager.ts
│   │   ├── Theme.ts
│   │   ├── components/
│   │   └── screens/
│   │
│   ├── audio/
│   │   └── AudioManager.ts
│   │
│   ├── platform/
│   │   ├── PlatformService.ts
│   │   ├── LocalPlatform.ts
│   │   └── PokiPlatform.ts
│   │
│   └── debug/
│       └── PerformanceOverlay.ts
│
├── tests/
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

This is a proposed architecture.

Adjust the structure when necessary, but maintain a clear separation of responsibilities.

Do not create placeholder modules solely to match the directory tree.

Every implemented module should have a defined responsibility.

---

# 31. DEVELOPMENT PHASES

Develop the game incrementally.

Each phase must produce a working, testable result.

## PHASE 1 — PROJECT FOUNDATION

Implement:

1. PlayCanvas application setup.
2. TypeScript configuration.
3. Vite development environment.
4. Responsive canvas.
5. Camera system.
6. Basic neon environment.
7. Game-state manager.
8. Desktop and mobile input.

### Acceptance Criteria

- Game opens in a browser.
- Canvas resizes correctly.
- Player can move on desktop.
- Player can move on mobile.
- No runtime errors.
- Development and production builds work.

Do not proceed until the foundation is stable.

---

## PHASE 2 — CORE COMBAT

Implement:

1. Player aircraft.
2. Automatic shooting.
3. Projectile pooling.
4. Basic enemies.
5. Enemy movement.
6. Collision detection.
7. Health and damage.
8. Enemy destruction.
9. Basic combat effects.

### Acceptance Criteria

- Player can shoot enemies.
- Enemies take damage.
- Enemies can damage the player.
- Projectiles are recycled.
- Combat works independently of frame rate.
- No unbounded object growth occurs.

---

## PHASE 3 — SQUADRON SYSTEM

Implement:

1. Gunner Wingman.
2. Missile Wingman.
3. Formation slots.
4. Smooth following.
5. Wingman targeting.
6. Wingman automatic attacks.
7. Squadron upgrades.

### Acceptance Criteria

- Wingmen follow smoothly.
- Wingmen attack independently.
- Formation remains stable.
- Wingmen do not require manual controls.
- Squadron system works on narrow mobile screens.

---

## PHASE 4 — PROCEDURAL GENERATION

Implement:

1. Seeded RNG.
2. Enemy mesh generator.
3. Wave director.
4. Formation generator.
5. Projectile pattern generator.
6. Environment chunk generation.

### Acceptance Criteria

- Different seeds produce variation.
- Identical seeds reproduce initial content.
- Enemies remain recognizable.
- Spawn patterns remain fair.
- Procedural generation does not create significant frame spikes.

---

## PHASE 5 — ROGUELIKE UPGRADES

Implement:

1. Upgrade definitions.
2. Upgrade selection logic.
3. Upgrade screen.
4. Upgrade effects.
5. Rarity system.
6. Wingman summoning.
7. Upgrade stacking.

### Acceptance Criteria

- Three valid choices appear.
- Gameplay pauses during selection.
- Upgrades apply correctly.
- Upgrade prerequisites work.
- Maximum stacks are enforced.
- UI works on desktop and mobile.

---

## PHASE 6 — BOSS AND FULL RUN

Implement:

1. Ten-wave progression.
2. Mini-boss.
3. Final boss.
4. Boss attack phases.
5. Victory conditions.
6. Defeat conditions.
7. Results screen.

### Acceptance Criteria

- A full run can be completed.
- Boss attacks are readable.
- Boss phases transition correctly.
- The player can win or lose.
- Restarting works reliably.

---

## PHASE 7 — COMPLETE UI/UX

Implement:

1. Main menu.
2. Gameplay HUD.
3. Upgrade screen polish.
4. Pause menu.
5. Results screen.
6. Hangar.
7. Settings.
8. Responsive layouts.
9. UI animations.

### Acceptance Criteria

- Every screen uses the same design language.
- Buttons work with mouse and touch.
- Text remains readable on mobile.
- No UI elements overlap unintentionally.
- UI respects safe areas.
- Navigation works without refreshing the page.

---

## PHASE 8 — PERMANENT PROGRESSION

Implement:

1. Coins.
2. Save manager.
3. Hangar upgrades.
4. Aircraft unlocks.
5. Progress persistence.
6. Save migration and validation.

### Acceptance Criteria

- Progress persists after refreshing.
- Invalid save data does not crash the game.
- Upgrades affect gameplay correctly.
- Resetting progress works.

---

## PHASE 9 — VISUAL AND AUDIO POLISH

Implement:

1. Neon material improvements.
2. Engine trails.
3. Explosion effects.
4. Boss destruction effects.
5. UI transitions.
6. Sound effects.
7. Music.
8. Adaptive effects settings.

### Acceptance Criteria

- Combat provides clear visual feedback.
- Effects do not obscure important bullets.
- Audio controls work.
- Reduced effects mode remains attractive.
- Performance remains stable under heavy combat.

---

## PHASE 10 — POKI INTEGRATION AND RELEASE

Implement:

1. Poki platform adapter.
2. Required gameplay events.
3. Advertisement integration.
4. Advertisement audio handling.
5. Loading optimizations.
6. Production build.
7. Responsive testing.
8. Performance profiling.
9. Browser compatibility testing.

### Acceptance Criteria

- Game builds successfully.
- Game runs without a backend.
- Local development works without Poki connectivity.
- Poki SDK initializes correctly in the supported environment.
- Gameplay pauses safely during advertising.
- Game works on desktop and mobile.
- No critical console errors occur.
- Final build follows current Poki requirements.

---

# 32. AUTOMATED TESTING

Implement tests for gameplay logic where practical.

Priority test cases:

- Seeded RNG reproducibility
- Upgrade eligibility
- Upgrade stacking
- Damage calculation
- Projectile lifetime
- Collision detection
- Wave difficulty budgets
- Save serialization
- Save migration
- Game-state transitions

Use automated testing for deterministic systems.

Manual testing is still required for gameplay feel and visuals.

---

# 33. PLAYTESTING AND BALANCING

Tune the game for:

- Immediate engagement
- Clear combat feedback
- Fair difficulty
- Satisfying upgrades
- Strong replayability
- Short restart times

## Suggested First-Session Experience

First 5 seconds:

- Player immediately controls the aircraft.

Within 15 seconds:

- Player destroys multiple enemies.

Within 30 seconds:

- Player sees the first upgrade selection.

Within 60 seconds:

- Player can acquire a Wingman.

Within 2 minutes:

- Player experiences a more complex enemy encounter.

Within 5–8 minutes:

- A successful player can complete the full run.

These timings are starting hypotheses.

Adjust them based on actual playtests.

---

# 34. IMPLEMENTATION RULES FOR THE AI DEVELOPER

Follow these instructions throughout development.

1. Write complete, functional TypeScript code.
2. Use the real PlayCanvas APIs.
3. Do not invent nonexistent methods or classes.
4. Verify compatibility with installed package versions.
5. Avoid unnecessary dependencies.
6. Do not add complex physics unless required.
7. Avoid oversized source files.
8. Keep systems modular and reusable.
9. Use configuration-driven gameplay values.
10. Implement proper error handling.
11. Avoid memory leaks.
12. Reuse objects whenever possible.
13. Handle mobile touch input correctly.
14. Handle browser resizing.
15. Do not block gameplay with unavailable advertisements.
16. Do not use copyrighted game assets.
17. Do not silently replace requested features with static mockups.
18. Do not consider a feature complete until it is functional.
19. Run the TypeScript compiler and production build after major changes.
20. Fix errors before moving to the next development phase.

When implementing a system, explain:

- Its responsibility
- How it connects to other systems
- Important configuration values
- Performance implications
- How to test it

Avoid excessive abstraction.

Prefer clear, practical implementations.

---

# 35. FINAL QUALITY EXPECTATIONS

The final game should feel like a polished arcade title rather than a collection of technical demos.

It must have:

- Responsive movement
- Satisfying automatic combat
- Interesting enemy patterns
- A meaningful squadron-building mechanic
- Readable projectile effects
- Fair procedural waves
- Attractive neon visuals
- Polished upgrade interactions
- Consistent UI
- Good mobile usability
- Smooth performance
- Reliable saving
- Fast restart flow

The visual quality should approach the supplied desktop and mobile mockups while remaining optimized for browser rendering.

Use the mockups as visual targets, not as single flattened background images.

All aircraft, bullets, enemies, panels, and interface components must be independently rendered and interactive where appropriate.

---

# 36. HOW TO BEGIN DEVELOPMENT

Begin with PHASE 1.

First:

1. Inspect the existing repository, if one exists.
2. Determine whether a PlayCanvas project is already configured.
3. If no project exists, initialize a new PlayCanvas + TypeScript + Vite application.
4. Implement the application bootstrap.
5. Create a responsive rendering canvas.
6. Configure the 2.5D camera.
7. Create a dark background and procedural neon grid.
8. Create the first procedural cyan player aircraft.
9. Implement desktop keyboard and mouse movement.
10. Implement mobile drag movement.
11. Verify that the game runs in the browser.
12. Verify that the production build succeeds.

The initial result must be a playable browser scene containing a controllable neon aircraft flying over a scrolling futuristic grid.

Do not begin by implementing every menu, upgrade, boss, or progression system.

After completing the foundation, continue through the defined development phases.

At the end of each phase, provide:

- Implemented features
- Important architectural decisions
- How to run and test the game
- Tests and build results
- Known limitations
- The next development phase

When the development environment supports direct file editing and command execution, implement the game in the actual project rather than merely describing the code.

**The ultimate objective is to build a complete, original, performant, visually polished browser game suitable for Poki, with a neon vector 2.5D aesthetic and a satisfying procedural squadron-based roguelike gameplay loop.**
