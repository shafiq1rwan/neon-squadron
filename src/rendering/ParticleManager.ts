/**
 * Pooled particles in typed arrays, rendered through one SpriteBatch.
 * Particles advance with the fixed simulation step (so they freeze on pause) and are
 * interpolated when drawn. When the budget is exhausted new particles are simply dropped.
 */
import type { SpriteShapeId } from './NeonShaders';
import { SpriteShape } from './NeonShaders';
import type { SpriteBatch } from './SpriteBatch';

export class ParticleManager {
  readonly capacity: number;
  /** Active budget (<= capacity); quality settings lower it. */
  budget: number;
  count = 0;
  private readonly x: Float32Array;
  private readonly y: Float32Array;
  private readonly px: Float32Array;
  private readonly py: Float32Array;
  private readonly vx: Float32Array;
  private readonly vy: Float32Array;
  private readonly life: Float32Array;
  private readonly maxLife: Float32Array;
  private readonly size0: Float32Array;
  private readonly size1: Float32Array;
  private readonly stretch: Float32Array;
  private readonly drag: Float32Array;
  private readonly alpha: Float32Array;
  private readonly r: Float32Array;
  private readonly g: Float32Array;
  private readonly b: Float32Array;
  private readonly shape: Uint8Array;

  constructor(capacity: number, budget = capacity) {
    this.capacity = capacity;
    this.budget = Math.min(budget, capacity);
    const f = () => new Float32Array(capacity);
    this.x = f();
    this.y = f();
    this.px = f();
    this.py = f();
    this.vx = f();
    this.vy = f();
    this.life = f();
    this.maxLife = f();
    this.size0 = f();
    this.size1 = f();
    this.stretch = f();
    this.drag = f();
    this.alpha = f();
    this.r = f();
    this.g = f();
    this.b = f();
    this.shape = new Uint8Array(capacity);
  }

  /**
   * @param stretch seconds of velocity added to the sprite's length (streaky sparks); 0 = round
   */
  emit(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    size0: number,
    size1: number,
    color: { r: number; g: number; b: number },
    shape: SpriteShapeId = SpriteShape.Dot,
    drag = 0,
    stretch = 0,
    alpha = 1,
  ): void {
    if (this.count >= this.budget) return;
    const i = this.count++;
    this.x[i] = this.px[i] = x;
    this.y[i] = this.py[i] = y;
    this.vx[i] = vx;
    this.vy[i] = vy;
    this.life[i] = this.maxLife[i] = life;
    this.size0[i] = size0;
    this.size1[i] = size1;
    this.stretch[i] = stretch;
    this.drag[i] = drag;
    this.alpha[i] = alpha;
    this.r[i] = color.r;
    this.g[i] = color.g;
    this.b[i] = color.b;
    this.shape[i] = shape;
  }

  private remove(i: number): void {
    const last = --this.count;
    if (i === last) return;
    this.x[i] = this.x[last]!;
    this.y[i] = this.y[last]!;
    this.px[i] = this.px[last]!;
    this.py[i] = this.py[last]!;
    this.vx[i] = this.vx[last]!;
    this.vy[i] = this.vy[last]!;
    this.life[i] = this.life[last]!;
    this.maxLife[i] = this.maxLife[last]!;
    this.size0[i] = this.size0[last]!;
    this.size1[i] = this.size1[last]!;
    this.stretch[i] = this.stretch[last]!;
    this.drag[i] = this.drag[last]!;
    this.alpha[i] = this.alpha[last]!;
    this.r[i] = this.r[last]!;
    this.g[i] = this.g[last]!;
    this.b[i] = this.b[last]!;
    this.shape[i] = this.shape[last]!;
  }

  step(dt: number): void {
    for (let i = this.count - 1; i >= 0; i--) {
      this.life[i]! -= dt;
      if (this.life[i]! <= 0) {
        this.remove(i);
        continue;
      }
      this.px[i] = this.x[i]!;
      this.py[i] = this.y[i]!;
      const d = this.drag[i]!;
      if (d > 0) {
        const k = Math.exp(-d * dt);
        this.vx[i]! *= k;
        this.vy[i]! *= k;
      }
      this.x[i]! += this.vx[i]! * dt;
      this.y[i]! += this.vy[i]! * dt;
    }
  }

  clear(): void {
    this.count = 0;
  }

  render(batch: SpriteBatch, interp: number, height: number): void {
    for (let i = 0; i < this.count; i++) {
      const t = 1 - this.life[i]! / this.maxLife[i]!;
      const size = this.size0[i]! + (this.size1[i]! - this.size0[i]!) * t;
      const shape = this.shape[i] as SpriteShapeId;
      // Rings fade linearly; sparks and flashes fade faster towards the end.
      const fade = shape === SpriteShape.Ring ? 1 - t : (1 - t) * (1 - t * 0.5);
      const x = this.px[i]! + (this.x[i]! - this.px[i]!) * interp;
      const y = this.py[i]! + (this.y[i]! - this.py[i]!) * interp;
      const vx = this.vx[i]!;
      const vy = this.vy[i]!;
      const speed = Math.hypot(vx, vy);
      const dx = speed > 1e-4 ? vx / speed : 0;
      const dy = speed > 1e-4 ? vy / speed : 1;
      const length = size + speed * this.stretch[i]!;
      batch.add(x, y, height, dx, dy, length, size, this.r[i]!, this.g[i]!, this.b[i]!, this.alpha[i]! * fade, shape);
    }
  }
}
