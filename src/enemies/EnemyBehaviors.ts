/**
 * Reusable enemy movement and attack patterns.
 *
 * Movement is deterministic for a given spawn (origin, parameters, phase) and gameplay state:
 * most patterns are closed-form functions of age; "dive" locks onto the player's position at a
 * well-defined moment. Attacks emit projectiles through the shared enemy ProjectileManager and
 * respect the fairness limits from GameConfig.combat (speed clamp).
 */
import { GameConfig } from '../app/GameConfig';
import type { ProjectileManager, ProjectileSpawn } from '../combat/ProjectileManager';
import { SpriteShape } from '../rendering/NeonShaders';

export type MovementKind = 'straight' | 'sine' | 'zigzag' | 'dive' | 'hover';

export interface MovementParams {
  kind: MovementKind;
  /** Base speed in units/s. */
  speed: number;
  /** Constant horizontal drift (units/s), used for diagonal paths. */
  driftX: number;
  /** Lateral amplitude for sine / zigzag / hover strafing. */
  amplitude: number;
  /** Oscillations per second. */
  frequency: number;
  /** Gameplay y where dive/hover enemies stop. */
  holdY: number;
  /** Seconds spent holding (dive wind-up or hover strafing). */
  holdTime: number;
}

export type AttackPattern = 'straight' | 'aimed' | 'spread' | 'radial';

export interface EnemyAttack {
  pattern: AttackPattern;
  count: number;
  /** Fan angle in degrees (spread) — ignored for straight/aimed single shots. */
  spreadAngle: number;
  speed: number;
  /** Seconds between attacks. */
  interval: number;
  /** Random delay range before the first attack (seconds). */
  initialDelay: readonly [number, number];
  damage: number;
  radius: number;
  /** Visual diameter. */
  size: number;
}

/** The mutable per-enemy state the behaviours operate on. */
export interface MovementState {
  x: number;
  y: number;
  x0: number;
  y0: number;
  age: number;
  phase: number;
  stage: number;
  stageTime: number;
  dirX: number;
  dirY: number;
  speedNow: number;
  movement: MovementParams;
}

export interface MovementContext {
  playerX: number;
  playerY: number;
  /** Half width of the combat lane (enemies that hold position stay inside it). */
  laneHalfWidth: number;
}

const TAU = Math.PI * 2;

function triangle(t: number): number {
  const f = t - Math.floor(t);
  return 4 * Math.abs(f - 0.5) - 1;
}

/** Eases towards holdY, never slower than 35% of speed. Returns true once arrived. */
function approachHold(s: MovementState, dt: number): boolean {
  const m = s.movement;
  const remaining = s.y - m.holdY;
  if (remaining <= 0.05) return true;
  const v = Math.max(m.speed * 0.35, m.speed * Math.min(1, remaining / 3));
  s.y -= Math.min(remaining, v * dt);
  return s.y - m.holdY <= 0.05;
}

export function stepMovement(s: MovementState, dt: number, ctx: MovementContext): void {
  const m = s.movement;
  s.age += dt;
  switch (m.kind) {
    case 'straight':
      s.y -= m.speed * dt;
      s.x += m.driftX * dt;
      break;

    case 'sine':
      s.y -= m.speed * dt;
      s.x0 += m.driftX * dt;
      s.x = s.x0 + m.amplitude * Math.sin(TAU * m.frequency * s.age + s.phase);
      break;

    case 'zigzag':
      s.y -= m.speed * dt;
      s.x0 += m.driftX * dt;
      s.x = s.x0 + m.amplitude * triangle(m.frequency * s.age + s.phase);
      break;

    case 'dive':
      if (s.stage === 0) {
        if (approachHold(s, dt)) {
          s.stage = 1;
          s.stageTime = 0;
        }
      } else if (s.stage === 1) {
        s.stageTime += dt;
        if (s.stageTime >= m.holdTime) {
          // Lock the dive vector now; it never homes afterwards, so it's dodgeable.
          const dx = ctx.playerX - s.x;
          const dy = Math.min(ctx.playerY - s.y, -2); // always dive downwards
          const len = Math.hypot(dx, dy) || 1;
          s.dirX = dx / len;
          s.dirY = dy / len;
          s.stage = 2;
          s.speedNow = m.speed * 0.4;
        }
      } else {
        s.speedNow = Math.min(m.speed * 2.4, s.speedNow + m.speed * 3 * dt);
        s.x += s.dirX * s.speedNow * dt;
        s.y += s.dirY * s.speedNow * dt;
      }
      break;

    case 'hover': {
      if (s.stage === 0) {
        if (approachHold(s, dt)) {
          s.stage = 1;
          s.stageTime = 0;
          // Keep the strafing band inside the lane.
          const limit = Math.max(0, ctx.laneHalfWidth - 1 - m.amplitude);
          s.x0 = Math.min(limit, Math.max(-limit, s.x));
        }
      } else if (s.stage === 1) {
        s.stageTime += dt;
        const target = s.x0 + m.amplitude * Math.sin(TAU * m.frequency * s.stageTime + s.phase);
        // Ease into the strafe so there's no jump when the stage starts.
        const k = Math.min(1, s.stageTime / 0.6);
        s.x += (target - s.x) * k;
        if (s.stageTime >= m.holdTime) {
          s.stage = 2;
          s.speedNow = 0;
        }
      } else {
        s.speedNow = Math.min(m.speed * 1.6, s.speedNow + m.speed * 1.5 * dt);
        s.y -= s.speedNow * dt;
      }
      break;
    }
  }
}

export interface AttackTimerState {
  fireTimer: number;
  telegraphing: boolean;
}

/**
 * Advances an enemy's attack timer. Returns true on the step the enemy should fire.
 *
 * A telegraph (warning flash) only starts if `canFire()` allows the shot when the warning
 * window begins, so a flashing enemy always means "incoming". If firing is blocked at either
 * point, the attack is postponed without a warning and re-evaluated shortly after.
 */
export function advanceAttackTimer(
  s: AttackTimerState,
  dt: number,
  interval: number,
  telegraph: number,
  canFire: () => boolean,
): boolean {
  const postpone = telegraph + 0.3;
  const before = s.fireTimer;
  s.fireTimer -= dt;
  if (before > telegraph && s.fireTimer <= telegraph) {
    if (!canFire()) {
      s.fireTimer = postpone;
      s.telegraphing = false;
      return false;
    }
    s.telegraphing = true;
  }
  if (s.fireTimer > 0) return false;
  s.telegraphing = false;
  if (!canFire()) {
    s.fireTimer = postpone;
    return false;
  }
  s.fireTimer = interval;
  return true;
}

const enemySpawn: ProjectileSpawn = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  damage: 1,
  radius: 0.2,
  life: 8,
  pierce: 0,
  areaRadius: 0,
  length: 0.5,
  width: 0.5,
  r: 1,
  g: 0.2,
  b: 0.35,
  shape: SpriteShape.EnemyOrb,
};

/**
 * Emits one attack. Angles: 0 = up the screen (+y), π = straight down.
 * `spin` rotates radial bursts so consecutive bursts interleave.
 */
export function fireAttack(
  attack: EnemyAttack,
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  color: { r: number; g: number; b: number },
  out: ProjectileManager,
  spin = 0,
): void {
  const cfg = GameConfig.combat;
  const speed = Math.min(cfg.enemyBulletSpeedMax, Math.max(cfg.enemyBulletSpeedMin, attack.speed));
  const aim = Math.atan2(targetX - x, targetY - y);
  const s = enemySpawn;
  s.damage = attack.damage;
  s.radius = attack.radius;
  s.length = s.width = attack.size;
  s.r = color.r;
  s.g = color.g;
  s.b = color.b;

  const emit = (angle: number) => {
    s.x = x;
    s.y = y;
    s.vx = Math.sin(angle) * speed;
    s.vy = Math.cos(angle) * speed;
    out.spawn(s);
  };

  const count = Math.max(1, attack.count);
  switch (attack.pattern) {
    case 'straight':
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1) - 0.5;
        s.x = x + t * 0.8 * (count - 1);
        s.y = y;
        s.vx = 0;
        s.vy = -speed;
        out.spawn(s);
      }
      break;
    case 'aimed':
      emit(aim);
      break;
    case 'spread': {
      const fan = (attack.spreadAngle * Math.PI) / 180;
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1) - 0.5;
        emit(aim + t * fan);
      }
      break;
    }
    case 'radial':
      for (let i = 0; i < count; i++) emit(spin + (i / count) * TAU);
      break;
  }
}
