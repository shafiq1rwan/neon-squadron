// Planet 5: OBSIDIAN · THE CORE (final world). Build: npm run art -- p5
// Faction "Void Legion": near-black gunmetal armour, CRIMSON glowing seams and cores, pale steel rim light,
// thin gold trim on the boss. Ground is black obsidian glass with a crimson void rift.
// Top-down, enemies face DOWN (front at the bottom). Symmetric sprites use mx: "c" (draw the left half).

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
  i: "#1c3550", // ice ramp, dark -> pale
  I: "#3a6a96",
  b: "#7fb0dc",
  B: "#c4e2ff",
  L: "#5f9a1c", // toxic lime ramp
  l: "#c8ff4a",
  d: "#1a1619", // rock / scrap metal ramp (landmarks)
  D: "#2a2429",
  f: "#40363a",
  F: "#5a4c4e",
  t: "#3a1a14", // red rock ramp (planet 1)
  T: "#6a2e1e",
  x: "#a04a2a",
  z: "#2a1640", // deep chitin
  // --- added for planet 5 ---
  A: "#120f14", // Void Legion armour, darkest -> light
  E: "#211c26",
  J: "#2f2936",
  K: "#433b4c",
  S: "#7e7890", // pale steel rim light
  U: "#c6c0d6",
  R: "#4a0a1a", // crimson void ramp
  M: "#8a1428",
  Q: "#ff3b4a",
  X: "#ff8a95",
  Z: "#ffc0c8",
  0: "#0e0b0d", // obsidian ground ramp
  1: "#1a1418",
  2: "#261d22",
  3: "#35282f",
  4: "#4a3842",
})
ramps("knshHjW", "kmPpq", "kCce", "kVvu", "kOoa", "Yy", "kGLl", "kiIbB", "dDfF", "ktTx", "kzVv", "kAEJKSU", "kRMQXZ", "01234")

const GLOW_CORE = { r: 3, strength: 0.6 }

// ================================================================ Void Legion

// shade: a wraith-like void drone. Ragged cloak trailing behind (top), a crimson eye at the front (bottom).
sprite("shade", { w: 19, h: 15, mx: "c", outline: "k" },
  // tattered veil: three ragged tendrils trailing behind (top), narrowing to a hood at the front (bottom)
  poly([0, 0, 2, 5, 4, 1, 6, 5, 8, 2, 9, 4, 9, 14, 7, 13, 3, 8, 0, 4], "E"),
  poly([3, 5, 6, 6, 9, 6, 9, 12, 7, 11, 4, 8], "A"),
  // flared veil arms
  poly([0, 4, 3, 8, 1, 10], "J"), px(0, 4, "S"), line(1, 9, 3, 8, "K"),
  // rim light on the tendril tips
  px(0, 0, "U"), px(4, 1, "S"), px(8, 2, "S"), line(0, 1, 1, 3, "K"),
  // crimson seams running down the veil into the hood
  line(2, 4, 6, 10, "M"), line(4, 3, 7, 9, "Q"),
  // hood and eye
  line(6, 9, 8, 8, "K"), circ(9, 11, 2, "R"), px(9, 11, "Q"), px(9, 12, "Z"), px(8, 11, "M"),
  glow("QZ", { r: 2, strength: 0.4 }))

// lance: a spear-shaped chaser. Swept back-blades (top), a long pale steel spearhead (bottom).
sprite("lance", { w: 15, h: 19, mx: "c", outline: "k" },
  poly([0, 1, 4, 0, 6, 8, 3, 9], "E"), line(0, 1, 4, 0, "S"), line(1, 2, 4, 7, "M"),
  poly([4, 0, 7, 0, 7, 14, 5, 12, 4, 4], "J"), vline(5, 2, 9, "K"), px(5, 1, "U"),
  vline(7, 2, 11, "M"), vline(7, 4, 7, "Q"), px(7, 6, "Z"),
  poly([5, 12, 7, 12, 7, 19, 6, 19], "S"), vline(6, 13, 4, "U"), px(7, 18, "Z"),
  glow("QZ", GLOW_CORE))

// sentinel: an armoured gunner. Heavy shoulder plates, a crimson core, twin emitters at the bottom.
sprite("sentinel", { w: 23, h: 19, mx: "c", outline: "k" },
  // shoulder plates
  poly([0, 3, 6, 1, 8, 9, 3, 12, 0, 9], "E"), poly([1, 4, 6, 2, 7, 8, 3, 10, 1, 8], "J"),
  line(0, 3, 6, 1, "U"), px(0, 4, "S"), line(2, 6, 6, 5, "Q"), px(2, 6, "X"),
  // hull
  poly([7, 0, 11, 0, 11, 16, 8, 15, 6, 8], "K"), poly([8, 3, 11, 3, 11, 13, 9, 12], "E"),
  hline(7, 0, 5, "U"), line(6, 8, 7, 1, "S"),
  // twin emitters
  rect(5, 12, 3, 7, "A"), vline(6, 12, 6, "J"), px(5, 12, "S"), rect(5, 18, 3, 1, "R"), px(6, 18, "Q"),
  // core
  circ(11, 7, 3, "R"), circ(11, 7, 2, "M"), px(11, 7, "Z"), px(10, 6, "X"),
  line(9, 11, 10, 15, "M"),
  glow("QXZ", GLOW_CORE))

// colossus: a massive armoured juggernaut with a crimson core and ram horns.
sprite("colossus", { w: 29, h: 27, mx: "c", outline: "k" },
  // side treads
  rect(0, 4, 4, 19, "A"), ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => hline(0, 5 + i * 2, 4, "E")), vline(0, 4, 19, "J"),
  // hull
  poly([5, 0, 14, 0, 14, 27, 5, 27, 2, 23, 2, 4], "E"),
  poly([5, 1, 14, 1, 14, 10, 3, 10, 3, 4], "K"), line(5, 1, 13, 1, "U"), line(3, 4, 5, 1, "S"),
  hline(3, 10, 12, "M"), hline(3, 19, 12, "R"), line(3, 11, 3, 22, "J"),
  // vents
  hline(6, 4, 6, "J"), hline(6, 6, 6, "J"), hline(6, 8, 6, "J"),
  // core
  circ(14, 14, 6, "A"), circ(14, 14, 5, "R"), circ(14, 14, 4, "M"), circ(14, 14, 2, "Q"), px(14, 14, "Z"), px(13, 13, "Z"),
  ring(14, 14, 6, "S"),
  // flank guns
  circ(7, 20, 2, "J"), vline(7, 20, 5, "K"), px(7, 25, "Q"),
  // ram horns
  poly([9, 23, 12, 27, 14, 27, 13, 23], "S"), line(10, 24, 12, 26, "U"),
  glow("QZ", GLOW_CORE))

// THE SOVEREIGN: a dark throne-ship, crown of spikes, gold trim, a crimson slit eye, gun ports along the bottom.
// a crown spike: thick base on the hull, leaning outward, steel-lit left edge, gold tip
const spike = (bx, by, tx, ty) => [poly([bx - 3, by, tx, ty, bx + 3, by], "J"), poly([bx, by, tx, ty, bx + 3, by], "E"),
  line(bx - 3, by, tx, ty, "S"), px(tx, ty, "y"), px(tx, ty + 1, "Y")]
sprite("boss_sovereign", { w: 71, h: 58, mx: "c", outline: "k" },
  // crown of spikes rising from the throne
  ...spike(15, 13, 10, 3), ...spike(22, 10, 19, 1), ...spike(29, 8, 27, 0),
  poly([32, 8, 35, 0, 36, 0, 36, 8], "J"), line(32, 8, 35, 0, "S"), px(35, 0, "y"), px(35, 1, "Y"),
  // wings / side armour
  poly([0, 22, 10, 16, 17, 40, 7, 49, 0, 41], "E"), poly([2, 24, 10, 18, 15, 38, 7, 46, 2, 40], "J"),
  line(0, 22, 10, 16, "U"), line(3, 30, 12, 27, "R"), line(4, 37, 14, 34, "R"), line(2, 26, 9, 22, "Q"),
  // wing guns
  rect(4, 44, 4, 9, "A"), vline(5, 44, 8, "K"), rect(4, 52, 4, 2, "R"), px(5, 53, "Q"),
  // main hull
  poly([35, 5, 36, 5, 36, 56, 26, 52, 14, 42, 8, 26, 14, 12, 24, 8], "E"),
  poly([35, 13, 36, 13, 36, 48, 28, 45, 20, 36, 16, 25, 22, 16], "A"),
  // throne back plate with gold trim
  poly([22, 10, 35, 4, 36, 4, 36, 12, 24, 14], "K"), line(22, 10, 35, 4, "y"), line(24, 14, 35, 12, "Y"),
  line(14, 12, 24, 8, "y"), line(8, 26, 14, 12, "Y"), line(14, 42, 26, 52, "Y"), line(26, 52, 35, 56, "y"),
  line(9, 26, 14, 13, "S"),
  // crimson seams
  line(16, 25, 22, 16, "Q"), line(20, 37, 28, 45, "M"), line(11, 30, 15, 41, "M"), line(17, 26, 21, 35, "R"),
  // gun ports along the bottom edge
  ...[0, 1, 2, 3, 4].flatMap((i) => { const x = Math.round(16 + i * 4.3), y = Math.round(42 + i * 2.4); return [rect(x, y, 2, 3, "A"), px(x + 1, y + 2, "Q")] }),
  // the eye
  circ(35, 28, 11, "A"), ring(35, 28, 11, "Y"), circ(35, 28, 9, "R"), circ(35, 28, 7, "M"), circ(35, 28, 5, "Q"),
  circ(35, 28, 3, "X"), vline(35, 21, 15, "R"), vline(35, 23, 11, "A"), px(32, 25, "Z"), px(33, 24, "Z"), px(31, 26, "w"),
  glow("QXZ", { r: 5, strength: 0.5 }))

// enemy bullet: crimson ring, white core (same build as the other planets' bullets)
const octa = (o, c) => poly([2 + o, o, 6 - o, o, 8 - o, 2 + o, 8 - o, 6 - o, 6 - o, 8 - o, 2 + o, 8 - o, o, 6 - o, o, 2 + o], c)
sprite("ebullet_r", { w: 8, h: 8, outline: "k" },
  octa(0, "M"), octa(1, "Q"), rect(2, 2, 4, 4, "X"), rect(3, 2, 2, 4, "w"), rect(2, 3, 4, 2, "w"),
  glow("QX", { r: 2, strength: 0.6 }))

// ================================================================ planet icon (48x48, no outline)

const lit = (cx, cy, r, base, mid, hi) => [circ(cx, cy, r, base), clip([cx, cy, r], circ(cx - 3, cy - 3, r - 2, mid), circ(cx - 7, cy - 7, r - 9, hi))]
const night = (cx, cy, r) => [shade([cx + 13, cy + 13, r + 1], 1, 0.5), shade([cx + 16, cy + 16, r + 1], 1), shade([cx + 24, cy + 24, r + 1], 1)]
sprite("planet_5", { w: 48, h: 48 },
  ring(24, 24, 23, "M"),
  ...lit(24, 24, 22, "1", "2", "4"),
  // glassy facets
  line(10, 14, 18, 10, "3"), line(13, 30, 20, 24, "3"), px(16, 12, "4"),
  // glowing crimson cracks
  line(7, 22, 16, 25, "R", 2), line(16, 25, 25, 20, "R", 2), line(25, 20, 33, 26, "R", 2), line(33, 26, 41, 22, "R"),
  line(18, 33, 27, 30, "R", 2), line(27, 30, 34, 37, "R"), line(22, 9, 25, 15, "R"),
  line(8, 22, 16, 24, "Q"), line(17, 24, 24, 20, "Q"), line(26, 21, 32, 25, "X"), line(19, 32, 26, 30, "Q"), line(23, 10, 24, 14, "M"),
  px(12, 27, "Q"), px(30, 31, "M"),
  ...night(24, 24, 22),
  glow("QXM", { r: 3, strength: 0.4 }))

// ================================================================ ground turret

sprite("turret_5_base", { w: 17, h: 17, mx: "c", outline: "k" },
  poly([4, 0, 9, 0, 9, 17, 4, 17, 0, 13, 0, 4], "E"),
  poly([5, 2, 9, 2, 9, 15, 5, 15, 2, 12, 2, 5], "J"),
  line(0, 4, 4, 0, "S"), hline(4, 0, 5, "U"),
  px(2, 4, "K"), px(2, 12, "A"), px(5, 1, "S"), px(5, 15, "A"),
  ring(8, 8, 5, "R"), circ(8, 8, 4, "A"), hline(1, 8, 2, "Q"), px(8, 1, "M"),
  glow("Q", { r: 2, strength: 0.5 }))

// gun: pivot hub at the exact sprite centre (4, 10); barrel points up; the lower half stays mostly empty
sprite("turret_5_gun", { w: 9, h: 21, mx: "c", outline: "k" },
  rect(3, 1, 2, 7, "J"), vline(3, 1, 7, "K"),
  rect(2, 0, 3, 2, "K"), hline(2, 0, 3, "S"), px(4, 0, "X"), px(4, 1, "Q"),
  hline(3, 4, 2, "M"),
  rect(0, 7, 5, 7, "E"), rect(1, 8, 4, 5, "J"), hline(1, 8, 4, "S"), vline(0, 8, 5, "K"),
  px(0, 7, "_"), px(0, 13, "_"), hline(1, 12, 4, "A"),
  circ(4, 10, 1, "M"), px(4, 10, "Z"),
  glow("QXZ", { r: 2, strength: 0.6 }))

// ================================================================ landmarks (subdued, behind gameplay)

// a tall obsidian obelisk on a stepped plinth, faint crimson runes, a long shadow
sprite("lm_obelisk", { w: 26, h: 58, outline: "0" },
  poly([13, 52, 25, 50, 26, 58, 12, 58], "0"), // shadow on the ground
  rect(3, 48, 20, 8, "2"), rect(3, 48, 20, 2, "3"), rect(5, 44, 16, 5, "3"), hline(5, 44, 16, "4"),
  poly([13, 0, 18, 8, 18, 45, 8, 45, 8, 8], "2"),
  poly([13, 0, 13, 45, 8, 45, 8, 8], "3"), line(8, 8, 13, 0, "4"),
  ...[12, 18, 24, 30, 36].map((y) => hline(10, y, 2, "R")), px(11, 15, "R"), px(15, 21, "R"), px(11, 27, "M"), px(15, 33, "R"),
  px(13, 2, "4"),
  glow("M", { r: 2, strength: 0.3 }))

// a ruined void gate: two broken pillars, a fallen arch segment, a faint rift between them
sprite("lm_gate", { w: 60, h: 40, outline: "0" },
  // the rift
  ellipse(30, 22, 13, 9, "R"), dither(19, 16, 22, 12, "R", "1", 0.5), ellipse(30, 22, 6, 4, "M"),
  // pillars
  rect(6, 6, 9, 30, "2"), rect(6, 6, 3, 30, "3"), rect(4, 33, 13, 5, "3"), hline(4, 33, 13, "4"),
  rect(45, 12, 9, 24, "2"), rect(45, 12, 3, 24, "3"), rect(43, 33, 13, 5, "3"), hline(43, 33, 13, "4"),
  // broken tops
  poly([6, 6, 10, 2, 15, 5, 15, 8, 6, 8], "3"), poly([45, 12, 49, 10, 54, 13, 54, 14, 45, 14], "3"),
  // the fallen arch: three toppled stone blocks with lit top edges
  poly([15, 4, 22, 2, 23, 7, 16, 9], "2"), line(15, 4, 22, 2, "4"), line(16, 9, 23, 7, "1"),
  poly([24, 1, 30, 0, 31, 5, 25, 6], "3"), line(24, 1, 30, 0, "4"), px(27, 3, "R"),
  poly([32, 2, 38, 4, 36, 9, 31, 7], "2"), line(32, 2, 38, 4, "4"),
  // rubble and runes
  rect(38, 36, 4, 3, "2"), rect(19, 35, 3, 2, "3"), px(8, 18, "R"), px(8, 24, "R"), px(47, 22, "R"),
  glow("M", { r: 3, strength: 0.35 }))

// ================================================================ ground decorations (subdued, ground-ramp outline)

sprite("deco_5_shard", { w: 11, h: 15, outline: "0" },
  poly([4, 15, 11, 13, 9, 15], "0"), // shadow
  poly([3, 0, 7, 4, 8, 14, 2, 14, 1, 6], "2"), poly([3, 0, 4, 14, 2, 14, 1, 6], "3"), line(1, 6, 3, 0, "4"), px(6, 6, "1"))

sprite("deco_5_vein", { w: 21, h: 9, outline: "1" },
  line(0, 5, 6, 3, "R", 2), line(6, 3, 13, 5, "R", 2), line(13, 5, 20, 2, "R"), line(9, 4, 11, 8, "R"),
  line(1, 5, 6, 3, "M"), line(7, 3, 12, 4, "Q"), line(14, 4, 19, 2, "M"), px(10, 6, "M"),
  glow("Q", { r: 2, strength: 0.4 }))

sprite("deco_5_spire", { w: 13, h: 17, outline: "0" },
  poly([5, 16, 13, 13, 12, 17, 4, 17], "0"), // shadow
  poly([5, 0, 9, 9, 11, 16, 1, 16, 2, 8], "2"), poly([5, 0, 6, 16, 1, 16, 2, 8], "3"), line(2, 8, 5, 0, "4"),
  poly([8, 5, 11, 3, 9, 9], "2"), px(5, 1, "4"))

sprite("deco_5_skull", { w: 13, h: 11, outline: "0" },
  ellipse(6, 5, 6, 5, "3"), ellipse(5, 4, 4, 3, "4"), circ(4, 5, 1, "0"), circ(8, 5, 1, "0"), px(4, 5, "R"),
  rect(4, 8, 5, 3, "3"), vline(5, 8, 3, "1"), vline(7, 8, 3, "1"), line(9, 1, 11, 3, "2"))

sprite("deco_5_brazier", { w: 11, h: 11, outline: "0" },
  ellipse(5, 7, 5, 3, "2"), ellipse(5, 6, 4, 2, "3"), ellipse(5, 6, 3, 1, "R"),
  poly([3, 6, 5, 0, 7, 6], "M"), poly([4, 6, 5, 2, 6, 6], "Q"), px(5, 4, "Z"),
  px(1, 9, "1"), px(9, 9, "1"),
  glow("QZ", { r: 2, strength: 0.5 }))

// ================================================================ previews (not in the atlas)
scene("_p5_enemies", { w: 200, h: 64, bg: "1" },
  stamp("shade", 2, 2), stamp("lance", 26, 2), stamp("sentinel", 46, 2), stamp("colossus", 74, 2), stamp("boss_sovereign", 106, 2),
  stamp("ebullet_r", 2, 30), stamp("turret_5_base", 20, 30), stamp("turret_5_gun", 21, 28), stamp("planet_5", 150, 14))
scene("_p5_ground", { w: 190, h: 64, bg: "1" },
  stamp("lm_obelisk", 2, 2), stamp("lm_gate", 32, 10), stamp("deco_5_shard", 98, 4), stamp("deco_5_vein", 114, 6),
  stamp("deco_5_spire", 140, 2), stamp("deco_5_skull", 158, 4), stamp("deco_5_brazier", 176, 4))

sheet("atlas_p5", ["shade", "lance", "sentinel", "colossus", "boss_sovereign", "ebullet_r", "planet_5", "turret_5_base", "turret_5_gun",
  "lm_obelisk", "lm_gate", "deco_5_shard", "deco_5_vein", "deco_5_spire", "deco_5_skull", "deco_5_brazier"], { pad: 2 })
