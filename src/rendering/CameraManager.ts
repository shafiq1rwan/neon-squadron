/**
 * Owns the fixed 2.5D camera. On every viewport change it re-solves the framing so the full
 * logical combat area is visible (minus HUD reserves) without stretching. Also converts
 * screen positions to gameplay-plane positions using the same maths as the framing.
 */
import { Color, Entity, type AppBase } from 'playcanvas';
import { GameConfig } from '../app/GameConfig';
import { hexToRgb, Palette } from '../ui/Theme';
import { ndcToPlane, solveFraming, type Framing } from './CameraFraming';
import type { Rect } from './WorldSpace';

const DEG = Math.PI / 180;

export class CameraManager {
  readonly entity: Entity;
  private framing: Framing | null = null;
  /** Shake trauma 0..1; offset grows with trauma² so small hits stay subtle. */
  private trauma = 0;
  private shakeTime = 0;
  /** Player setting (0 disables, 1 = default). */
  shakeScale: number = GameConfig.effects.screenShakeScale;
  private viewportWidth = 1;
  private viewportHeight = 1;
  /** Visible region of the gameplay plane (axis-aligned bounds of the view trapezoid). */
  readonly visibleGameplay: Rect = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  /** Visible region of the floor plane. */
  readonly visibleFloor: Rect = { minX: 0, maxX: 0, minY: 0, maxY: 0 };

  constructor(app: AppBase) {
    const cfg = GameConfig.camera;
    const bg = hexToRgb(Palette.bgPrimary);
    this.entity = new Entity('MainCamera');
    this.entity.addComponent('camera', {
      clearColor: new Color(bg.r, bg.g, bg.b, 1),
      fov: cfg.verticalFovDeg,
      nearClip: cfg.nearClip,
      farClip: cfg.farClip,
    });
    app.root.addChild(this.entity);
  }

  /** The view direction (constant, since the camera never rotates). */
  static viewDirection(): { x: number; y: number; z: number } {
    const p = GameConfig.camera.pitchDeg * DEG;
    return { x: 0, y: -Math.sin(p), z: -Math.cos(p) };
  }

  /** Re-solves framing for a viewport size in CSS pixels. */
  resize(cssWidth: number, cssHeight: number): void {
    const w = Math.max(1, cssWidth);
    const h = Math.max(1, cssHeight);
    this.viewportWidth = w;
    this.viewportHeight = h;
    const cfg = GameConfig.camera;
    const world = GameConfig.world;

    this.framing = solveFraming({
      aspect: w / h,
      verticalFovRad: cfg.verticalFovDeg * DEG,
      pitchRad: cfg.pitchDeg * DEG,
      halfWidth: world.combatWidth / 2,
      halfHeight: world.combatHeight / 2,
      planeY: 0,
      margins: {
        top: (2 * cfg.reserveTopPx) / h,
        bottom: (2 * cfg.reserveBottomPx) / h,
        side: (2 * cfg.reserveSidePx) / w,
      },
    });

    const { position, target } = this.framing;
    this.entity.setPosition(position.x, position.y, position.z);
    this.entity.lookAt(target.x, target.y, target.z);

    this.computeVisibleRect(0, this.visibleGameplay);
    this.computeVisibleRect(-world.floorDepth, this.visibleFloor);
  }

  /** Requests screen shake. Values add up and saturate at 1. */
  addTrauma(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  /** Applies decaying shake around the solved camera position. Call once per rendered frame. */
  update(frameDt: number): void {
    if (!this.framing) return;
    const { position } = this.framing;
    if (this.trauma <= 0 || this.shakeScale <= 0) {
      this.entity.setPosition(position.x, position.y, position.z);
      this.trauma = 0;
      return;
    }
    this.shakeTime += frameDt;
    const amp = this.trauma * this.trauma * GameConfig.effects.maxShakeOffset * this.shakeScale;
    const t = this.shakeTime * 32;
    // Sum of incommensurate sines: smooth, non-repeating, cheap.
    const ox = (Math.sin(t * 1.0) + Math.sin(t * 2.31 + 1.7) * 0.5) * amp;
    const oz = (Math.sin(t * 1.37 + 0.4) + Math.sin(t * 2.71 + 3.1) * 0.5) * amp;
    this.entity.setPosition(position.x + ox, position.y, position.z + oz);
    this.trauma = Math.max(0, this.trauma - GameConfig.effects.shakeDecay * frameDt);
  }

  private computeVisibleRect(planeY: number, out: Rect): void {
    if (!this.framing) return;
    out.minX = Infinity;
    out.maxX = -Infinity;
    out.minY = Infinity;
    out.maxY = -Infinity;
    for (const nx of [-1, 1]) {
      for (const ny of [-1, 1]) {
        const p = ndcToPlane(this.framing, nx, ny, planeY);
        if (!p) continue;
        out.minX = Math.min(out.minX, p.x);
        out.maxX = Math.max(out.maxX, p.x);
        out.minY = Math.min(out.minY, -p.z);
        out.maxY = Math.max(out.maxY, -p.z);
      }
    }
  }

  /**
   * Converts a position in CSS pixels relative to the canvas' top-left into a point on the
   * gameplay plane. Returns false if the ray misses the plane.
   */
  screenToGameplay(px: number, py: number, out: { x: number; y: number }): boolean {
    if (!this.framing) return false;
    const ndcX = (px / this.viewportWidth) * 2 - 1;
    const ndcY = 1 - (py / this.viewportHeight) * 2;
    const hit = ndcToPlane(this.framing, ndcX, ndcY, 0);
    if (!hit) return false;
    out.x = hit.x;
    out.y = -hit.z;
    return true;
  }

  get currentFraming(): Readonly<Framing> | null {
    return this.framing;
  }
}
