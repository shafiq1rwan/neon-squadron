/**
 * High-level visual feedback built from pooled particles plus camera shake requests.
 * Uses the cosmetic RNG stream, so effects never influence gameplay randomness.
 *
 * Effects are deliberately short-lived and sized so they don't hide enemy bullets
 * (which are also drawn in a separate layer on top).
 */
import type { SeededRandom } from '../core/SeededRandom';
import { hexToRgb, Palette, type RGB } from '../ui/Theme';
import type { CameraManager } from './CameraManager';
import { SpriteShape } from './NeonShaders';
import type { ParticleManager } from './ParticleManager';

const TAU = Math.PI * 2;

export class EffectsManager {
  private readonly particles: ParticleManager;
  private readonly camera: CameraManager;
  private rng: SeededRandom;
  private readonly enemyColor = hexToRgb(Palette.enemy);
  private readonly hotColor = hexToRgb(Palette.enemyCore);
  private readonly playerColor = hexToRgb(Palette.player);
  private readonly shieldColor = hexToRgb(Palette.shieldHit);
  private readonly white: RGB = { r: 1, g: 1, b: 1 };
  private readonly shotColor = hexToRgb(Palette.projectile);
  private readonly goldColor = hexToRgb(Palette.legendary);

  constructor(particles: ParticleManager, camera: CameraManager, rng: SeededRandom) {
    this.particles = particles;
    this.camera = camera;
    this.rng = rng;
  }

  setRandom(rng: SeededRandom): void {
    this.rng = rng;
  }

  private burst(x: number, y: number, count: number, speedMin: number, speedMax: number, life: number, size: number, color: RGB, stretch: number, drag: number): void {
    const p = this.particles;
    const r = this.rng;
    for (let i = 0; i < count; i++) {
      const a = r.next() * TAU;
      const s = r.range(speedMin, speedMax);
      p.emit(x, y, Math.cos(a) * s, Math.sin(a) * s, life * r.range(0.6, 1.1), size, size * 0.3, color, SpriteShape.Bolt, drag, stretch);
    }
  }

  /** Small spark where a shot connects without killing. */
  hitSpark(x: number, y: number): void {
    const p = this.particles;
    p.emit(x, y, 0, 0, 0.08, 0.7, 0.3, this.shotColor, SpriteShape.Dot);
    const r = this.rng;
    for (let i = 0; i < 3; i++) {
      // Sparks kick back towards the shooter (downwards) with spread.
      const a = -Math.PI / 2 + r.range(-0.9, 0.9);
      const s = r.range(5, 10);
      p.emit(x, y, Math.cos(a) * s, Math.sin(a) * s, 0.16, 0.14, 0.05, this.hotColor, SpriteShape.Bolt, 6, 0.03);
    }
  }

  /** Enemy destroyed. `scale` ~1 for small craft, larger for heavy ones. */
  explosion(x: number, y: number, scale = 1): void {
    const p = this.particles;
    p.emit(x, y, 0, 0, 0.16, 2.6 * scale, 1.2 * scale, this.white, SpriteShape.Dot, 0, 0, 0.9);
    p.emit(x, y, 0, 0, 0.24, 1.8 * scale, 0.8 * scale, this.enemyColor, SpriteShape.Dot);
    p.emit(x, y, 0, 0, 0.38, 0.6 * scale, 4.2 * scale, this.enemyColor, SpriteShape.Ring);
    this.burst(x, y, Math.round(12 * scale), 6, 15 * Math.sqrt(scale), 0.42, 0.2, this.hotColor, 0.035, 3.5);
    this.burst(x, y, Math.round(6 * scale), 2, 6, 0.7, 0.32, this.enemyColor, 0, 2);
    if (scale >= 1.4) this.camera.addTrauma(0.35);
  }

  /** Splash damage marker. */
  areaBurst(x: number, y: number, radius: number): void {
    this.particles.emit(x, y, 0, 0, 0.28, radius * 0.5, radius * 2.1, this.goldColor, SpriteShape.Ring, 0, 0, 0.8);
  }

  shieldHit(x: number, y: number): void {
    const p = this.particles;
    p.emit(x, y, 0, 0, 0.35, 1.0, 3.4, this.shieldColor, SpriteShape.Ring);
    this.burst(x, y, 8, 4, 9, 0.3, 0.16, this.shieldColor, 0.03, 4);
    this.camera.addTrauma(0.25);
  }

  playerHit(x: number, y: number, fatal: boolean): void {
    const p = this.particles;
    if (fatal) {
      p.emit(x, y, 0, 0, 0.3, 5, 2, this.white, SpriteShape.Dot);
      p.emit(x, y, 0, 0, 0.6, 1, 8, this.playerColor, SpriteShape.Ring);
      p.emit(x, y, 0, 0, 0.45, 0.6, 5, this.white, SpriteShape.Ring, 0, 0, 0.7);
      this.burst(x, y, 34, 6, 20, 0.8, 0.24, this.playerColor, 0.04, 2.5);
      this.burst(x, y, 14, 2, 7, 1.1, 0.4, this.white, 0, 1.5);
      this.camera.addTrauma(0.85);
      return;
    }
    p.emit(x, y, 0, 0, 0.2, 2.2, 1, this.enemyColor, SpriteShape.Dot);
    this.burst(x, y, 12, 5, 12, 0.35, 0.18, this.hotColor, 0.03, 4);
    this.camera.addTrauma(0.5);
  }

  muzzleFlash(x: number, y: number): void {
    this.particles.emit(x, y, 0, 6, 0.05, 0.75, 0.35, this.shotColor, SpriteShape.Dot, 0, 0, 0.8);
  }
}

