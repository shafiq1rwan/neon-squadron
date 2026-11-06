/**
 * Mouse cursor tracking for follow-cursor steering. Only pointer events of type "mouse"
 * on the canvas are considered, so menus (HTML elements above the canvas) never steer.
 */
export class MouseInput {
  private readonly canvas: HTMLCanvasElement;
  /** Cursor position in CSS px relative to the canvas. */
  readonly position = { x: 0, y: 0 };
  /** True once the cursor has moved since the last call to markStale(). */
  private fresh = false;

  private readonly handleMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const rect = this.canvas.getBoundingClientRect();
    this.position.x = e.clientX - rect.left;
    this.position.y = e.clientY - rect.top;
    this.fresh = true;
  };

  private readonly handleContextMenu = (e: Event) => e.preventDefault();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.addEventListener('pointermove', this.handleMove);
    canvas.addEventListener('pointerdown', this.handleMove);
    canvas.addEventListener('contextmenu', this.handleContextMenu);
  }

  /** Whether the cursor should currently steer the aircraft. */
  get isActive(): boolean {
    return this.fresh;
  }

  /**
   * Stops cursor steering until the mouse moves again. Used when the keyboard takes over
   * and when gameplay resumes, so the ship doesn't dart towards a stale cursor position.
   */
  markStale(): void {
    this.fresh = false;
  }

  destroy(): void {
    this.canvas.removeEventListener('pointermove', this.handleMove);
    this.canvas.removeEventListener('pointerdown', this.handleMove);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
  }
}
