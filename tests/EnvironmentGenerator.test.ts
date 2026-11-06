import { describe, expect, it } from 'vitest';
import { generateChunkLayout } from '../src/procedural/EnvironmentGenerator';

const opts = { seed: 'ENV', chunkLength: 24, laneHalfWidth: 9, laneClearance: 1.6, sideDepth: 22, propCount: 8 };

describe('generateChunkLayout', () => {
  it('is deterministic per (seed, chunk index) regardless of generation order', () => {
    const a5 = generateChunkLayout(5, opts);
    generateChunkLayout(99, opts);
    expect(generateChunkLayout(5, opts)).toEqual(a5);
  });

  it('varies between seeds and chunks', () => {
    expect(generateChunkLayout(1, opts)).not.toEqual(generateChunkLayout(2, opts));
    expect(generateChunkLayout(1, opts)).not.toEqual(generateChunkLayout(1, { ...opts, seed: 'OTHER' }));
  });

  it('never places scenery inside the combat lane', () => {
    for (let k = -20; k < 200; k++) {
      for (const p of generateChunkLayout(k, opts)) {
        expect(Math.abs(p.x)).toBeGreaterThanOrEqual(opts.laneHalfWidth + opts.laneClearance);
        expect(p.along).toBeGreaterThanOrEqual(0);
        expect(p.along).toBeLessThan(opts.chunkLength);
      }
    }
  });
});
