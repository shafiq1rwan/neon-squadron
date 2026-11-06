/**
 * Enemy archetypes as data: stats, default movement, attack and visual design.
 * `cost` feeds the difficulty-budget wave director in the procedural phase.
 */
import type { AircraftDesign } from '../procedural/AircraftGenerator';
import { Palette } from '../ui/Theme';
import type { EnemyAttack, MovementParams } from './EnemyBehaviors';

export type EnemyTypeId = 'drone' | 'interceptor' | 'shooter' | 'tank';

export interface EnemyDefinition {
  id: EnemyTypeId;
  name: string;
  /** Difficulty-budget cost. */
  cost: number;
  health: number;
  collisionRadius: number;
  /** Damage dealt to the player on contact. */
  contactDamage: number;
  /** Coins awarded when destroyed. */
  reward: number;
  movement: MovementParams;
  attack: EnemyAttack | null;
  design: AircraftDesign;
  /** Visual scale of the generated mesh. */
  scale: number;
  /** Explosion size multiplier. */
  explosionScale: number;
}

const baseDesign = {
  hasCore: true,
  color: Palette.enemy,
  accent: Palette.enemyCore,
  hullTint: 0.28,
  glow: 0.9,
} as const;

export const ENEMIES: Record<EnemyTypeId, EnemyDefinition> = {
  drone: {
    id: 'drone',
    name: 'Basic Drone',
    cost: 1,
    health: 2,
    collisionRadius: 0.55,
    contactDamage: 1,
    reward: 1,
    movement: { kind: 'straight', speed: 3.4, driftX: 0, amplitude: 0, frequency: 0, holdY: 0, holdTime: 0 },
    attack: {
      pattern: 'straight',
      count: 1,
      spreadAngle: 0,
      speed: 6.5,
      interval: 3.4,
      initialDelay: [1.0, 2.6],
      damage: 1,
      radius: 0.2,
      size: 0.64,
    },
    design: {
      ...baseDesign,
      body: 'diamond',
      wing: 'straight',
      length: 1.0,
      width: 0.62,
      wingSpan: 0.72,
      wingChord: 0.38,
      wingSweep: 0.1,
      wingOffset: 0,
      engineCount: 1,
      weaponMounts: 0,
      hasFins: false,
    },
    scale: 1.15,
    explosionScale: 0.9,
  },

  interceptor: {
    id: 'interceptor',
    name: 'Fast Interceptor',
    cost: 2,
    health: 2,
    collisionRadius: 0.5,
    contactDamage: 1,
    reward: 2,
    movement: { kind: 'dive', speed: 7, driftX: 0, amplitude: 0, frequency: 0, holdY: 9, holdTime: 0.6 },
    attack: null,
    design: {
      ...baseDesign,
      body: 'arrowhead',
      wing: 'swept',
      length: 1.25,
      width: 0.62,
      wingSpan: 0.78,
      wingChord: 0.42,
      wingSweep: 0.48,
      wingOffset: -0.05,
      engineCount: 2,
      weaponMounts: 0,
      hasFins: true,
    },
    scale: 1.1,
    explosionScale: 0.85,
  },

  shooter: {
    id: 'shooter',
    name: 'Shooter Drone',
    cost: 3,
    health: 7,
    collisionRadius: 0.7,
    contactDamage: 1,
    reward: 3,
    movement: { kind: 'hover', speed: 4.5, driftX: 0, amplitude: 2.2, frequency: 0.18, holdY: 9.5, holdTime: 8 },
    attack: {
      pattern: 'aimed',
      count: 1,
      spreadAngle: 0,
      speed: 8.5,
      interval: 1.7,
      initialDelay: [0.8, 1.6],
      damage: 1,
      radius: 0.22,
      size: 0.68,
    },
    design: {
      ...baseDesign,
      body: 'hexagon',
      wing: 'angular',
      length: 1.3,
      width: 0.82,
      wingSpan: 1.0,
      wingChord: 0.6,
      wingSweep: 0.25,
      wingOffset: 0,
      engineCount: 2,
      weaponMounts: 2,
      hasFins: false,
    },
    scale: 1.15,
    explosionScale: 1.1,
  },

  tank: {
    id: 'tank',
    name: 'Heavy Tank',
    cost: 5,
    health: 28,
    collisionRadius: 1.15,
    contactDamage: 2,
    reward: 6,
    movement: { kind: 'straight', speed: 1.7, driftX: 0, amplitude: 0, frequency: 0, holdY: 0, holdTime: 0 },
    attack: {
      pattern: 'spread',
      count: 5,
      spreadAngle: 54,
      speed: 6.8,
      interval: 2.5,
      initialDelay: [1.2, 1.8],
      damage: 1,
      radius: 0.24,
      size: 0.72,
    },
    design: {
      ...baseDesign,
      body: 'hexagon',
      wing: 'delta',
      length: 1.9,
      width: 1.25,
      wingSpan: 1.55,
      wingChord: 1.05,
      wingSweep: 0.3,
      wingOffset: -0.05,
      engineCount: 3,
      weaponMounts: 4,
      hasFins: true,
      hullTint: 0.32,
    },
    scale: 1.2,
    explosionScale: 1.7,
  },
};
