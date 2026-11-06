/**
 * Deterministic pseudo-random generation.
 *
 * Uses the sfc32 generator seeded through a cyrb128 string hash. A run owns one root seed;
 * independent subsystems fork named child streams so, for example, cosmetic randomness
 * never shifts the enemy or upgrade sequences.
 */

/** cyrb128 string hash -> four 32-bit words. */
export function hashString128(input: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < input.length; i++) {
    const k = input.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

export class SeededRandom {
  readonly seed: string;
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(seed: string | number) {
    this.seed = String(seed);
    [this.a, this.b, this.c, this.d] = hashString128(this.seed);
    // Warm up so similar seeds diverge quickly.
    for (let i = 0; i < 12; i++) this.nextUint32();
  }

  /** Raw 32-bit unsigned output (sfc32). */
  nextUint32(): number {
    this.a >>>= 0;
    this.b >>>= 0;
    this.c >>>= 0;
    this.d >>>= 0;
    let t = (this.a + this.b) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.d = (this.d + 1) | 0;
    t = (t + this.d) | 0;
    this.c = (this.c + t) | 0;
    return t >>> 0;
  }

  /** Float in [0, 1). */
  next(): number {
    return this.nextUint32() / 4294967296;
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    if (max < min) throw new Error(`int(): max (${max}) < min (${min})`);
    return min + Math.floor(this.next() * (max - min + 1));
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  sign(): 1 | -1 {
    return this.next() < 0.5 ? -1 : 1;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('pick() from empty array');
    return items[Math.floor(this.next() * items.length)] as T;
  }

  /** Picks an index using non-negative weights. Returns -1 if all weights are zero. */
  weightedIndex(weights: readonly number[]): number {
    let total = 0;
    for (const w of weights) total += Math.max(0, w);
    if (total <= 0) return -1;
    let roll = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      roll -= Math.max(0, weights[i] as number);
      if (roll < 0) return i;
    }
    return weights.length - 1;
  }

  /** In-place Fisher-Yates shuffle. */
  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = items[i] as T;
      items[i] = items[j] as T;
      items[j] = tmp;
    }
    return items;
  }

  /**
   * Creates an independent child stream. The child depends only on this stream's
   * seed and the label, never on how many numbers have been drawn from the parent.
   */
  fork(label: string): SeededRandom {
    return new SeededRandom(`${this.seed}/${label}`);
  }
}

/** Named streams owned by a run. Cosmetic must never feed gameplay decisions. */
export interface RunRandomStreams {
  environment: SeededRandom;
  enemy: SeededRandom;
  wave: SeededRandom;
  upgrade: SeededRandom;
  cosmetic: SeededRandom;
}

export function createRunStreams(runSeed: string): RunRandomStreams {
  const root = new SeededRandom(runSeed);
  return {
    environment: root.fork('environment'),
    enemy: root.fork('enemy'),
    wave: root.fork('wave'),
    upgrade: root.fork('upgrade'),
    cosmetic: root.fork('cosmetic'),
  };
}

/** Generates a short human-readable seed for new runs. */
export function generateRunSeed(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const bytes = new Uint32Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 4294967296);
  }
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}
