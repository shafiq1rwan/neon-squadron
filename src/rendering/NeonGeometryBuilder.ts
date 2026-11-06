/**
 * Accumulates procedural neon geometry into two buffers:
 *  - solid: opaque faceted surfaces with lighting baked into vertex colours (no runtime lights);
 *  - glow:  additive line cores, soft halos and glowing discs (vertex alpha shapes the falloff).
 *
 * Lines are camera-facing ribbons instead of GL lines (WebGL line width is fixed at 1px).
 * Because the game camera never rotates, a single constant view direction is enough to
 * orient every ribbon. Geometry is built once and cached (see ProceduralMeshCache).
 */
import type { RGB } from '../ui/Theme';

export interface V2 {
  x: number;
  y: number;
}

export interface V3 {
  x: number;
  y: number;
  z: number;
}

export interface GeometryBuffers {
  positions: number[];
  colors: number[];
  indices: number[];
}

/** Gameplay-plane point (x, y) at height h → local mesh space (x, h, -y). */
export function planeToLocal(p: V2, h: number): V3 {
  return { x: p.x, y: h, z: -p.y };
}

const LIGHT_DIR = normalize({ x: -0.35, y: 0.85, z: 0.45 });

function sub(a: V3, b: V3): V3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function cross(a: V3, b: V3): V3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}

function dot(a: V3, b: V3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function normalize(a: V3): V3 {
  const len = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / len, y: a.y / len, z: a.z / len };
}

function lerp3(a: V3, b: V3, t: number): V3 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}

export interface LineStyle {
  color: RGB;
  /** Width of the bright core ribbon. */
  coreWidth: number;
  coreAlpha: number;
  /** Total width of the soft halo (0 disables). */
  haloWidth: number;
  haloAlpha: number;
}

export class NeonGeometryBuilder {
  readonly solid: GeometryBuffers = { positions: [], colors: [], indices: [] };
  readonly glow: GeometryBuffers = { positions: [], colors: [], indices: [] };

  /** Direction the camera looks along, used to orient ribbons towards it. */
  private readonly viewDir: V3;

  constructor(viewDir: V3) {
    this.viewDir = normalize(viewDir);
  }

  private pushVertex(buf: GeometryBuffers, p: V3, c: RGB, a: number): number {
    const index = buf.positions.length / 3;
    buf.positions.push(p.x, p.y, p.z);
    buf.colors.push(c.r, c.g, c.b, a);
    return index;
  }

  /** Flat-shaded triangle with baked lighting into the solid buffer. */
  addSolidTriangle(a: V3, b: V3, c: V3, color: RGB, ambient = 0.55, diffuse = 0.65): void {
    let n = normalize(cross(sub(b, a), sub(c, a)));
    if (n.y < 0) n = { x: -n.x, y: -n.y, z: -n.z }; // surfaces face up towards the camera
    const shade = ambient + diffuse * Math.max(0, dot(n, LIGHT_DIR));
    const shaded = { r: color.r * shade, g: color.g * shade, b: color.b * shade };
    const i0 = this.pushVertex(this.solid, a, shaded, 1);
    const i1 = this.pushVertex(this.solid, b, shaded, 1);
    const i2 = this.pushVertex(this.solid, c, shaded, 1);
    this.solid.indices.push(i0, i1, i2);
  }

  /**
   * Faceted low pyramid over a star-shaped polygon (gameplay-plane coordinates).
   * Each edge forms a triangle with a raised apex, giving a crisp angular look.
   */
  addFacetedPolygon(poly: readonly V2[], baseHeight: number, apexHeight: number, color: RGB, apex?: V2): void {
    const centre = apex ?? polygonCentroid(poly);
    const top = planeToLocal(centre, baseHeight + apexHeight);
    for (let i = 0; i < poly.length; i++) {
      const a = planeToLocal(poly[i] as V2, baseHeight);
      const b = planeToLocal(poly[(i + 1) % poly.length] as V2, baseHeight);
      this.addSolidTriangle(a, b, top, color);
    }
  }

  /** Axis-aligned faceted box (world-local coordinates), used for scenery. */
  addBox(min: V3, max: V3, color: RGB): void {
    const p = (x: number, y: number, z: number): V3 => ({ x, y, z });
    const [x0, y0, z0, x1, y1, z1] = [min.x, min.y, min.z, max.x, max.y, max.z];
    const quad = (a: V3, b: V3, c: V3, d: V3, ambient: number) => {
      this.addSolidTriangle(a, b, c, color, ambient, 0.5);
      this.addSolidTriangle(a, c, d, color, ambient, 0.5);
    };
    quad(p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1), 0.7); // top
    quad(p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1), 0.45); // front (+z)
    quad(p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1), p(x0, y1, z0), 0.35); // left
    quad(p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1), p(x1, y0, z1), 0.35); // right
  }

  /** Neon line between two local-space points: bright core plus optional soft halo. */
  addLine(a: V3, b: V3, style: LineStyle): void {
    const dir = normalize(sub(b, a));
    let side = cross(dir, this.viewDir);
    if (Math.hypot(side.x, side.y, side.z) < 1e-5) side = { x: 1, y: 0, z: 0 };
    side = normalize(side);

    // Extend the core slightly so corners join without gaps.
    const ext = style.coreWidth * 0.5;
    const a2 = { x: a.x - dir.x * ext, y: a.y - dir.y * ext, z: a.z - dir.z * ext };
    const b2 = { x: b.x + dir.x * ext, y: b.y + dir.y * ext, z: b.z + dir.z * ext };

    if (style.haloWidth > 0 && style.haloAlpha > 0) {
      this.addRibbon(a, b, side, style.haloWidth, style.color, style.haloAlpha, true);
    }
    const core = brighten(style.color, 0.45);
    this.addRibbon(a2, b2, side, style.coreWidth, core, style.coreAlpha, false);
  }

  /** Outline of a polygon in the gameplay plane at the given height. */
  addPolygonOutline(poly: readonly V2[], height: number, style: LineStyle): void {
    for (let i = 0; i < poly.length; i++) {
      this.addLine(
        planeToLocal(poly[i] as V2, height),
        planeToLocal(poly[(i + 1) % poly.length] as V2, height),
        style,
      );
    }
  }

  /** Radial glowing disc in the gameplay plane (centre alpha → transparent rim). */
  addGlowDisc(centre: V2, height: number, radius: number, color: RGB, alpha: number, segments = 12): void {
    const buf = this.glow;
    const c = this.pushVertex(buf, planeToLocal(centre, height), brighten(color, 0.6), alpha);
    const first = buf.positions.length / 3;
    for (let i = 0; i < segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      this.pushVertex(
        buf,
        planeToLocal({ x: centre.x + Math.cos(t) * radius, y: centre.y + Math.sin(t) * radius }, height),
        color,
        0,
      );
    }
    for (let i = 0; i < segments; i++) {
      buf.indices.push(c, first + i, first + ((i + 1) % segments));
    }
  }

  /** Filled additive polygon (e.g. a glowing core) with a uniform alpha. */
  addGlowPolygon(poly: readonly V2[], height: number, color: RGB, alpha: number): void {
    const buf = this.glow;
    const centre = polygonCentroid(poly);
    const c = this.pushVertex(buf, planeToLocal(centre, height), brighten(color, 0.6), alpha);
    const first = buf.positions.length / 3;
    for (const p of poly) this.pushVertex(buf, planeToLocal(p, height), color, alpha * 0.85);
    for (let i = 0; i < poly.length; i++) {
      buf.indices.push(c, first + i, first + ((i + 1) % poly.length));
    }
  }

  private addRibbon(a: V3, b: V3, side: V3, width: number, color: RGB, alpha: number, soft: boolean): void {
    const buf = this.glow;
    const h = width * 0.5;
    const off = { x: side.x * h, y: side.y * h, z: side.z * h };
    if (!soft) {
      const i0 = this.pushVertex(buf, { x: a.x - off.x, y: a.y - off.y, z: a.z - off.z }, color, alpha);
      const i1 = this.pushVertex(buf, { x: a.x + off.x, y: a.y + off.y, z: a.z + off.z }, color, alpha);
      const i2 = this.pushVertex(buf, { x: b.x + off.x, y: b.y + off.y, z: b.z + off.z }, color, alpha);
      const i3 = this.pushVertex(buf, { x: b.x - off.x, y: b.y - off.y, z: b.z - off.z }, color, alpha);
      buf.indices.push(i0, i1, i2, i0, i2, i3);
      return;
    }
    // Three rows: transparent edge, opaque centre, transparent edge.
    const rows: Array<[V3, V3, number]> = [
      [sub(a, off), sub(b, off), 0],
      [a, b, alpha],
      [{ x: a.x + off.x, y: a.y + off.y, z: a.z + off.z }, { x: b.x + off.x, y: b.y + off.y, z: b.z + off.z }, 0],
    ];
    const ids = rows.map(([pa, pb, al]) => [
      this.pushVertex(buf, pa, color, al),
      this.pushVertex(buf, pb, color, al),
    ]);
    for (let r = 0; r < 2; r++) {
      const [a0, b0] = ids[r] as number[];
      const [a1, b1] = ids[r + 1] as number[];
      buf.indices.push(a0!, a1!, b1!, a0!, b1!, b0!);
    }
  }

  /** Utility for simple mid-points when building details. */
  static midpoint(a: V3, b: V3, t = 0.5): V3 {
    return lerp3(a, b, t);
  }
}

export function polygonCentroid(poly: readonly V2[]): V2 {
  let x = 0;
  let y = 0;
  for (const p of poly) {
    x += p.x;
    y += p.y;
  }
  return { x: x / poly.length, y: y / poly.length };
}

export function brighten(c: RGB, amount: number): RGB {
  return { r: c.r + (1 - c.r) * amount, g: c.g + (1 - c.g) * amount, b: c.b + (1 - c.b) * amount };
}

export function scaleRgb(c: RGB, s: number): RGB {
  return { r: c.r * s, g: c.g * s, b: c.b * s };
}

/** Mirror a right-side polygon across the centre line (keeps winding consistent). */
export function mirrorX(poly: readonly V2[]): V2[] {
  return poly.map((p) => ({ x: -p.x, y: p.y })).reverse();
}
