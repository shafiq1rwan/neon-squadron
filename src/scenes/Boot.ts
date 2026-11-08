import Phaser from "phaser";
import FX from "../data/fx-manifest.json";
import { PLANETS, CanyonPalette } from "../data/planets";
import { Art, ATLASES } from "../art";
import { canyonShape, CANYON_H } from "../canyon";
import { Poki } from "../poki";

type FxMeta = { frameWidth: number; frameHeight: number; frames: number; fps: number; loop: boolean };
const FX_SHEETS = FX as Record<string, FxMeta>;
const TAU = Math.PI * 2;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x: number, y: number) => (BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16;

/**
 * Loads the atlases (pxl) and effect sheets (pixelfx), then generates at runtime:
 * - one tileable canyon texture per planet ("canyon_0".."canyon_2") and its drifting dust ("dust_N"),
 * - rolled ship frames for banking ("bank" texture: "player@1", "player@2", "att_cannon_1@1", ...).
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, 404, 22).setStrokeStyle(3, 0x4f56a8);
    const bar = this.add.rectangle(width / 2 - 198, height / 2, 0, 12, 0x2df4ff).setOrigin(0, 0.5);
    this.load.on("progress", (p: number) => (bar.width = 396 * p));

    for (const key of ATLASES) this.load.atlas(key, `assets/${key}.png`, `assets/${key}.json`);
    for (const [key, m] of Object.entries(FX_SHEETS))
      this.load.spritesheet(key, `assets/fx/${key}.png`, { frameWidth: m.frameWidth, frameHeight: m.frameHeight });
  }

  create() {
    for (const [key, m] of Object.entries(FX_SHEETS))
      this.anims.create({ key, frames: this.anims.generateFrameNumbers(key, { start: 0, end: m.frames - 1 }), frameRate: m.fps, repeat: m.loop ? -1 : 0 });
    // hand-drawn pxl animations in the main atlas (frames "<name>_0".."<name>_n")
    for (const [key, fps] of [["fx_launch", 20], ["fx_hatch", 16], ["paladin_morph", 18]] as const) {
      const n = this.textures.get("atlas").getFrameNames().filter((f) => f.startsWith(key + "_")).length;
      this.anims.create({ key, frames: this.anims.generateFrameNames("atlas", { prefix: key + "_", start: 0, end: n - 1 }), frameRate: fps, repeat: 0 });
    }

    PLANETS.forEach((p) => {
      this.makeCanyon(`canyon_${p.index}`, p.canyon, p.name);
      this.makeDust(`dust_${p.index}`, p.canyon.dust, p.name, p.index);
    });
    this.makeBankFrames();
    Art.index(this.textures);

    Poki.loadingFinished();
    this.scene.start("game");
    this.scene.launch("hud");
  }

  // ------------------------------------------------------------------ banking

  /** Fake a roll: compress the right half (and darken it), keep the left half lit. Flip for left. */
  private makeBankFrames() {
    const atlas = this.textures.get("atlas");
    const names = ["flame", ...atlas.getFrameNames().filter((n) => n.startsWith("att_") || n.startsWith("ship_") || n.startsWith("mech_"))];
    const tmp = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
    const items = names.map((name) => {
      const f = atlas.get(name);
      tmp.canvas.width = f.cutWidth;
      tmp.canvas.height = f.cutHeight;
      tmp.clearRect(0, 0, f.cutWidth, f.cutHeight);
      tmp.drawImage(f.source.image as CanvasImageSource, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, f.cutWidth, f.cutHeight);
      return { name, data: tmp.getImageData(0, 0, f.cutWidth, f.cutHeight) };
    });
    // shelf-pack into rows no wider than 1024 px (keeps the texture well under GPU size limits)
    const ROW = 1024, cellH = Math.max(...items.map((it) => it.data.height)) + 2;
    const slots: { it: (typeof items)[number]; level: number; x: number; y: number }[] = [];
    let x = 0, y = 0;
    for (const it of items)
      for (const level of [1, 2]) {
        if (x + it.data.width > ROW) { x = 0; y += cellH; }
        slots.push({ it, level, x, y });
        x += it.data.width + 2;
      }
    const tex = this.textures.createCanvas("bank", ROW, y + cellH)!;
    const ctx = tex.getContext();
    for (const s of slots) {
      ctx.putImageData(roll(s.it.data, s.level === 1 ? 0.5 : 1), s.x, s.y);
      tex.add(`${s.it.name}@${s.level}`, 0, s.x, s.y, s.it.data.width, s.it.data.height);
    }
    tex.refresh();
  }

  // ------------------------------------------------------------------ canyon

  private makeCanyon(key: string, P: CanyonPalette, seed: string) {
    const W = 240, H = CANYON_H;
    const shape = canyonShape(seed); // shared with the game, which places ground objects on it
    const { xL, xR, xc, rw, ph } = shape;
    const rnd = new Phaser.Math.RandomDataGenerator([seed + "detail"]);
    const wave = (y: number, k: number, p: number) => Math.sin((TAU * k * y) / H + p); // integer k: loops every H

    const img = new ImageData(W, H);
    const put = (x: number, y: number, c: number) => {
      x = Math.round(x);
      y = ((Math.round(y) % H) + H) % H;
      if (x < 0 || x >= W) return;
      const o = (y * W + x) * 4;
      img.data[o] = (c >> 16) & 255; img.data[o + 1] = (c >> 8) & 255; img.data[o + 2] = c & 255; img.data[o + 3] = 255;
    };
    const pick = (ramp: number[], v: number, x: number, y: number) =>
      ramp[Phaser.Math.Clamp(Math.floor(v * (ramp.length - 1) + bayer(x, y)), 0, ramp.length - 1)];

    for (let y = 0; y < H; y++) {
      const l = xL(y), r = xR(y), c0 = xc(y), w = rw(y);
      for (let x = 0; x < W; x++) {
        let c: number;
        if (x < l || x > r) {
          // plateau: wavy strata bands, a lit rim along the edge
          const edge = x < l ? l - x : x - r;
          if (edge < 1.5) c = P.rim;
          else {
            const strata = Math.sin((y + 5 * Math.sin(x * 0.09 + ph[8])) * 0.4);
            const v = 0.45 + 0.3 * strata + 0.15 * Math.sin(x * 0.05 + wave(y, 3, ph[9]) * 2) - Math.min(0.25, edge / 120);
            c = pick(P.plateau, v, x, y);
          }
        } else {
          const fromL = x - l, fromR = r - x;
          const stri = (Math.floor(x) + (wave(y, 23, ph[10]) > 0.3 ? 1 : 0)) & 1;
          if (fromL < 5) c = pick(P.faceDark, 0.25 + 0.5 * stri * (fromL / 5), x, y); // left cliff face, in shadow
          else if (fromR < 4) c = pick(P.faceLit, 0.3 + 0.5 * stri, x, y); // right cliff face, lit
          else {
            const n = 0.5 * Math.sin(x * 0.11 + wave(y, 3, ph[11]) * 2.5) + 0.5 * Math.sin(x * 0.047 + wave(y, 5, ph[12]) * 2);
            let v = 0.55 + 0.28 * n;
            if (fromL < 15) v -= ((15 - fromL) / 10) * 0.55; // shadow cast by the left wall
            if (fromR < 7) v -= ((7 - fromR) / 7) * 0.25;
            c = pick(P.floor, v, x, y);
            const dr = Math.abs(x - c0);
            if (dr < w) {
              const t = dr / w;
              const flow = 0.12 * Math.sin(y * 0.5 + x * 0.3); // ripples
              c = t < 0.28 ? pick(P.river.slice(2), 0.6 - t + flow, x, y) : t < 0.7 ? pick(P.river.slice(1, 3), 0.9 - t + flow, x, y) : pick(P.river.slice(0, 2), 1.1 - t, x, y);
            } else if (dr < w + 1.6) c = P.crust;
          }
        }
        put(x, y, c);
      }
    }

    const onFloor = (x: number, y: number, margin: number) => x > xL(y) + 7 + margin && x < xR(y) - 5 - margin && Math.abs(x - xc(y)) > rw(y) + 3 + margin;

    // craters
    for (let i = 0; i < 7; i++) {
      const y = rnd.between(0, H - 1), x = rnd.between(30, W - 30), r = rnd.between(4, 8);
      if (!onFloor(x, y, r)) continue;
      for (let a = 0; a < TAU; a += 0.05) {
        put(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8, Math.cos(a - 0.8) > 0.3 ? P.rock[2] : P.rock[0]);
        put(x + Math.cos(a) * (r - 1), y + Math.sin(a) * (r - 1) * 0.8, P.floor[0]);
      }
    }
    // boulders on the floor and plateaus: drop shadow, lit top-left
    for (let i = 0; i < 70; i++) {
      const y = rnd.between(0, H - 1), x = rnd.between(2, W - 3), r = rnd.realInRange(1.2, 3.6);
      const plateau = x < xL(y) - 3 || x > xR(y) + 3;
      if (!plateau && !onFloor(x, y, r)) continue;
      for (let dy = -4; dy <= 4; dy++)
        for (let dx = -4; dx <= 4; dx++) {
          if (dx * dx + dy * dy > r * r) continue;
          put(x + dx + 1, y + dy + 1, P.rock[0]);
        }
      for (let dy = -4; dy <= 4; dy++)
        for (let dx = -4; dx <= 4; dx++) {
          if (dx * dx + dy * dy > r * r) continue;
          const lit = (dx + dy) / r;
          put(x + dx, y + dy, lit < -0.5 ? P.rock[2] : lit > 0.55 ? P.rock[0] : P.rock[1]);
        }
    }
    // cracks
    for (let i = 0; i < 14; i++) {
      let x = rnd.between(4, W - 4), y = rnd.between(0, H - 1), a = rnd.realInRange(0, TAU);
      const steps = rnd.between(10, 28);
      for (let s = 0; s < steps; s++) {
        put(x, y, P.crust);
        a += rnd.realInRange(-0.6, 0.6);
        x += Math.cos(a);
        y += Math.sin(a);
      }
    }

    const tex = this.textures.createCanvas(key, W, H)!;
    tex.getContext().putImageData(img, 0, 0);
    tex.refresh();
  }

  /** Sparse drifting particles: embers (planet 1), snow (2), spores (3). */
  private makeDust(key: string, colors: number[], seed: string, kind: number) {
    const W = 240, H = 256;
    const rnd = new Phaser.Math.RandomDataGenerator([seed + "dust"]);
    const g = this.make.graphics({}, false);
    const n = kind === 1 ? 70 : 40;
    for (let i = 0; i < n; i++) {
      const big = rnd.frac() < (kind === 2 ? 0.25 : 0.15);
      g.fillStyle(rnd.pick(colors), rnd.realInRange(0.5, 1));
      const x = rnd.between(0, W - 2), y = rnd.between(0, H - 2);
      g.fillRect(x, y, big ? 2 : 1, big ? 2 : 1);
      if (kind === 0 && big) g.fillStyle(colors[0], 0.5).fillRect(x, y + 2, 1, 2); // ember trail
    }
    g.generateTexture(key, W, H);
    g.destroy();
  }
}

/** Horizontal roll: left half shifted and brightened, right half compressed and darkened. */
function roll(src: ImageData, a: number): ImageData {
  const w = src.width, h = src.height, out = new ImageData(w, h);
  const cx = w / 2, s = 1 - 0.38 * a, d = (cx * (1 - s)) / 2;
  for (let x = 0; x < w; x++) {
    const ox = x + 0.5;
    const right = ox >= cx + d;
    const sx = Math.floor(right ? cx + (ox - cx - d) / s : ox - d);
    if (sx < 0 || sx >= w) continue;
    const k = right ? 1 - 0.3 * a : 1 + 0.1 * a;
    for (let y = 0; y < h; y++) {
      const i = (y * w + sx) * 4, o = (y * w + x) * 4;
      out.data[o] = Math.min(255, src.data[i] * k);
      out.data[o + 1] = Math.min(255, src.data[i + 1] * k);
      out.data[o + 2] = Math.min(255, src.data[i + 2] * k);
      out.data[o + 3] = src.data[i + 3];
    }
  }
  return out;
}
