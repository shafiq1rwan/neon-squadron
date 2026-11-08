// Neon Squadron: planet 4 THALOS · STORM MESA. Enemies (Arc Constructs), boss, bullet, icon, turret, landmarks, props.
// Build: node .claude/skills/pxl-pixel-art/bin/pxl.js build art/planet4.px.js --out art/out_p4
// Top-down view, enemies face DOWN. Symmetric sprites use mx: "c" (odd width, left half drawn).

pal({
  k: "#0a0718", // outline
  n: "#141029", // hull ramp, darkest -> lightest (gunmetal / steel)
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
  i: "#1c3550", // ice ramp
  I: "#3a6a96",
  b: "#7fb0dc",
  B: "#c4e2ff",
  L: "#5f9a1c", // toxic lime ramp
  l: "#c8ff4a",
  d: "#1a1619", // rock / scrap metal ramp
  D: "#2a2429",
  f: "#40363a",
  F: "#5a4c4e",
  t: "#3a1a14", // red rock ramp
  T: "#6a2e1e",
  x: "#a04a2a",
  z: "#2a1640", // deep chitin
  // --- added for planet 4 THALOS ---
  1: "#5c4e0c", // electric yellow ramp, dark -> white-hot
  2: "#b89c18",
  3: "#ffe84a",
  4: "#fffbd0",
  5: "#14121f", // slate ground ramp, dark -> light
  6: "#221f33",
  7: "#2f2b45",
  8: "#3d395a",
  9: "#57527a",
})
ramps("knshHjW", "kmPpq", "kCce", "kVvu", "kOoa", "Yy", "kGLl", "kiIbB", "dDfF", "ktTx", "kzVv", "1234", "56789")

const ARC = "34" // glowing electric keys

// ================================================================ enemies (Arc Constructs, face down)

// spark: a small tesla-coil drone. Coil rings seen from above, side arms with spark tips, a prong below.
sprite("spark", { w: 19, h: 15, mx: "c", outline: "k" },
  rect(0, 5, 4, 5, "s"), rect(0, 6, 3, 3, "h"), vline(0, 6, 3, "H"), px(0, 5, "3"),
  ellipse(9, 7, 7, 6, "s"),
  ellipse(9, 6, 6, 4, "h"), hline(5, 2, 5, "H"),
  hline(3, 11, 7, "n"),
  circ(9, 7, 4, "n"), ring(9, 7, 4, "2"), ring(9, 7, 2, "3"), px(9, 7, "4"), px(8, 6, "4"),
  poly([7, 12, 9, 15, 10, 15, 10, 12], "s"), px(9, 14, "3"),
  glow(ARC, { r: 3, strength: 0.5 }))

// bolt: a fast interceptor whose wings are lightning bolts.
sprite("bolt", { w: 15, h: 19, mx: "c", outline: "k" },
  line(0, 2, 4, 8, "2", 2), line(4, 8, 1, 10, "2", 2), line(1, 10, 5, 16, "2", 2),
  line(0, 2, 4, 7, "3"), line(1, 10, 5, 15, "3"),
  poly([5, 1, 8, 1, 8, 19, 7, 19, 5, 12], "s"),
  vline(6, 3, 10, "h"), vline(7, 1, 17, "H"), px(7, 0, "j"),
  rect(6, 10, 2, 4, "1"), rect(6, 11, 2, 2, "3"), px(7, 11, "4"),
  px(7, 18, "3"),
  glow(ARC, { r: 3, strength: 0.5 }))

// coil: a coil-gun platform. Armoured chassis, three coil bands, a yellow core, twin emitters at the bottom.
sprite("coil", { w: 23, h: 19, mx: "c", outline: "k" },
  rect(0, 6, 3, 6, "n"), rect(0, 7, 2, 4, "s"), px(1, 7, "3"),
  poly([3, 1, 11, 1, 11, 15, 3, 15, 1, 12, 1, 4], "s"),
  rect(3, 3, 9, 10, "h"), hline(3, 3, 9, "H"), vline(3, 3, 10, "H"), px(3, 3, "j"),
  ...[5, 8, 11].map((y) => hline(5, y, 7, "2")), ...[5, 8, 11].map((y) => px(5, y, "3")),
  circ(11, 8, 2, "n"), circ(11, 8, 1, "3"), px(11, 8, "4"),
  rect(6, 14, 3, 5, "n"), rect(7, 15, 1, 3, "h"), px(7, 18, "3"),
  glow(ARC, { r: 3, strength: 0.5 }))

// dynamo: armoured generator walker. Four feet, plated body, a big yellow core with a steel ring.
sprite("dynamo", { w: 29, h: 27, mx: "c", outline: "k" },
  rect(0, 2, 5, 6, "s"), rect(1, 3, 3, 4, "h"), px(1, 3, "H"),
  rect(0, 19, 5, 6, "s"), rect(1, 20, 3, 4, "h"), px(1, 20, "H"),
  line(4, 5, 7, 8, "n", 2), line(4, 22, 7, 19, "n", 2),
  poly([7, 1, 14, 0, 14, 27, 7, 26, 4, 21, 4, 6], "s"),
  poly([8, 2, 14, 2, 14, 25, 8, 24, 5, 20, 5, 7], "h"),
  line(8, 2, 13, 2, "H"), line(5, 7, 8, 2, "H"),
  hline(6, 5, 6, "n"), hline(6, 22, 6, "n"),
  ring(8, 6, 2, "2"), px(8, 6, "3"), ring(8, 21, 2, "2"), px(8, 21, "3"),
  circ(14, 13, 7, "s"), ring(14, 13, 7, "H"),
  circ(14, 13, 6, "n"), circ(14, 13, 5, "1"), circ(14, 13, 4, "2"), circ(14, 13, 3, "3"), circ(14, 13, 1, "4"),
  px(12, 11, "4"),
  glow(ARC, { r: 5, strength: 0.5 }))

// boss_tempest: TEMPEST ENGINE. A storm-dynamo fortress: twin tesla towers, a crackling central core, armoured
// flanks, and lightning-rod prongs at the bottom.
sprite("boss_tempest", { w: 67, h: 56, mx: "c", outline: "k" },
  // armoured lower flanks / legs
  poly([3, 26, 17, 29, 19, 45, 9, 50, 2, 41], "n"),
  poly([4, 28, 16, 30, 17, 43, 9, 47, 4, 40], "s"),
  line(4, 28, 16, 30, "h"), line(6, 36, 16, 37, "n"), line(7, 42, 16, 42, "n"),
  // vent grille and a yellow power conduit on each flank
  ...[31, 33].map((y) => hline(7, y, 6, "n")), line(5, 39, 15, 34, "1"), px(15, 34, "3"),
  rect(8, 46, 5, 7, "n"), rect(9, 47, 3, 5, "s"), px(10, 52, "3"),
  // main hull
  poly([33, 3, 34, 3, 34, 51, 24, 49, 17, 41, 15, 20, 22, 8], "s"),
  poly([33, 6, 34, 6, 34, 48, 25, 46, 19, 39, 17, 21, 23, 10], "h"),
  line(22, 8, 33, 3, "H"), line(15, 20, 22, 8, "H"), px(32, 4, "j"),
  line(19, 33, 30, 37, "s"), line(18, 27, 26, 29, "s"), hline(24, 44, 10, "s"),
  // hull plating: seams, rivets, feed conduits running into the core
  vline(23, 12, 8, "s"), line(18, 20, 22, 13, "s"), px(21, 17, "n"), px(20, 24, "n"), px(23, 40, "n"), px(28, 42, "n"),
  line(24, 18, 26, 19, "1"), line(22, 36, 26, 33, "1"), px(26, 33, "2"),
  // arm linking each tower to the hull, with a feed cable
  rect(15, 12, 9, 5, "h"), hline(15, 12, 9, "H"), hline(15, 16, 9, "n"), hline(16, 14, 7, "2"),
  // tesla tower (left; mirrored) seen from above: a steel toroid (donut) around a dark shaft, lit top-left,
  // with charge points crackling on its rim. No bright centre, so it never reads as an eye.
  circ(10, 14, 9, "n"), circ(10, 14, 8, "h"), circ(10, 14, 7, "s"),
  ring(10, 14, 6, "h"), ring(10, 14, 4, "n"),
  circ(10, 14, 3, "h"), circ(9, 13, 2, "H"), px(8, 12, "j"), // capped steel dome on the coil shaft
  line(4, 10, 7, 7, "H"), line(3, 13, 4, 10, "H"), px(6, 8, "j"),
  line(13, 20, 16, 17, "n"),
  // charge points crackling on the rim
  px(2, 16, "3"), px(1, 17, "4"), px(10, 5, "3"), px(10, 4, "4"), px(16, 9, "2"), px(4, 20, "2"), px(3, 21, "3"),
  // arcs leaping from tower to hull
  line(12, 6, 17, 4, "3"), line(17, 4, 21, 7, "3"), px(19, 5, "4"),
  // central crackling core
  circ(33, 25, 10, "n"), ring(33, 25, 10, "H"),
  circ(33, 25, 8, "1"), circ(33, 25, 6, "2"), circ(33, 25, 4, "3"), circ(33, 25, 2, "4"),
  line(26, 20, 29, 23, "4"), line(25, 27, 29, 26, "3"), line(28, 31, 30, 28, "3"),
  // lightning-rod prongs at the bottom
  vline(27, 47, 7, "h"), px(27, 54, "3"),
  vline(30, 49, 6, "H"), px(30, 55, "4"),
  vline(33, 50, 6, "j"), px(33, 56, "4"),
  glow(ARC, { r: 6, strength: 0.5 }))

// ================================================================ enemy fire

sprite("ebullet_y", { w: 8, h: 8, outline: "k" },
  circ(4, 4, 3, "2"), circ(4, 4, 2, "3"), rect(3, 3, 2, 2, "4"), px(3, 3, "w"),
  glow("34", { r: 2, strength: 0.6 }))

// ================================================================ planet icon (no outline, like planet_1..3)

sprite("planet_4", { w: 48, h: 48 }, (c) => {
  const cx = 23.5, cy = 23.5, R = 22
  const ramp = ["5", "6", "7", "8", "9"]
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
  for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy)
    if (d > R) continue
    const nz = Math.sqrt(Math.max(0, 1 - (d / R) ** 2))
    // light from the top-left
    const lit = (-dx * 0.55 - dy * 0.55) / R + nz * 0.7
    // swirling cloud bands
    const band = Math.sin(dy * 0.42 + Math.sin(dx * 0.18 + dy * 0.05) * 2.2) * 0.22
    let v = 0.25 + lit * 0.55 + band
    const t = (bayer[(y & 3) * 4 + (x & 3)] + 0.5) / 16
    const idx = Math.max(0, Math.min(4, Math.floor(v * 4 + t - 0.3)))
    c.px(x, y, ramp[idx])
  }
  // lightning flashes in the storm bands
  c.line(16, 14, 19, 18, "3"); c.line(19, 18, 17, 20, "3"); c.line(17, 20, 20, 24, "4")
  c.line(30, 27, 32, 30, "2"); c.line(32, 30, 30, 32, "3")
  c.px(12, 28, "3"); c.px(13, 29, "2")
  // atmosphere rim (top-left lit side)
  for (let a = Math.PI * 0.85; a < Math.PI * 1.75; a += 0.02)
    c.px(Math.round(cx + Math.cos(a) * R), Math.round(cy + Math.sin(a) * R), "u")
}, glow("34", { r: 2, strength: 0.5 }))

// ================================================================ ground turret

// turret_4_base: an octagonal steel pad with yellow hazard corners and a charge ring.
sprite("turret_4_base", { w: 17, h: 17, mx: "c", outline: "k" },
  poly([4, 0, 9, 0, 9, 17, 4, 17, 0, 13, 0, 4], "s"),
  poly([5, 1, 9, 1, 9, 16, 5, 16, 1, 12, 1, 5], "h"),
  line(1, 5, 5, 1, "H"), hline(5, 1, 4, "H"),
  px(1, 5, "2"), px(2, 4, "2"), px(1, 12, "2"), px(2, 13, "2"),
  ring(8, 8, 5, "n"), ring(8, 8, 4, "1"),
  px(3, 8, "3"), px(8, 3, "3"),
  glow("3", { r: 2, strength: 0.5 }))

// turret_4_gun: a tesla-rail gun. Pivot hub at the exact sprite centre (4, 10); barrel points UP; lower half mostly empty.
sprite("turret_4_gun", { w: 9, h: 21, mx: "c", outline: "k" },
  // twin rails with coil bands and a crackling muzzle gap
  rect(2, 1, 2, 7, "s"), vline(2, 1, 7, "h"), px(2, 0, "H"),
  hline(2, 3, 2, "2"), hline(2, 5, 2, "2"),
  px(4, 1, "3"), px(4, 0, "4"), px(4, 3, "3"),
  // armoured housing around the pivot
  rect(0, 7, 5, 7, "s"), rect(1, 8, 4, 5, "h"), hline(1, 8, 4, "H"), vline(0, 8, 5, "h"),
  px(0, 7, "_"), px(0, 13, "_"), hline(1, 12, 4, "s"),
  circ(4, 10, 1, "1"), px(4, 10, "3"),
  glow(ARC, { r: 2, strength: 0.6 }))

// ================================================================ landmarks (subdued, behind gameplay)

// lm_pylon: a storm pylon seen from above. Lattice mast, two cross-arms with insulators, cables running away,
// and a long cast shadow. One small warning light.
sprite("lm_pylon", { w: 36, h: 56 },
  // cast shadow (down-right)
  poly([18, 14, 34, 30, 30, 34, 14, 18], "5"),
  // cables running down the screen from the arm ends
  vline(4, 12, 44, "7"), vline(31, 12, 44, "7"), vline(8, 24, 32, "7"), vline(27, 24, 32, "7"),
  ...[30, 44].map((y) => hline(3, y, 3, "8")), ...[30, 44].map((y) => hline(30, y, 3, "8")), // cable clamps
  ...[38, 50].map((y) => hline(7, y, 3, "8")), ...[38, 50].map((y) => hline(26, y, 3, "8")),
  // cross-arms
  rect(3, 10, 30, 3, "7"), hline(3, 10, 30, "8"), rect(7, 22, 22, 2, "7"), hline(7, 22, 22, "8"),
  // insulators
  ...[4, 31].map((x) => rect(x - 1, 9, 3, 5, "9")), ...[4, 31].map((x) => px(x, 9, "j")),
  ...[8, 27].map((x) => rect(x - 1, 21, 3, 4, "9")),
  // lattice mast
  rect(13, 6, 10, 10, "6"), box(13, 6, 10, 10, "8"), line(13, 6, 22, 15, "7"), line(22, 6, 13, 15, "7"),
  box(15, 8, 6, 6, "9"), px(17, 10, "8"), px(18, 11, "8"),
  // lightning rod tip and warning light
  rect(17, 3, 2, 4, "9"), px(17, 2, "j"), px(18, 2, "2"),
  glow("2", { r: 2, strength: 0.4 }))

// lm_dish: a broken radar dish. Concave bowl with a missing wedge and a crack, central feed horn on a tripod,
// a concrete base, scattered debris.
sprite("lm_dish", { w: 48, h: 44 }, (c) => {
  // base pad and shadow
  c.ellipse(26, 26, 20, 15, "5")
  c.rect(17, 30, 16, 10, "6"); c.box(17, 30, 16, 10, "7")
  // bowl: concave, darker toward the top-left rim (in its own shadow), lit bottom-right inner wall
  const cx = 23, cy = 21, R = 17
  for (let y = 0; y < 44; y++) for (let x = 0; x < 48; x++) {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy)
    if (d > R) continue
    const ang = Math.atan2(dy, dx)
    if (ang > -0.25 && ang < 0.55 && d > 6) continue // missing wedge (broken)
    const inner = (dx + dy) / (R * 1.4)
    const k = d > R - 1.5 ? "9" : inner > 0.35 ? "8" : inner > -0.2 ? "7" : "6"
    c.px(x, y, k)
  }
  // ribs
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    if (a > -0.25 && a < 0.55) continue
    c.line(cx, cy, Math.round(cx + Math.cos(a) * (R - 2)), Math.round(cy + Math.sin(a) * (R - 2)), "6")
  }
  // crack
  c.line(cx - 4, cy + 5, cx - 9, cy + 13, "5"); c.line(cx - 9, cy + 13, cx - 7, cy + 16, "5")
  // tripod + feed horn
  c.line(cx, cy, cx - 6, cy - 7, "8"); c.line(cx, cy, cx + 6, cy - 6, "8"); c.line(cx, cy, cx - 1, cy + 8, "8")
  c.circ(cx, cy, 2, "9"); c.px(cx, cy, "2")
  // debris from the broken wedge
  c.rect(41, 18, 3, 2, "8"); c.rect(38, 26, 2, 2, "7"); c.px(44, 23, "9"); c.rect(36, 33, 3, 2, "7")
}, glow("2", { r: 2, strength: 0.4 }))

// ================================================================ decorations (subdued ground props)

// deco_4_rod: a lightning rod: footing, thin mast, a charged tip, cast shadow.
sprite("deco_4_rod", { w: 9, h: 17, outline: "5" },
  line(4, 14, 8, 10, "5"), // shadow
  rect(2, 13, 5, 3, "7"), hline(2, 13, 5, "8"),
  vline(4, 2, 12, "8"), vline(5, 3, 10, "7"),
  px(4, 1, "9"), px(4, 0, "2"),
  glow("2", { r: 2, strength: 0.35 }))

const boulder = (x, y, r) => [circ(x + 1, y + 1, r, "5"), circ(x, y, r, "7"), circ(x - 1, y - 1, Math.max(1, r - 2), "8"), px(x - r + 1, y - 1, "9")]
sprite("deco_4_rocks", { w: 19, h: 13, outline: "5" }, ...boulder(5, 7, 4), ...boulder(14, 5, 3), ...boulder(13, 10, 2))

// deco_4_crystal: a charged slate crystal with a faint yellow glow inside.
sprite("deco_4_crystal", { w: 11, h: 13, outline: "5" },
  poly([7, 12, 11, 9, 9, 13], "5"), // shadow
  poly([5, 0, 8, 4, 7, 12, 3, 12, 2, 4], "7"),
  poly([5, 0, 5, 12, 3, 12, 2, 4], "8"), line(5, 1, 3, 4, "9"),
  poly([1, 6, 3, 8, 2, 12, 0, 11], "7"), poly([8, 5, 10, 8, 9, 11, 8, 10], "8"),
  px(5, 6, "2"), px(5, 7, "1"), px(4, 8, "1"),
  glow("2", { r: 2, strength: 0.4 }))

// deco_4_cable: a fallen power cable with insulator segments and a frayed, sparking end.
sprite("deco_4_cable", { w: 23, h: 9, outline: "5" }, (c) => {
  for (let x = 1; x < 21; x++) {
    const y = Math.round(4 + Math.sin(x * 0.45) * 2)
    c.px(x, y + 1, "5"); c.px(x, y, "7")
    if (x % 6 === 2) { c.rect(x, y - 1, 2, 3, "8"); c.px(x, y - 1, "9") }
  }
  c.px(21, 3, "8"); c.px(22, 2, "2"); c.px(22, 4, "1")
}, glow("2", { r: 2, strength: 0.35 }))

// deco_4_glass: fulgurite: a scorched patch with branching lightning-fused glass.
sprite("deco_4_glass", { w: 17, h: 11 },
  ellipse(8, 5, 8, 5, "5"), ellipse(8, 5, 6, 3, "6"),
  line(2, 5, 8, 4, "8"), line(8, 4, 14, 6, "8"), line(8, 4, 10, 1, "8"), line(5, 5, 4, 8, "8"), line(11, 5, 12, 9, "8"),
  px(8, 4, "9"), px(10, 1, "9"), px(14, 6, "9"), px(7, 4, "W"))

// ================================================================ previews (not in the atlas)

scene("p4_enemies", { w: 150, h: 60, bg: "6" },
  stamp("spark", 2, 2), stamp("bolt", 24, 2), stamp("coil", 42, 2), stamp("dynamo", 68, 2), stamp("ebullet_y", 100, 4),
  stamp("turret_4_base", 102, 24), stamp("turret_4_gun", 106, 22))
scene("p4_ground", { w: 170, h: 64, bg: "6" },
  stamp("lm_pylon", 2, 4), stamp("lm_dish", 40, 4), stamp("deco_4_rod", 92, 4), stamp("deco_4_rocks", 104, 4),
  stamp("deco_4_crystal", 126, 4), stamp("deco_4_cable", 140, 4), stamp("deco_4_glass", 92, 30), stamp("planet_4", 116, 16))

sheet("atlas_p4", ["spark", "bolt", "coil", "dynamo", "boss_tempest", "ebullet_y", "planet_4", "turret_4_base", "turret_4_gun",
  "lm_pylon", "lm_dish", "deco_4_rod", "deco_4_rocks", "deco_4_crystal", "deco_4_cable", "deco_4_glass"], { pad: 2 })
