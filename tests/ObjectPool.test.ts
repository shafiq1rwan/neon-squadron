import { describe, expect, it } from 'vitest';
import { ObjectPool } from '../src/core/ObjectPool';

describe('ObjectPool', () => {
  it('reuses released objects instead of creating new ones', () => {
    let created = 0;
    const pool = new ObjectPool({
      create: () => ({ id: created++, live: false }),
      onAcquire: (o) => {
        o.live = true;
      },
      onRelease: (o) => {
        o.live = false;
      },
    });
    const a = pool.acquire()!;
    pool.release(a);
    const b = pool.acquire()!;
    expect(b).toBe(a);
    expect(b.live).toBe(true);
    expect(pool.total).toBe(1);
    expect(pool.active).toBe(1);
  });

  it('respects maxSize and prewarm', () => {
    const pool = new ObjectPool({ create: () => ({}), maxSize: 3 });
    pool.prewarm(10);
    expect(pool.total).toBe(3);
    expect(pool.acquire()).not.toBeNull();
    expect(pool.acquire()).not.toBeNull();
    expect(pool.acquire()).not.toBeNull();
    expect(pool.acquire()).toBeNull();
  });
});
