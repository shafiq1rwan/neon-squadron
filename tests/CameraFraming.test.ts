import { describe, expect, it } from 'vitest';
import { ndcToPlane, projectToNdc, solveFraming } from '../src/rendering/CameraFraming';

const DEG = Math.PI / 180;
const base = {
  verticalFovRad: 36 * DEG,
  pitchRad: 68 * DEG,
  halfWidth: 9,
  halfHeight: 15,
  planeY: 0,
  margins: { top: 0.1, bottom: 0.04, side: 0.02 },
};

const aspects: Record<string, number> = {
  '16:9': 16 / 9,
  '16:10': 1.6,
  '4:3': 4 / 3,
  '9:16': 9 / 16,
  '9:19.5': 9 / 19.5,
  '21:9': 21 / 9,
};

describe('solveFraming', () => {
  for (const [name, aspect] of Object.entries(aspects)) {
    it(`keeps the whole combat area visible at ${name}`, () => {
      const f = solveFraming({ ...base, aspect });
      let touchesX = false;
      let touchesY = false;
      for (const x of [-9, 9]) {
        for (const y of [-15, 15]) {
          const ndc = projectToNdc(f, { x, y: 0, z: -y });
          expect(ndc).not.toBeNull();
          expect(Math.abs(ndc!.x)).toBeLessThanOrEqual(1 - base.margins.side + 1e-3);
          expect(ndc!.y).toBeLessThanOrEqual(1 - base.margins.top + 1e-3);
          expect(ndc!.y).toBeGreaterThanOrEqual(-1 + base.margins.bottom - 1e-3);
          if (Math.abs(ndc!.x) > 1 - base.margins.side - 0.01) touchesX = true;
          if (ndc!.y > 1 - base.margins.top - 0.01 || ndc!.y < -1 + base.margins.bottom + 0.01) touchesY = true;
        }
      }
      // The fit should be tight on at least one axis (no wasted zoom-out).
      expect(touchesX || touchesY).toBe(true);
    });
  }

  it('portrait screens are width-limited, landscape screens are height-limited', () => {
    const portrait = solveFraming({ ...base, aspect: 9 / 19.5 });
    const landscape = solveFraming({ ...base, aspect: 16 / 9 });
    const pRight = projectToNdc(portrait, { x: 9, y: 0, z: 15 })!;
    expect(pRight.x).toBeGreaterThan(0.95);
    const lRight = projectToNdc(landscape, { x: 9, y: 0, z: 15 })!;
    expect(lRight.x).toBeLessThan(0.8);
  });

  it('ndcToPlane inverts projectToNdc', () => {
    const f = solveFraming({ ...base, aspect: 16 / 9 });
    const p = { x: 3.5, y: 0, z: -7 };
    const ndc = projectToNdc(f, p)!;
    const back = ndcToPlane(f, ndc.x, ndc.y, 0)!;
    expect(back.x).toBeCloseTo(p.x, 5);
    expect(back.z).toBeCloseTo(p.z, 5);
  });
});
