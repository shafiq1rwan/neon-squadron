// Neon Squadron ground art (pxl DSL): turrets, structures, scorch decal, floating mine.
// Top-down view. Build: node .claude/skills/pxl-pixel-art/bin/pxl.js build art/ground.px.js --out art/out_ground

pal({
  k: "#0a0718", // outline
  n: "#141029", // hull ramp, darkest -> lightest
  s: "#262449",
  h: "#3d4277",
  H: "#6470b3",
  j: "#9aa8e6",
  W: "#dfe6ff",
  w: "#ffffff",
  C: "#0b5d7a", // cyan ramp
  c: "#18a8c9",
  e: "#2df4ff",
  m: "#3e0628", // magenta ramp
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
  // --- added for planets 2/3 ---
  i: "#1c3550", // ice ramp, dark -> pale
  I: "#3a6a96",
  b: "#7fb0dc",
  B: "#c4e2ff",
  L: "#5f9a1c", // toxic lime ramp
  l: "#c8ff4a",
  d: "#1a1619", // rock / scrap metal ramp
  D: "#2a2429",
  f: "#40363a",
  F: "#5a4c4e",
  t: "#3a1a14", // red rock ramp (planet 1)
  T: "#6a2e1e",
  x: "#a04a2a",
  z: "#2a1640", // deep chitin
  // --- added for ground structures ---
  R: "#8a1020", // dark red (fuel tank shade)
  A: "#7a7480", // concrete ramp, mid
  E: "#a29ca6", // concrete light
})
ramps("knshHjW", "kmPpq", "kCce", "kVvu", "kOoa", "Yy", "kGLl", "kiIbB", "dDfF", "ktTx", "kzVv", "dfAE")

// ================================================================ turrets
// Each turret = a static base + a gun head that rotates around the exact sprite centre.
// Guns: hub centred in the sprite, barrel pointing up (y = 0), lower half empty.

// ---- planet 1: magenta war-mech pad
sprite("turret_1_base", { w: 17, h: 17, mx: "c", outline: "k" },
  poly([4, 0, 9, 0, 9, 17, 4, 17, 0, 13, 0, 4], "V"),
  poly([5, 1, 9, 1, 9, 16, 5, 16, 1, 12, 1, 5], "v"),
  line(1, 5, 5, 1, "u"), hline(5, 1, 4, "u"),
  poly([6, 3, 9, 3, 9, 14, 6, 14, 3, 11, 3, 6], "V"),
  circ(8, 8, 4, "m"), ring(8, 8, 4, "P"),
  px(3, 3, "u"), px(3, 13, "s"), px(1, 8, "u"), px(8, 1, "W"),
  px(6, 15, "p"))
sprite("turret_1_gun", { w: 9, h: 21, mx: "c", outline: "k" },
  // barrel with a muzzle brake and a recoil sleeve
  // gunmetal (contrasts with the magenta pad), magenta muzzle and core
  rect(3, 2, 2, 6, "s"), vline(3, 2, 6, "h"),
  rect(2, 0, 3, 2, "h"), hline(2, 0, 3, "H"), px(4, 0, "q"), px(4, 1, "p"),
  rect(2, 5, 3, 2, "n"), hline(2, 5, 3, "s"),
  // armoured housing around the pivot (centre 4,10)
  rect(0, 7, 5, 7, "s"), rect(1, 8, 4, 5, "h"), hline(1, 8, 4, "H"), vline(0, 8, 5, "h"),
  px(0, 7, "_"), px(0, 13, "_"), hline(1, 12, 4, "s"),
  circ(4, 10, 1, "P"), px(4, 10, "q"),
  glow("q", { r: 2, strength: 0.6 }))

// ---- planet 2: cryo-mech pad, pale armour, amber core
sprite("turret_2_base", { w: 17, h: 17, mx: "c", outline: "k" },
  poly([4, 0, 9, 0, 9, 17, 4, 17, 0, 13, 0, 4], "I"),
  poly([5, 1, 9, 1, 9, 16, 5, 16, 1, 12, 1, 5], "b"),
  line(1, 5, 5, 1, "B"), hline(5, 1, 4, "B"),
  poly([6, 3, 9, 3, 9, 14, 6, 14, 3, 11, 3, 6], "I"),
  circ(8, 8, 4, "i"), ring(8, 8, 4, "Y"),
  px(3, 3, "W"), px(3, 13, "i"), px(1, 8, "B"),
  px(0, 8, "a"), px(8, 16, "a"),
  glow("a", { r: 2, strength: 0.5 }))
sprite("turret_2_gun", { w: 9, h: 21, mx: "c", outline: "k" },
  // twin heavy barrels tied together by a cooling collar, amber muzzles
  rect(1, 1, 2, 7, "I"), vline(1, 1, 7, "b"), rect(1, 0, 2, 1, "a"), px(2, 0, "y"),
  rect(1, 3, 4, 2, "i"), hline(1, 3, 4, "I"),
  // faceted ice-steel housing, amber core
  rect(0, 7, 5, 7, "I"), rect(1, 8, 4, 5, "b"), hline(1, 8, 4, "B"), vline(0, 8, 5, "b"),
  px(0, 7, "_"), px(0, 13, "_"), hline(1, 12, 4, "I"),
  circ(4, 10, 1, "a"), px(4, 10, "y"),
  glow("ay", { r: 2, strength: 0.6 }))

// ---- planet 3: bio-insect pod with a spitter stalk
sprite("turret_3_base", { w: 17, h: 17, mx: "c", outline: "k" },
  ellipse(8, 8, 8, 8, "z"), ellipse(8, 8, 7, 7, "V"),
  ellipse(7, 7, 5, 5, "v"), line(2, 5, 5, 2, "u"),
  ring(8, 8, 4, "z"), circ(8, 8, 3, "z"),
  px(2, 9, "L"), px(3, 12, "l"), px(5, 14, "L"), px(1, 7, "l"),
  glow("l", { r: 2, strength: 0.5 }))
sprite("turret_3_gun", { w: 9, h: 21, mx: "c", outline: "k" },
  // wide hooked pincer mandibles around a glowing mouth
  px(0, 0, "u"), px(0, 1, "v"), px(0, 2, "v"), px(1, 3, "v"), px(2, 4, "V"), px(1, 2, "V"),
  rect(3, 0, 2, 3, "L"), px(4, 1, "l"), px(4, 0, "l"), px(3, 0, "l"),
  // ribbed neck, wider
  rect(2, 3, 3, 5, "v"), hline(2, 4, 3, "V"), hline(2, 6, 3, "V"), px(2, 3, "u"), px(2, 5, "u"),
  // chitin head around the pivot, with venom sacs
  circ(4, 10, 4, "z"), circ(4, 10, 3, "V"), line(1, 9, 3, 7, "v"), px(2, 8, "u"),
  hline(1, 11, 4, "z"), px(2, 12, "L"), px(4, 10, "l"), px(4, 12, "L"),
  glow("l", { r: 2, strength: 0.6 }))

// ================================================================ structures

sprite("crate", { w: 13, h: 13, mx: "c", outline: "k" },
  rect(0, 0, 7, 13, "f"), rect(1, 1, 6, 11, "D"),
  hline(0, 0, 7, "F"), vline(0, 0, 13, "F"), hline(1, 12, 6, "d"),
  line(1, 1, 6, 6, "f"), line(1, 11, 6, 6, "f"),
  rect(1, 1, 2, 2, "y"), rect(1, 10, 2, 2, "Y"),
  px(6, 1, "e"), px(6, 2, "c"),
  glow("e", { r: 2, strength: 0.6 }))

// fuel tank: a capsule lying on the ground, lit from the left; explodes when shot
const TANK_SHADE = ["R", "r", "r", "a", "r", "r", "r", "r", "r", "r", "R", "R", "m", "m", "m"]
sprite("fuel_tank", { w: 15, h: 19, outline: "k" },
  (c) => {
    for (let x = 0; x < 15; x++) {
      const inset = x === 0 || x === 14 ? 2 : x === 1 || x === 13 ? 1 : 0
      c.vline(x, 2 + inset, 15 - inset * 2, TANK_SHADE[x])
    }
    // hazard band
    for (let y = 8; y <= 10; y++) for (let x = 0; x < 15; x++) if ((x + y) % 4 < 2) c.px(x, y, "y")
    for (let y = 8; y <= 10; y++) for (let x = 0; x < 15; x++) if ((x + y) % 4 >= 2) c.px(x, y, "k")
  },
  // end caps
  rect(3, 0, 9, 2, "f"), hline(3, 0, 9, "F"), rect(3, 17, 9, 2, "D"), hline(3, 18, 9, "d"),
  // valve
  circ(7, 4, 2, "F"), px(6, 3, "E"), px(7, 4, "y"),
  rect(6, 13, 3, 2, "f"), px(7, 13, "a"),
  glow("y", { where: [5, 2, 5, 5], r: 2, strength: 0.4 }))

// bunker: concrete box, panelled roof, gun slits facing the player (bottom), antennas, warning light
sprite("bunker", { w: 31, h: 23, mx: "c", outline: "k" },
  // polys/rects reach x = 16 so the shared centre column (15) is filled
  poly([4, 0, 16, 0, 16, 23, 4, 23, 0, 19, 0, 4], "f"),
  poly([5, 1, 16, 1, 16, 21, 4, 21, 1, 18, 1, 5], "A"),
  line(1, 5, 5, 1, "E"), hline(5, 1, 11, "E"),
  rect(4, 4, 12, 13, "f"), rect(5, 5, 11, 11, "A"),
  hline(5, 10, 11, "f"), vline(10, 5, 11, "f"),
  px(5, 5, "E"), px(11, 5, "E"), px(5, 11, "E"), px(11, 11, "E"),
  rect(2, 21, 14, 2, "D"),
  rect(4, 19, 4, 2, "k"), rect(10, 19, 4, 2, "k"), px(5, 19, "o"), px(11, 19, "o"),
  // antennas on the back corners
  vline(3, 2, 3, "j"), px(3, 1, "W"),
  // warning light on the roof
  circ(15, 8, 2, "D"), px(15, 8, "r"), px(14, 7, "r"),
  // vents
  hline(6, 14, 3, "d"), hline(6, 15, 3, "f"),
  glow("r", { r: 3, strength: 0.6 }))

// scorch: burnt crater left behind (no outline, sits flat on the ground)
sprite("scorch", { w: 21, h: 15 },
  ellipse(10, 7, 10, 7, "d"), ellipse(10, 7, 8, 5, "k"),
  ellipse(9, 6, 4, 3, "d"),
  line(3, 4, 7, 6, "D"), line(16, 3, 13, 6, "D"), line(4, 12, 8, 9, "D"), line(17, 11, 13, 8, "D"),
  px(0, 7, "_"), px(20, 7, "_"), px(1, 3, "_"), px(19, 11, "_"), px(5, 0, "_"), px(15, 14, "_"),
  px(9, 7, "O"), px(12, 8, "o"), px(7, 9, "O"), px(11, 5, "O"),
  glow("o", { r: 2, strength: 0.4 }))

// ================================================================ airborne obstacle

const mine = (lit) => [
  // spikes (8 directions)
  vline(6, 0, 3, "h"), vline(6, 10, 3, "s"), hline(0, 6, 3, "h"), hline(10, 6, 3, "s"),
  line(1, 1, 3, 3, "h"), line(11, 1, 9, 3, "s"), line(1, 11, 3, 9, "s"), line(11, 11, 9, 9, "n"),
  px(6, 0, "j"), px(0, 6, "j"), px(1, 1, "j"),
  // sphere, lit top-left
  circ(6, 6, 4, "s"), circ(5, 5, 3, "h"), circ(5, 5, 1, "H"), px(4, 4, "j"),
  px(8, 9, "n"), px(9, 8, "n"),
  // warning light
  ...(lit ? [circ(7, 7, 1, "r"), px(7, 7, "w")] : [circ(7, 7, 1, "R"), px(7, 7, "m")]),
]
sprite("mine", { w: 13, h: 13, outline: "k" }, ...mine(false))
sprite("mine_lit", { w: 13, h: 13, outline: "k" }, ...mine(true), glow("rw", { r: 3, strength: 0.8 }))

// preview (not in the atlas)
scene("ground_preview", { w: 140, h: 60, bg: "t" },
  stamp("turret_1_base", 2, 2), stamp("turret_1_gun", 6, 1),
  stamp("turret_2_base", 24, 2), stamp("turret_2_gun", 28, 1),
  stamp("turret_3_base", 46, 2), stamp("turret_3_gun", 50, 1),
  stamp("crate", 70, 4), stamp("fuel_tank", 88, 2), stamp("mine", 108, 4), stamp("mine_lit", 124, 4),
  stamp("bunker", 2, 30), stamp("scorch", 40, 34))

sheet("atlas_ground", ["turret_*", "crate", "fuel_tank", "bunker", "scorch", "mine", "mine_lit"], { pad: 2 })
