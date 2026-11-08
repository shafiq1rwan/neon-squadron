// Tiny synthesized sound effects (WebAudio). No audio files, so nothing to download.
// The context is created on the first user gesture, as browsers require.

type Wave = OscillatorType;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let adMuted = false;
const last: Record<string, number> = {};

function applyGain() {
  if (master && ctx) master.gain.setTargetAtTime(muted || adMuted ? 0 : 0.32, ctx.currentTime, 0.01);
}

function tone(wave: Wave, f0: number, f1: number, dur: number, vol: number, delay = 0) {
  if (!ctx || !master) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = wave;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

let noiseBuf: AudioBuffer | null = null;
function noise(dur: number, vol: number, cut0: number, cut1: number) {
  if (!ctx || !master) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = noiseBuf;
  f.type = "lowpass";
  f.frequency.setValueAtTime(cut0, t);
  f.frequency.exponentialRampToValueAtTime(cut1, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
  src.stop(t + dur);
}

/** Minimum seconds between two plays of the same sound, so rapid fire doesn't turn into noise. */
const GAP: Record<string, number> = { shoot: 0.07, hit: 0.045, pickup: 0.035, boom: 0.05, laser: 0.5, seeker: 0.15 };

const SOUNDS: Record<string, () => void> = {
  shoot: () => tone("square", 900, 420, 0.05, 0.035),
  seeker: () => tone("sawtooth", 300, 900, 0.12, 0.03),
  laser: () => { tone("sawtooth", 180, 90, 0.5, 0.05); tone("square", 1200, 600, 0.3, 0.02); },
  hit: () => tone("triangle", 260, 140, 0.04, 0.06),
  boom: () => { noise(0.35, 0.22, 2400, 120); tone("sine", 120, 40, 0.3, 0.12); },
  bigboom: () => { noise(0.9, 0.35, 3000, 60); tone("sine", 90, 30, 0.8, 0.25); },
  pickup: () => tone("sine", 700 + Math.random() * 120, 1400, 0.06, 0.05),
  heal: () => { tone("sine", 520, 1040, 0.12, 0.08); tone("sine", 780, 1560, 0.12, 0.06, 0.08); },
  levelup: () => [523, 659, 784, 1047].forEach((f, i) => tone("square", f, f, 0.1, 0.05, i * 0.07)),
  pick: () => { tone("square", 660, 990, 0.08, 0.05); tone("square", 990, 1320, 0.08, 0.04, 0.06); },
  hurt: () => { tone("sawtooth", 220, 50, 0.3, 0.12); noise(0.2, 0.15, 1500, 200); },
  // transform: servo whine up plus mechanical clunks
  transform: () => { tone("square", 180, 720, 0.3, 0.05); [0, 0.1, 0.2].forEach((d) => tone("square", 90, 60, 0.05, 0.08, d)); noise(0.12, 0.08, 3000, 400); },
  zap: () => { noise(0.25, 0.25, 9000, 600); tone("sawtooth", 1800, 120, 0.22, 0.08); },
  shieldup: () => { tone("sine", 400, 1200, 0.18, 0.08); tone("triangle", 800, 1600, 0.2, 0.05, 0.06); },
  shield: () => { tone("triangle", 1400, 500, 0.12, 0.09); noise(0.08, 0.08, 4000, 800); },
  shieldbreak: () => { tone("triangle", 1200, 150, 0.35, 0.1); noise(0.3, 0.14, 5000, 300); },
  warn: () => [0, 0.32, 0.64].forEach((d) => tone("square", 440, 330, 0.24, 0.07, d)),
  click: () => tone("square", 520, 520, 0.03, 0.04),
};

export const Sfx = {
  /** Call from a user gesture (pointerdown / keydown). */
  unlock(): void {
    if (!ctx) {
      try {
        ctx = new AudioContext();
        master = ctx.createGain();
        master.connect(ctx.destination);
        applyGain();
      } catch {
        ctx = null;
        return;
      }
    }
    if (ctx.state === "suspended") void ctx.resume();
  },

  play(name: keyof typeof SOUNDS | string): void {
    if (!ctx || muted || adMuted) return;
    const now = ctx.currentTime;
    const gap = GAP[name] ?? 0.02;
    if (now - (last[name] ?? -1) < gap) return;
    last[name] = now;
    SOUNDS[name]?.();
  },

  setMuted(m: boolean): void { muted = m; applyGain(); },
  get muted(): boolean { return muted; },
  /** Poki: mute everything while an ad plays. */
  setAdMuted(m: boolean): void { adMuted = m; applyGain(); },
  suspend(): void { if (ctx && ctx.state === "running") void ctx.suspend(); },
  resume(): void { if (ctx && ctx.state === "suspended") void ctx.resume(); },
};
