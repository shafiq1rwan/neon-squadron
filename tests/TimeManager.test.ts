import { describe, expect, it } from 'vitest';
import { TimeManager } from '../src/core/TimeManager';

const cfg = { fixedDt: 1 / 60, maxStepsPerFrame: 5, maxFrameDelta: 0.25 };

describe('TimeManager', () => {
  it('runs one step per 60 Hz frame', () => {
    const t = new TimeManager(cfg);
    let steps = 0;
    for (let i = 0; i < 60; i++) steps += t.advance(1 / 60, true);
    expect(steps).toBe(60);
    expect(t.simTime).toBeCloseTo(1, 6);
  });

  it('is frame-rate independent: 144 Hz and 30 Hz simulate the same time', () => {
    const a = new TimeManager(cfg);
    const b = new TimeManager(cfg);
    let sa = 0;
    let sb = 0;
    for (let i = 0; i < 144; i++) sa += a.advance(1 / 144, true);
    for (let i = 0; i < 30; i++) sb += b.advance(1 / 30, true);
    expect(Math.abs(sa - sb)).toBeLessThanOrEqual(1);
    expect(a.alpha).toBeGreaterThanOrEqual(0);
    expect(a.alpha).toBeLessThan(1);
  });

  it('does not advance while not running', () => {
    const t = new TimeManager(cfg);
    expect(t.advance(1, false)).toBe(0);
    expect(t.simTime).toBe(0);
    expect(t.advance(1 / 60, true)).toBe(1);
  });

  it('bounds catch-up steps and records dropped time', () => {
    const t = new TimeManager(cfg);
    const steps = t.advance(0.2, true);
    expect(steps).toBe(5);
    expect(t.droppedTime).toBeGreaterThan(0);
    expect(t.alpha).toBeLessThan(1);
  });

  it('clamps huge frame deltas', () => {
    const t = new TimeManager(cfg);
    t.advance(10, true);
    expect(t.simTime).toBeLessThanOrEqual(0.25);
  });
});
