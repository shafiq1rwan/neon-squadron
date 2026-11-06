/**
 * Builds aircraft geometry from reusable geometric components (body, wings, engines, core,
 * weapon mounts, fins). A design is plain data, so the same templates serve the hand-tuned
 * player ship and the seeded enemy variants added in the procedural-generation phase.
 *
 * All shapes are authored in gameplay-plane units with the nose pointing towards +y.
 */
import { hexToRgb, mixRgb, Palette } from '../ui/Theme';
import {
  NeonGeometryBuilder,
  brighten,
  mirrorX,
  scaleRgb,
  type LineStyle,
  type V2,
  type V3,
} from '../rendering/NeonGeometryBuilder';

export type BodyType = 'triangle' | 'diamond' | 'hexagon' | 'arrowhead' | 'spearhead';
export type WingType = 'straight' | 'swept' | 'split' | 'delta' | 'angular';

export interface AircraftDesign {
  body: BodyType;
  wing: WingType;
  /** Nose-to-tail length of the body. */
  length: number;
  /** Body width at its widest. */
  width: number;
  /** Distance from centre line to wing tip. */
  wingSpan: number;
  /** Wing chord at the root. */
  wingChord: number;
  /** How far back the wing tip sits relative to the root (positive = swept back). */
  wingSweep: number;
  /** Wing root position along the body (fraction of length, + = forward). */
  wingOffset: number;
  engineCount: 1 | 2 | 3;
  weaponMounts: number;
  hasCore: boolean;
  hasFins: boolean;
  /** Main neon colour (hex). */
  color: string;
  /** Engine / core colour (hex). */
  accent: string;
  /** How much of the neon colour tints the dark hull (0..1). */
  hullTint: number;
  /** Overall glow strength multiplier. */
  glow: number;
}

export const PLAYER_DESIGN: AircraftDesign = {
  body: 'spearhead',
  wing: 'swept',
  length: 1.75,
  width: 0.56,
  wingSpan: 0.82,
  wingChord: 0.62,
  wingSweep: 0.42,
  wingOffset: 0.02,
  engineCount: 2,
  weaponMounts: 2,
  hasCore: true,
  hasFins: true,
  color: Palette.player,
  accent: Palette.engineCore,
  hullTint: 0.3,
  glow: 1,
};

interface Part {
  poly: V2[];
  apexHeight: number;
  apex?: V2;
}

function bodyPolygon(type: BodyType, L: number, W: number): Part {
  const hw = W / 2;
  switch (type) {
    case 'triangle':
      return { poly: [{ x: 0, y: L * 0.5 }, { x: -hw, y: -L * 0.5 }, { x: hw, y: -L * 0.5 }].reverse(), apexHeight: 0.2 };
    case 'diamond':
      return {
        poly: [{ x: 0, y: L * 0.5 }, { x: hw, y: 0 }, { x: 0, y: -L * 0.5 }, { x: -hw, y: 0 }].reverse(),
        apexHeight: 0.24,
      };
    case 'hexagon':
      return {
        poly: [
          { x: 0, y: L * 0.5 },
          { x: hw, y: L * 0.2 },
          { x: hw, y: -L * 0.25 },
          { x: 0, y: -L * 0.5 },
          { x: -hw, y: -L * 0.25 },
          { x: -hw, y: L * 0.2 },
        ].reverse(),
        apexHeight: 0.24,
      };
    case 'arrowhead':
      return {
        poly: [{ x: 0, y: L * 0.5 }, { x: hw, y: -L * 0.42 }, { x: 0, y: -L * 0.18 }, { x: -hw, y: -L * 0.42 }].reverse(),
        apexHeight: 0.2,
        apex: { x: 0, y: L * 0.08 },
      };
    case 'spearhead':
    default:
      return {
        poly: [
          { x: 0, y: L * 0.55 },
          { x: hw * 0.55, y: L * 0.12 },
          { x: hw, y: -L * 0.12 },
          { x: hw * 0.62, y: -L * 0.45 },
          { x: 0, y: -L * 0.34 },
          { x: -hw * 0.62, y: -L * 0.45 },
          { x: -hw, y: -L * 0.12 },
          { x: -hw * 0.55, y: L * 0.12 },
        ].reverse(),
        apexHeight: 0.26,
        apex: { x: 0, y: L * 0.02 },
      };
  }
}

/** Right-side wing polygons (mirrored for the left). */
function wingPolygons(d: AircraftDesign): V2[][] {
  const rootX = d.width * 0.3;
  const y0 = d.wingOffset * d.length;
  const c = d.wingChord;
  const span = d.wingSpan;
  const sweep = d.wingSweep;
  switch (d.wing) {
    case 'straight':
      return [[
        { x: rootX, y: y0 + c * 0.5 },
        { x: span, y: y0 + c * 0.35 },
        { x: span, y: y0 - c * 0.35 },
        { x: rootX, y: y0 - c * 0.5 },
      ]];
    case 'delta':
      return [[
        { x: rootX, y: y0 + c * 0.7 },
        { x: span, y: y0 - c * 0.45 - sweep * 0.3 },
        { x: rootX, y: y0 - c * 0.5 },
      ]];
    case 'split':
      return [
        [
          { x: rootX, y: y0 + c * 0.55 },
          { x: span, y: y0 + c * 0.1 - sweep * 0.5 },
          { x: span, y: y0 - c * 0.05 - sweep * 0.5 },
          { x: rootX, y: y0 + c * 0.05 },
        ],
        [
          { x: rootX, y: y0 - c * 0.2 },
          { x: span * 0.75, y: y0 - c * 0.55 - sweep * 0.5 },
          { x: span * 0.75, y: y0 - c * 0.7 - sweep * 0.5 },
          { x: rootX, y: y0 - c * 0.6 },
        ],
      ];
    case 'angular':
      return [[
        { x: rootX, y: y0 + c * 0.5 },
        { x: span * 0.7, y: y0 + c * 0.2 },
        { x: span, y: y0 - c * 0.35 - sweep * 0.4 },
        { x: span * 0.8, y: y0 - c * 0.6 - sweep * 0.4 },
        { x: rootX, y: y0 - c * 0.5 },
      ]];
    case 'swept':
    default:
      return [[
        { x: rootX, y: y0 + c * 0.5 },
        { x: span, y: y0 - sweep },
        { x: span, y: y0 - sweep - c * 0.32 },
        { x: rootX, y: y0 - c * 0.5 },
      ]];
  }
}

export interface AircraftGeometryOptions {
  viewDir: V3;
  /** Multiplier applied to halo alpha (quality setting). */
  glowScale?: number;
}

/** Produces solid + glow geometry buffers for a design. */
export function buildAircraftGeometry(design: AircraftDesign, options: AircraftGeometryOptions): NeonGeometryBuilder {
  const b = new NeonGeometryBuilder(options.viewDir);
  const neon = hexToRgb(design.color);
  const accent = hexToRgb(design.accent);
  const bg = hexToRgb(Palette.bgSecondary);
  const hull = mixRgb(bg, neon, design.hullTint);
  const wingHull = scaleRgb(hull, 0.85);
  const glow = design.glow * (options.glowScale ?? 1);

  const outline: LineStyle = {
    color: neon,
    coreWidth: 0.05,
    coreAlpha: 1,
    haloWidth: 0.34,
    haloAlpha: 0.32 * glow,
  };
  const detail: LineStyle = {
    color: neon,
    coreWidth: 0.025,
    coreAlpha: 0.75,
    haloWidth: 0,
    haloAlpha: 0,
  };

  const L = design.length;
  const lineLift = 0.03;

  // Wings first (under the body).
  for (const right of wingPolygons(design)) {
    const left = mirrorX(right);
    for (const poly of [right, left]) {
      b.addFacetedPolygon(poly, 0, 0.07, wingHull);
      b.addPolygonOutline(poly, lineLift, outline);
    }
  }

  // Body.
  const body = bodyPolygon(design.body, L, design.width);
  b.addFacetedPolygon(body.poly, 0.02, body.apexHeight, hull, body.apex);
  b.addPolygonOutline(body.poly, 0.02 + lineLift, outline);

  // Spine detail line along the centre ridge.
  const apex = body.apex ?? { x: 0, y: 0 };
  const ridgeH = 0.02 + body.apexHeight + 0.01;
  b.addLine({ x: 0, y: 0.05, z: -L * 0.5 }, { x: apex.x, y: ridgeH, z: -apex.y }, detail);

  // Energy fins near the tail.
  if (design.hasFins) {
    const finStyle: LineStyle = { ...detail, coreWidth: 0.035, coreAlpha: 0.9, haloWidth: 0.18, haloAlpha: 0.25 * glow };
    for (const s of [-1, 1]) {
      b.addLine(
        { x: s * design.width * 0.28, y: 0.14, z: L * 0.22 },
        { x: s * design.width * 0.46, y: 0.32, z: L * 0.42 },
        finStyle,
      );
    }
  }

  // Weapon mounts: short barrels on the wing leading edges.
  if (design.weaponMounts > 0) {
    const mountStyle: LineStyle = { ...detail, coreWidth: 0.04, coreAlpha: 1, haloWidth: 0.14, haloAlpha: 0.3 * glow };
    const count = Math.min(design.weaponMounts, 4);
    for (let i = 0; i < count; i++) {
      const s = i % 2 === 0 ? 1 : -1;
      const tier = Math.floor(i / 2);
      const x = s * (design.width * 0.42 + tier * design.wingSpan * 0.25);
      const yBack = design.wingOffset * L + design.wingChord * 0.15 - tier * 0.12;
      b.addLine({ x, y: 0.06, z: -yBack }, { x, y: 0.06, z: -(yBack + 0.32) }, mountStyle);
    }
  }

  // Glowing core / cockpit.
  if (design.hasCore) {
    const cy = L * 0.18;
    const r = design.width * 0.16;
    const core: V2[] = [
      { x: 0, y: cy + r * 1.6 },
      { x: r, y: cy },
      { x: 0, y: cy - r * 1.2 },
      { x: -r, y: cy },
    ].reverse();
    b.addGlowPolygon(core, 0.02 + body.apexHeight * 0.75, brighten(neon, 0.4), 0.95);
    b.addGlowDisc({ x: 0, y: cy }, 0.02 + body.apexHeight * 0.7, r * 3, neon, 0.35 * glow);
  }

  // Engines at the tail.
  const tailY = -L * 0.42;
  const spread = design.width * 0.32;
  const engineXs = design.engineCount === 1 ? [0] : design.engineCount === 2 ? [-spread, spread] : [-spread * 1.3, 0, spread * 1.3];
  for (const x of engineXs) {
    b.addGlowDisc({ x, y: tailY }, 0.1, 0.12, accent, 1, 10);
    b.addGlowDisc({ x, y: tailY - 0.05 }, 0.08, 0.36, neon, 0.55 * glow, 12);
  }

  return b;
}

/** Stable cache key for a design so identical designs share one mesh. */
export function designKey(design: AircraftDesign): string {
  return [
    design.body,
    design.wing,
    design.length.toFixed(3),
    design.width.toFixed(3),
    design.wingSpan.toFixed(3),
    design.wingChord.toFixed(3),
    design.wingSweep.toFixed(3),
    design.wingOffset.toFixed(3),
    design.engineCount,
    design.weaponMounts,
    design.hasCore ? 1 : 0,
    design.hasFins ? 1 : 0,
    design.color,
    design.accent,
    design.hullTint.toFixed(2),
    design.glow.toFixed(2),
  ].join('|');
}

