/**
 * Uniform-grid broad phase. Items (by integer index) are bucketed by centre point using
 * intrusive linked lists in typed arrays — rebuilding costs O(n) with zero allocation.
 * Queries visit every cell overlapping (x ± reach, y ± reach); callers do the exact test.
 */
export class SpatialGrid {
  readonly cellSize: number;
  private readonly minX: number;
  private readonly minY: number;
  private readonly cols: number;
  private readonly rows: number;
  private readonly head: Int32Array;
  private next: Int32Array;
  /** Largest radius inserted since the last clear (queries extend by this). */
  maxRadius = 0;

  constructor(minX: number, minY: number, width: number, height: number, cellSize: number, capacity = 256) {
    this.cellSize = cellSize;
    this.minX = minX;
    this.minY = minY;
    this.cols = Math.max(1, Math.ceil(width / cellSize));
    this.rows = Math.max(1, Math.ceil(height / cellSize));
    this.head = new Int32Array(this.cols * this.rows).fill(-1);
    this.next = new Int32Array(capacity).fill(-1);
  }

  clear(): void {
    this.head.fill(-1);
    this.maxRadius = 0;
  }

  private col(x: number): number {
    const c = Math.floor((x - this.minX) / this.cellSize);
    return c < 0 ? 0 : c >= this.cols ? this.cols - 1 : c;
  }

  private row(y: number): number {
    const r = Math.floor((y - this.minY) / this.cellSize);
    return r < 0 ? 0 : r >= this.rows ? this.rows - 1 : r;
  }

  /** Inserts item `index` at (x, y). Out-of-range points clamp to edge cells. */
  insert(index: number, x: number, y: number, radius: number): void {
    if (index >= this.next.length) {
      const grown = new Int32Array(Math.max(index + 1, this.next.length * 2)).fill(-1);
      grown.set(this.next);
      this.next = grown;
    }
    const cell = this.row(y) * this.cols + this.col(x);
    this.next[index] = this.head[cell]!;
    this.head[cell] = index;
    if (radius > this.maxRadius) this.maxRadius = radius;
  }

  /**
   * Writes candidate item indices near (x, y) into `out` and returns how many.
   * `reach` should be the query radius; maxRadius is added automatically.
   */
  query(x: number, y: number, reach: number, out: number[]): number {
    const r = reach + this.maxRadius;
    const c0 = this.col(x - r);
    const c1 = this.col(x + r);
    const r0 = this.row(y - r);
    const r1 = this.row(y + r);
    let n = 0;
    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        for (let i = this.head[row * this.cols + col]!; i !== -1; i = this.next[i]!) {
          out[n++] = i;
        }
      }
    }
    return n;
  }
}
