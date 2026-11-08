// Hangar ("FLIGHT"): ship versions bought with scrap. Each ship is drawn in every upgrade state
// (art/sprites.px.js: ship_<id>_<cannon tier><armour tier>), so Pulse Cannon and Hull Plating upgrades
// change the hull itself, in that ship's own colours.
import type { UpgradeId } from "./upgrades";

export interface ShipDef {
  id: string;
  code: string;
  name: string;
  frame: string; // base sprite (no upgrades), used by the menus
  color: number;
  cost: number; // scrap
  requires?: number; // planet index that must be cleared first
  desc: string[];
  perk: { hp?: number; rate?: number; damage?: number; start?: UpgradeId; shield?: number };
  stats: { power: number; armor: number; rate: number }; // 1-5, for the hangar bars
  /** Where the wing-gun muzzles are drawn, relative to the ship centre (mirrored for the other wing). */
  gun: { x: number; y: number };
  /** Can switch into a robot (sprites mech_<id>_<cannon><armour>, morph anim "<id>_morph"). */
  transform?: boolean;
}

/** Robot form: slower, tougher, harder-hitting. */
export const ROBOT = {
  speed: 0.6, // keyboard speed multiplier
  maxSpeed: 160, // world units/s when following the mouse or a finger (the fighter is effectively ~700)
  damageTaken: 0.65,
  damage: 1.3, // all weapons
  fireInterval: 1.15, // arm cannons fire a bit slower than the nose gun
  hitRadius: 3.5, // vs 2.5 for fighters
  arm: { x: 10.5, y: -7 }, // arm-cannon muzzles relative to the centre (mirrored)
  morphTime: 0.34, // transform animation length (6 frames at 18 fps)
  cooldown: 1.2,
};

export const SHIPS: ShipDef[] = [
  {
    id: "vanguard", code: "NS-1", name: "VANGUARD", frame: "ship_vanguard_00", color: 0x2df4ff, cost: 0,
    desc: ["BALANCED ALL-ROUNDER.", "STARTS WITH PULSE CANNON."], perk: {}, stats: { power: 2, armor: 2, rate: 2 },
    gun: { x: 6.5, y: -6 },
  },
  {
    id: "viper", code: "NS-2", name: "VIPER", frame: "ship_viper_00", color: 0x9cff4a, cost: 400,
    desc: ["+25% FIRE RATE.", "-20 HULL."], perk: { rate: 0.25, hp: -20 }, stats: { power: 2, armor: 1, rate: 4 },
    gun: { x: 5.5, y: -10 },
  },
  {
    id: "bastion", code: "NS-3", name: "BASTION", frame: "ship_bastion_00", color: 0xffb04a, cost: 900,
    desc: ["+50 HULL.", "STARTS WITH ARC BLADE."], perk: { hp: 50, start: "blade" }, stats: { power: 2, armor: 5, rate: 2 },
    gun: { x: 6.5, y: -8 },
  },
  {
    id: "phantom", code: "NS-4", name: "PHANTOM", frame: "ship_phantom_00", color: 0xa982ff, cost: 1600, requires: 1,
    desc: ["+20% DAMAGE.", "STARTS WITH SEEKER DARTS."], perk: { damage: 0.2, start: "seeker" }, stats: { power: 4, armor: 2, rate: 3 },
    gun: { x: 7.5, y: -5 },
  },
  {
    id: "halo", code: "NS-5", name: "HALO", frame: "ship_halo_00", color: 0xff7cc0, cost: 2400, requires: 2,
    desc: ["STARTS WITH A SHIELD (2 HITS).", "STARTS WITH TRACTOR FIELD."], perk: { shield: 2, start: "magnet" }, stats: { power: 2, armor: 4, rate: 2 },
    gun: { x: 8.5, y: -7 },
  },
  {
    id: "raptor", code: "NS-6", name: "RAPTOR", frame: "ship_raptor_00", color: 0xff3b3b, cost: 3500, requires: 3,
    desc: ["+15% DAMAGE AND FIRE RATE.", "STARTS WITH PRISM LASER. -30 HULL."], perk: { damage: 0.15, rate: 0.15, hp: -30, start: "laser" },
    stats: { power: 5, armor: 1, rate: 4 },
    gun: { x: 7.5, y: -3 },
  },
  {
    id: "paladin", code: "NS-7", name: "PALADIN", frame: "ship_paladin_00", color: 0x4dff8a, cost: 2000, requires: 0,
    desc: ["TRANSFORMS INTO A ROBOT: TOUGHER,", "HITS HARDER, MOVES SLOWER. SWAP ANY TIME."], perk: {}, stats: { power: 4, armor: 4, rate: 2 },
    gun: { x: 7.5, y: -5 },
    transform: true,
  },
];

export const shipById = (id: string): ShipDef => SHIPS.find((s) => s.id === id) ?? SHIPS[0];
