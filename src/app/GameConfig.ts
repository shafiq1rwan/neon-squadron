/**
 * Tunable gameplay and engine values. Systems read from here instead of hardcoding numbers.
 *
 * Coordinate convention: gameplay happens on a 2D plane (x = right, y = forward/up-screen).
 * Rendering maps gameplay (x, y) to world (x, height, -y); see rendering/WorldSpace.ts.
 */

export interface PlayerConfig {
  maxHealth: number;
  maxShield: number;
  /** Top speed in world units per second for direct (keyboard) control. */
  movementSpeed: number;
  /** Units/s² when speeding up or changing direction. */
  acceleration: number;
  /** Units/s² when slowing to rest. */
  deceleration: number;
  collisionRadius: number;
  invulnerabilityDuration: number;
}

export type QualityLevel = 'low' | 'medium' | 'high';

export interface QualityProfile {
  /** Upper bound on device pixel ratio used for the render target. */
  maxPixelRatio: number;
  antialias: boolean;
  /** Multiplier applied to glow/halo alpha. */
  glowIntensity: number;
  /** Decorative props per environment chunk. */
  propsPerChunk: number;
  /** Simultaneous particle budget. */
  maxParticles: number;
}

export const GameConfig = {
  simulation: {
    /** Fixed simulation step (seconds). */
    fixedDt: 1 / 60,
    /** Max simulation steps per rendered frame before dropping time (prevents spiral of death). */
    maxStepsPerFrame: 5,
    /** Real frame deltas above this are clamped (tab switches, debugger pauses). */
    maxFrameDelta: 0.25,
  },

  world: {
    /** Logical combat area, identical on every device so screen shape gives no advantage. */
    combatWidth: 18,
    combatHeight: 30,
    /** How far inside the combat edge the player's centre is clamped. */
    playerEdgeMargin: 0.9,
    /** Height of the gameplay plane above the floor grid, for parallax depth. */
    floorDepth: 3.5,
    /** Visual hover height of aircraft above the gameplay plane. */
    aircraftHeight: 0.4,
  },

  camera: {
    verticalFovDeg: 36,
    /** Angle of the view direction below the horizon. 90 = straight down. */
    pitchDeg: 68,
    /** Screen space (CSS px) kept free above/below the combat area for HUD and thumbs. */
    reserveTopPx: 56,
    reserveBottomPx: 16,
    /** Extra side margin (CSS px) so the aircraft never touches the screen edge on phones. */
    reserveSidePx: 8,
    nearClip: 0.5,
    farClip: 400,
  },

  player: {
    maxHealth: 5,
    maxShield: 2,
    movementSpeed: 17,
    acceleration: 140,
    deceleration: 110,
    collisionRadius: 0.38,
    invulnerabilityDuration: 1.2,
  } satisfies PlayerConfig,

  playerVisual: {
    /** Max visual roll (radians) at full lateral speed. Visual only. */
    maxBank: 0.55,
    /** Exponential smoothing rate for the bank angle (1/s). */
    bankResponse: 10,
    /** Gentle idle bob amplitude (world units). */
    bobAmplitude: 0.05,
    scale: 1.3,
  },

  input: {
    /** Pointer (mouse/touch) following: speed multiplier relative to movementSpeed. */
    pointerSpeedMultiplier: 1.9,
    /** Pointer following gain (1/s): desired speed = distance * gain, capped by max speed. */
    pointerFollowGain: 14,
    /** Touch drag: world displacement per unit of finger displacement. */
    touchSensitivity: 1.15,
    /** Mouse follow: target offset in gameplay units (0 = aircraft centred on cursor). */
    mouseTargetOffsetY: 0,
  },

  combat: {
    /** Pool capacities (hard limits on simultaneous projectiles). */
    playerProjectileCapacity: 700,
    enemyProjectileCapacity: 700,
    /** Fairness: enemies hold fire while this many enemy bullets are alive. */
    maxEnemyProjectiles: 160,
    /** Fairness: enemy bullet speeds are clamped to this range (units/s). */
    enemyBulletSpeedMin: 4,
    enemyBulletSpeedMax: 12,
    /** Fairness: enemies never fire when closer than this to the player. */
    enemyFireMinDistance: 4.5,
    /** Enemies must be this far inside the top edge before attacking. */
    enemyFireTopMargin: 1.2,
    /** Warning flash before an enemy fires (seconds). */
    telegraphDuration: 0.4,
    /** Visual height of projectiles above the gameplay plane. */
    projectileHeight: 0.45,
    /** Shield regenerates one point every interval after this long without damage. */
    shieldRegenDelay: 5,
    shieldRegenInterval: 2.5,
    /** Damage the player deals to an enemy by ramming it. */
    ramDamageToEnemy: 6,
    /** Seconds between the player's death and the game-over screen. */
    deathDelay: 1.4,
    /** Spatial grid cell size for broad-phase collision. */
    gridCellSize: 3,
    /** Enemies spawn this far above the combat area's top edge. */
    spawnOffsetY: 3,
    /** Enemies are removed this far outside the combat area. */
    despawnMargin: 4,
    /** Hit-flash duration on damaged aircraft (seconds). */
    hitFlashDuration: 0.09,
  },

  effects: {
    /** Global multiplier for screen shake (settings will expose this; 0 disables). */
    screenShakeScale: 1,
    /** Maximum camera offset at full shake (world units). */
    maxShakeOffset: 0.35,
    /** How fast shake trauma decays per second. */
    shakeDecay: 2.2,
  },

  environment: {
    scrollSpeed: 7,
    gridMinorCell: 2,
    gridMajorEvery: 4,
    chunkLength: 24,
    activeChunks: 4,
  },

  quality: {
    low: { maxPixelRatio: 1, antialias: false, glowIntensity: 0.7, propsPerChunk: 3, maxParticles: 250 },
    medium: { maxPixelRatio: 1.5, antialias: true, glowIntensity: 0.9, propsPerChunk: 5, maxParticles: 500 },
    high: { maxPixelRatio: 2, antialias: true, glowIntensity: 1, propsPerChunk: 8, maxParticles: 900 },
  } satisfies Record<QualityLevel, QualityProfile>,
} as const;
