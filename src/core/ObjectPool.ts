/**
 * Generic free-list pool. Objects are created lazily by `create`, handed out with acquire()
 * and returned with release(); nothing is ever garbage-collected during play.
 */
export interface PoolHooks<T> {
  create: () => T;
  /** Called when an object is taken from the pool. */
  onAcquire?: (item: T) => void;
  /** Called when an object is returned; should hide/disable it. */
  onRelease?: (item: T) => void;
  /** Hard cap; acquire() returns null beyond it. Defaults to unlimited. */
  maxSize?: number;
}

export class ObjectPool<T> {
  private readonly free: T[] = [];
  private readonly hooks: PoolHooks<T>;
  private totalCreated = 0;
  private activeCount = 0;

  constructor(hooks: PoolHooks<T>) {
    this.hooks = hooks;
  }

  get active(): number {
    return this.activeCount;
  }

  get total(): number {
    return this.totalCreated;
  }

  get available(): number {
    return this.free.length;
  }

  /** Pre-creates objects so the first spawns cause no allocation spikes. */
  prewarm(count: number): void {
    const max = this.hooks.maxSize ?? Infinity;
    while (this.totalCreated < Math.min(count, max)) {
      const item = this.hooks.create();
      this.totalCreated++;
      this.hooks.onRelease?.(item);
      this.free.push(item);
    }
  }

  acquire(): T | null {
    let item = this.free.pop();
    if (item === undefined) {
      if (this.totalCreated >= (this.hooks.maxSize ?? Infinity)) return null;
      item = this.hooks.create();
      this.totalCreated++;
    }
    this.activeCount++;
    this.hooks.onAcquire?.(item);
    return item;
  }

  release(item: T): void {
    this.hooks.onRelease?.(item);
    this.free.push(item);
    this.activeCount--;
  }
}
