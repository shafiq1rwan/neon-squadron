// Planets, their enemies and bosses, and the 15-wave stage script.
// World units: the playfield is 240 wide (see layout.ts).

export type Role = "swarm" | "chaser" | "gunner" | "heavy" | "elite" | "boss" | "missile" | "turret" | "structure" | "mine";
/** Roles fixed to the scrolling ground: they move with the canyon, never ram, and don't hold up a wave. */
export const GROUND_ROLES: Role[] = ["turret", "structure"];

export interface Fire {
  kind: "aimed" | "fan" | "wavy" | "ring" | "split";
  n: number;
  spread?: number; // radians between bullets (aimed/fan/wavy)
  speed: number;
  every: number; // seconds
}

export interface EnemyDef {
  id: string;
  frame: string;
  role: Role;
  hp: number;
  radius: number;
  speed: number;
  xp: number; // xp dropped (big crystals are worth 5)
  score: number;
  contact: number; // damage when it rams the player
  boomScale: number;
  scale?: number;
  tint?: number;
  rams?: boolean; // dies when it hits the player
  zigzag?: boolean; // swarm variant: zig-zags instead of weaving
  fire?: Fire;
  onDeath?: { spawn: string; n: number };
  head?: string; // turret: rotating gun sprite drawn over the base
  loot?: boolean; // structure: drops a random pickup
  blast?: { radius: number; dmg: number }; // explodes, damaging nearby enemies (fuel tanks, mines)
}

const E = (d: EnemyDef) => d;

export const ENEMIES: Record<string, EnemyDef> = {
  // ---- planet 1: KARR-7, magenta war-mechs
  drone: E({ id: "drone", frame: "drone", role: "swarm", hp: 3, radius: 8, speed: 38, xp: 1, score: 10, contact: 12, boomScale: 0.7, rams: true }),
  dart: E({ id: "dart", frame: "dart", role: "chaser", hp: 2, radius: 7, speed: 75, xp: 1, score: 15, contact: 12, boomScale: 0.6, rams: true }),
  gunner: E({ id: "gunner", frame: "gunner", role: "gunner", hp: 12, radius: 10, speed: 48, xp: 3, score: 40, contact: 15, boomScale: 0.85,
    fire: { kind: "aimed", n: 3, spread: 0.22, speed: 80, every: 1.6 } }),
  tank: E({ id: "tank", frame: "tank", role: "heavy", hp: 45, radius: 13, speed: 16, xp: 8, score: 100, contact: 20, boomScale: 1.1,
    fire: { kind: "ring", n: 8, speed: 50, every: 3.4 } }),
  boss_warden: E({ id: "boss_warden", frame: "boss_warden", role: "boss", hp: 1500, radius: 24, speed: 30, xp: 0, score: 5000, contact: 30, boomScale: 1.5 }),
  missile: E({ id: "missile", frame: "emissile", role: "missile", hp: 2, radius: 4, speed: 52, xp: 0, score: 5, contact: 12, boomScale: 0.4, rams: true }),

  // ---- planet 2: VELA, cryo-mechs
  shard: E({ id: "shard", frame: "shard", role: "swarm", hp: 4, radius: 8, speed: 42, xp: 1, score: 12, contact: 12, boomScale: 0.7, rams: true, zigzag: true }),
  spike: E({ id: "spike", frame: "spike", role: "chaser", hp: 3, radius: 6, speed: 90, xp: 1, score: 18, contact: 14, boomScale: 0.6, rams: true }),
  prism: E({ id: "prism", frame: "prism", role: "gunner", hp: 16, radius: 10, speed: 48, xp: 3, score: 45, contact: 15, boomScale: 0.85,
    fire: { kind: "fan", n: 5, spread: 0.2, speed: 68, every: 2.0 } }),
  golem: E({ id: "golem", frame: "golem", role: "heavy", hp: 60, radius: 13, speed: 15, xp: 8, score: 110, contact: 22, boomScale: 1.1,
    fire: { kind: "split", n: 4, speed: 48, every: 3.6 } }),
  boss_rimejaw: E({ id: "boss_rimejaw", frame: "boss_rimejaw", role: "boss", hp: 2200, radius: 24, speed: 30, xp: 0, score: 7000, contact: 30, boomScale: 1.5 }),

  // ---- planet 3: NOXA, bio-insects
  mite: E({ id: "mite", frame: "mite", role: "swarm", hp: 3, radius: 7, speed: 50, xp: 1, score: 12, contact: 12, boomScale: 0.6, rams: true }),
  wasp: E({ id: "wasp", frame: "wasp", role: "chaser", hp: 4, radius: 7, speed: 85, xp: 1, score: 20, contact: 14, boomScale: 0.6, rams: true }),
  spitter: E({ id: "spitter", frame: "spitter", role: "gunner", hp: 20, radius: 10, speed: 48, xp: 3, score: 50, contact: 15, boomScale: 0.85,
    fire: { kind: "wavy", n: 3, spread: 0.3, speed: 70, every: 1.8 } }),
  carapace: E({ id: "carapace", frame: "carapace", role: "heavy", hp: 75, radius: 13, speed: 15, xp: 8, score: 120, contact: 22, boomScale: 1.1,
    fire: { kind: "ring", n: 10, speed: 48, every: 3.2 }, onDeath: { spawn: "mite", n: 2 } }),
  // ---- ground turrets (one per planet): a fixed base and a gun that tracks the player
  turret_1: E({ id: "turret_1", frame: "turret_1_base", head: "turret_1_gun", role: "turret", hp: 10, radius: 8, speed: 0, xp: 3, score: 50,
    contact: 0, boomScale: 0.8, fire: { kind: "aimed", n: 1, speed: 85, every: 2.0 } }),
  turret_2: E({ id: "turret_2", frame: "turret_2_base", head: "turret_2_gun", role: "turret", hp: 13, radius: 8, speed: 0, xp: 3, score: 55,
    contact: 0, boomScale: 0.8, fire: { kind: "aimed", n: 2, spread: 0.16, speed: 75, every: 2.4 } }),
  turret_3: E({ id: "turret_3", frame: "turret_3_base", head: "turret_3_gun", role: "turret", hp: 15, radius: 8, speed: 0, xp: 3, score: 60,
    contact: 0, boomScale: 0.8, fire: { kind: "wavy", n: 1, speed: 70, every: 1.8 } }),

  // ---- planet 4: THALOS, Arc Constructs (storm robots with yellow electric cores)
  spark: E({ id: "spark", frame: "spark", role: "swarm", hp: 4, radius: 8, speed: 44, xp: 1, score: 14, contact: 12, boomScale: 0.7, rams: true, zigzag: true }),
  bolt: E({ id: "bolt", frame: "bolt", role: "chaser", hp: 3, radius: 6, speed: 95, xp: 1, score: 20, contact: 14, boomScale: 0.6, rams: true }),
  coil: E({ id: "coil", frame: "coil", role: "gunner", hp: 20, radius: 10, speed: 48, xp: 3, score: 55, contact: 15, boomScale: 0.85,
    fire: { kind: "aimed", n: 3, spread: 0.16, speed: 92, every: 1.7 } }),
  dynamo: E({ id: "dynamo", frame: "dynamo", role: "heavy", hp: 80, radius: 13, speed: 15, xp: 8, score: 130, contact: 22, boomScale: 1.1,
    fire: { kind: "ring", n: 12, speed: 52, every: 3.0 } }),
  turret_4: E({ id: "turret_4", frame: "turret_4_base", head: "turret_4_gun", role: "turret", hp: 17, radius: 8, speed: 0, xp: 3, score: 65,
    contact: 0, boomScale: 0.8, fire: { kind: "aimed", n: 3, spread: 0.1, speed: 82, every: 2.6 } }),
  boss_tempest: E({ id: "boss_tempest", frame: "boss_tempest", role: "boss", hp: 2400, radius: 24, speed: 30, xp: 0, score: 11000, contact: 30, boomScale: 1.5 }),

  // ---- planet 5: OBSIDIAN, Void Legion (black armour, crimson seams)
  shade: E({ id: "shade", frame: "shade", role: "swarm", hp: 5, radius: 8, speed: 46, xp: 1, score: 16, contact: 12, boomScale: 0.7, rams: true }),
  lance: E({ id: "lance", frame: "lance", role: "chaser", hp: 4, radius: 6, speed: 100, xp: 1, score: 22, contact: 14, boomScale: 0.6, rams: true }),
  sentinel: E({ id: "sentinel", frame: "sentinel", role: "gunner", hp: 24, radius: 10, speed: 48, xp: 3, score: 60, contact: 15, boomScale: 0.85,
    fire: { kind: "wavy", n: 5, spread: 0.22, speed: 68, every: 2.2 } }),
  colossus: E({ id: "colossus", frame: "colossus", role: "heavy", hp: 95, radius: 13, speed: 14, xp: 8, score: 140, contact: 24, boomScale: 1.1,
    fire: { kind: "ring", n: 14, speed: 50, every: 3.0 }, onDeath: { spawn: "shade", n: 2 } }),
  turret_5: E({ id: "turret_5", frame: "turret_5_base", head: "turret_5_gun", role: "turret", hp: 19, radius: 8, speed: 0, xp: 3, score: 70,
    contact: 0, boomScale: 0.8, fire: { kind: "aimed", n: 1, speed: 100, every: 1.6 } }),
  boss_sovereign: E({ id: "boss_sovereign", frame: "boss_sovereign", role: "boss", hp: 2800, radius: 25, speed: 30, xp: 0, score: 15000, contact: 30, boomScale: 1.6 }),

  // ---- structures and obstacles (every planet)
  crate: E({ id: "crate", frame: "crate", role: "structure", hp: 4, radius: 7, speed: 0, xp: 0, score: 30, contact: 0, boomScale: 0.5, loot: true }),
  fuel_tank: E({ id: "fuel_tank", frame: "fuel_tank", role: "structure", hp: 6, radius: 8, speed: 0, xp: 1, score: 40, contact: 0, boomScale: 0.9,
    blast: { radius: 36, dmg: 14 } }),
  bunker: E({ id: "bunker", frame: "bunker", role: "structure", hp: 40, radius: 14, speed: 0, xp: 10, score: 150, contact: 0, boomScale: 1.1 }),
  mine: E({ id: "mine", frame: "mine", role: "mine", hp: 3, radius: 6, speed: 20, xp: 1, score: 20, contact: 20, boomScale: 0.7, rams: true,
    blast: { radius: 28, dmg: 10 } }),

  boss_queen: E({ id: "boss_queen", frame: "boss_queen", role: "boss", hp: 2600, radius: 24, speed: 30, xp: 0, score: 9000, contact: 30, boomScale: 1.5 }),
};

/** The planet's elite is its heavy, gilded, bigger and much tougher. */
export function eliteOf(heavy: EnemyDef): EnemyDef {
  return { ...heavy, id: heavy.id + "_elite", role: "elite", hp: heavy.hp * 5.5, radius: 17, xp: 30, score: 600, scale: 1.3,
    tint: 0xffe8a0, boomScale: 0.9, onDeath: undefined };
}

export interface CanyonPalette {
  floor: number[]; // dark -> light
  plateau: number[];
  rim: number;
  faceDark: number[];
  faceLit: number[];
  river: number[]; // edge, mid, core, hot
  crust: number;
  rock: number[]; // shadow, base, light
  dust: number[];
}

export interface Planet {
  index: number;
  name: string;
  title: string;
  icon: string;
  roles: { swarm: string; chaser: string; gunner: string; heavy: string };
  boss: string;
  bossName: string;
  bullet: string; // enemy bullet frame
  turret: string; // ground turret enemy id
  deco: string[]; // small ground props scattered on the canyon
  hpMul: number;
  landmarks: string[];
  canyon: CanyonPalette;
}

const hex = (s: string) => parseInt(s.slice(1), 16);
const pal = (...c: string[]) => c.map(hex);

export const PLANETS: Planet[] = [
  {
    index: 0, name: "KARR-7", title: "EMBER CANYON", icon: "planet_1",
    roles: { swarm: "drone", chaser: "dart", gunner: "gunner", heavy: "tank" },
    boss: "boss_warden", bossName: "WARDEN-9", bullet: "ebullet_v", hpMul: 1, turret: "turret_1",
    deco: ["deco_1_spire", "deco_1_vent", "deco_1_wreck", "deco_1_pipe", "deco_1_rocks"],
    landmarks: ["lm_outpost", "lm_wreck", "lm_drill"],
    canyon: {
      floor: pal("#1e0f12", "#28141a", "#331a1d"), plateau: pal("#40201e", "#4f2a24", "#5e3328"), rim: hex("#7c4430"),
      faceDark: pal("#170a0c", "#211014"), faceLit: pal("#4a2620", "#5a3024"),
      river: pal("#7a1e0e", "#c8481a", "#ff9a2e", "#ffd86a"), crust: hex("#120607"),
      rock: pal("#140a0b", "#3a2220", "#5a382c"), dust: pal("#ff9a2e", "#ffd86a", "#ff5a2a"),
    },
  },
  {
    index: 1, name: "VELA", title: "FROST RIFT", icon: "planet_2",
    roles: { swarm: "shard", chaser: "spike", gunner: "prism", heavy: "golem" },
    boss: "boss_rimejaw", bossName: "RIMEJAW", bullet: "ebullet_o", hpMul: 1.35, turret: "turret_2",
    deco: ["deco_2_spikes", "deco_2_pod", "deco_2_drift", "deco_2_tower", "deco_2_crystal"],
    landmarks: ["lm_crystals", "lm_wreck", "lm_drill"],
    canyon: {
      floor: pal("#0f1a2c", "#132136", "#182942"), plateau: pal("#22385a", "#2b4568", "#355278"), rim: hex("#6f93bf"),
      faceDark: pal("#0a1222", "#0e182c"), faceLit: pal("#2c4a72", "#365a86"),
      river: pal("#1d5a8a", "#3a9ad0", "#8ad8ff", "#e6fbff"), crust: hex("#0a1426"),
      rock: pal("#0a1220", "#26405e", "#4a6a90"), dust: pal("#e6f4ff", "#a8d8ff", "#ffffff"),
    },
  },
  {
    index: 2, name: "NOXA", title: "TOXIC GORGE", icon: "planet_3",
    roles: { swarm: "mite", chaser: "wasp", gunner: "spitter", heavy: "carapace" },
    boss: "boss_queen", bossName: "VEXA, HIVE QUEEN", bullet: "ebullet_m", hpMul: 1.75, turret: "turret_3",
    deco: ["deco_3_shroom", "deco_3_tendril", "deco_3_eggs", "deco_3_bones", "deco_3_pod"],
    landmarks: ["lm_hive", "lm_ribs", "lm_wreck"],
    canyon: {
      floor: pal("#0f1810", "#132015", "#18281a"), plateau: pal("#25321c", "#2e3e22", "#384a28"), rim: hex("#66783c"),
      faceDark: pal("#0a120a", "#0f180e"), faceLit: pal("#2c3a20", "#364626"),
      river: pal("#1e6a16", "#3aa82a", "#8cff3a", "#e4ff7a"), crust: hex("#081008"),
      rock: pal("#081008", "#283a22", "#46603a"), dust: pal("#b4ff5a", "#e4ff7a", "#7adf3a"),
    },
  },
  {
    index: 3, name: "THALOS", title: "STORM MESA", icon: "planet_4",
    roles: { swarm: "spark", chaser: "bolt", gunner: "coil", heavy: "dynamo" },
    boss: "boss_tempest", bossName: "TEMPEST ENGINE", bullet: "ebullet_y", hpMul: 2.1, turret: "turret_4",
    deco: ["deco_4_rod", "deco_4_rocks", "deco_4_crystal", "deco_4_cable", "deco_4_glass"],
    landmarks: ["lm_pylon", "lm_dish", "lm_wreck"],
    canyon: {
      floor: pal("#14121f", "#1a1828", "#211e33"), plateau: pal("#2a2840", "#33304d", "#3d395a"), rim: hex("#6a64a0"),
      faceDark: pal("#0d0c16", "#121020"), faceLit: pal("#2e2b48", "#38345a"),
      // dimmer than the bullets on purpose: yellow enemy shots must stay readable over the plasma river
      river: pal("#3a3214", "#6a5a1c", "#a08a30", "#d0bc68"), crust: hex("#0a0912"),
      rock: pal("#0c0b14", "#2a2840", "#4a4670"), dust: pal("#ffe84a", "#fffbd0", "#8ad8ff"),
    },
  },
  {
    index: 4, name: "OBSIDIAN", title: "THE CORE", icon: "planet_5",
    roles: { swarm: "shade", chaser: "lance", gunner: "sentinel", heavy: "colossus" },
    boss: "boss_sovereign", bossName: "THE SOVEREIGN", bullet: "ebullet_r", hpMul: 2.5, turret: "turret_5",
    deco: ["deco_5_shard", "deco_5_vein", "deco_5_spire", "deco_5_skull", "deco_5_brazier"],
    landmarks: ["lm_obelisk", "lm_gate", "lm_wreck"],
    canyon: {
      floor: pal("#0e0b0d", "#141013", "#1a1519"), plateau: pal("#221a1e", "#2b2126", "#35282f"), rim: hex("#5a3a44"),
      faceDark: pal("#08060a", "#0d0a0e"), faceLit: pal("#2a1e24", "#33242c"),
      // dimmer than the bullets on purpose: crimson enemy shots must stay readable over the void rift
      river: pal("#2a0610", "#5a0c1c", "#8c1c2e", "#c04a58"), crust: hex("#050304"),
      rock: pal("#060406", "#241b20", "#43333b"), dust: pal("#ff3b4a", "#ff8a6a", "#ffd0c0"),
    },
  },
];

// ---------------------------------------------------------------- waves

export type Pattern = "line" | "v" | "snake" | "sides";
export interface Group { at: number; role: "swarm" | "chaser" | "gunner" | "heavy" | "elite" | "turret" | "mine"; n?: number; pattern?: Pattern }

/**
 * Waves 1-14; wave 15 is the boss. A wave ends when everything spawned and the air is clear
 * (ground turrets and mines don't hold a wave up; they scroll away with the canyon).
 * Turrets join from wave 2, mines from wave 4, elites arrive at waves 5 and 10.
 * Buildings (crates, fuel tanks, bunkers) appear on their own timer.
 */
export const WAVES: Group[][] = [
  // 1-4: learn the faction
  [{ at: 0, role: "swarm", pattern: "line" }, { at: 3, role: "swarm", pattern: "v" }, { at: 6.5, role: "swarm", pattern: "snake" }, { at: 10, role: "swarm", pattern: "line" }],
  [{ at: 0, role: "swarm", pattern: "v" }, { at: 1.5, role: "turret", n: 1 }, { at: 2.5, role: "chaser", n: 1 }, { at: 5, role: "swarm", pattern: "snake" }, { at: 7, role: "chaser", n: 2 }, { at: 10, role: "swarm", pattern: "line" }],
  [{ at: 0, role: "gunner", n: 1 }, { at: 1, role: "turret", n: 2 }, { at: 2, role: "swarm", pattern: "line" }, { at: 5, role: "swarm", pattern: "v" }, { at: 7, role: "gunner", n: 1 }, { at: 9, role: "chaser", n: 2 }],
  [{ at: 0, role: "chaser", n: 2 }, { at: 1, role: "mine", n: 3 }, { at: 2, role: "swarm", pattern: "snake" }, { at: 4, role: "chaser", n: 2 }, { at: 5, role: "turret", n: 1 }, { at: 6, role: "gunner", n: 2 }, { at: 9, role: "swarm", pattern: "sides" }, { at: 11, role: "chaser", n: 3 }],
  // 5: first elite
  [{ at: 0, role: "swarm", pattern: "v" }, { at: 2, role: "elite" }, { at: 8, role: "swarm", pattern: "line" }, { at: 10, role: "turret", n: 2 }, { at: 14, role: "chaser", n: 2 }],
  // 6-9: heavies and mixed pressure
  [{ at: 0, role: "heavy", n: 1 }, { at: 1, role: "turret", n: 2 }, { at: 2, role: "swarm", pattern: "line" }, { at: 5, role: "chaser", n: 2 }, { at: 6, role: "mine", n: 3 }, { at: 7, role: "swarm", pattern: "snake" }, { at: 10, role: "gunner", n: 1 }, { at: 12, role: "swarm", pattern: "v" }],
  [{ at: 0, role: "gunner", n: 2 }, { at: 2, role: "turret", n: 2 }, { at: 3, role: "chaser", n: 3 }, { at: 6, role: "swarm", pattern: "sides" }, { at: 7, role: "mine", n: 4 }, { at: 8, role: "gunner", n: 1 }, { at: 10, role: "swarm", pattern: "line" }, { at: 12, role: "chaser", n: 3 }],
  [{ at: 0, role: "swarm", pattern: "line" }, { at: 1.5, role: "swarm", pattern: "v" }, { at: 3, role: "swarm", pattern: "snake" }, { at: 4, role: "chaser", n: 3 }, { at: 5.5, role: "swarm", pattern: "sides" },
    { at: 7, role: "swarm", pattern: "line" }, { at: 8, role: "chaser", n: 3 }, { at: 9.5, role: "swarm", pattern: "v" }, { at: 11, role: "turret", n: 2 }],
  [{ at: 0, role: "heavy", n: 2 }, { at: 2, role: "turret", n: 3 }, { at: 3, role: "swarm", pattern: "v" }, { at: 5, role: "gunner", n: 2 }, { at: 8, role: "swarm", pattern: "snake" }, { at: 10, role: "chaser", n: 3 }, { at: 11, role: "mine", n: 3 }, { at: 13, role: "swarm", pattern: "line" }],
  // 10: second elite with escorts
  [{ at: 0, role: "swarm", pattern: "sides" }, { at: 2, role: "elite" }, { at: 4, role: "gunner", n: 2 }, { at: 8, role: "chaser", n: 3 }, { at: 11, role: "turret", n: 2 }, { at: 14, role: "swarm", pattern: "v" }],
  // 11-14: the push to the boss
  [{ at: 0, role: "turret", n: 3 }, { at: 1, role: "mine", n: 4 }, { at: 2, role: "chaser", n: 3 }, { at: 4, role: "gunner", n: 2 }, { at: 6, role: "swarm", pattern: "snake" }, { at: 8, role: "chaser", n: 3 }, { at: 10, role: "swarm", pattern: "line" }],
  [{ at: 0, role: "heavy", n: 1 }, { at: 1.5, role: "gunner", n: 2 }, { at: 3, role: "turret", n: 2 }, { at: 4, role: "swarm", pattern: "v" }, { at: 6, role: "heavy", n: 1 }, { at: 7, role: "mine", n: 3 }, { at: 9, role: "gunner", n: 2 }, { at: 11, role: "swarm", pattern: "sides" }],
  [{ at: 0, role: "swarm", pattern: "sides" }, { at: 1, role: "turret", n: 2 }, { at: 1.5, role: "heavy", n: 1 }, { at: 3, role: "gunner", n: 2 }, { at: 4, role: "mine", n: 4 }, { at: 5, role: "chaser", n: 3 }, { at: 7, role: "swarm", pattern: "v" },
    { at: 8, role: "turret", n: 2 }, { at: 9, role: "heavy", n: 1 }, { at: 11, role: "gunner", n: 2 }, { at: 13, role: "swarm", pattern: "snake" }, { at: 15, role: "chaser", n: 3 }],
  [{ at: 0, role: "heavy", n: 2 }, { at: 1, role: "turret", n: 3 }, { at: 2, role: "gunner", n: 3 }, { at: 4, role: "mine", n: 4 }, { at: 5, role: "swarm", pattern: "line" }, { at: 6, role: "chaser", n: 3 },
    { at: 8, role: "swarm", pattern: "v" }, { at: 10, role: "gunner", n: 2 }, { at: 12, role: "chaser", n: 3 }, { at: 14, role: "swarm", pattern: "sides" }],
];
export const WAVE_COUNT = WAVES.length + 1; // + boss
export const WAVE_TIMEOUT = 22; // seconds after the last group before the next wave starts anyway

/** Enemy hp multiplier for a planet and wave (1-based). */
// gentler per-wave ramp now that a stage is 15 waves long
export const hpMul = (p: Planet, wave: number) => p.hpMul * (1 + 0.05 * (wave - 1));

export const BULLET_DAMAGE = 14;

/** XP needed to go from `level` to `level + 1`. */
export const xpNeeded = (level: number) => Math.round(5 + (level - 1) * 4 + (level - 1) ** 2 * 0.3);
