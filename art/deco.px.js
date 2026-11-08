// Neon Squadron: per-planet ground decoration (pxl DSL). Build: npm run art -- deco
// Top-down props scattered on the scrolling canyon floor and plateaus, BEHIND gameplay:
// subdued tones matched to each planet's ground (src/data/planets.ts canyon palettes), a dark ground-colour
// outline, at most one small glow accent. Light comes from the top-left; cast shadows fall down-right.

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
  // --- ground ramps for decoration (dark outline first) ---
  1: "#140a0b", // KARR-7 red rock
  2: "#2c171a",
  3: "#4a2a24",
  4: "#6a4030",
  5: "#8c5236",
  6: "#08101c", // VELA ice ground
  7: "#16263e",
  8: "#2a4466",
  9: "#4f74a0",
  0: "#86aed6",
  "!": "#070e07", // NOXA toxic ground
  "@": "#142016",
  $: "#22341f",
  "%": "#3c5634",
  "&": "#5c7a44",
  "^": "#8a8a70", // old bone
  "~": "#5a5a48",
})
ramps("knshHjW", "kmPpq", "kCce", "kVvu", "kOoa", "Yy", "kGLl", "kiIbB", "dDfF", "ktTx", "kzVv",
  "12345", "67890", "!@$%&", "~^")

// ================================================================ PLANET 1 · KARR-7 (red rock, lava)

// Objects are outlined parts ("_" = not exported) stamped over an un-outlined cast shadow, so the
// shadow never gets an outline of its own.

// jagged pinnacle: lit west face, dark east face, a ridge down the middle
sprite("_spire", { w: 11, h: 15, outline: "1" },
  poly([5, 0, 7, 2, 8, 1, 10, 5, 9, 8, 10, 11, 7, 14, 3, 14, 1, 11, 0, 7, 2, 3, 4, 2], "3"),
  poly([5, 0, 6, 4, 5, 8, 5, 14, 3, 14, 1, 11, 0, 7, 2, 3, 4, 2], "4"),
  line(5, 0, 2, 4, "5"), px(1, 7, "5"),
  poly([8, 1, 10, 5, 9, 8, 10, 11, 8, 13, 8, 6], "2"),
  line(6, 4, 5, 8, "2"), vline(5, 8, 6, "2"),
  px(3, 9, "3"), px(2, 12, "3"), px(7, 6, "4"))
sprite("deco_1_spire", { w: 15, h: 18 },
  poly([6, 9, 14, 12, 15, 18, 6, 18, 3, 15], "1"),
  stamp("_spire", 0, 0))

sprite("deco_1_vent", { w: 15, h: 11, outline: "1" },
  ellipse(7, 5, 7, 5, "3"), ellipse(7, 5, 6, 4, "4", true), px(3, 2, "5"), px(5, 1, "5"),
  ellipse(7, 6, 5, 3, "2"),
  ellipse(7, 6, 3, 2, "O"), ellipse(7, 6, 2, 1, "o"), px(7, 6, "a"), px(6, 6, "y"),
  line(1, 6, 3, 8, "1"), line(12, 3, 14, 5, "1"), px(10, 9, "1"),
  glow("ay", { r: 3, strength: 0.45 }))

sprite("deco_1_wreck", { w: 17, h: 13, outline: "1" },
  // scorch on the ground
  ellipse(8, 7, 8, 6, "2"),
  // treads
  rect(1, 2, 3, 9, "d"), rect(13, 3, 3, 8, "d"), ...[3, 5, 7, 9].map((y) => hline(1, y, 3, "D")), ...[4, 6, 8].map((y) => hline(13, y, 3, "D")),
  // a broken track link thrown off
  rect(14, 0, 2, 2, "d"),
  // burnt hull with rust runs, a torn-open rear deck, the turret knocked askew with a bent barrel
  rect(4, 2, 9, 9, "f"), hline(4, 2, 9, "F"), vline(4, 2, 9, "F"),
  vline(6, 3, 4, "T"), vline(11, 3, 3, "T"), px(6, 7, "t"),
  rect(8, 8, 5, 3, "d"), px(9, 9, "O"), px(11, 9, "1"),
  circ(8, 5, 2, "D"), px(7, 4, "F"), line(9, 4, 12, 0, "D"), px(12, 0, "f"),
  px(5, 9, "1"))

sprite("deco_1_pipe", { w: 23, h: 9, outline: "1" },
  hline(0, 8, 23, "2"), // ground shadow
  rect(0, 2, 23, 5, "T"), hline(0, 2, 23, "x"), hline(0, 3, 23, "T"), hline(0, 5, 23, "t"), hline(0, 6, 23, "t"),
  rect(5, 1, 2, 7, "3"), hline(5, 1, 2, "4"), rect(17, 1, 2, 7, "3"), hline(17, 1, 2, "4"), // flanges
  ring(11, 4, 3, "F"), line(9, 4, 13, 4, "f"), line(11, 2, 11, 6, "f"), px(11, 4, "D"), px(10, 2, "j"), // valve wheel
  px(2, 4, "t"), px(21, 3, "x"))

// boulders lit top-left, a crack on the big one
sprite("_boulder_l", { w: 10, h: 9, outline: "1" },
  ellipse(5, 4, 5, 4, "3"), ellipse(4, 3, 3, 2, "4"), px(2, 2, "5"), px(3, 1, "5"),
  poly([10, 3, 10, 9, 4, 9, 8, 6], "2"), line(6, 1, 7, 4, "2"))
sprite("_boulder_m", { w: 7, h: 6, outline: "1" },
  ellipse(3, 3, 3, 3, "3"), px(2, 1, "4"), px(1, 2, "4"), px(1, 1, "5"), poly([7, 2, 7, 6, 3, 6], "2"))
sprite("_boulder_s", { w: 4, h: 4, outline: "1" }, circ(2, 2, 2, "3"), px(1, 1, "4"), px(3, 3, "2"))
sprite("deco_1_rocks", { w: 20, h: 14 },
  ellipse(8, 9, 6, 4, "1"), ellipse(16, 10, 4, 3, "1"), ellipse(11, 12, 3, 2, "1"),
  stamp("_boulder_l", 0, 1), stamp("_boulder_m", 11, 4), stamp("_boulder_s", 7, 8))

// ================================================================ PLANET 2 · VELA (dark blue ice)

// ice shards radiating from a frozen base: lit west half of each shard, pale tips
const shard = (pts, lit, tip) => [poly(pts, "9"), poly(lit, "0"), px(tip[0], tip[1], "B")]
sprite("_spikes", { w: 13, h: 14, outline: "6" },
  ...shard([6, 0, 8, 10, 4, 10], [6, 0, 6, 10, 4, 10], [6, 1]),
  ...shard([0, 3, 6, 9, 4, 11], [0, 3, 5, 9, 4, 10], [1, 4]),
  ...shard([13, 4, 8, 11, 7, 9], [13, 4, 9, 8, 7, 9], [12, 5]),
  ...shard([2, 13, 6, 9, 7, 11], [2, 13, 6, 9, 5, 11], [3, 12]),
  ellipse(6, 11, 3, 2, "8"), px(5, 10, "9"), px(6, 3, "B"))
sprite("deco_2_spikes", { w: 16, h: 17 },
  poly([7, 9, 15, 11, 16, 17, 7, 17, 4, 14], "6"),
  stamp("_spikes", 0, 0))

sprite("deco_2_pod", { w: 15, h: 13, outline: "6" },
  ellipse(8, 8, 7, 4, "7"), // shadow
  // steel capsule tipped on its side: hull, dull hazard band, a visor slit, a frosted nose cone
  ellipse(7, 6, 6, 4, "s"), ellipse(6, 5, 5, 3, "h"), hline(3, 3, 6, "H"), px(3, 4, "j"),
  vline(9, 2, 7, "O"), vline(10, 2, 7, "O"),
  hline(4, 6, 4, "i"), hline(4, 5, 3, "I"),
  ellipse(12, 6, 1, 3, "8"), px(12, 4, "0"),
  // ice drift burying the lower half
  poly([0, 8, 4, 7, 8, 9, 12, 7, 15, 9, 15, 13, 0, 13], "9"), poly([1, 9, 4, 8, 8, 10, 12, 8, 14, 10, 14, 11, 1, 11], "0"),
  px(5, 9, "B"))

sprite("deco_2_drift", { w: 23, h: 11, outline: "6" },
  poly([0, 7, 5, 3, 11, 1, 17, 2, 23, 6, 21, 10, 3, 10], "8"),
  poly([2, 7, 6, 4, 11, 2, 17, 3, 21, 6, 17, 7, 6, 8], "9"),
  poly([6, 5, 11, 3, 16, 4, 12, 5], "0"),
  hline(3, 9, 18, "7"),
  px(10, 3, "w"), px(17, 5, "B"), px(5, 6, "B"))

sprite("deco_2_tower", { w: 11, h: 19, outline: "6" },
  line(6, 6, 10, 18, "7", 2), // long cast shadow
  rect(2, 14, 7, 5, "D"), hline(2, 14, 7, "f"), // base plate
  vline(5, 3, 13, "F"), vline(4, 4, 11, "f"), // mast
  hline(2, 6, 7, "f"), hline(3, 10, 5, "f"), // cross bars
  ellipse(5, 2, 3, 2, "F"), px(4, 1, "j"), // dish
  px(5, 0, "a"),
  glow("a", { r: 2, strength: 0.5 }))

sprite("_crystal", { w: 7, h: 10, outline: "6" },
  poly([3, 0, 7, 4, 4, 10, 3, 10, 0, 4], "8"), poly([3, 0, 3, 10, 0, 4], "9"), poly([3, 0, 3, 5, 1, 4], "0"),
  line(4, 1, 6, 4, "9"), px(2, 2, "B"))
sprite("deco_2_crystal", { w: 10, h: 12 },
  poly([5, 6, 10, 8, 10, 12, 5, 12], "6"),
  stamp("_crystal", 0, 0))

// ================================================================ PLANET 3 · NOXA (dark green, toxic)

// mushroom caps from above: dark gill rim, lit cap, faint lime spots
sprite("_cap_l", { w: 8, h: 8, outline: "!" },
  circ(4, 4, 4, "@"), circ(4, 4, 3, "$"), circ(3, 3, 2, "%"), px(2, 2, "&"), px(5, 5, "L"), px(2, 5, "L"), px(5, 2, "l"))
sprite("_cap_s", { w: 6, h: 6, outline: "!" },
  circ(3, 3, 3, "@"), circ(3, 3, 2, "$"), px(2, 2, "%"), px(3, 4, "L"))
sprite("deco_3_shroom", { w: 16, h: 14 },
  ellipse(7, 10, 6, 3, "!"), ellipse(13, 11, 3, 2, "!"),
  stamp("_cap_l", 0, 0), stamp("_cap_s", 9, 4), stamp("_cap_s", 4, 7),
  glow("l", { r: 2, strength: 0.35 }))

sprite("deco_3_tendril", { w: 13, h: 17, outline: "!" },
  line(4, 16, 3, 9, "@", 3), // shadow
  line(3, 15, 3, 9, "z", 3), line(3, 9, 5, 4, "z", 3), line(5, 4, 9, 2, "z", 2), line(9, 2, 11, 4, "V", 2),
  line(3, 14, 3, 9, "V"), line(3, 9, 5, 5, "V"), px(10, 4, "v"),
  px(2, 12, "v"), px(4, 7, "v"), px(7, 3, "v"), // suckers
  px(11, 5, "L"))

sprite("deco_3_eggs", { w: 15, h: 11, outline: "!" },
  ellipse(8, 7, 7, 4, "@"), // shadow
  ellipse(4, 5, 3, 3, "z"), ellipse(9, 4, 3, 3, "z"), ellipse(7, 8, 3, 2, "z"), ellipse(12, 7, 2, 2, "z"),
  ellipse(4, 5, 2, 2, "V"), ellipse(9, 4, 2, 2, "V"), ellipse(7, 8, 2, 1, "V"),
  px(4, 5, "L"), px(9, 4, "l"), px(7, 8, "L"), px(12, 7, "V"),
  px(3, 4, "u"), px(8, 3, "u"),
  glow("l", { r: 2, strength: 0.4 }))

sprite("deco_3_bones", { w: 19, h: 9, outline: "!" },
  // a long bone
  line(1, 3, 12, 5, "~", 2), line(1, 2, 12, 4, "^"), circ(1, 3, 1, "^"), circ(12, 5, 1, "^"),
  // a rib arc and a small bone
  line(13, 1, 17, 3, "~"), line(17, 3, 18, 7, "~"), px(13, 1, "^"),
  line(4, 7, 8, 8, "~"), px(4, 7, "^"),
  hline(2, 6, 9, "@"))

sprite("deco_3_pod", { w: 11, h: 11, outline: "!" },
  ellipse(6, 7, 5, 4, "@"), // shadow
  circ(5, 5, 4, "z"), circ(4, 4, 3, "V"), px(3, 3, "v"),
  ellipse(5, 5, 2, 1, "!"), px(5, 5, "L"), px(6, 5, "l"),
  line(1, 8, 0, 10, "z"), line(9, 8, 10, 10, "z"),
  glow("l", { r: 2, strength: 0.35 }))

// ================================================================ previews (not in the sheet)

scene("preview_1", { w: 110, h: 24, bg: "#291417" },
  stamp("deco_1_spire", 2, 2), stamp("deco_1_vent", 20, 6), stamp("deco_1_wreck", 40, 4), stamp("deco_1_pipe", 62, 7), stamp("deco_1_rocks", 88, 5))
scene("preview_2", { w: 110, h: 24, bg: "#132136" },
  stamp("deco_2_spikes", 2, 2), stamp("deco_2_pod", 22, 5), stamp("deco_2_drift", 42, 7), stamp("deco_2_tower", 70, 1), stamp("deco_2_crystal", 90, 7))
scene("preview_3", { w: 110, h: 24, bg: "#132015" },
  stamp("deco_3_shroom", 2, 5), stamp("deco_3_tendril", 22, 2), stamp("deco_3_eggs", 42, 6), stamp("deco_3_bones", 62, 8), stamp("deco_3_pod", 90, 6))

sheet("atlas_deco", ["deco_*"], { pad: 2 })
