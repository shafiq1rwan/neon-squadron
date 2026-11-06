/**
 * Centralised projectile storage for one team (player or enemy).
 *
 * Projectiles are plain data in parallel typed arrays (structure-of-arrays) with a fixed
 * capacity: spawning writes into the next free slot and removal swaps the last live slot into
 * the hole, so live projectiles are always packed in [0, count). No objects or entities are
 * created per bullet. Rendering goes through a single SpriteBatch draw call.
 */
import type { SpriteBatch } from '../rendering/SpriteBatch';
import type { SpriteShapeId } from '../rendering/NeonShaders';
import type { Rect } from '../rendering/WorldSpace';

export interface ProjectileSpawn {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  /** Seconds before the projectile expires. */
  life: number;
  /** Number of additional enemies it may pass through. */
  pierce: number;
  /** Area-of-effect radius on hit (0 = single target). */
  areaRadius: number;
  /** Visual size. */
  length: number;
  width: number;
  r: number;
  g: number;
  b: number;
  shape: SpriteShapeId;
}

export class ProjectileManager {
  readonly capacity: number;
  count = 0;
  /** Number of spawns refused because the pool was full (diagnostics). */
  rejected = 0;

  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly px: Float32Array;
  readonly py: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly damage: Float32Array;
  readonly radius: Float32Array;
  readonly life: Float32Array;
  readonly pierce: Int16Array;
  readonly areaRadius: Float32Array;
  readonly length: Float32Array;
  readonly width: Float32Array;
  readonly r: Float32Array;
  readonly g: Float32Array;
  readonly b: Float32Array;
  readonly shape: Uint8Array;
  /** Id of the last enemy hit, so a piercing shot doesn't hit the same target every step. */
  readonly lastHit: Int32Array;

  constructor(capacity: number) {
    this.capacity = capacity;
    const f = () => new Float32Array(capacity);
    this.x = f();
    this.y = f();
    this.px = f();
    this.py = f();
    this.vx = f();
    this.vy = f();
    this.damage = f();
    this.radius = f();
    this.life = f();
    this.pierce = new Int16Array(capacity);
    this.areaRadius = f();
    this.length = f();
    this.width = f();
    this.r = f();
    this.g = f();
    this.b = f();
    this.shape = new Uint8Array(capacity);
    this.lastHit = new Int32Array(capacity);
  }

  spawn(s: ProjectileSpawn): boolean {
    if (this.count >= this.capacity) {
      this.rejected++;
      return false;
    }
    const i = this.count++;
    this.x[i] = this.px[i] = s.x;
    this.y[i] = this.py[i] = s.y;
    this.vx[i] = s.vx;
    this.vy[i] = s.vy;
    this.damage[i] = s.damage;
    this.radius[i] = s.radius;
    this.life[i] = s.life;
    this.pierce[i] = s.pierce;
    this.areaRadius[i] = s.areaRadius;
    this.length[i] = s.length;
    this.width[i] = s.width;
    this.r[i] = s.r;
    this.g[i] = s.g;
    this.b[i] = s.b;
    this.shape[i] = s.shape;
    this.lastHit[i] = -1;
    return true;
  }

  /** Removes projectile i by moving the last live projectile into its slot. */
  remove(i: number): void {
    const last = --this.count;
    if (i === last) return;
    this.x[i] = this.x[last]!;
    this.y[i] = this.y[last]!;
    this.px[i] = this.px[last]!;
    this.py[i] = this.py[last]!;
    this.vx[i] = this.vx[last]!;
    this.vy[i] = this.vy[last]!;
    this.damage[i] = this.damage[last]!;
    this.radius[i] = this.radius[last]!;
    this.life[i] = this.life[last]!;
    this.pierce[i] = this.pierce[last]!;
    this.areaRadius[i] = this.areaRadius[last]!;
    this.length[i] = this.length[last]!;
    this.width[i] = this.width[last]!;
    this.r[i] = this.r[last]!;
    this.g[i] = this.g[last]!;
    this.b[i] = this.b[last]!;
    this.shape[i] = this.shape[last]!;
    this.lastHit[i] = this.lastHit[last]!;
  }

  /** Moves every projectile and removes the expired or out-of-bounds ones. */
  step(dt: number, bounds: Rect): void {
    for (let i = this.count - 1; i >= 0; i--) {
      this.px[i] = this.x[i]!;
      this.py[i] = this.y[i]!;
      this.x[i]! += this.vx[i]! * dt;
      this.y[i]! += this.vy[i]! * dt;
      this.life[i]! -= dt;
      const x = this.x[i]!;
      const y = this.y[i]!;
      if (this.life[i]! <= 0 || x < bounds.minX || x > bounds.maxX || y < bounds.minY || y > bounds.maxY) {
        this.remove(i);
      }
    }
  }

  clear(): void {
    this.count = 0;
  }

  /** Writes all projectiles into a sprite batch, interpolated by `alpha`. */
  render(batch: SpriteBatch, alpha: number, height: number, intensity = 1): void {
    for (let i = 0; i < this.count; i++) {
      const x = this.px[i]! + (this.x[i]! - this.px[i]!) * alpha;
      const y = this.py[i]! + (this.y[i]! - this.py[i]!) * alpha;
      const vx = this.vx[i]!;
      const vy = this.vy[i]!;
      const speed = Math.hypot(vx, vy);
      const dx = speed > 1e-5 ? vx / speed : 0;
      const dy = speed > 1e-5 ? vy / speed : 1;
      batch.add(x, y, height, dx, dy, this.length[i]!, this.width[i]!, this.r[i]!, this.g[i]!, this.b[i]!, intensity, this.shape[i] as SpriteShapeId);
    }
  }
}
