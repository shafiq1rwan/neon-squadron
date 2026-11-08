import Phaser from "phaser";

// Canyon shape for one planet, shared by the texture generator (Boot) and the game (where to put
// turrets, buildings and props). Every term uses an integer number of cycles over H, so the texture loops.

export const CANYON_H = 512; // texture height (world units); width is the playfield, 240
const TAU = Math.PI * 2;

export interface CanyonShape {
  xL(y: number): number; // left wall edge (plateau is x < xL)
  xR(y: number): number; // right wall edge (plateau is x > xR)
  xc(y: number): number; // river centre
  rw(y: number): number; // river half width
  ph: number[]; // extra phases for texture detail
}

export function canyonShape(seed: string): CanyonShape {
  const rnd = new Phaser.Math.RandomDataGenerator([seed]);
  const ph = Array.from({ length: 14 }, () => rnd.frac() * TAU);
  const wave = (y: number, k: number, p: number) => Math.sin((TAU * k * y) / CANYON_H + p);
  const xL = (y: number) => 40 + 13 * wave(y, 2, ph[0]) + 6 * wave(y, 5, ph[1]) + 2.5 * wave(y, 11, ph[2]);
  const xR = (y: number) => 200 - 13 * wave(y, 2, ph[3]) - 6 * wave(y, 4, ph[4]) - 2.5 * wave(y, 13, ph[5]);
  const xc = (y: number) => { const l = xL(y), r = xR(y); return (l + r) / 2 + (r - l) * 0.17 * wave(y, 3, ph[6]); };
  const rw = (y: number) => 6 + 2.5 * wave(y, 4, ph[7]);
  return { xL, xR, xc, rw, ph };
}

export type Ground = "floor" | "plateau" | "any";

/**
 * Pick an x on solid ground at texture row `ty`: on the canyon floor (away from walls and the river) or on a
 * plateau. Returns null if nothing fits (e.g. a narrow stretch).
 */
export function groundX(c: CanyonShape, ty: number, where: Ground, halfW: number, rand: () => number): number | null {
  const l = c.xL(ty), r = c.xR(ty), xc = c.xc(ty), rw = c.rw(ty);
  const spots: [number, number][] = [];
  if (where !== "plateau") {
    // floor left of the river, floor right of the river
    spots.push([l + 8 + halfW, xc - rw - 4 - halfW], [xc + rw + 4 + halfW, r - 6 - halfW]);
  }
  if (where !== "floor") spots.push([4 + halfW, l - 4 - halfW], [r + 4 + halfW, 236 - halfW]);
  const ok = spots.filter(([a, b]) => b - a >= 1);
  if (!ok.length) return null;
  const [a, b] = ok[Math.floor(rand() * ok.length)];
  return a + rand() * (b - a);
}
