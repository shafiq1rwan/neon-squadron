import { describe, expect, it } from 'vitest';
import { GameConfig } from '../src/app/GameConfig';
import { segmentPointDistSq } from '../src/combat/CollisionSystem';
import { ProjectileManager, type ProjectileSpawn } from '../src/combat/ProjectileManager';
import { SpatialGrid } from '../src/combat/SpatialGrid';
import { WEAPONS } from '../src/combat/WeaponDefinitions';
import { Weapon, defaultWeaponModifiers } from '../src/combat/WeaponSystem';
import {
  advanceAttackTimer,
  fireAttack,
  stepMovement,
  type EnemyAttack,
  type MovementState,
} from '../src/enemies/EnemyBehaviors';
import { PlayerStats } from '../src/player/PlayerStats';

const bounds = { minX: -20, maxX: 20, minY: -20, maxY: 20 };

function shot(overrides: Partial<ProjectileSpawn> = {}): ProjectileSpawn {
  return {
    x: 0, y: 0, vx: 0, vy: 10, damage: 1, radius: 0.2, life: 1, pierce: 0, areaRadius: 0,
    length: 1, width: 0.3, r: 1, g: 1, b: 1, shape: 0, ...overrides,
  };
}

describe('ProjectileManager', () => {
  it('moves projectiles and remembers the previous position', () => {
    const p = new ProjectileManager(8);
    p.spawn(shot({ vy: 10 }));
    p.step(0.1, bounds);
    expect(p.y[0]).toBeCloseTo(1);
    expect(p.py[0]).toBeCloseTo(0);
  });

  it('expires projectiles when their lifetime runs out', () => {
    const p = new ProjectileManager(8);
    p.spawn(shot({ life: 0.25, vy: 1 }));
    for (let i = 0; i < 2; i++) p.step(0.1, bounds);
    expect(p.count).toBe(1);
    p.step(0.1, bounds);
    expect(p.count).toBe(0);
  });

  it('removes projectiles that leave the bounds', () => {
    const p = new ProjectileManager(8);
    p.spawn(shot({ y: 19.5, vy: 10 }));
    p.step(0.1, bounds);
    expect(p.count).toBe(0);
  });

  it('swap-removes and keeps live data packed', () => {
    const p = new ProjectileManager(8);
    p.spawn(shot({ x: 1 }));
    p.spawn(shot({ x: 2 }));
    p.spawn(shot({ x: 3 }));
    p.remove(0);
    expect(p.count).toBe(2);
    expect([...p.x.slice(0, 2)].sort()).toEqual([2, 3]);
  });

  it('never grows beyond capacity (no unbounded allocation)', () => {
    const p = new ProjectileManager(4);
    for (let i = 0; i < 10; i++) p.spawn(shot());
    expect(p.count).toBe(4);
    expect(p.rejected).toBe(6);
  });
});

describe('Weapon', () => {
  it('fires at the configured rate independent of step size', () => {
    const fine = new Weapon(WEAPONS.pulseCannon);
    const coarse = new Weapon(WEAPONS.pulseCannon);
    const out1 = new ProjectileManager(500);
    const out2 = new ProjectileManager(500);
    const mods = defaultWeaponModifiers();
    let v1 = 0;
    let v2 = 0;
    for (let i = 0; i < 252; i++) v1 += fine.update(1 / 120, 0, 0, mods, out1);
    for (let i = 0; i < 63; i++) v2 += coarse.update(1 / 30, 0, 0, mods, out2);
    // 2.1 s at 7.5/s (away from a volley boundary), plus the immediate first volley.
    const expected = Math.floor(2.1 * WEAPONS.pulseCannon.fireRate) + 1;
    expect(v1).toBe(expected);
    expect(v2).toBe(expected);
  });

  it('adds projectiles and applies damage modifiers', () => {
    const w = new Weapon(WEAPONS.pulseCannon);
    const out = new ProjectileManager(50);
    const mods = { ...defaultWeaponModifiers(), extraProjectiles: 2, damageMult: 1.5 };
    w.update(1 / 60, 0, 0, mods, out);
    expect(out.count).toBe(3);
    expect(out.damage[0]).toBeCloseTo(1.5);
    // Parallel streams are laterally separated and fly upwards.
    const xs = [...out.x.slice(0, 3)].sort((a, b) => a - b);
    expect(xs[2]! - xs[0]!).toBeGreaterThan(0.5);
    for (let i = 0; i < 3; i++) expect(out.vy[i]).toBeGreaterThan(0);
  });

  it('caps attack speed at the cooldown floor', () => {
    const w = new Weapon(WEAPONS.pulseCannon);
    const mods = { ...defaultWeaponModifiers(), fireRateMult: 1000 };
    expect(w.interval(mods)).toBe(WEAPONS.pulseCannon.cooldown);
  });

  it('fans spread shots symmetrically', () => {
    const w = new Weapon(WEAPONS.spreadCannon);
    const out = new ProjectileManager(50);
    w.update(1 / 60, 0, 0, defaultWeaponModifiers(), out);
    const vxs = [...out.vx.slice(0, out.count)].sort((a, b) => a - b);
    expect(vxs[0]).toBeCloseTo(-vxs[vxs.length - 1]!, 5);
  });
});

describe('PlayerStats', () => {
  const regen = { shieldRegenDelay: 5, shieldRegenInterval: 2.5 };
  const cfg = { ...GameConfig.player, maxHealth: 3, maxShield: 1, invulnerabilityDuration: 1 };

  it('absorbs damage with the shield first, then health', () => {
    const s = new PlayerStats(cfg, regen);
    expect(s.applyDamage(1)).toBe('shield');
    expect(s.shield).toBe(0);
    expect(s.health).toBe(3);
    s.step(1.01);
    expect(s.applyDamage(1)).toBe('health');
    expect(s.health).toBe(2);
  });

  it('ignores damage during invulnerability frames', () => {
    const s = new PlayerStats(cfg, regen);
    s.applyDamage(1);
    expect(s.applyDamage(1)).toBe('ignored');
    s.step(0.5);
    expect(s.applyDamage(1)).toBe('ignored');
    s.step(0.6);
    expect(s.applyDamage(1)).toBe('health');
  });

  it('dies at zero health and ignores further damage', () => {
    const s = new PlayerStats({ ...cfg, maxShield: 0 }, regen);
    for (let i = 0; i < 3; i++) {
      s.applyDamage(1);
      s.step(1.1);
    }
    expect(s.alive).toBe(false);
    expect(s.applyDamage(1)).toBe('ignored');
  });

  it('regenerates shield only after a quiet period', () => {
    const s = new PlayerStats(cfg, regen);
    s.applyDamage(1);
    for (let t = 0; t < 7; t += 0.1) s.step(0.1);
    expect(s.shield).toBe(0); // 5s delay + 2.5s interval not yet reached
    for (let t = 0; t < 1; t += 0.1) s.step(0.1);
    expect(s.shield).toBe(1);
  });
});

describe('collision helpers', () => {
  it('segment distance catches fast projectiles that would tunnel', () => {
    // A shot moving from y=-1 to y=1 in one step passes through a circle at the origin.
    expect(segmentPointDistSq(0, -1, 0, 1, 0, 0)).toBe(0);
    // The end points alone are both outside a 0.5 radius.
    expect(segmentPointDistSq(0, -1, 0, -1, 0, 0)).toBe(1);
    expect(segmentPointDistSq(0, -1, 0, 1, 2, 0)).toBe(4);
  });

  it('spatial grid returns nearby items and skips far ones', () => {
    const g = new SpatialGrid(-10, -10, 20, 20, 2);
    g.insert(0, 0, 0, 0.5);
    g.insert(1, 8, 8, 0.5);
    g.insert(2, 0.9, 0.5, 0.5);
    const out: number[] = [];
    const n = g.query(0, 0, 0.5, out);
    const found = out.slice(0, n).sort();
    expect(found).toContain(0);
    expect(found).toContain(2);
    expect(found).not.toContain(1);
  });
});

function movementState(kind: MovementState['movement']['kind'], extra: Partial<MovementState['movement']> = {}): MovementState {
  return {
    x: 0, y: 15, x0: 0, y0: 15, age: 0, phase: 0, stage: 0, stageTime: 0, dirX: 0, dirY: 0, speedNow: 0,
    movement: { kind, speed: 4, driftX: 0, amplitude: 2, frequency: 0.5, holdY: 8, holdTime: 0.5, ...extra },
  };
}

describe('enemy behaviours', () => {
  const ctx = { playerX: 3, playerY: -10, laneHalfWidth: 9 };

  it('movement is deterministic for identical inputs', () => {
    const a = movementState('sine');
    const b = movementState('sine');
    for (let i = 0; i < 200; i++) {
      stepMovement(a, 1 / 60, ctx);
      stepMovement(b, 1 / 60, ctx);
    }
    expect(a.x).toBe(b.x);
    expect(a.y).toBe(b.y);
  });

  it('sine movement stays within its amplitude', () => {
    const s = movementState('sine');
    for (let i = 0; i < 600; i++) {
      stepMovement(s, 1 / 60, ctx);
      expect(Math.abs(s.x)).toBeLessThanOrEqual(2 + 1e-9);
    }
  });

  it('dive holds, then commits to a locked downward vector towards the player', () => {
    const s = movementState('dive');
    let t = 0;
    while (s.stage < 2 && t < 10) {
      stepMovement(s, 1 / 60, ctx);
      t += 1 / 60;
    }
    expect(s.stage).toBe(2);
    expect(s.dirY).toBeLessThan(0);
    expect(s.dirX).toBeGreaterThan(0); // player is to the right
    const locked = { x: s.dirX, y: s.dirY };
    // Player moving afterwards must not change the dive (dodgeable).
    for (let i = 0; i < 30; i++) stepMovement(s, 1 / 60, { ...ctx, playerX: -8 });
    expect(s.dirX).toBe(locked.x);
    expect(s.dirY).toBe(locked.y);
  });

  it('hover stays inside the combat lane', () => {
    const s = movementState('hover', { amplitude: 3, holdTime: 6 });
    s.x = s.x0 = 8.8;
    for (let i = 0; i < 600; i++) {
      stepMovement(s, 1 / 60, ctx);
      if (s.stage === 1) expect(Math.abs(s.x)).toBeLessThanOrEqual(9);
    }
  });

  it('enemy bullet speed is clamped to the fairness limits', () => {
    const out = new ProjectileManager(20);
    const attack: EnemyAttack = {
      pattern: 'aimed', count: 1, spreadAngle: 0, speed: 999, interval: 1,
      initialDelay: [0, 0], damage: 1, radius: 0.2, size: 0.5,
    };
    fireAttack(attack, 0, 10, 0, -10, { r: 1, g: 0, b: 0 }, out);
    expect(Math.hypot(out.vx[0]!, out.vy[0]!)).toBeCloseTo(GameConfig.combat.enemyBulletSpeedMax, 4);
    expect(out.vy[0]).toBeLessThan(0);
  });

  it('radial bursts fire evenly in all directions', () => {
    const out = new ProjectileManager(20);
    const attack: EnemyAttack = {
      pattern: 'radial', count: 8, spreadAngle: 0, speed: 6, interval: 1,
      initialDelay: [0, 0], damage: 1, radius: 0.2, size: 0.5,
    };
    fireAttack(attack, 0, 0, 0, -10, { r: 1, g: 0, b: 0 }, out);
    let sx = 0;
    let sy = 0;
    for (let i = 0; i < out.count; i++) {
      sx += out.vx[i]!;
      sy += out.vy[i]!;
    }
    expect(out.count).toBe(8);
    expect(Math.abs(sx)).toBeLessThan(1e-4);
    expect(Math.abs(sy)).toBeLessThan(1e-4);
  });
});

describe('attack telegraph', () => {
  const dt = 1 / 60;
  const run = (s: { fireTimer: number; telegraphing: boolean }, seconds: number, canFire: () => boolean) => {
    let fired = 0;
    let telegraphFrames = 0;
    for (let t = 0; t < seconds; t += dt) {
      if (advanceAttackTimer(s, dt, 2, 0.4, canFire)) fired++;
      if (s.telegraphing) telegraphFrames++;
    }
    return { fired, telegraphFrames };
  };

  it('always warns before firing', () => {
    const s = { fireTimer: 1, telegraphing: false };
    let warnedBeforeShot = false;
    for (let t = 0; t < 1.2; t += dt) {
      const wasTelegraphing = s.telegraphing;
      if (advanceAttackTimer(s, dt, 2, 0.4, () => true)) {
        warnedBeforeShot = wasTelegraphing;
        break;
      }
    }
    expect(warnedBeforeShot).toBe(true);
  });

  it('never flashes a warning while firing is blocked', () => {
    const s = { fireTimer: 1, telegraphing: false };
    const { fired, telegraphFrames } = run(s, 6, () => false);
    expect(fired).toBe(0);
    expect(telegraphFrames).toBe(0);
  });

  it('fires on its interval when allowed', () => {
    const s = { fireTimer: 0.5, telegraphing: false };
    const { fired } = run(s, 4.6, () => true);
    expect(fired).toBe(3); // t ≈ 0.5, 2.5, 4.5
  });
});
