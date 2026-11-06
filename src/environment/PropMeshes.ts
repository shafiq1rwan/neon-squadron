/**
 * Low-poly neon scenery props. Built once per (type, colourway) and cached.
 * All props stay below the gameplay plane (max height < floorDepth) so they can never
 * cover aircraft or projectiles.
 */
import { CameraManager } from '../rendering/CameraManager';
import { NeonGeometryBuilder, type LineStyle, type V3 } from '../rendering/NeonGeometryBuilder';
import type { PropType } from '../procedural/EnvironmentGenerator';
import { hexToRgb, mixRgb, Palette } from '../ui/Theme';

export function buildPropGeometry(type: PropType, accent: boolean): NeonGeometryBuilder {
  const b = new NeonGeometryBuilder(CameraManager.viewDirection());
  const bg = hexToRgb(Palette.bgSecondary);
  const neonBase = hexToRgb(accent ? Palette.wingman : Palette.player);
  const neon = mixRgb(bg, neonBase, accent ? 0.75 : 0.6);
  const hull = mixRgb(bg, neonBase, 0.1);
  const line: LineStyle = { color: neon, coreWidth: 0.05, coreAlpha: 0.85, haloWidth: 0.3, haloAlpha: 0.18 };
  const thin: LineStyle = { ...line, coreWidth: 0.03, coreAlpha: 0.55, haloWidth: 0 };

  const boxEdges = (x0: number, z0: number, x1: number, z1: number, h: number, style: LineStyle) => {
    const top: V3[] = [
      { x: x0, y: h, z: z0 },
      { x: x1, y: h, z: z0 },
      { x: x1, y: h, z: z1 },
      { x: x0, y: h, z: z1 },
    ];
    for (let i = 0; i < 4; i++) b.addLine(top[i]!, top[(i + 1) % 4]!, style);
    // Vertical edges facing the camera.
    b.addLine({ x: x0, y: 0, z: z1 }, { x: x0, y: h, z: z1 }, style);
    b.addLine({ x: x1, y: 0, z: z1 }, { x: x1, y: h, z: z1 }, style);
  };

  switch (type) {
    case 'pillar': {
      const w = 0.45;
      const h = 2.0;
      b.addBox({ x: -w, y: 0, z: -w }, { x: w, y: h, z: w }, hull);
      boxEdges(-w, -w, w, w, h, line);
      b.addLine({ x: -w, y: h * 0.55, z: w }, { x: w, y: h * 0.55, z: w }, thin);
      break;
    }
    case 'tower': {
      const w = 0.3;
      const h = 2.6;
      b.addBox({ x: -w, y: 0, z: -w }, { x: w, y: h, z: w }, hull);
      boxEdges(-w, -w, w, w, h, line);
      b.addGlowDisc({ x: 0, y: 0 }, h + 0.05, 0.9, neonBase, 0.45);
      break;
    }
    case 'pyramid': {
      const w = 1.1;
      const h = 1.4;
      const apex = { x: 0, y: h, z: 0 };
      const base: V3[] = [
        { x: -w, y: 0, z: -w },
        { x: w, y: 0, z: -w },
        { x: w, y: 0, z: w },
        { x: -w, y: 0, z: w },
      ];
      for (let i = 0; i < 4; i++) {
        b.addSolidTriangle(base[i]!, base[(i + 1) % 4]!, apex, hull, 0.4, 0.6);
        b.addLine(base[i]!, apex, line);
        b.addLine(base[i]!, base[(i + 1) % 4]!, thin);
      }
      break;
    }
    case 'pad': {
      const r = 1.3;
      const sq = (s: number, style: LineStyle) => {
        const pts: V3[] = [
          { x: -s, y: 0.02, z: -s },
          { x: s, y: 0.02, z: -s },
          { x: s, y: 0.02, z: s },
          { x: -s, y: 0.02, z: s },
        ];
        for (let i = 0; i < 4; i++) b.addLine(pts[i]!, pts[(i + 1) % 4]!, style);
      };
      sq(r, line);
      sq(r * 0.55, thin);
      b.addGlowDisc({ x: 0, y: 0 }, 0.03, r * 0.5, neonBase, 0.25);
      break;
    }
    case 'arch': {
      const span = 1.4;
      const h = 2.4;
      const w = 0.16;
      for (const s of [-1, 1]) {
        b.addBox({ x: s * span - w, y: 0, z: -w }, { x: s * span + w, y: h, z: w }, hull);
        b.addLine({ x: s * span, y: 0, z: w }, { x: s * span, y: h, z: w }, line);
      }
      b.addBox({ x: -span - w, y: h - 0.2, z: -w }, { x: span + w, y: h, z: w }, hull);
      b.addLine({ x: -span, y: h, z: w }, { x: span, y: h, z: w }, line);
      break;
    }
  }
  return b;
}
