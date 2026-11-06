/**
 * Data-driven weapon definitions. Gameplay code never branches on weapon ids; the weapon
 * system reads these fields. Further weapons (laser beam, homing missile, tesla) plug in
 * through the `kind` field in later phases.
 */
import { Palette } from '../ui/Theme';

export type WeaponKind = 'projectile';
/** 'parallel': side-by-side streams; 'fan': projectiles spread across spreadAngle. */
export type VolleyPattern = 'parallel' | 'fan';

export interface WeaponDefinition {
  id: string;
  name: string;
  kind: WeaponKind;
  /** Damage per projectile. */
  damage: number;
  /** Volleys per second before modifiers. */
  fireRate: number;
  /** Units per second. */
  projectileSpeed: number;
  /** Projectiles per volley. */
  projectileCount: number;
  /** Total fan angle in degrees ('fan' pattern), or extra fan for parallel streams. */
  spreadAngle: number;
  /** Extra enemies each projectile can pass through. */
  piercing: number;
  /**
   * Minimum seconds between volleys after attack-speed modifiers. Caps how far
   * fire-rate upgrades can push a weapon.
   */
  cooldown: number;
  pattern: VolleyPattern;
  /** Lateral distance between parallel streams. */
  spacing: number;
  /** Area-of-effect radius on impact (0 = none). */
  areaRadius: number;
  projectileRadius: number;
  projectileLength: number;
  projectileWidth: number;
  lifetime: number;
  color: string;
}

export const WEAPONS = {
  pulseCannon: {
    id: 'pulseCannon',
    name: 'Pulse Cannon',
    kind: 'projectile',
    damage: 1,
    fireRate: 8.5,
    projectileSpeed: 38,
    projectileCount: 1,
    spreadAngle: 0,
    piercing: 0,
    cooldown: 0.05,
    pattern: 'parallel',
    spacing: 0.38,
    areaRadius: 0,
    projectileRadius: 0.22,
    projectileLength: 1.3,
    projectileWidth: 0.5,
    lifetime: 1.4,
    color: Palette.projectile,
  },
  spreadCannon: {
    id: 'spreadCannon',
    name: 'Spread Cannon',
    kind: 'projectile',
    damage: 0.8,
    fireRate: 4,
    projectileSpeed: 30,
    projectileCount: 5,
    spreadAngle: 40,
    piercing: 0,
    cooldown: 0.08,
    pattern: 'fan',
    spacing: 0,
    areaRadius: 0,
    projectileRadius: 0.2,
    projectileLength: 0.95,
    projectileWidth: 0.45,
    lifetime: 1.1,
    color: Palette.projectile,
  },
} as const satisfies Record<string, WeaponDefinition>;

export type WeaponId = keyof typeof WEAPONS;
