/**
 * Player movement simulation on the gameplay plane (fixed timestep, no rendering).
 *
 * Velocity approaches a desired velocity with separate acceleration/deceleration limits,
 * which gives precise, non-slippery handling for bullet dodging. Pointer targets use a
 * proportional approach (speed ∝ distance, capped) so the ship settles without overshoot.
 */
import type { PlayerConfig } from '../app/GameConfig';
import type { MoveIntent } from '../input/InputManager';
import type { Rect } from '../rendering/WorldSpace';

export interface PointerFollowConfig {
  pointerSpeedMultiplier: number;
  pointerFollowGain: number;
}

export class PlayerController {
  readonly position = { x: 0, y: 0 };
  readonly previous = { x: 0, y: 0 };
  readonly velocity = { x: 0, y: 0 };
  private readonly config: PlayerConfig;
  private readonly follow: PointerFollowConfig;
  bounds: Rect;
  /** Upgrade multiplier on top speed. */
  speedMultiplier = 1;

  constructor(config: PlayerConfig, follow: PointerFollowConfig, bounds: Rect) {
    this.config = config;
    this.follow = follow;
    this.bounds = bounds;
  }

  get maxSpeed(): number {
    return this.config.movementSpeed * this.speedMultiplier;
  }

  get maxPointerSpeed(): number {
    return this.maxSpeed * this.follow.pointerSpeedMultiplier;
  }

  reset(x: number, y: number): void {
    this.position.x = this.previous.x = x;
    this.position.y = this.previous.y = y;
    this.velocity.x = this.velocity.y = 0;
  }

  step(dt: number, intent: MoveIntent): void {
    this.previous.x = this.position.x;
    this.previous.y = this.position.y;

    let dvx = 0;
    let dvy = 0;
    if (intent.kind === 'direction') {
      dvx = intent.x * this.maxSpeed;
      dvy = intent.y * this.maxSpeed;
    } else if (intent.kind === 'target') {
      const dx = intent.x - this.position.x;
      const dy = intent.y - this.position.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1e-4) {
        // "Arrive" behaviour: never request more speed than we can shed before reaching the
        // target (v² = 2·a·d), nor more than covers the distance this step. Prevents overshoot.
        // Braking is planned at 75% of the limit to absorb fixed-step discretisation lag.
        const brakingSpeed = Math.sqrt(2 * this.config.deceleration * 0.75 * dist);
        const speed = Math.min(this.maxPointerSpeed, dist * this.follow.pointerFollowGain, brakingSpeed, dist / dt);
        dvx = (dx / dist) * speed;
        dvy = (dy / dist) * speed;
      }
    }

    // Accelerate when gaining speed or turning; decelerate when easing off.
    const desiredSpeed = Math.hypot(dvx, dvy);
    const currentSpeed = Math.hypot(this.velocity.x, this.velocity.y);
    const turning = this.velocity.x * dvx + this.velocity.y * dvy < 0;
    const rate = desiredSpeed >= currentSpeed || turning ? this.config.acceleration : this.config.deceleration;
    moveTowards(this.velocity, dvx, dvy, rate * dt);

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    // Clamp to the combat area and kill velocity into the wall.
    const b = this.bounds;
    if (this.position.x < b.minX) {
      this.position.x = b.minX;
      if (this.velocity.x < 0) this.velocity.x = 0;
    } else if (this.position.x > b.maxX) {
      this.position.x = b.maxX;
      if (this.velocity.x > 0) this.velocity.x = 0;
    }
    if (this.position.y < b.minY) {
      this.position.y = b.minY;
      if (this.velocity.y < 0) this.velocity.y = 0;
    } else if (this.position.y > b.maxY) {
      this.position.y = b.maxY;
      if (this.velocity.y > 0) this.velocity.y = 0;
    }
  }
}

/** Moves vector `v` towards (tx, ty) by at most `maxDelta`. */
export function moveTowards(v: { x: number; y: number }, tx: number, ty: number, maxDelta: number): void {
  const dx = tx - v.x;
  const dy = ty - v.y;
  const d = Math.hypot(dx, dy);
  if (d <= maxDelta || d < 1e-9) {
    v.x = tx;
    v.y = ty;
  } else {
    v.x += (dx / d) * maxDelta;
    v.y += (dy / d) * maxDelta;
  }
}
