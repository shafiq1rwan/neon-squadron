import { describe, expect, it } from 'vitest';
import { GameConfig } from '../src/app/GameConfig';
import { PlayerController } from '../src/player/PlayerController';

const bounds = { minX: -8, maxX: 8, minY: -14, maxY: 14 };
const dt = 1 / 60;

function make(): PlayerController {
  const p = new PlayerController(GameConfig.player, GameConfig.input, bounds);
  p.reset(0, 0);
  return p;
}

describe('PlayerController', () => {
  it('accelerates towards top speed with keyboard input and never exceeds it', () => {
    const p = make();
    for (let i = 0; i < 120; i++) {
      p.step(dt, { kind: 'direction', x: 0, y: 1 });
      expect(Math.hypot(p.velocity.x, p.velocity.y)).toBeLessThanOrEqual(GameConfig.player.movementSpeed + 1e-6);
      if (p.position.y >= bounds.maxY) break;
    }
  });

  it('reaches top speed before hitting the boundary', () => {
    const p = make();
    p.reset(0, bounds.minY);
    for (let i = 0; i < 20; i++) p.step(dt, { kind: 'direction', x: 0, y: 1 });
    expect(p.velocity.y).toBeCloseTo(GameConfig.player.movementSpeed, 3);
  });

  it('stops quickly when input is released (not slippery)', () => {
    const p = make();
    for (let i = 0; i < 30; i++) p.step(dt, { kind: 'direction', x: 1, y: 0 });
    let frames = 0;
    while (Math.hypot(p.velocity.x, p.velocity.y) > 0 && frames < 120) {
      p.step(dt, { kind: 'none' });
      frames++;
    }
    expect(frames).toBeLessThan(15); // under a quarter second
  });

  it('clamps to bounds and zeroes velocity into walls', () => {
    const p = make();
    for (let i = 0; i < 300; i++) p.step(dt, { kind: 'direction', x: 1, y: 1 });
    expect(p.position.x).toBe(bounds.maxX);
    expect(p.position.y).toBe(bounds.maxY);
    expect(p.velocity.x).toBe(0);
    expect(p.velocity.y).toBe(0);
  });

  it('settles on a pointer target without overshooting or teleporting', () => {
    const p = make();
    const target = { kind: 'target' as const, x: 6, y: 4 };
    let maxStep = 0;
    let maxX = 0;
    for (let i = 0; i < 180; i++) {
      const before = { ...p.position };
      p.step(dt, target);
      maxStep = Math.max(maxStep, Math.hypot(p.position.x - before.x, p.position.y - before.y));
      maxX = Math.max(maxX, p.position.x);
    }
    expect(p.position.x).toBeCloseTo(6, 2);
    expect(p.position.y).toBeCloseTo(4, 2);
    expect(maxX).toBeLessThanOrEqual(6 + 0.05);
    expect(maxStep).toBeLessThanOrEqual(p.maxPointerSpeed * dt + 1e-6);
  });

  it('tracks previous position for interpolation', () => {
    const p = make();
    p.step(dt, { kind: 'direction', x: 1, y: 0 });
    const prev = { ...p.position };
    p.step(dt, { kind: 'direction', x: 1, y: 0 });
    expect(p.previous).toEqual(prev);
  });
});
