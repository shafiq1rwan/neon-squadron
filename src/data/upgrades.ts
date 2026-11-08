// In-run upgrades: weapons (max level 6, CORE upgrades at 3 and 6) and passives (max level 5).
// A CORE level changes how the weapon behaves, not just its numbers.

export type WeaponId = "cannon" | "seeker" | "blade" | "laser";
export type PassiveId = "rate" | "damage" | "hull" | "magnet";
export type UpgradeId = WeaponId | PassiveId;

export interface UpgradeDef {
  id: UpgradeId;
  kind: "weapon" | "passive";
  name: string;
  icon: string; // atlas frame
  color: number; // card accent
  max: number;
  core: number[]; // levels that are CORE upgrades
  desc: string[]; // desc[level - 1]
}

export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  cannon: {
    id: "cannon", kind: "weapon", name: "Pulse Cannon", icon: "icon_cannon", color: 0x2df4ff, max: 6, core: [3, 6],
    desc: [
      "Fires a steady stream of pulse rounds.",
      "+30% damage.",
      "SPLIT SHOT: fires a 3-way spread.",
      "+25% fire rate.",
      "+30% damage.",
      "RICOCHET: rounds bounce to a second target.",
    ],
  },
  seeker: {
    id: "seeker", kind: "weapon", name: "Seeker Darts", icon: "icon_seeker", color: 0xb46cff, max: 6, core: [3, 6],
    desc: [
      "Launches 2 homing darts.",
      "+1 dart per volley.",
      "CLUSTER: darts burst on impact, hitting nearby foes.",
      "+30% damage.",
      "+1 dart, faster reload.",
      "SWARM: launches a second volley.",
    ],
  },
  blade: {
    id: "blade", kind: "weapon", name: "Arc Blade", icon: "icon_blade", color: 0x2df4ff, max: 6, core: [3, 6],
    desc: [
      "A blade orbits your ship, cutting what it touches.",
      "+1 blade.",
      "WIDE ARC: blades orbit farther and grow larger.",
      "+40% damage.",
      "+1 blade.",
      "OVERDRIVE: blades spin twice as fast.",
    ],
  },
  laser: {
    id: "laser", kind: "weapon", name: "Prism Laser", icon: "icon_laser", color: 0xff3d9a, max: 6, core: [3, 6],
    desc: [
      "Fires a piercing beam ahead every few seconds.",
      "+40% damage.",
      "PRISM SPLIT: two extra beams fan out.",
      "Beam lasts longer.",
      "+40% damage.",
      "OVERLOAD: wider beam, fires more often.",
    ],
  },
  rate: {
    id: "rate", kind: "passive", name: "Overclock", icon: "icon_rate", color: 0xffe24a, max: 5, core: [],
    desc: Array(5).fill("+12% fire rate for all weapons."),
  },
  damage: {
    id: "damage", kind: "passive", name: "Payload", icon: "icon_damage", color: 0xff8c2e, max: 5, core: [],
    desc: Array(5).fill("+15% damage for all weapons."),
  },
  hull: {
    id: "hull", kind: "passive", name: "Hull Plating", icon: "icon_armor", color: 0x8f9ae8, max: 5, core: [],
    desc: Array(5).fill("+20 max hull, and repair 20."),
  },
  magnet: {
    id: "magnet", kind: "passive", name: "Tractor Field", icon: "icon_magnet", color: 0xff3d9a, max: 5, core: [],
    desc: Array(5).fill("+40% pickup range."),
  },
};

export type Levels = Record<UpgradeId, number>;

// How upgrades show on the ship:
// - Pulse Cannon and Hull Plating are part of the hull: they pick which ship sprite is drawn (shipFrame below).
// - Seeker Darts and Prism Laser are separate hardware: overlay sprites (missile racks, nose prism).
// - Overclock = bigger, hotter engine flames; Payload = bigger, warmer bullets; Tractor Field = range ring;
//   Arc Blade = the orbiting swords themselves. (Handled in GameScene.)

/** Pulse Cannon level -> hull gun stage: 0 base, 1 nose muzzle (lv 2), 2 wing guns (lv 3-5), 3 heavy twin guns (lv 6). */
export const cannonTier = (level: number) => (level >= 6 ? 3 : level >= 3 ? 2 : level >= 2 ? 1 : 0);
/** Hull Plating level -> armour stage: 0 none, 1 root plates (lv 1-3), 2 full plating (lv 4-5). */
export const armourTier = (level: number) => (level >= 4 ? 2 : level >= 1 ? 1 : 0);
/** The ship sprite for a hangar ship in its current upgrade state. */
export const shipFrame = (shipId: string, levels: Levels, robot = false) =>
  `${robot ? "mech" : "ship"}_${shipId}_${cannonTier(levels.cannon)}${armourTier(levels.hull)}`;

/** External hardware overlays: [minimum level, atlas frame]. The highest reached tier is drawn. */
export const ATTACHMENTS: Partial<Record<UpgradeId, [number, string][]>> = {
  seeker: [[1, "att_seeker_1"], [3, "att_seeker_2"], [6, "att_seeker_3"]],
  laser: [[1, "att_laser_1"], [3, "att_laser_2"], [6, "att_laser_3"]],
};
/** Missile racks hang under the wings; the prism sits on the nose. */
export const ATTACH_UNDER: UpgradeId[] = ["seeker"];
export const ATTACH_OVER: UpgradeId[] = ["laser"];

export function attachmentFrame(id: UpgradeId, level: number): string | null {
  let frame: string | null = null;
  for (const [min, f] of ATTACHMENTS[id] ?? []) if (level >= min) frame = f;
  return frame;
}

export const emptyLevels = (): Levels => ({ cannon: 1, seeker: 0, blade: 0, laser: 0, rate: 0, damage: 0, hull: 0, magnet: 0 });

export interface Choice {
  def: UpgradeDef;
  level: number; // the level it becomes
  isNew: boolean;
  isCore: boolean;
  text: string;
}

/** Pick up to 3 distinct upgrades that aren't maxed. Owned weapons are a little more likely. */
export function rollChoices(levels: Levels, rand: () => number = Math.random): Choice[] {
  const pool = (Object.keys(UPGRADES) as UpgradeId[])
    .filter((id) => levels[id] < UPGRADES[id].max)
    .map((id) => {
      const def = UPGRADES[id];
      const owned = levels[id] > 0;
      const w = def.kind === "weapon" ? (owned ? 1.4 : 1.0) : 0.8;
      // a coming CORE upgrade is exciting: nudge it
      return { id, w: def.core.includes(levels[id] + 1) ? w * 1.3 : w };
    });
  const out: Choice[] = [];
  while (out.length < 3 && pool.length) {
    const total = pool.reduce((s, p) => s + p.w, 0);
    let r = rand() * total;
    let i = 0;
    while (i < pool.length - 1 && (r -= pool[i].w) > 0) i++;
    const { id } = pool.splice(i, 1)[0];
    const def = UPGRADES[id];
    const level = levels[id] + 1;
    out.push({ def, level, isNew: level === 1, isCore: def.core.includes(level), text: def.desc[level - 1] });
  }
  return out;
}
