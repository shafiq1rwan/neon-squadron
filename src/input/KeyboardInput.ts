/**
 * Keyboard state: WASD / arrow movement axes and pause requests.
 * Keys are cleared on window blur so the aircraft never drifts with a "stuck" key.
 */

const LEFT = new Set(['KeyA', 'ArrowLeft']);
const RIGHT = new Set(['KeyD', 'ArrowRight']);
const UP = new Set(['KeyW', 'ArrowUp']);
const DOWN = new Set(['KeyS', 'ArrowDown']);
const PAUSE = new Set(['Escape', 'KeyP']);
const MOVEMENT = new Set([...LEFT, ...RIGHT, ...UP, ...DOWN]);

export class KeyboardInput {
  private readonly down = new Set<string>();
  private readonly target: Window;
  /** Invoked once per key press (not on auto-repeat). */
  onPause: (() => void) | null = null;
  /** Invoked for other non-repeat key presses (used by debug tooling). */
  onKey: ((code: string) => void) | null = null;

  private readonly handleDown = (e: KeyboardEvent) => {
    if (isTypingTarget(e.target)) return;
    if (MOVEMENT.has(e.code) || e.code === 'Space') e.preventDefault();
    this.down.add(e.code);
    if (e.repeat) return;
    if (PAUSE.has(e.code)) this.onPause?.();
    else this.onKey?.(e.code);
  };

  private readonly handleUp = (e: KeyboardEvent) => {
    this.down.delete(e.code);
  };

  private readonly handleBlur = () => this.down.clear();

  constructor(target: Window = window) {
    this.target = target;
    target.addEventListener('keydown', this.handleDown);
    target.addEventListener('keyup', this.handleUp);
    target.addEventListener('blur', this.handleBlur);
  }

  private any(keys: Set<string>): boolean {
    for (const k of keys) if (this.down.has(k)) return true;
    return false;
  }

  /** Writes a movement direction (length ≤ 1) into `out`; returns true if any key is held. */
  getAxis(out: { x: number; y: number }): boolean {
    const x = (this.any(RIGHT) ? 1 : 0) - (this.any(LEFT) ? 1 : 0);
    const y = (this.any(UP) ? 1 : 0) - (this.any(DOWN) ? 1 : 0);
    const len = Math.hypot(x, y);
    out.x = len > 0 ? x / len : 0;
    out.y = len > 0 ? y / len : 0;
    return len > 0;
  }

  reset(): void {
    this.down.clear();
  }

  destroy(): void {
    this.target.removeEventListener('keydown', this.handleDown);
    this.target.removeEventListener('keyup', this.handleUp);
    this.target.removeEventListener('blur', this.handleBlur);
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
}
