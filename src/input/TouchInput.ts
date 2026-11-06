/**
 * One-finger relative drag for touch and pen.
 *
 * The first finger down anywhere on the canvas becomes the steering finger. Movement is
 * relative to where it touched, so the finger keeps its natural offset from the aircraft and
 * never covers it. Extra fingers are tracked; if the steering finger lifts while another is
 * still down, that finger takes over (with a fresh anchor, so the aircraft never jumps).
 */

interface TrackedPointer {
  x: number;
  y: number;
}

export class TouchInput {
  private readonly canvas: HTMLCanvasElement;
  private readonly pointers = new Map<number, TrackedPointer>();
  private activeId: number | null = null;
  /** Anchor (touch-down) and current positions of the steering finger, CSS px. */
  readonly anchor = { x: 0, y: 0 };
  readonly current = { x: 0, y: 0 };
  private anchorDirty = false;

  private readonly handleDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    e.preventDefault();
    const p = this.toLocal(e);
    this.pointers.set(e.pointerId, p);
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // Capture can fail if the pointer is already gone; tracking still works without it.
    }
    if (this.activeId === null) this.activate(e.pointerId, p);
  };

  private readonly handleMove = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    const tracked = this.pointers.get(e.pointerId);
    if (!tracked) return;
    const p = this.toLocal(e);
    tracked.x = p.x;
    tracked.y = p.y;
    if (e.pointerId === this.activeId) {
      this.current.x = p.x;
      this.current.y = p.y;
    }
  };

  private readonly handleUp = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    this.pointers.delete(e.pointerId);
    if (e.pointerId !== this.activeId) return;
    this.activeId = null;
    // Promote another finger that is still down.
    const next = this.pointers.entries().next();
    if (!next.done) this.activate(next.value[0], next.value[1]);
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.addEventListener('pointerdown', this.handleDown);
    canvas.addEventListener('pointermove', this.handleMove);
    canvas.addEventListener('pointerup', this.handleUp);
    canvas.addEventListener('pointercancel', this.handleUp);
    canvas.addEventListener('lostpointercapture', this.handleUp);
  }

  private toLocal(e: PointerEvent): TrackedPointer {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private activate(id: number, p: TrackedPointer): void {
    this.activeId = id;
    this.anchor.x = this.current.x = p.x;
    this.anchor.y = this.current.y = p.y;
    this.anchorDirty = true;
  }

  get isDragging(): boolean {
    return this.activeId !== null;
  }

  /** True exactly once after a new steering finger is chosen (caller must re-anchor). */
  consumeAnchorChange(): boolean {
    const dirty = this.anchorDirty;
    this.anchorDirty = false;
    return dirty;
  }

  /**
   * Ends the current drag (e.g. on pause). Fingers still on the screen are ignored until
   * they are lifted, so resuming never makes the aircraft jump.
   */
  reset(): void {
    this.activeId = null;
    this.anchorDirty = false;
    this.pointers.clear();
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.handleDown);
    this.canvas.removeEventListener('pointermove', this.handleMove);
    this.canvas.removeEventListener('pointerup', this.handleUp);
    this.canvas.removeEventListener('pointercancel', this.handleUp);
    this.canvas.removeEventListener('lostpointercapture', this.handleUp);
  }
}
