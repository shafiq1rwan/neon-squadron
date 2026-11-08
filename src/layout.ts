// Screen layout. The playfield is always 240 world units wide, drawn at 3x (ZOOM): sprites are big
// and chunky while UI text (screen units) stays crisp.
// - Tall screens (phones in portrait): playfield fills the screen, it just gets taller.
// - Wide screens (desktop 16:9): playfield 240x426 in the centre, side panels left and right.

export const PLAY_W = 240;
export const ZOOM = 3;
const PF = PLAY_W * ZOOM; // playfield width in screen units

export interface Layout {
  width: number; // game canvas size (screen units)
  height: number;
  playX: number; // playfield rectangle on screen
  playW: number;
  worldH: number; // playfield height in world units
  panels: boolean; // room for side panels
}

const even = (n: number) => Math.round(n / 2) * 2;
const whole = (n: number) => Math.round(n / ZOOM) * ZOOM; // keeps worldH an integer

export function computeLayout(vw: number, vh: number): Layout {
  const aspect = Math.max(0.3, vw / Math.max(1, vh));
  if (aspect <= 9 / 16) {
    // portrait phone: widen nothing, grow taller (cap so tiny-width windows stay sane)
    const height = whole(Math.min(PF / aspect, PF * 2.3));
    return { width: PF, height, playX: 0, playW: PF, worldH: height / ZOOM, panels: false };
  }
  const height = 1278;
  const width = Math.max(PF, even(Math.min(aspect, 2.4) * height));
  const playX = even((width - PF) / 2);
  return { width, height, playX, playW: PF, worldH: height / ZOOM, panels: playX >= 300 };
}

let current: Layout = computeLayout(window.innerWidth, window.innerHeight);

export const Layouts = {
  get current(): Layout {
    return current;
  },
  set(l: Layout) {
    current = l;
  },
};
