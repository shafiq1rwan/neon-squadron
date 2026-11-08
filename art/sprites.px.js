// Neon Squadron sprite sheet (pxl DSL). Build: npm run art
// Top-down view. Player faces up, enemies face down. Everything lands in one atlas.
// Symmetric sprites use mx: "c" (odd width, shared centre column): only the left half is drawn.

pal({
  k: "#0a0718", // outline
  n: "#141029", // hull ramp, darkest -> lightest
  s: "#262449",
  h: "#3d4277",
  H: "#6470b3",
  j: "#9aa8e6",
  W: "#dfe6ff",
  w: "#ffffff",
  C: "#0b5d7a", // cyan ramp (player neon, glass)
  c: "#18a8c9",
  e: "#2df4ff",
  m: "#3e0628", // magenta ramp (enemies)
  P: "#8c1452",
  p: "#e0287f",
  q: "#ff7cc0",
  V: "#2e1660", // violet ramp
  v: "#6a34c8",
  u: "#a982ff",
  O: "#6e2606", // orange ramp
  o: "#d8661c",
  a: "#ffb04a",
  Y: "#a8700c", // gold
  y: "#ffe24a",
  G: "#0f7a40", // green
  g: "#4dff8a",
  r: "#ff3b3b",
  R: "#8a1020",
  i: "#12401a", // lime ramp (VIPER)
  L: "#3aa82a",
  l: "#9cff4a",
})
ramps("knshHjW", "kmPpq", "kCce", "kVvu", "kOoa", "Yy", "kGg")

// ================================================================ player ships
// Every hangar ship is drawn in every upgrade state: ship_<id>_<cannon tier><armour tier>.
//   cannon tier (Pulse Cannon level): 0 = lv1, 1 = lv2 (nose muzzle), 2 = lv3-5 (wing guns), 3 = lv6 (heavy twin guns)
//   armour tier (Hull Plating level): 0 = none, 1 = lv1-3 (root plates), 2 = lv4-5 (full plating)
// The upgrades are drawn INTO the ship, in that ship's own hull and neon colours.
// All ships share the 25x28 frame, engine pods (x 5-9, y 16-27) and wing roots (x 9-12, y 11-22).

const BASES = {
  // NS-1 VANGUARD: balanced delta. Cyan neon, blue-steel hull.
  vanguard: [
    rect(5, 16, 5, 11, "s"), rect(6, 17, 3, 9, "h"), vline(6, 17, 9, "H"), rect(5, 26, 5, 2, "n"), rect(6, 26, 3, 1, "O"),
    poly([12, 11, 12, 22, 2, 24, 0, 21, 2, 18, 9, 12], "h"),
    poly([9, 12, 2, 18, 4, 19, 10, 14], "H"),
    line(2, 18, 9, 12, "e"),
    hline(2, 22, 10, "s"), hline(3, 23, 8, "n"),
    rect(0, 19, 2, 5, "j"), px(0, 19, "W"), px(0, 22, "e"), px(1, 22, "e"),
    line(4, 20, 9, 17, "s"),
    poly([12, 0, 12, 27, 9, 27, 9, 11, 11, 3], "H"),
    line(11, 3, 10, 7, "h"), vline(9, 11, 15, "h"), vline(10, 8, 3, "h"),
    vline(12, 1, 5, "j"), vline(12, 13, 12, "j"), px(12, 0, "W"),
    poly([12, 5, 12, 12, 10, 11, 10, 7], "C"),
    vline(11, 7, 4, "c"), px(11, 7, "e"), px(12, 6, "w"), px(12, 7, "e"),
    rect(10, 12, 2, 2, "n"), px(11, 12, "s"),
    vline(10, 16, 5, "c"), px(10, 16, "e"),
    hline(9, 26, 3, "s"),
  ],
  // NS-2 VIPER: slim, sharply swept wings, canards, long nose. Lime neon, gunmetal hull.
  viper: [
    rect(6, 16, 4, 11, "s"), rect(7, 17, 2, 9, "h"), rect(6, 26, 4, 2, "n"), rect(7, 26, 2, 1, "O"),
    poly([12, 12, 12, 22, 3, 26, 1, 24, 9, 14], "s"),
    poly([9, 14, 1, 24, 3, 24, 10, 16], "h"),
    line(1, 24, 9, 14, "l"), px(1, 24, "w"),
    hline(4, 23, 8, "n"), line(5, 22, 10, 18, "n"),
    poly([12, 6, 12, 10, 6, 11, 9, 7], "h"), line(6, 11, 9, 7, "l"),
    poly([12, 0, 12, 27, 10, 27, 10, 9, 11, 2], "h"),
    vline(10, 9, 18, "s"), vline(12, 2, 24, "H"), px(12, 0, "W"),
    poly([12, 3, 12, 11, 11, 10, 11, 5], "i"), px(11, 6, "l"), px(12, 4, "w"), px(12, 5, "l"),
    vline(11, 14, 6, "L"), px(11, 14, "l"),
    hline(10, 26, 2, "s"),
  ],
  // NS-3 BASTION: broad armoured wings, armour blocks, blunt nose. Gold trim, light steel hull.
  bastion: [
    rect(4, 15, 6, 12, "s"), rect(5, 16, 4, 10, "h"), vline(5, 16, 10, "H"), rect(4, 26, 6, 2, "n"), rect(5, 26, 4, 1, "O"),
    poly([12, 10, 12, 23, 1, 24, 0, 18, 3, 14, 9, 11], "h"),
    poly([9, 11, 3, 14, 3, 16, 10, 13], "H"),
    line(3, 14, 9, 11, "a"), line(0, 18, 3, 14, "y"),
    rect(1, 16, 4, 6, "H"), hline(1, 16, 4, "j"), px(1, 17, "n"), px(4, 21, "n"), px(2, 19, "y"),
    hline(1, 23, 11, "s"),
    poly([12, 1, 12, 27, 8, 27, 8, 9, 10, 3, 11, 1], "H"),
    vline(8, 9, 18, "h"), vline(12, 3, 22, "j"), rect(11, 0, 2, 2, "j"), px(12, 0, "W"),
    poly([12, 5, 12, 11, 10, 11, 10, 7], "Y"), px(11, 7, "y"), px(12, 6, "w"), px(12, 7, "y"),
    rect(9, 13, 3, 3, "h"), hline(9, 13, 3, "j"), px(10, 14, "a"),
    vline(9, 18, 6, "Y"), px(9, 18, "y"),
  ],
  // NS-4 PHANTOM: forward-swept "W" wings, twin tail fins, dark hull. Violet neon.
  phantom: [
    rect(5, 16, 5, 11, "n"), rect(6, 17, 3, 9, "s"), vline(6, 17, 9, "h"), rect(5, 26, 5, 2, "n"), rect(6, 26, 3, 1, "V"),
    poly([12, 12, 12, 21, 4, 22, 0, 26, 0, 20, 7, 14], "s"),
    poly([7, 14, 0, 20, 2, 20, 9, 15], "h"),
    line(0, 20, 7, 14, "u"), px(0, 25, "u"), px(0, 26, "w"),
    hline(3, 21, 9, "n"),
    poly([9, 21, 9, 28, 7, 28, 7, 23], "s"), vline(8, 22, 5, "v"),
    poly([12, 0, 12, 27, 9, 27, 9, 11, 11, 3], "s"),
    line(11, 3, 10, 7, "n"), vline(9, 11, 15, "n"), vline(12, 1, 24, "h"), px(12, 0, "H"),
    poly([12, 5, 12, 12, 10, 11, 10, 7], "V"), vline(11, 7, 4, "v"), px(11, 7, "u"), px(12, 6, "w"), px(12, 7, "u"),
    vline(10, 15, 6, "v"), px(10, 15, "u"),
  ],
  // NS-5 HALO: support ship. White hull, crescent wings that curve back in a halo, pink neon.
  halo: [
    rect(5, 16, 5, 11, "s"), rect(6, 17, 3, 9, "H"), vline(6, 17, 9, "j"), rect(5, 26, 5, 2, "n"), rect(6, 26, 3, 1, "P"),
    poly([12, 13, 12, 21, 6, 23, 1, 20, 0, 15, 2, 11, 5, 14, 9, 14], "H"),
    poly([5, 14, 2, 12, 1, 15, 3, 18, 7, 17], "j"),
    line(0, 15, 2, 11, "q"), line(2, 11, 5, 14, "p"), px(2, 11, "w"), px(1, 19, "p"),
    hline(3, 21, 9, "h"),
    poly([12, 0, 12, 27, 9, 27, 9, 10, 11, 2], "j"),
    vline(9, 10, 17, "H"), vline(12, 1, 24, "W"), px(12, 0, "w"),
    poly([12, 4, 12, 11, 10, 10, 10, 6], "P"), vline(11, 6, 4, "p"), px(11, 6, "q"), px(12, 5, "w"), px(12, 6, "q"),
    vline(10, 14, 6, "p"), px(10, 14, "q"),
    hline(9, 26, 3, "H"),
  ],
  // NS-6 RAPTOR: aggressive striker. Sharply swept wings, long canards, twin tail fins, dark hull, red neon.
  raptor: [
    rect(5, 16, 5, 11, "n"), rect(6, 17, 3, 9, "s"), vline(6, 17, 9, "h"), rect(5, 26, 5, 2, "n"), rect(6, 26, 3, 1, "R"),
    poly([12, 12, 12, 20, 0, 25, 0, 23, 8, 14], "s"),
    poly([8, 14, 0, 23, 2, 23, 10, 15], "h"),
    line(0, 23, 8, 14, "r"), px(0, 24, "w"),
    poly([12, 5, 12, 9, 7, 10, 10, 6], "h"), line(7, 10, 10, 6, "r"),
    poly([9, 20, 9, 28, 7, 28, 6, 22], "s"), vline(8, 21, 5, "R"),
    poly([12, 0, 12, 27, 10, 27, 10, 8, 11, 1], "h"),
    vline(10, 8, 19, "s"), vline(12, 1, 24, "H"), px(12, 0, "W"),
    poly([12, 3, 12, 9, 11, 8, 11, 4], "R"), px(11, 5, "r"), px(12, 4, "w"),
    vline(11, 12, 7, "R"), px(11, 12, "r"),
  ],
}

// NS-7 PALADIN: a transforming fighter. One parametric shape, t = 0 (fighter) .. 1 (robot), so the transform
// animation is a real morph: the wings fold into shoulder armour, the nose sinks into a chest with a visor head,
// the engine pods drop into legs, and arm cannons swing out from under the shoulders.
// Steel-white hull, mint neon. Same 25x28 frame as every ship (fighter pods x 5-9, y 16-27).
const lerp = (a, b, t) => a + (b - a) * t
const lerpPts = (A, B, t) => A.map((v, i) => Math.round(lerp(v, B[i], t)))
function paladinParts(t) {
  const out = []
  const ty = (y0, y1) => Math.round(lerp(y0, y1, t))
  // legs (engine pods dropping down and apart)
  const lx = Math.round(lerp(5, 6, t)), ly = ty(16, 18), lw = 5 - Math.round(t), lh = ty(11, 9)
  out.push(rect(lx, ly, lw, lh, "s"), rect(lx + 1, ly + 1, lw - 2, lh - 2, "h"), vline(lx + 1, ly + 1, lh - 2, "H"))
  if (t > 0.5) out.push(rect(lx - 1, ly + lh - 2, lw + 1, 2, "n"), hline(lx, ly + Math.round(lh / 2), lw, "n")) // knee joint, feet
  else out.push(rect(lx, ly + lh - 1, lw, 2, "n"))
  out.push(rect(lx + 1, ly + lh, lw - 2, 1, "O"))
  // wings -> shoulder armour
  const W = lerpPts([12, 11, 12, 21, 2, 23, 0, 20, 9, 12], [12, 9, 12, 16, 4, 17, 2, 12, 7, 8], t)
  out.push(poly(W, "H"))
  out.push(poly(lerpPts([9, 12, 2, 18, 3, 19, 10, 14], [7, 8, 2, 12, 4, 12, 8, 10], t), "j"))
  out.push(line(W[6], W[7], W[8], W[9], "g"))
  out.push(hline(W[4] + 1, W[5] - 1, Math.max(1, 11 - W[4]), "h"))
  // arm cannons swinging out from under the shoulders (robot only)
  if (t > 0.25) {
    const k = (t - 0.25) / 0.75, ax = Math.round(lerp(4, 1, k)), len = Math.round(lerp(2, 9, k))
    out.push(rect(ax, 13, 3, len, "h"), vline(ax, 13, len, "H"), hline(ax, 13 + len - 1, 3, "s"))
    out.push(rect(ax + 1, 13 - Math.round(6 * k), 1, Math.round(6 * k) + 1, "s"), px(ax + 1, 12 - Math.round(6 * k), "g"))
  }
  // fuselage -> torso
  const N = lerpPts([12, 0, 12, 26, 9, 26, 9, 11, 11, 3], [12, 5, 12, 19, 8, 19, 8, 9, 10, 6], t)
  out.push(poly(N, "j"), vline(N[6], N[7] + 1, Math.max(1, N[5] - N[7] - 2), "H"), vline(12, N[1] + 1, N[3] - N[1] - 2, "W"))
  // canopy -> visor head
  const cy = ty(5, 5)
  if (t < 0.6) out.push(poly([12, cy, 12, cy + 6, 10, cy + 5, 10, cy + 2], "G"), px(11, cy + 2, "g"), px(12, cy + 1, "w"))
  else out.push(rect(10, 5, 3, 4, "H"), rect(10, 6, 3, 2, "G"), hline(10, 6, 3, "g"), px(12, 6, "w"), px(12, 5, "j"))
  // chest core / spine stripe
  out.push(vline(11, ty(14, 11), ty(6, 4), "G"), px(11, ty(14, 11), "g"))
  if (t > 0.6) out.push(rect(10, 12, 3, 3, "s"), px(11, 13, "g"), px(12, 13, "w")) // reactor in the chest
  return out
}
BASES.paladin = paladinParts(0)

// robot-form upgrades: bigger arm cannons (cannon tier) and chest/shoulder plating (armour tier)
function robotCannon(tier) {
  const out = []
  if (tier >= 1) out.push(px(2, 3, "w"), px(2, 4, "g")) // hotter muzzle
  if (tier >= 2) out.push(rect(0, 9, 1, 8, "s"), px(0, 8, "g"), rect(0, 15, 2, 2, "h")) // second barrel
  if (tier >= 3) out.push(rect(1, 3, 3, 2, "H"), hline(1, 2, 3, "g"), rect(0, 6, 1, 4, "n"), line(4, 16, 8, 14, "g")) // heavy muzzle brake + conduit
  return out
}
function robotArmour(tier) {
  const out = []
  if (tier >= 1) out.push(rect(8, 15, 3, 3, "H"), hline(8, 15, 3, "W"), px(8, 17, "s"))
  if (tier >= 2) out.push(rect(3, 9, 4, 2, "W"), hline(3, 11, 4, "H"), rect(6, 22, 4, 2, "H"), hline(6, 22, 4, "W"))
  return out
}
for (let c = 0; c <= 3; c++)
  for (let a = 0; a <= 2; a++)
    sprite(`mech_paladin_${c}${a}`, { w: 25, h: 28, mx: "c", outline: "k" },
      ...paladinParts(1), ...robotArmour(a), ...robotCannon(c), glow("gw", { r: 3, strength: 0.5 }))
// the transform itself: 6 morph frames, fighter -> robot (played backwards to turn back into a fighter)
anim("paladin_morph", { w: 25, h: 28, mx: "c", outline: "k", fps: 18, loop: false },
  ...[0, 1, 2, 3, 4, 5].map((i) => frame(...paladinParts(i / 5)))) // (glow isn't allowed inside anim frames)
scene("paladin_preview", { w: 6 * 29, h: 32 }, ...[0, 1, 2, 3, 4, 5].map((i) => stamp("paladin_morph", i * 29, 2, { frame: i })))

// Per-ship colour roles (hull dark -> light, neon dark -> bright) and where the wing gun sits on the wing
// (gun.x = column, gun.y = top of the housing; the muzzle is 6 px above). Mirrored by mx.
const SHIP_STYLE = {
  vanguard: { d: ["n", "s", "h", "H", "j", "W"], g: ["C", "c", "e"], gun: { x: 6, y: 14 } },
  viper: { d: ["n", "n", "s", "h", "H", "j"], g: ["i", "L", "l"], gun: { x: 7, y: 10 } }, // on the canards
  bastion: { d: ["s", "h", "H", "j", "W", "w"], g: ["Y", "a", "y"], gun: { x: 6, y: 12 } },
  phantom: { d: ["n", "n", "s", "h", "H", "j"], g: ["V", "v", "u"], gun: { x: 5, y: 15 } },
  halo: { d: ["s", "h", "H", "j", "W", "w"], g: ["P", "p", "q"], gun: { x: 4, y: 13 } }, // in the crescent's notch
  raptor: { d: ["n", "n", "s", "h", "H", "j"], g: ["R", "r", "q"], gun: { x: 5, y: 17 } }, // on the swept wing
  paladin: { d: ["s", "h", "H", "j", "W", "w"], g: ["G", "g", "w"], gun: { x: 5, y: 15 } }, // fighter form; robot form is mech_paladin_*
}

function cannonParts(S, tier) {
  const { d, g, gun: A } = S, out = []
  if (tier >= 1) {
    // nose muzzle + a neon feed line down the spine
    out.push(px(12, 0, "w"), px(11, 1, g[2]), vline(11, 14, 7, g[1]), px(11, 14, g[2]))
  }
  // guns are one shade lighter than the hull so they read on dark ships too
  if (tier === 2) {
    // gun housing built into the wing, one barrel, glowing muzzle
    out.push(rect(A.x - 1, A.y, 3, 4, d[3]), vline(A.x - 1, A.y, 4, d[4]), hline(A.x - 1, A.y + 3, 3, d[1]),
      rect(A.x, A.y - 5, 1, 5, d[2]), px(A.x, A.y - 6, g[2]), px(A.x + 1, A.y + 1, g[2]))
  }
  if (tier === 3) {
    // heavy twin-barrel gun, energy conduit to the fuselage
    out.push(rect(A.x - 2, A.y - 1, 5, 5, d[3]), vline(A.x - 2, A.y - 1, 5, d[4]), hline(A.x - 2, A.y + 3, 5, d[1]),
      rect(A.x - 1, A.y - 7, 1, 6, d[2]), rect(A.x + 1, A.y - 6, 1, 5, d[2]),
      px(A.x - 1, A.y - 8, "w"), px(A.x + 1, A.y - 7, g[2]), px(A.x, A.y + 1, g[2]),
      line(A.x + 2, A.y + 2, 9, A.y + 4, g[2]))
  }
  return out
}

function armourParts(S, tier) {
  const { d } = S, out = []
  if (tier >= 1) {
    // riveted plates on the wing roots and the engine pods
    out.push(rect(9, 15, 3, 4, d[3]), hline(9, 15, 3, d[4]), px(9, 18, d[1]), px(11, 18, d[1]),
      rect(5, 20, 1, 4, d[3]), px(5, 20, d[4]))
  }
  if (tier >= 2) {
    // full plating: canopy frame, bigger root plate, engine collars
    out.push(rect(8, 14, 4, 6, d[3]), hline(8, 14, 4, d[4]), vline(8, 14, 6, d[4]), px(10, 17, d[1]), px(8, 19, d[1]),
      vline(9, 6, 5, d[4]), px(9, 5, d[5]),
      hline(5, 24, 5, d[4]), hline(5, 25, 5, d[2]))
  }
  return out
}

const GLOW = { vanguard: "e", viper: "l", bastion: "ay", phantom: "u", halo: "q", raptor: "r", paladin: "g" }
for (const id of Object.keys(BASES))
  for (let c = 0; c <= 3; c++)
    for (let a = 0; a <= 2; a++)
      sprite(`ship_${id}_${c}${a}`, { w: 25, h: 28, mx: "c", outline: "k" },
        ...BASES[id], ...armourParts(SHIP_STYLE[id], a), ...cannonParts(SHIP_STYLE[id], c),
        glow(GLOW[id] + "w", { r: 4, strength: 0.5 }))

// ---------------------------------------------------------------- entrance effects (things that appear mid-screen)

// fx_launch: a cannon muzzle blast. White flash -> star flare + fireball -> expanding smoke ring with embers.
anim("fx_launch", { w: 23, h: 23, frames: 7, fps: 20, loop: false }, (c) => {
  const f = c.frame, cx = 11, cy = 11, rng = c.rng(3)
  const ring = (r, key, step = 0.12) => { for (let a = 0; a < Math.PI * 2; a += step) c.px(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), key) }
  if (f === 0) { c.circ(cx, cy, 2, "w"); c.hline(cx - 4, cy, 9, "y"); c.vline(cx, cy - 4, 9, "y") }
  if (f === 1) {
    c.circ(cx, cy, 4, "a"); c.circ(cx, cy, 3, "y"); c.circ(cx, cy, 1, "w")
    c.hline(cx - 8, cy, 17, "y"); c.vline(cx, cy - 8, 17, "y"); c.line(cx - 5, cy - 5, cx + 5, cy + 5, "a"); c.line(cx - 5, cy + 5, cx + 5, cy - 5, "a")
  }
  if (f === 2) { ring(6, "h"); c.circ(cx, cy, 4, "o"); c.circ(cx, cy, 3, "a"); c.circ(cx, cy, 1, "y") }
  if (f === 3) { ring(7, "H"); ring(6, "s"); c.circ(cx, cy, 3, "O"); c.circ(cx, cy, 2, "o") }
  if (f === 4) { ring(8, "h", 0.2); c.circ(cx, cy, 2, "O") }
  if (f === 5) { ring(9, "s", 0.3) }
  if (f === 6) { ring(10, "s", 0.6) }
  // embers flung outward on the middle frames
  if (f >= 2 && f <= 5) for (let i = 0; i < 7; i++) {
    const a = rng() * Math.PI * 2, r = 3 + f * 1.6 + rng() * 2
    c.px(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), f < 4 ? "a" : "O")
  }
}, glow("wya", { r: 3, strength: 0.6 }))

// fx_hatch: a brood sac swells, cracks and bursts: flash, lime goo drops and chitin shell fragments that splat and fade.
anim("fx_hatch", { w: 25, h: 25, frames: 8, fps: 16, loop: false }, (c) => {
  const f = c.frame, cx = 12, cy = 12, rng = c.rng(7)
  const sac = (r) => { c.ellipse(cx, cy, r, r - 1, "V"); c.ellipse(cx, cy, r - 1, r - 2, "v"); c.ellipse(cx, cy, r - 2, r - 3, "L"); c.px(cx - 1, cy - 2, "l"); c.px(cx - 2, cy - 1, "l") }
  if (f === 0) sac(5)
  if (f === 1) { sac(6); c.line(cx - 3, cy - 4, cx, cy, "k"); c.line(cx + 4, cy - 2, cx + 1, cy + 1, "k"); c.line(cx - 1, cy + 5, cx, cy + 1, "k") }
  if (f === 2) { c.circ(cx, cy, 5, "l"); c.circ(cx, cy, 3, "w"); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.line(cx, cy, Math.round(cx + Math.cos(a) * 8), Math.round(cy + Math.sin(a) * 8), "l") } }
  if (f >= 3) {
    const t = f - 3 // 0..4
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + rng() * 0.4, r = 5 + t * 1.7 + rng() * 2
      const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r)
      if (t < 3) { c.circ(x, y, t < 1 ? 1 : 0, i % 3 ? "l" : "L") } // goo drops
      else if (i % 2 === 0) c.px(x, y, t < 4 ? "L" : "i") // splats
      if (i % 3 === 0 && t < 4) { c.rect(x + 1, y - 1, 2, 2, "V"); c.px(x + 1, y - 1, "u") } // shell fragments
    }
    if (t < 2) { c.ellipse(cx, cy, 3 - t, 2 - t, "L"); c.px(cx, cy, "l") } // burst membrane
  }
}, glow("lw", { r: 2, strength: 0.5 }))

// twin engine jets, placed under the engine pods
sprite("flame", { w: 13, h: 7, mx: "c" },
  rect(1, 0, 3, 2, "w"), rect(1, 2, 3, 2, "a"), rect(2, 4, 2, 2, "o"), px(2, 6, "O"),
  glow("wa", { r: 2, strength: 0.6 }))

// ================================================================ player projectiles

sprite("bullet", { w: 5, h: 10, mx: "c" },
  rect(1, 1, 2, 8, "c"), rect(2, 0, 1, 9, "w"), px(1, 2, "e"), px(1, 8, "C"),
  glow("ew", { r: 2, strength: 0.7 }))

// Seeker Dart: a slim rocket. Red warhead, gunmetal body with a violet band, small tail fins and a hot
// exhaust. Kept narrow and dark-bodied so it never reads as a tiny copy of the player's ship.
sprite("seeker", { w: 5, h: 13, mx: "c", outline: "k" }, `
  ..r
  .Rr
  .Rq
  .hH
  .vu
  .hH
  .hH
  .hH
  VhH
  V.s
  ..a
  ..w`, glow("aw", { r: 2, strength: 0.8 }))

// smoke-and-fire puff left behind missiles (and reused for small sparks)
sprite("puff", { w: 3, h: 3 }, rect(0, 0, 3, 3, "a"), px(1, 1, "w"), px(0, 0, "o"), px(2, 2, "o"))

// Arc Blade: an energy sword. Tip points up (outward when orbiting): blade, crossguard with a gem, wrapped grip, pommel.
sprite("blade", { w: 9, h: 23, mx: "c", outline: "k" },
  px(4, 0, "w"), rect(3, 1, 2, 2, "e"), px(4, 1, "w"),
  rect(2, 3, 3, 13, "c"), vline(3, 3, 13, "e"), vline(4, 2, 14, "w"),
  rect(0, 16, 5, 2, "H"), hline(0, 16, 5, "j"), px(0, 17, "s"), px(4, 16, "e"), px(4, 17, "C"),
  rect(3, 18, 2, 3, "s"), px(3, 19, "h"), px(4, 18, "h"), px(4, 20, "h"),
  rect(3, 21, 2, 2, "H"), px(4, 22, "e"),
  glow("ew", { r: 3, strength: 0.7 }))

// ================================================================ enemies

sprite("drone", { w: 19, h: 15, mx: "c", outline: "k" },
  rect(0, 4, 3, 7, "V"), rect(0, 5, 2, 4, "v"), px(0, 5, "u"),
  ellipse(9, 7, 7, 6, "P"),
  ellipse(9, 5, 6, 3, "p"), hline(5, 2, 5, "q"),
  ellipse(9, 7, 7, 6, "m", true),
  hline(3, 9, 7, "m"),
  circ(9, 8, 3, "m"), circ(9, 8, 2, "r"), px(9, 8, "w"), px(8, 7, "q"),
  poly([7, 12, 9, 15, 10, 15, 10, 12], "P"),
  glow("rw", { r: 3, strength: 0.5 }))

sprite("dart", { w: 15, h: 19, mx: "c", outline: "k" },
  poly([0, 0, 3, 0, 8, 12, 8, 19, 6, 15], "P"),
  poly([3, 1, 8, 3, 8, 17, 6, 12], "p"),
  line(1, 0, 5, 9, "q"),
  rect(6, 4, 2, 5, "m"), px(7, 5, "q"),
  rect(6, 11, 2, 4, "q"), px(7, 12, "w"),
  hline(4, 8, 3, "m"),
  glow("qw", { r: 3, strength: 0.45 }))

sprite("gunner", { w: 23, h: 19, mx: "c", outline: "k" },
  // swept wings (enemies fly down, so the wings sweep towards the top)
  poly([0, 1, 7, 4, 8, 12, 3, 13, 0, 9], "O"),
  poly([1, 3, 7, 5, 7, 11, 3, 11, 1, 8], "o"),
  line(0, 1, 7, 4, "a"), hline(2, 10, 4, "O"), px(1, 8, "r"),
  // hull, nose pointing down
  poly([8, 0, 12, 0, 12, 19, 10, 19, 7, 13, 7, 3], "o"),
  poly([7, 3, 7, 13, 9, 16, 9, 4], "O"),
  hline(8, 1, 4, "a"), hline(9, 5, 3, "O"), hline(9, 13, 3, "O"),
  // twin cannons
  rect(4, 12, 3, 7, "s"), rect(5, 12, 1, 6, "H"), rect(4, 17, 3, 2, "n"), px(5, 18, "a"),
  // cockpit slit on the centre line
  rect(10, 7, 2, 5, "m"), vline(11, 7, 5, "P"), px(11, 8, "q"), px(11, 9, "w"),
  glow("aqrw", { r: 3, strength: 0.4 }))

sprite("tank", { w: 29, h: 25, mx: "c", outline: "k" },
  rect(0, 5, 4, 15, "n"), ...[0, 1, 2, 3, 4, 5, 6].map((i) => hline(0, 6 + i * 2, 4, "s")),
  poly([6, 0, 15, 0, 15, 25, 6, 25, 3, 21, 3, 4], "V"),
  poly([6, 1, 15, 1, 15, 10, 4, 10, 4, 4], "v"),
  hline(4, 10, 11, "V"), hline(4, 17, 11, "m"),
  line(6, 1, 14, 1, "u"), px(5, 3, "u"),
  hline(6, 4, 7, "V"), hline(6, 6, 7, "V"), hline(6, 8, 7, "V"), hline(6, 3, 7, "u"),
  circ(14, 13, 6, "V"), circ(14, 13, 5, "m"), circ(14, 13, 4, "P"), circ(14, 13, 2, "p"), px(14, 13, "w"), px(13, 12, "q"),
  circ(7, 20, 2, "s"), vline(7, 20, 5, "H"), px(7, 24, "q"),
  glow("pqw", { r: 4, strength: 0.4 }))

sprite("boss_warden", { w: 67, h: 52, mx: "c", outline: "k" },
  // wings
  poly([0, 18, 17, 13, 23, 36, 9, 47, 0, 41], "V"),
  poly([2, 20, 16, 15, 21, 34, 9, 44, 2, 39], "v"),
  line(3, 26, 18, 21, "V"), line(4, 33, 20, 28, "V"), line(5, 39, 20, 35, "V"),
  line(0, 18, 17, 13, "u"), px(1, 19, "W"),
  ...[0, 1, 2].map((i) => rect(4 + i * 4, 23 + i * 1, 2, 2, "q")),
  // engine pods
  rect(8, 39, 7, 11, "n"), rect(9, 40, 5, 9, "s"), vline(9, 40, 9, "h"), rect(9, 49, 5, 2, "O"), rect(10, 50, 3, 2, "a"),
  // hull
  poly([33, 0, 34, 0, 34, 50, 23, 46, 15, 34, 19, 11, 26, 3], "P"),
  poly([26, 3, 19, 11, 15, 34, 17, 35, 21, 12, 27, 5], "m"),
  line(26, 3, 33, 1, "q"), line(21, 11, 26, 5, "q"),
  line(19, 30, 33, 36, "m"), line(18, 24, 24, 27, "m"),
  // cannons
  rect(21, 38, 4, 12, "s"), rect(22, 38, 2, 11, "H"), rect(21, 48, 4, 3, "n"), px(22, 50, "q"),
  // mandible
  poly([27, 40, 31, 52, 34, 52, 34, 44], "P"), line(28, 41, 31, 50, "q"),
  // core
  circ(33, 22, 10, "V"), circ(33, 22, 9, "m"), circ(33, 22, 7, "P"), circ(33, 22, 5, "p"),
  circ(33, 22, 3, "q"), circ(33, 22, 1, "w"), px(31, 20, "w"),
  ring(33, 22, 11, "u"),
  // sensors
  rect(27, 8, 3, 2, "r"), px(28, 8, "w"),
  glow("pqrw", { r: 6, strength: 0.45 }))

// ================================================================ enemy fire

// enemy bullets per planet live in art/planets.px.js
sprite("emissile", { w: 7, h: 12, mx: "c", outline: "m" },
  rect(1, 2, 2, 7, "s"), vline(2, 1, 9, "H"), px(3, 0, "w"), rect(2, 0, 2, 2, "r"),
  rect(0, 6, 2, 3, "P"), px(0, 6, "p"),
  rect(2, 9, 2, 2, "a"), px(3, 11, "o"),
  glow("raw", { r: 2, strength: 0.6 }))

// ================================================================ pickups

sprite("xp", { w: 5, h: 7 }, poly([2, 0, 3, 0, 5, 3, 3, 7, 2, 7, 0, 3], "c"),
  poly([2, 0, 3, 0, 3, 7, 2, 7, 0, 3], "e"), px(2, 1, "w"), px(1, 3, "w"), px(4, 4, "C"), px(3, 5, "C"),
  glow("e", { r: 2, strength: 0.6 }))

sprite("xp_big", { w: 7, h: 10 }, poly([3, 0, 4, 0, 7, 4, 4, 10, 3, 10, 0, 4], "Y"),
  poly([3, 0, 4, 0, 4, 10, 3, 10, 0, 4], "y"), vline(3, 1, 3, "w"), px(1, 4, "w"), px(2, 3, "w"),
  px(5, 5, "a"), px(4, 7, "a"),
  glow("y", { r: 3, strength: 0.6 }))

sprite("heart", { w: 11, h: 10, mx: "c", outline: "k" },
  circ(3, 3, 3, "g"), poly([0, 3, 6, 3, 6, 10, 5, 10], "g"),
  poly([0, 4, 5, 9, 6, 9, 6, 10, 5, 10, 0, 5], "G"), px(2, 1, "w"), px(1, 2, "w"), px(2, 2, "W"),
  glow("g", { r: 3, strength: 0.4 }))

// shield pickup: a cyan hex badge with a white chevron
sprite("shield", { w: 11, h: 12, mx: "c", outline: "k" },
  poly([5, 0, 6, 0, 6, 12, 5, 12, 0, 9, 0, 3], "C"), poly([5, 1, 6, 1, 6, 11, 5, 11, 1, 8, 1, 4], "c"),
  poly([5, 2, 6, 2, 6, 9, 5, 9, 2, 7, 2, 5], "e"), vline(5, 3, 5, "w"), px(4, 4, "w"), px(3, 5, "W"),
  glow("e", { r: 3, strength: 0.6 }))

sprite("magnet", { w: 11, h: 11, outline: "k" },
  rect(0, 0, 3, 8, "p"), rect(8, 0, 3, 8, "p"), rect(0, 7, 11, 4, "p"), rect(3, 7, 5, 1, "P"),
  rect(0, 9, 11, 2, "P"), vline(0, 3, 6, "q"),
  rect(0, 0, 3, 2, "W"), rect(8, 0, 3, 2, "W"), px(0, 0, "w"), px(8, 0, "w"))

// ================================================================ external hardware (separate from the hull)
// Pulse Cannon and Hull Plating are drawn into the ship sprites above. The two weapons that are their own
// hardware get overlays: missile racks under the wings (Seeker Darts) and a prism on the nose (Prism Laser).
// Each overlay is 37x32 (39x34 with outline), centred on the ship: ship-art pixel (x, y) is overlay pixel (x + 6, y + 2).
const ATT = { w: 37, h: 32, mx: "c", outline: "k" };

// a hanging missile: same look as the fired "seeker" (red warhead, gunmetal body, violet band)
const rackMissile = (x, y) => [
  px(x + 1, y, "r"), rect(x, y + 1, 2, 2, "R"), px(x + 1, y + 1, "q"),
  rect(x, y + 3, 2, 6, "h"), vline(x + 1, y + 3, 6, "H"), hline(x, y + 4, 2, "v"),
  hline(x, y + 9, 2, "s"),
]
const pylon = (x0, x1, y) => hline(x0, y, x1 - x0 + 1, "s")

// Seeker Darts: one missile per wing, then two, then a four-cell launcher pod
sprite("att_seeker_1", ATT, ...rackMissile(4, 15), pylon(6, 7, 20))
sprite("att_seeker_2", ATT, ...rackMissile(4, 15), ...rackMissile(1, 17), pylon(3, 7, 21))
sprite("att_seeker_3", ATT,
  rect(0, 14, 7, 12, "s"), rect(1, 15, 5, 10, "h"), vline(1, 15, 10, "H"), hline(0, 25, 7, "n"),
  ...[[1, 15], [4, 15], [1, 19], [4, 19]].flatMap(([x, y]) => [rect(x, y, 2, 3, "n"), px(x, y, "r"), px(x + 1, y, "r"), px(x, y + 1, "W")]),
  pylon(7, 9, 20),
  glow("r", { r: 2, strength: 0.4 }))

// Prism Laser: a laser cannon slung under the nose. Gunmetal barrel housing with charge-coil bands and a
// small focusing lens at the muzzle; it grows longer and gains side emitters with each core level.
// (Overlay x 17-19 = the ship's centre line; overlay y 2 = the ship's nose tip.)
const laserBarrel = (top, len) => [
  rect(17, top, 3, len, "s"), vline(17, top, len, "h"), vline(19, top, len, "n"), // housing, lit from the left
  px(18, top - 1, "P"), px(18, top, "q"), // focusing lens at the muzzle
  ...Array.from({ length: Math.floor((len - 3) / 3) }, (_, i) => hline(17, top + 3 + i * 3, 3, "p")), // charge coils
]
sprite("att_laser_1", ATT, ...laserBarrel(1, 8), glow("q", { r: 2, strength: 0.6 }))
sprite("att_laser_2", ATT, ...laserBarrel(0, 10),
  rect(14, 9, 2, 5, "s"), vline(14, 9, 5, "h"), px(14, 8, "q"), hline(14, 11, 2, "p"), // side emitters
  glow("q", { r: 2, strength: 0.6 }))
sprite("att_laser_3", ATT, ...laserBarrel(0, 12),
  rect(15, 3, 1, 7, "n"), // heavier shroud
  rect(13, 8, 2, 7, "s"), vline(13, 8, 7, "h"), px(13, 7, "q"), hline(13, 10, 2, "p"), hline(13, 13, 2, "p"),
  glow("pq", { r: 3, strength: 0.7 }))

// Previews only (not in the atlas): ships with hardware, to check alignment.
scene("loadout_max", { w: 39, h: 34 }, stamp("att_seeker_3", 0, 0), stamp("ship_vanguard_32", 6, 2), stamp("att_laser_3", 0, 0))
scene("loadout_mid", { w: 39, h: 34 }, stamp("att_seeker_1", 0, 0), stamp("ship_vanguard_21", 6, 2), stamp("att_laser_1", 0, 0))
for (const id of ["vanguard", "viper", "bastion", "phantom", "halo", "raptor", "paladin"])
  scene(`evo_${id}`, { w: 4 * 29, h: 3 * 32 }, ...[0, 1, 2, 3].flatMap((c) => [0, 1, 2].map((a) => stamp(`ship_${id}_${c}${a}`, c * 29, a * 32))))
scene("projectiles", { w: 52, h: 26 }, stamp("seeker", 0, 0), stamp("blade", 10, 0), stamp("puff", 24, 0), stamp("bullet", 30, 0), stamp("shield", 38, 0))

sheet("atlas", ["ship_*", "mech_*", "paladin_morph","fx_launch", "fx_hatch", "flame", "bullet", "seeker", "puff", "blade", "drone", "dart", "gunner", "tank", "boss_warden",
  "emissile", "xp", "xp_big", "heart", "magnet", "shield", "att_*"], { pad: 2 })
