/**
 * Turns weapon definitions + modifiers into volleys of projectiles.
 *
 * A Weapon only decides *when* and *what* to fire; projectile motion, collision and damage
 * live in ProjectileManager / CollisionSystem / DamageSystem, and visuals in the sprite batch.
 */
import { hexToRgb } from '../ui/Theme';
import { SpriteShape } from '../rendering/NeonShaders';
import type { ProjectileManager, ProjectileSpawn } from './ProjectileManager';
import type { WeaponDefinition } from './WeaponDefinitions';

/** Multiplicative/additive modifiers from upgrades and permanent progression. */
export interface WeaponModifiers {
  damageMult: number;
  fireRateMult: number;
  projectileSpeedMult: number;
  extraProjectiles: number;
  extraPiercing: number;
  areaRadiusBonus: number;
}

export function defaultWeaponModifiers(): WeaponModifiers {
  return {
    damageMult: 1,
    fireRateMult: 1,
    projectileSpeedMult: 1,
    extraProjectiles: 0,
    extraPiercing: 0,
    areaRadiusBonus: 0,
  };
}

const DEG = Math.PI / 180;

export class Weapon {
  readonly def: WeaponDefinition;
  private timer: number;
  private readonly color: { r: number; g: number; b: number };
  private readonly spawn: ProjectileSpawn;

  constructor(def: WeaponDefinition, initialDelay = 0) {
    this.def = def;
    this.timer = initialDelay;
    this.color = hexToRgb(def.color);
    this.spawn = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      damage: 0,
      radius: def.projectileRadius,
      life: def.lifetime,
      pierce: 0,
      areaRadius: 0,
      length: def.projectileLength,
      width: def.projectileWidth,
      r: this.color.r,
      g: this.color.g,
      b: this.color.b,
      shape: SpriteShape.Bolt,
    };
  }

  /** Seconds between volleys after modifiers, never below the definition's cooldown. */
  interval(mods: WeaponModifiers): number {
    return Math.max(this.def.cooldown, 1 / (this.def.fireRate * Math.max(mods.fireRateMult, 0.01)));
  }

  reset(initialDelay = 0): void {
    this.timer = initialDelay;
  }

  /**
   * Advances the fire timer and emits volleys from (x, y) towards `aimAngle`
   * (radians, 0 = straight up the screen). Returns the number of volleys fired.
   */
  update(dt: number, x: number, y: number, mods: WeaponModifiers, out: ProjectileManager, aimAngle = 0): number {
    this.timer -= dt;
    let volleys = 0;
    const interval = this.interval(mods);
    // Loop so very high fire rates stay correct with a fixed timestep.
    while (this.timer <= 0) {
      this.fire(x, y, mods, out, aimAngle);
      this.timer += interval;
      volleys++;
    }
    return volleys;
  }

  private fire(x: number, y: number, mods: WeaponModifiers, out: ProjectileManager, aimAngle: number): void {
    const def = this.def;
    const count = Math.max(1, def.projectileCount + mods.extraProjectiles);
    const speed = def.projectileSpeed * mods.projectileSpeedMult;
    const s = this.spawn;
    s.damage = def.damage * mods.damageMult;
    s.pierce = def.piercing + mods.extraPiercing;
    s.areaRadius = def.areaRadius + (def.areaRadius > 0 || mods.areaRadiusBonus > 0 ? mods.areaRadiusBonus : 0);
    s.life = def.lifetime;

    const cosA = Math.cos(aimAngle);
    const sinA = Math.sin(aimAngle);
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1) - 0.5; // -0.5..0.5
      let angle = aimAngle;
      let offset = 0;
      if (def.pattern === 'fan') {
        angle += t * def.spreadAngle * DEG;
      } else {
        offset = t * def.spacing * (count - 1);
        // Slight outward splay for wide parallel volleys keeps them readable.
        angle += t * def.spreadAngle * DEG;
      }
      // Angle 0 points along +y; offset is perpendicular (along +x when aim is 0).
      s.x = x + offset * cosA;
      s.y = y - offset * sinA;
      s.vx = Math.sin(angle) * speed;
      s.vy = Math.cos(angle) * speed;
      out.spawn(s);
    }
  }
}
