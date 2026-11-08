// Neon Squadron: planet 2/3 enemies + bosses, enemy bullets, planet icons, background landmarks.
// Build: node .claude/skills/pxl-pixel-art/bin/pxl.js build art/planets.px.js --out art/out_planets
// Top-down view, enemies face DOWN. Symmetric sprites use mx: "c" (odd width, left half drawn).

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
  d: "#1a1619", // rock / scrap metal ramp (landmarks)
  D: "#2a2429",
  f: "#40363a",
  F: "#5a4c4e",
  t: "#3a1a14", // red rock ramp (planet 1)
  T: "#6a2e1e",
  x: "#a04a2a",
  z: "#2a1640", // deep chitin
})
ramps("knshHjW", "kmPpq", "kCce", "kVvu", "kOoa", "Yy", "kGLl", "kiIbB", "dDfF", "ktTx", "kzVv")

// ================================================================ PLANET 2: VELA, cryo-mechs

sprite("shard", { w: 19, h: 15, mx: "c", outline: "k" },
  // steel side fins
  poly([0, 4, 5, 4, 6, 10, 1, 10], "h"), poly([1, 5, 5, 5, 5, 8, 1, 8], "H"), hline(0, 4, 5, "j"),
  // crystal diamond body
  poly([9, 0, 10, 0, 10, 15, 9, 15, 3, 7], "I"),
  poly([9, 0, 10, 0, 10, 7, 3, 7], "b"),
  line(4, 6, 8, 1, "B"), px(9, 0, "W"),
  hline(4, 7, 6, "i"), line(5, 9, 8, 13, "i"),
  // amber core
  circ(9, 8, 2, "O"), circ(9, 8, 1, "o"), px(9, 8, "y"), px(9, 7, "a"),
  glow("oay", { r: 3, strength: 0.5 }))

sprite("spike", { w: 15, h: 19, mx: "c", outline: "k" },
  // steel fins
  poly([0, 1, 4, 0, 5, 6, 1, 5], "h"), line(0, 1, 3, 0, "j"), px(1, 4, "s"),
  // icicle needle
  poly([3, 0, 8, 0, 8, 19, 7, 19], "I"),
  poly([4, 0, 8, 0, 8, 14, 6, 7], "b"),
  line(4, 0, 6, 8, "B"), vline(7, 15, 3, "b"),
  line(5, 9, 7, 16, "i"),
  // amber core
  rect(6, 3, 2, 4, "O"), rect(7, 3, 1, 4, "o"), px(7, 4, "y"),
  px(7, 18, "a"),
  glow("oay", { r: 3, strength: 0.5 }))

sprite("prism", { w: 23, h: 19, mx: "c", outline: "k" },
  // steel wings
  poly([0, 3, 7, 3, 7, 11, 2, 12], "h"), poly([1, 4, 6, 4, 6, 10, 2, 10], "H"), hline(0, 3, 7, "j"),
  vline(3, 6, 4, "s"), px(1, 10, "a"),
  // faceted gem body
  poly([6, 1, 12, 0, 12, 17, 8, 16, 4, 8], "I"),
  poly([7, 1, 12, 0, 12, 8, 5, 8], "b"),
  line(6, 2, 11, 0, "B"), hline(5, 8, 8, "i"),
  poly([9, 9, 12, 9, 12, 16, 10, 15], "i"), line(6, 9, 9, 15, "b"), line(7, 11, 11, 13, "i"),
  // twin emitters
  rect(5, 12, 3, 7, "s"), rect(6, 12, 1, 6, "H"), rect(5, 17, 3, 2, "n"), px(6, 18, "a"),
  // core
  rect(10, 4, 2, 4, "O"), rect(11, 4, 1, 4, "o"), px(11, 5, "y"),
  glow("oay", { r: 3, strength: 0.45 }))

sprite("golem", { w: 29, h: 27, mx: "c", outline: "k" },
  // steel treads
  rect(0, 4, 4, 19, "n"), ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => hline(0, 5 + i * 2, 4, "s")), vline(3, 4, 19, "h"),
  // ice block body
  poly([6, 0, 15, 0, 15, 27, 6, 27, 3, 24, 3, 3], "I"),
  poly([6, 1, 15, 1, 15, 11, 4, 11, 4, 3], "b"),
  hline(6, 1, 9, "B"), px(5, 2, "B"), px(4, 4, "B"),
  line(4, 15, 8, 19, "i"), line(5, 22, 9, 25, "i"), line(9, 4, 11, 8, "I"),
  // steel brace
  rect(3, 11, 12, 3, "h"), hline(3, 11, 12, "H"), px(6, 12, "s"), px(10, 12, "s"),
  // shoulder vents (slits, not round, so they don't read as eyes)
  rect(5, 4, 6, 5, "s"), hline(6, 5, 4, "o"), hline(6, 7, 4, "O"), hline(5, 4, 6, "H"),
  // big amber core
  circ(14, 18, 6, "i"), circ(14, 18, 5, "O"), circ(14, 18, 3, "o"), circ(14, 18, 2, "a"), px(14, 18, "y"), px(14, 17, "w"),
  glow("oayw", { r: 4, strength: 0.45 }))

sprite("boss_rimejaw", { w: 67, h: 52, mx: "c", outline: "k" },
  // steel flippers
  poly([0, 13, 13, 11, 16, 29, 5, 34, 0, 27], "h"),
  poly([1, 15, 12, 13, 14, 27, 5, 31, 1, 25], "H"),
  line(0, 13, 13, 11, "j"), line(3, 20, 13, 18, "h"), line(3, 26, 14, 24, "h"),
  rect(3, 22, 2, 2, "a"), rect(7, 21, 2, 2, "a"),
  // crystal back spines: pointed, swept back, varied heights
  poly([11, 14, 13, 1, 19, 12], "I"), line(13, 2, 12, 12, "b"), px(13, 1, "B"),
  poly([18, 10, 21, 0, 25, 9], "b"), line(21, 1, 19, 9, "B"), line(22, 2, 24, 8, "I"),
  poly([25, 7, 28, 0, 31, 6], "I"), line(28, 1, 26, 6, "b"),
  poly([31, 5, 33, 0, 34, 0, 34, 4], "b"), px(33, 0, "W"),
  // skull / body
  poly([33, 4, 34, 4, 34, 40, 25, 41, 15, 33, 11, 17, 19, 8], "I"),
  poly([33, 5, 34, 5, 34, 21, 14, 21, 19, 9], "b"),
  line(19, 9, 33, 5, "B"), line(14, 20, 18, 11, "B"),
  // armour plate seams on the dome
  line(20, 10, 23, 20, "I"), line(27, 7, 28, 20, "I"), line(15, 15, 22, 15, "I"),
  poly([21, 9, 26, 7, 25, 12, 21, 13], "B"),
  line(16, 27, 25, 31, "i"), line(18, 33, 26, 36, "i"), hline(14, 21, 20, "i"),
  line(20, 27, 21, 34, "i"), line(27, 27, 28, 36, "i"),
  // armour band + visor
  rect(17, 22, 17, 4, "h"), hline(17, 22, 17, "H"), hline(22, 24, 12, "o"), hline(24, 24, 10, "a"), px(33, 24, "y"),
  // upper jaw plates
  poly([17, 34, 25, 38, 34, 38, 34, 41, 24, 42, 15, 36], "h"), line(18, 34, 25, 37, "H"),
  // open jaw with amber glow
  poly([24, 40, 34, 40, 34, 49, 27, 46], "O"),
  poly([26, 41, 34, 41, 34, 47, 29, 45], "o"),
  poly([29, 42, 34, 42, 34, 46, 31, 45], "a"), rect(33, 43, 1, 2, "y"),
  // fangs
  poly([20, 38, 24, 38, 28, 52, 25, 52], "B"), line(21, 38, 26, 50, "W"),
  poly([25, 41, 27, 41, 28, 46], "W"),
  // lower jaw steel
  poly([15, 36, 21, 38, 25, 51, 19, 46], "s"), line(16, 37, 21, 45, "H"),
  glow("oayW", { r: 6, strength: 0.4 }))

// ================================================================ PLANET 3: NOXA, bio-insects

sprite("mite", { w: 17, h: 15, mx: "c", outline: "k" },
  line(0, 3, 4, 5, "V"), line(0, 8, 4, 8, "V"), line(1, 13, 4, 10, "V"), px(0, 3, "v"), px(0, 8, "v"),
  ellipse(8, 7, 5, 6, "V"),
  ellipse(8, 6, 4, 5, "v"),
  ellipse(8, 4, 3, 2, "u"), vline(8, 1, 9, "z"),
  circ(6, 6, 1, "L"), px(6, 6, "l"),
  ellipse(8, 12, 3, 2, "m"), px(6, 12, "l"), px(7, 12, "l"),
  px(6, 14, "P"),
  glow("l", { r: 2, strength: 0.6 }))

sprite("wasp", { w: 15, h: 19, mx: "c", outline: "k" },
  // wings
  poly([0, 2, 5, 4, 6, 10, 1, 9], "u"), poly([1, 3, 5, 5, 5, 8, 2, 8], "j"), line(1, 3, 5, 5, "W"), line(1, 7, 5, 7, "u"),
  // head (top) with eyes
  circ(7, 2, 2, "v"), px(6, 2, "l"), px(6, 1, "u"),
  // thorax
  ellipse(7, 6, 3, 2, "V"), px(6, 5, "v"),
  // striped abdomen
  ellipse(7, 12, 3, 5, "v"), ellipse(7, 11, 2, 4, "u"),
  hline(4, 10, 4, "L"), hline(4, 13, 4, "L"), hline(5, 11, 3, "l"), hline(5, 14, 3, "l"),
  vline(7, 7, 10, "z"),
  // stinger
  vline(7, 17, 2, "q"), px(7, 18, "w"),
  glow("lw", { r: 2, strength: 0.5 }))

sprite("spitter", { w: 23, h: 19, mx: "c", outline: "k" },
  // legs
  line(0, 4, 5, 6, "V"), line(0, 9, 5, 9, "V"), line(1, 14, 5, 12, "V"),
  // shell
  ellipse(11, 8, 8, 7, "V"), ellipse(11, 7, 7, 6, "v"), ellipse(11, 5, 5, 3, "u"),
  vline(11, 1, 13, "z"), line(5, 9, 10, 11, "z"),
  line(5, 6, 8, 3, "j"), px(6, 9, "u"),
  // head + eyes
  ellipse(11, 15, 5, 3, "m"), ellipse(11, 14, 4, 2, "P"), px(9, 15, "l"), px(10, 15, "l"),
  // acid glands
  circ(6, 16, 2, "L"), circ(6, 16, 1, "l"), px(6, 18, "l"), px(5, 15, "w"),
  glow("lw", { r: 3, strength: 0.5 }))

sprite("carapace", { w: 29, h: 27, mx: "c", outline: "k" },
  // legs
  line(0, 5, 4, 8, "V"), line(0, 12, 4, 12, "V"), line(0, 19, 4, 16, "V"), px(0, 5, "v"), px(0, 12, "v"), px(0, 19, "v"),
  // shell: three overlapping armour bands, each lit on its top edge
  ellipse(14, 11, 11, 11, "V"), ellipse(14, 10, 10, 10, "v"),
  ellipse(14, 6, 8, 4, "u"), hline(9, 2, 6, "j"),
  line(4, 9, 13, 7, "z"), line(4, 10, 13, 8, "u"),
  line(4, 15, 13, 14, "z"), line(5, 16, 13, 15, "u"),
  line(7, 19, 13, 19, "z"),
  vline(14, 1, 20, "z"), vline(13, 2, 18, "V"),
  // studs along the seams (small glowing pores, not eyes)
  px(7, 8, "l"), px(10, 7, "L"), px(6, 14, "l"), px(10, 14, "L"), px(9, 18, "l"),
  // head, horn, eyes
  ellipse(14, 22, 6, 3, "m"), ellipse(14, 21, 5, 2, "P"), px(11, 22, "l"), px(12, 22, "l"),
  poly([13, 23, 15, 23, 15, 27, 14, 27], "q"),
  glow("lw", { r: 3, strength: 0.5 }))

sprite("boss_queen", { w: 67, h: 56, mx: "c", outline: "k" },
  // wings
  ellipse(12, 18, 12, 9, "u"), ellipse(13, 18, 10, 7, "j"),
  line(4, 16, 22, 18, "v"), line(6, 22, 22, 19, "v"), line(8, 12, 22, 17, "v"),
  ellipse(14, 31, 10, 5, "u"), ellipse(15, 31, 8, 3, "j"), line(7, 31, 22, 30, "v"),
  // legs
  line(16, 36, 8, 44, "V"), line(18, 39, 12, 50, "V"), line(14, 33, 5, 37, "V"),
  // abdomen
  ellipse(33, 15, 14, 15, "V"), ellipse(33, 14, 13, 14, "v"), ellipse(33, 8, 9, 6, "u"),
  hline(20, 12, 14, "z"), hline(21, 18, 13, "z"), hline(22, 24, 12, "z"),
  vline(33, 1, 28, "z"),
  // glowing sacs
  circ(25, 9, 3, "L"), circ(25, 9, 2, "l"), px(24, 8, "w"),
  circ(27, 21, 2, "L"), px(27, 21, "l"), circ(31, 15, 2, "L"), px(31, 15, "l"),
  // thorax
  ellipse(33, 34, 9, 6, "z"), ellipse(33, 33, 8, 5, "V"), ellipse(33, 32, 6, 3, "v"),
  // head
  ellipse(33, 45, 8, 6, "m"), ellipse(33, 44, 7, 5, "P"), ellipse(33, 42, 5, 2, "p"),
  circ(29, 46, 2, "L"), circ(29, 46, 1, "l"), px(28, 45, "w"),
  // crown
  poly([24, 40, 26, 34, 28, 40], "y"), poly([28, 39, 30, 33, 32, 39], "y"), poly([32, 38, 33, 32, 34, 32, 34, 38], "y"),
  line(25, 39, 26, 35, "Y"), rect(24, 39, 10, 2, "Y"), px(30, 35, "w"),
  // mandibles
  poly([28, 49, 31, 50, 33, 56, 30, 55], "P"), line(29, 50, 32, 55, "q"),
  glow("lyw", { r: 5, strength: 0.45 }))

// ================================================================ enemy bullets

const octa = (o, c) => poly([2 + o, o, 6 - o, o, 8 - o, 2 + o, 8 - o, 6 - o, 6 - o, 8 - o, 2 + o, 8 - o, o, 6 - o, o, 2 + o], c)
const bullet = (name, dark, mid, hi) => sprite(name, { w: 8, h: 8, outline: "k" },
  octa(0, dark), octa(1, mid), rect(2, 2, 4, 4, hi), rect(3, 2, 2, 4, "w"), rect(2, 3, 4, 2, "w"),
  glow(mid + hi, { r: 2, strength: 0.6 }))
bullet("ebullet_v", "V", "v", "u")
bullet("ebullet_o", "O", "o", "a")
bullet("ebullet_m", "P", "p", "q")

sprite("eshard", { w: 5, h: 9, mx: "c", outline: "k" },
  poly([0, 0, 3, 0, 3, 9, 2, 9, 0, 3], "o"), poly([1, 0, 3, 0, 3, 7, 2, 6], "a"), vline(2, 1, 4, "y"), px(2, 0, "w"),
  glow("ay", { r: 2, strength: 0.6 }))

// ================================================================ planet icons (48x48)

const lit = (cx, cy, r, base, mid, hi) => [circ(cx, cy, r, base), clip([cx, cy, r], circ(cx - 3, cy - 3, r - 2, mid), circ(cx - 7, cy - 7, r - 9, hi))]
// Night side: a dithered terminator band, then two solid steps darker towards the bottom-right.
const night = (cx, cy, r) => [
  shade([cx + 13, cy + 13, r + 1], 1, 0.5),
  shade([cx + 16, cy + 16, r + 1], 1),
  shade([cx + 24, cy + 24, r + 1], 1),
]

sprite("planet_1", { w: 48, h: 48 },
  ring(24, 24, 23, "O"),
  ...lit(24, 24, 22, "t", "T", "x"),
  // canyon cracks with lava
  line(8, 18, 20, 22, "O", 2), line(20, 22, 30, 16, "O", 2), line(30, 16, 40, 20, "O"),
  line(14, 32, 26, 30, "O", 2), line(26, 30, 36, 36, "O"),
  line(9, 18, 20, 21, "a"), line(21, 21, 29, 16, "a"), line(15, 31, 25, 30, "a"), line(20, 9, 24, 14, "o"),
  px(12, 26, "o"), px(33, 27, "o"),
  ...night(24, 24, 22),
  glow("aO", { r: 3, strength: 0.35 }))

sprite("planet_2", { w: 48, h: 48 },
  ring(24, 24, 23, "b"),
  ...lit(24, 24, 22, "i", "I", "b"),
  ellipse(17, 12, 8, 3, "B"), ellipse(15, 11, 4, 1, "W"),
  line(6, 26, 22, 28, "i", 2), line(22, 28, 40, 24, "i"), line(12, 34, 30, 38, "i"),
  line(26, 8, 32, 18, "i"), line(32, 18, 30, 30, "i"),
  rect(18, 18, 3, 2, "B"), rect(30, 12, 2, 1, "B"),
  ...night(24, 24, 22),
  glow("Bb", { r: 3, strength: 0.3 }))

sprite("planet_3", { w: 48, h: 48 },
  clip([0, 0, 48, 25], ellipse(24, 25, 23, 6, "L", true), ellipse(24, 25, 22, 5, "G", true)),
  circ(24, 24, 19, "k"),
  ...lit(24, 24, 18, "G", "L", "l"),
  line(9, 20, 22, 17, "G", 2), line(22, 17, 38, 21, "G"), line(12, 30, 34, 31, "G", 2),
  ellipse(16, 13, 5, 2, "l"), px(31, 26, "l"), px(20, 25, "l"),
  ...night(24, 24, 18),
  clip([0, 25, 48, 23], ellipse(24, 25, 23, 6, "L", true), ellipse(24, 25, 22, 5, "l", true)),
  glow("l", { r: 3, strength: 0.3 }))

// ================================================================ background landmarks (subdued, behind gameplay)

// A frigate lying diagonally, broken in two. hull(t, s): t along the keel (0 = nose), s across it.
const W_A = [34, 2], W_B = [10, 62]
const wLen = Math.hypot(W_B[0] - W_A[0], W_B[1] - W_A[1])
const wDir = [(W_B[0] - W_A[0]) / wLen, (W_B[1] - W_A[1]) / wLen], wPerp = [-wDir[1], wDir[0]]
const hp = (t, s) => [W_A[0] + wDir[0] * t * wLen + wPerp[0] * s, W_A[1] + wDir[1] * t * wLen + wPerp[1] * s]
const seg = (pts, c) => poly(pts.flatMap(([t, s]) => hp(t, s)), c)
const cut = (t, s0, s1, c) => line(...hp(t, s0).map(Math.round), ...hp(t, s1).map(Math.round), c)
sprite("lm_wreck", { w: 44, h: 64 },
  // scorch where the halves hit the ground
  clip([22, 31, 14], dither(0, 0, 44, 64, "d", "k", 0.45)), clip([21, 31, 8], dither(0, 0, 44, 64, "k", "d", 0.4)),
  clip([30, 12, 7], dither(0, 0, 44, 64, "d", "k", 0.3)),
  // wings on the rear half (one torn short)
  seg([[0.62, -6], [0.74, -18], [0.84, -17], [0.84, -6]], "d"), seg([[0.64, -6], [0.74, -16], [0.8, -15], [0.8, -6]], "D"),
  seg([[0.66, 6], [0.72, 12], [0.8, 11], [0.82, 6]], "d"),
  // rear half
  seg([[0.5, -7], [1, -7], [1, 7], [0.5, 7]], "D"),
  seg([[0.5, -7], [1, -7], [1, 0], [0.5, 0]], "f"),
  cut(0.5, -7, 7, "k"), ...[0.6, 0.72, 0.86].map((t) => cut(t, -7, 7, "d")),
  line(...hp(0.52, -5).map(Math.round), ...hp(0.98, -5).map(Math.round), "F"),
  // engine bells at the stern
  ...[-4, 3].map((s) => circ(...hp(0.95, s).map(Math.round), 2, "k")),
  // nose half, knocked slightly askew
  seg([[0, 0], [0.12, -5], [0.42, -6], [0.42, 6], [0.12, 5]], "D"),
  seg([[0, 0], [0.12, -5], [0.42, -6], [0.42, 0]], "f"),
  cut(0.42, -6, 6, "k"), cut(0.25, -6, 6, "d"),
  line(...hp(0.06, -2).map(Math.round), ...hp(0.4, -4).map(Math.round), "F"),
  // bridge window
  rect(...hp(0.16, -1).map(Math.round), 2, 2, "k"), px(...hp(0.16, 0).map(Math.round), "C"),
  // debris
  rect(4, 30, 3, 2, "f"), rect(37, 26, 2, 3, "f"), rect(38, 50, 3, 2, "D"), px(6, 50, "f"), px(30, 40, "D"),
  // one dim warning light
  px(...hp(0.7, 5).map(Math.round), "r"),
  glow("r", { r: 2, strength: 0.3 }))

sprite("lm_outpost", { w: 56, h: 56, outline: "d" },
  // landing pad
  circ(16, 40, 13, "D"), ring(16, 40, 13, "f"), ring(16, 40, 10, "d"),
  rect(12, 35, 2, 10, "F"), rect(18, 35, 2, 10, "F"), rect(14, 39, 4, 2, "F"),
  // corridors
  rect(26, 38, 10, 4, "D"), hline(26, 38, 10, "f"), rect(40, 20, 4, 14, "D"), vline(40, 20, 14, "f"),
  // dome
  circ(42, 14, 11, "D"), circ(41, 13, 9, "f"), circ(39, 11, 5, "F"), ring(42, 14, 11, "d"),
  line(32, 14, 52, 14, "D"), line(42, 4, 42, 24, "D"),
  // module
  rect(34, 34, 16, 14, "D"), rect(35, 35, 14, 5, "f"), hline(35, 44, 14, "d"),
  rect(37, 42, 2, 2, "t"), rect(44, 42, 2, 2, "t"),
  // beacon
  px(16, 27, "o"), px(48, 46, "o"),
  glow("o", { r: 2, strength: 0.35 }))

sprite("lm_drill", { w: 40, h: 48, outline: "d" },
  // shaft hole
  circ(20, 34, 9, "d"), circ(20, 34, 6, "k"), ring(20, 34, 9, "D"),
  // platform
  rect(4, 4, 32, 24, "D"), rect(5, 5, 30, 8, "f"), hline(5, 12, 30, "d"),
  ...[0, 1, 2, 3].map((i) => vline(8 + i * 8, 13, 14, "d")),
  // derrick lattice
  box(12, 8, 16, 26, "F"), line(12, 8, 28, 34, "f"), line(28, 8, 12, 34, "f"),
  rect(18, 8, 4, 4, "F"),
  // drill shaft
  rect(19, 18, 2, 18, "F"), px(19, 36, "f"),
  // pipes
  line(4, 30, 10, 44, "D", 2), line(36, 30, 30, 44, "D", 2),
  // light
  px(6, 6, "o"), px(33, 6, "o"),
  glow("o", { r: 2, strength: 0.35 }))

sprite("lm_crystals", { w: 44, h: 40 },
  ellipse(22, 26, 20, 12, "k"), dither(2, 16, 40, 22, "k", "i", 0.25),
  // crystal prisms seen from above: hexes with lit top facet
  ...[[10, 22, 7], [22, 14, 9], [33, 24, 7], [20, 30, 6], [6, 32, 4], [38, 34, 4]].flatMap(([x, y, r]) => [
    poly([x - r, y, x - r / 2, y - r, x + r / 2, y - r, x + r, y, x + r / 2, y + r, x - r / 2, y + r], "i"),
    poly([x - r, y, x - r / 2, y - r, x + r / 2, y - r, x, y], "I"),
    poly([x - r / 2 + 1, y - r + 1, x + r / 2 - 1, y - r + 1, x, y - 1], "b"),
  ]),
  px(22, 7, "B"), px(10, 17, "B"))

sprite("lm_hive", { w: 48, h: 44 },
  ellipse(24, 24, 23, 19, "k"), clip([24, 24, 19], dither(0, 0, 48, 44, "k", "z", 0.4)),
  ...[[14, 16, 9, 8], [32, 14, 10, 9], [22, 31, 10, 8], [38, 32, 7, 6], [8, 32, 6, 5]].flatMap(([x, y, rx, ry]) => [
    ellipse(x, y, rx, ry, "z"), ellipse(x - 1, y - 1, rx - 2, ry - 2, "V"), ellipse(x - 2, y - 2, Math.max(1, rx - 5), Math.max(1, ry - 5), "v"),
    ellipse(x, y + 1, Math.max(1, rx / 3), Math.max(1, ry / 3), "k"),
    px(x, y + 1, "L"),
  ]),
  line(14, 24, 22, 23, "V"), line(30, 22, 26, 26, "V"),
  glow("L", { r: 2, strength: 0.3 }))

sprite("lm_ribs", { w: 60, h: 40 },
  // spine
  ...[...Array(13)].map((_, i) => rect(4 + i * 4, 18, 3, 4, i % 2 ? "f" : "F")),
  // ribs arcing out both sides
  ...[...Array(6)].flatMap((_, i) => {
    const x = 10 + i * 8, h = 15 - Math.abs(i - 2.5) * 2
    return [line(x, 18, x - 3, 18 - h, "F"), line(x - 3, 18 - h, x - 6, 18 - h + 3, "f"),
      line(x, 22, x - 3, 22 + h, "f"), line(x - 3, 22 + h, x - 6, 22 + h - 3, "D")]
  }),
  // skull end
  ellipse(57, 20, 3, 5, "F"), px(57, 18, "d"), px(57, 22, "d"))

sheet("atlas_planets", ["*"], { pad: 2 })
