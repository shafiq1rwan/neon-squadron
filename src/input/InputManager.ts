/**
 * Merges keyboard, mouse and touch into a single movement intent for the player controller.
 *
 * Priority: an active touch drag, then held keys, then a recently moved mouse cursor.
 * Pointer modes produce a *target* on the gameplay plane; the controller flies there with
 * limited speed, so switching devices never teleports the aircraft.
 */
import { GameConfig } from '../app/GameConfig';
import type { CameraManager } from '../rendering/CameraManager';
import type { Rect } from '../rendering/WorldSpace';
import { KeyboardInput } from './KeyboardInput';
import { MouseInput } from './MouseInput';
import { TouchInput } from './TouchInput';

export type MoveIntent =
  | { kind: 'none' }
  | { kind: 'direction'; x: number; y: number }
  | { kind: 'target'; x: number; y: number };

export type InputMode = 'none' | 'keyboard' | 'mouse' | 'touch';

export class InputManager {
  readonly keyboard: KeyboardInput;
  readonly mouse: MouseInput;
  readonly touch: TouchInput;
  private readonly camera: CameraManager;

  private enabled = false;
  private modeValue: InputMode = 'none';
  private readonly intent: { kind: MoveIntent['kind']; x: number; y: number } = { kind: 'none', x: 0, y: 0 };

  // Touch drag anchoring (gameplay-plane units).
  private readonly anchorPlayer = { x: 0, y: 0 };
  private readonly anchorGround = { x: 0, y: 0 };
  private readonly tmp = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement, camera: CameraManager) {
    this.camera = camera;
    this.keyboard = new KeyboardInput(window);
    this.mouse = new MouseInput(canvas);
    this.touch = new TouchInput(canvas);
  }

  get mode(): InputMode {
    return this.modeValue;
  }

  /**
   * Enables/disables steering. Disabling (pause, menus, upgrade selection) drops the
   * current drag and requires the mouse to move again, so resuming is jump-free.
   */
  setEnabled(enabled: boolean): void {
    if (enabled === this.enabled) return;
    this.enabled = enabled;
    this.touch.reset();
    this.mouse.markStale();
    this.intent.kind = 'none';
    this.modeValue = 'none';
  }

  /** Computes this frame's intent. `playerPos` is the current simulated position. */
  update(playerPos: { x: number; y: number }, bounds: Rect): MoveIntent {
    const out = this.intent;
    out.kind = 'none';
    if (!this.enabled) {
      this.modeValue = 'none';
      return out as MoveIntent;
    }

    if (this.touch.isDragging) {
      this.modeValue = 'touch';
      this.updateTouch(playerPos, bounds);
      return out as MoveIntent;
    }

    if (this.keyboard.getAxis(this.tmp)) {
      this.modeValue = 'keyboard';
      this.mouse.markStale();
      out.kind = 'direction';
      out.x = this.tmp.x;
      out.y = this.tmp.y;
      return out as MoveIntent;
    }

    if (this.mouse.isActive && this.camera.screenToGameplay(this.mouse.position.x, this.mouse.position.y, this.tmp)) {
      this.modeValue = 'mouse';
      out.kind = 'target';
      out.x = clamp(this.tmp.x, bounds.minX, bounds.maxX);
      out.y = clamp(this.tmp.y + GameConfig.input.mouseTargetOffsetY, bounds.minY, bounds.maxY);
      return out as MoveIntent;
    }

    this.modeValue = 'none';
    return out as MoveIntent;
  }

  private updateTouch(playerPos: { x: number; y: number }, bounds: Rect): void {
    const out = this.intent;
    const t = this.touch;
    if (t.consumeAnchorChange()) {
      this.anchorPlayer.x = playerPos.x;
      this.anchorPlayer.y = playerPos.y;
      if (!this.camera.screenToGameplay(t.anchor.x, t.anchor.y, this.anchorGround)) {
        this.anchorGround.x = this.anchorGround.y = 0;
      }
    }
    if (!this.camera.screenToGameplay(t.current.x, t.current.y, this.tmp)) return;

    const sens = GameConfig.input.touchSensitivity;
    const tx = this.anchorPlayer.x + (this.tmp.x - this.anchorGround.x) * sens;
    const ty = this.anchorPlayer.y + (this.tmp.y - this.anchorGround.y) * sens;
    const cx = clamp(tx, bounds.minX, bounds.maxX);
    const cy = clamp(ty, bounds.minY, bounds.maxY);
    // When the finger pushes past the edge, slide the anchor so reversing direction
    // responds immediately instead of waiting for the finger to come back.
    this.anchorPlayer.x += cx - tx;
    this.anchorPlayer.y += cy - ty;

    out.kind = 'target';
    out.x = cx;
    out.y = cy;
  }

  destroy(): void {
    this.keyboard.destroy();
    this.mouse.destroy();
    this.touch.destroy();
  }
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}
