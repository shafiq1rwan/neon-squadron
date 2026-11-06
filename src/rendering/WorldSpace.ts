/**
 * Mapping between the 2D gameplay plane and the 3D render world.
 *
 * Gameplay: x = right, y = forward (towards the top of the screen).
 * World:    x = right, y = up (height), z = towards the camera.
 * So gameplay (x, y) at visual height h renders at world (x, h, -y).
 */
import { Vec3 } from 'playcanvas';

export function gameplayToWorld(x: number, y: number, height: number, out: Vec3 = new Vec3()): Vec3 {
  return out.set(x, height, -y);
}

export function worldToGameplayY(worldZ: number): number {
  return -worldZ;
}

/** Axis-aligned rectangle on the gameplay plane. */
export interface Rect {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function rectFromCentre(halfWidth: number, halfHeight: number): Rect {
  return { minX: -halfWidth, maxX: halfWidth, minY: -halfHeight, maxY: halfHeight };
}

export function shrinkRect(r: Rect, by: number): Rect {
  return { minX: r.minX + by, maxX: r.maxX - by, minY: r.minY + by, maxY: r.maxY - by };
}
