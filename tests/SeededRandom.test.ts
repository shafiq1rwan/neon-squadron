import { describe, expect, it } from 'vitest';
import { SeededRandom, createRunStreams } from '../src/core/SeededRandom';

const draw = (rng: SeededRandom, n: number) => Array.from({ length: n }, () => rng.next());

describe('SeededRandom', () => {
  it('reproduces the same sequence for the same seed', () => {
    expect(draw(new SeededRandom('ABC'), 50)).toEqual(draw(new SeededRandom('ABC'), 50));
  });

  it('produces different sequences for different seeds', () => {
    expect(draw(new SeededRandom('ABC'), 10)).not.toEqual(draw(new SeededRandom('ABD'), 10));
  });

  it('stays within requested ranges', () => {
    const rng = new SeededRandom(42);
    for (let i = 0; i < 5000; i++) {
      const f = rng.next();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = rng.int(-3, 3);
      expect(n).toBeGreaterThanOrEqual(-3);
      expect(n).toBeLessThanOrEqual(3);
    }
  });

  it('int() covers the full inclusive range', () => {
    const rng = new SeededRandom('cover');
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(rng.int(1, 4));
    expect([...seen].sort()).toEqual([1, 2, 3, 4]);
  });

  it('forks independently of how much the parent has been used', () => {
    const a = new SeededRandom('root');
    const b = new SeededRandom('root');
    draw(b, 100);
    expect(draw(a.fork('enemy'), 20)).toEqual(draw(b.fork('enemy'), 20));
    expect(draw(a.fork('enemy'), 5)).not.toEqual(draw(a.fork('wave'), 5));
  });

  it('weightedIndex respects zero weights and returns -1 when all are zero', () => {
    const rng = new SeededRandom('w');
    for (let i = 0; i < 200; i++) expect(rng.weightedIndex([0, 1, 0])).toBe(1);
    expect(rng.weightedIndex([0, 0])).toBe(-1);
  });

  it('run streams are reproducible and isolated', () => {
    const s1 = createRunStreams('RUN1');
    const s2 = createRunStreams('RUN1');
    draw(s1.cosmetic, 1000); // cosmetic use must not affect gameplay streams
    expect(draw(s1.enemy, 10)).toEqual(draw(s2.enemy, 10));
    expect(draw(s1.wave, 10)).toEqual(draw(s2.wave, 10));
  });
});
