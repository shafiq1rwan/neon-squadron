/**
 * Pure maths for the fixed 2.5D camera.
 *
 * The camera looks down at `pitch` radians below the horizon towards world -Z (gameplay +Y).
 * Given a viewport aspect ratio, solveFraming() finds the camera distance and target that make
 * the whole logical combat rectangle visible with the requested screen margins, so every device
 * sees the same combat area; wider or taller screens simply see extra decorative space.
 *
 * These functions do not depend on PlayCanvas so they can be unit-tested.
 */

export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

export interface FramingMargins {
  /** Margins in NDC units (0 = touch the edge, 2 = whole screen). */
  top: number;
  bottom: number;
  side: number;
}

export interface FramingInput {
  aspect: number;
  verticalFovRad: number;
  pitchRad: number;
  /** Half extents of the combat rectangle on the gameplay plane. */
  halfWidth: number;
  halfHeight: number;
  /** World Y of the gameplay plane. */
  planeY: number;
  margins: FramingMargins;
}

export interface CameraPose {
  position: Vec3Like;
  target: Vec3Like;
  forward: Vec3Like;
  up: Vec3Like;
  right: Vec3Like;
  tanHalfV: number;
  tanHalfH: number;
}

export interface Framing extends CameraPose {
  distance: number;
}

const RIGHT: Vec3Like = { x: 1, y: 0, z: 0 };

export function makePose(
  target: Vec3Like,
  distance: number,
  pitchRad: number,
  verticalFovRad: number,
  aspect: number,
): CameraPose {
  const s = Math.sin(pitchRad);
  const c = Math.cos(pitchRad);
  const forward = { x: 0, y: -s, z: -c };
  const up = { x: 0, y: c, z: -s };
  const tanHalfV = Math.tan(verticalFovRad / 2);
  return {
    position: { x: target.x, y: target.y + s * distance, z: target.z + c * distance },
    target: { ...target },
    forward,
    up,
    right: RIGHT,
    tanHalfV,
    tanHalfH: tanHalfV * aspect,
  };
}

/** Projects a world point to normalised device coordinates. Returns null if behind the camera. */
export function projectToNdc(
  pose: CameraPose,
  p: Vec3Like,
  out: { x: number; y: number } = { x: 0, y: 0 },
): { x: number; y: number } | null {
  const vx = p.x - pose.position.x;
  const vy = p.y - pose.position.y;
  const vz = p.z - pose.position.z;
  const zc = vx * pose.forward.x + vy * pose.forward.y + vz * pose.forward.z;
  if (zc <= 1e-6) return null;
  const xc = vx * pose.right.x + vy * pose.right.y + vz * pose.right.z;
  const yc = vx * pose.up.x + vy * pose.up.y + vz * pose.up.z;
  out.x = xc / (zc * pose.tanHalfH);
  out.y = yc / (zc * pose.tanHalfV);
  return out;
}

/**
 * Intersects the view ray through an NDC point with the horizontal plane y = planeY.
 * Returns null if the ray does not hit the plane in front of the camera.
 */
export function ndcToPlane(
  pose: CameraPose,
  ndcX: number,
  ndcY: number,
  planeY: number,
  out: Vec3Like = { x: 0, y: 0, z: 0 },
): Vec3Like | null {
  const dx = pose.forward.x + pose.right.x * ndcX * pose.tanHalfH + pose.up.x * ndcY * pose.tanHalfV;
  const dy = pose.forward.y + pose.right.y * ndcX * pose.tanHalfH + pose.up.y * ndcY * pose.tanHalfV;
  const dz = pose.forward.z + pose.right.z * ndcX * pose.tanHalfH + pose.up.z * ndcY * pose.tanHalfV;
  if (Math.abs(dy) < 1e-9) return null;
  const t = (planeY - pose.position.y) / dy;
  if (t <= 0) return null;
  out.x = pose.position.x + dx * t;
  out.y = planeY;
  out.z = pose.position.z + dz * t;
  return out;
}

interface Extents {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function rectExtents(pose: CameraPose, input: FramingInput): Extents | null {
  const { halfWidth: hw, halfHeight: hh, planeY } = input;
  const ext: Extents = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  const ndc = { x: 0, y: 0 };
  // Gameplay (x, y) maps to world (x, planeY, -y).
  for (const gx of [-hw, hw]) {
    for (const gy of [-hh, hh]) {
      if (!projectToNdc(pose, { x: gx, y: planeY, z: -gy }, ndc)) return null;
      ext.minX = Math.min(ext.minX, ndc.x);
      ext.maxX = Math.max(ext.maxX, ndc.x);
      ext.minY = Math.min(ext.minY, ndc.y);
      ext.maxY = Math.max(ext.maxY, ndc.y);
    }
  }
  return ext;
}

function fits(ext: Extents | null, m: FramingMargins): boolean {
  if (!ext) return false;
  return (
    ext.minX >= -1 + m.side &&
    ext.maxX <= 1 - m.side &&
    ext.minY >= -1 + m.bottom &&
    ext.maxY <= 1 - m.top
  );
}

function fitDistance(input: FramingInput, target: Vec3Like): number {
  let lo = 0.5;
  let hi = 5000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const pose = makePose(target, mid, input.pitchRad, input.verticalFovRad, input.aspect);
    if (fits(rectExtents(pose, input), input.margins)) hi = mid;
    else lo = mid;
  }
  return hi;
}

/** Solves camera distance and target so the combat rectangle fits, vertically balanced. */
export function solveFraming(input: FramingInput): Framing {
  const margins = sanitiseMargins(input.margins);
  const safeInput = { ...input, margins, aspect: Math.max(input.aspect, 0.05) };
  const target: Vec3Like = { x: 0, y: input.planeY, z: 0 };
  let distance = fitDistance(safeInput, target);

  for (let iter = 0; iter < 8; iter++) {
    const pose = makePose(target, distance, safeInput.pitchRad, safeInput.verticalFovRad, safeInput.aspect);
    const ext = rectExtents(pose, safeInput);
    if (!ext) break;
    const slackTop = 1 - margins.top - ext.maxY;
    const slackBottom = ext.minY - (-1 + margins.bottom);
    const imbalance = (slackTop - slackBottom) / 2; // >0: content should move up on screen
    if (Math.abs(imbalance) < 1e-4) break;

    // Numerically estimate how NDC y responds to moving the target along world Z.
    const eps = 0.01;
    const shifted = makePose(
      { ...target, z: target.z + eps },
      distance,
      safeInput.pitchRad,
      safeInput.verticalFovRad,
      safeInput.aspect,
    );
    const centre = { x: 0, y: input.planeY, z: 0 };
    const a = projectToNdc(pose, centre);
    const b = projectToNdc(shifted, centre);
    if (!a || !b) break;
    const dNdcPerZ = (b.y - a.y) / eps;
    if (Math.abs(dNdcPerZ) < 1e-9) break;
    target.z += imbalance / dNdcPerZ;
    distance = fitDistance(safeInput, target);
  }

  const pose = makePose(target, distance, safeInput.pitchRad, safeInput.verticalFovRad, safeInput.aspect);
  return { ...pose, distance };
}

function sanitiseMargins(m: FramingMargins): FramingMargins {
  // Never let margins consume the whole screen.
  const clamp = (v: number) => Math.min(Math.max(v, 0), 0.8);
  const top = clamp(m.top);
  const bottom = clamp(m.bottom);
  const scale = top + bottom > 1.2 ? 1.2 / (top + bottom) : 1;
  return { top: top * scale, bottom: bottom * scale, side: clamp(m.side) };
}
