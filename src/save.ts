// Progress saved in localStorage. Every access is wrapped: in incognito or with storage blocked
// the game must stay playable (Poki requirement), it just won't remember anything.

const KEY = "neon-squadron:v2";
const PLANET_COUNT = 5; // keep in sync with PLANETS (src/data/planets.ts)

export interface SaveData {
  scrap: number; // the single meta currency
  unlocked: number; // planets unlocked (1 = only the first)
  selected: number; // planet index picked on the main screen
  best: number[]; // best score per planet
  cleared: boolean[]; // boss beaten per planet
  runs: number;
  muted: boolean;
  ships: string[]; // owned ship ids (hangar)
  ship: string; // equipped ship id
}

const DEFAULTS: SaveData = {
  scrap: 0, unlocked: 1, selected: 0, best: Array(PLANET_COUNT).fill(0), cleared: Array(PLANET_COUNT).fill(false), runs: 0, muted: false,
  ships: ["vanguard"], ship: "vanguard",
};

let cache: SaveData | null = null;

function read(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SaveData>) };
      // older saves had fewer planets: pad to the current count
      d.best = Array.from({ length: PLANET_COUNT }, (_, i) => d.best[i] ?? 0);
      d.cleared = Array.from({ length: PLANET_COUNT }, (_, i) => d.cleared[i] ?? false);
      if (!d.ships.includes("vanguard")) d.ships = ["vanguard", ...d.ships];
      if (!d.ships.includes(d.ship)) d.ship = "vanguard";
      return d;
    }
  } catch { /* storage unavailable or corrupt */ }
  return structuredClone(DEFAULTS);
}

export const Save = {
  get data(): SaveData {
    return (cache ??= read());
  },
  update(patch: Partial<SaveData>): SaveData {
    cache = { ...this.data, ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* not saved, still playable */ }
    return cache;
  },
};
