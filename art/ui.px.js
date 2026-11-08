// Neon Squadron UI icons (pxl DSL).
// Build: node .claude/skills/pxl-pixel-art/bin/pxl.js build art/ui.px.js --out art/out_ui
// Upgrade icons are drawn 14x14 + 1px outline = 16x16. HUD icons 10x10 + outline = 12x12.
// Light from top-left: lighter top/left edges, darker bottom/right, one white glint.

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
  z: "#fff6b8",
  G: "#0f7a40", // green
  g: "#4dff8a",
  t: "#b8ffd4",
  R: "#8a1020", // red
  r: "#ff3b3b",
})
ramps("knshHjW", "kmPpq", "kCce", "kVvu", "kOoay", "Yyz", "kGgt", "kRr")

const star = (cx, cy, n, r1, r2, rot = -Math.PI / 2) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = rot + (i * Math.PI) / n, r = i % 2 ? r2 : r1;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  }).flat();

const icon = { w: 14, h: 14, outline: "k" };
const ui = { w: 10, h: 10, outline: "k" };

// ================================================================ upgrade icons (16x16)

sprite("icon_cannon", icon,
  // base block
  rect(1, 9, 12, 5, "h"), hline(1, 9, 12, "H"), hline(1, 13, 12, "s"), vline(12, 9, 5, "s"),
  px(2, 11, "j"), px(11, 11, "j"),
  // side barrels
  rect(1, 4, 3, 5, "h"), vline(1, 4, 5, "j"), vline(3, 4, 5, "s"), hline(1, 4, 3, "c"),
  rect(10, 4, 3, 5, "h"), vline(10, 4, 5, "j"), vline(12, 4, 5, "s"), hline(10, 4, 3, "c"),
  // centre barrel
  rect(5, 2, 4, 7, "H"), vline(5, 2, 7, "W"), vline(8, 2, 7, "h"), hline(5, 2, 4, "e"),
  // muzzle flash
  rect(6, 0, 2, 2, "w"), px(5, 1, "e"), px(8, 1, "e"), px(2, 3, "e"), px(11, 3, "e"),
  glow("ew", { r: 2, strength: 0.5 }))

sprite("icon_seeker", icon,
  // curling homing trail behind the tail
  px(3, 11, "u"), px(2, 12, "v"), px(1, 12, "v"), px(0, 11, "V"), px(0, 10, "V"), px(1, 9, "V"),
  // body: a rotated capsule from tail (5,9) to nose (12,2)
  poly([3.9, 7.9, 10.9, 0.9, 13.1, 3.1, 6.1, 10.1], "v"),
  line(4, 8, 11, 1, "u"), line(6, 10, 12, 4, "V"),
  // band and nose cone
  line(8, 3, 10, 5, "a"),
  poly([10.9, 0.9, 14, 0, 13.1, 3.1], "W"), px(13, 0, "w"), px(12, 1, "w"),
  // fins
  poly([3.9, 7.9, 1.5, 6.5, 5.5, 6.2], "u"), poly([6.1, 10.1, 7.5, 12.5, 7.8, 8.5], "V"),
  // flame
  px(4, 10, "a"), px(3, 10, "o"),
  glow("uwa", { r: 2, strength: 0.4 }))

sprite("icon_blade", icon,
  // orbit, dashed so it reads as motion
  ring(7, 7, 5, "C"), px(2, 7, "_"), px(12, 7, "_"), px(7, 2, "_"), px(7, 12, "_"),
  // core
  circ(7, 7, 2, "c"), px(6, 6, "w"), px(7, 6, "e"), px(6, 7, "e"),
  // two blades on the orbit, lying along it
  line(9, 0, 13, 4, "e", 2), line(9, 0, 13, 4, "w"),
  line(1, 9, 5, 13, "c", 2), line(1, 9, 5, 13, "e"),
  // trailing glints behind each blade
  px(7, 1, "c"), px(6, 1, "C"), px(13, 7, "c"), px(13, 8, "C"),
  glow("ew", { r: 2, strength: 0.5 }))

sprite("icon_laser", icon,
  // white ray in from the left
  line(0, 11, 4, 9, "W"), px(0, 11, "w"),
  // prism: light left face, dark right face, base
  poly([1, 14, 7, 2, 12, 14], "P"), poly([1, 14, 7, 2, 7, 14], "p"),
  line(2, 13, 6, 4, "q"), hline(2, 13, 10, "m"), line(8, 4, 11, 12, "m"),
  px(5, 7, "w"), px(4, 9, "q"),
  // split beams out to the upper right
  line(9, 7, 13, 2, "w"), line(9, 8, 13, 5, "q"), line(10, 9, 13, 8, "u"),
  px(13, 1, "w"), px(12, 1, "q"),
  glow("qwu", { r: 2, strength: 0.5 }))

sprite("icon_rate", icon,
  // gear
  circ(7, 7, 5, "H"),
  rect(6, 0, 2, 2, "j"), rect(6, 12, 2, 2, "h"), rect(0, 6, 2, 2, "j"), rect(12, 6, 2, 2, "h"),
  rect(2, 2, 2, 2, "j"), rect(10, 2, 2, 2, "H"), rect(2, 10, 2, 2, "H"), rect(10, 10, 2, 2, "h"),
  circ(8, 8, 4, "h"), circ(7, 7, 4, "H"),
  circ(7, 7, 2, "n"),
  // bolt
  poly([8, 0, 3, 8, 7, 8, 5, 14, 11, 5, 7, 5, 9, 0], "y"),
  line(7, 1, 4, 7, "z"), poly([7, 5, 11, 5, 10, 6, 6, 6], "Y"), px(6, 2, "w"),
  glow("yz", { r: 2, strength: 0.4 }))

sprite("icon_damage", icon,
  // layered blast: dark long spikes, bright short spikes, hot core
  poly(star(7, 7, 8, 7.4, 3.8), "O"),
  poly(star(7, 7, 8, 6.2, 3.4, -Math.PI / 2 + Math.PI / 8), "o"),
  circ(7, 7, 4, "o"), circ(7, 7, 3, "a"), circ(6, 6, 2, "y"), rect(5, 5, 2, 2, "w"),
  // shrapnel
  px(0, 0, "a"), px(13, 1, "o"), px(0, 13, "o"), px(13, 13, "O"),
  glow("ayw", { r: 2, strength: 0.4 }))

sprite("icon_armor", icon,
  poly([0, 0, 14, 0, 14, 8, 7, 14, 0, 8], "h"),
  poly([2, 2, 12, 2, 12, 8, 7, 12, 2, 8], "H"),
  hline(0, 0, 14, "j"), vline(0, 0, 8, "j"),
  vline(13, 1, 7, "s"), line(13, 8, 7, 13, "s"),
  vline(7, 3, 8, "j"), hline(3, 5, 9, "j"), vline(8, 4, 7, "h"),
  px(1, 1, "W"), px(12, 1, "W"), px(1, 7, "W"), px(12, 7, "s"),
  px(3, 3, "w"),
  glow("w", { r: 1, strength: 0.3 }))

sprite("icon_magnet", icon,
  // legs
  rect(1, 5, 4, 5, "p"), rect(9, 5, 4, 5, "P"),
  vline(1, 5, 6, "q"), vline(9, 5, 5, "p"),
  // bottom curve
  rect(1, 9, 12, 2, "p"), rect(2, 11, 10, 2, "P"), hline(4, 13, 6, "m"),
  px(2, 11, "p"), hline(5, 9, 4, "_"), rect(5, 5, 4, 4, "_"), hline(6, 10, 2, "P"),
  // silver tips
  rect(1, 3, 4, 2, "W"), rect(9, 3, 4, 2, "j"), px(1, 3, "w"),
  // field arcs
  px(4, 1, "q"), px(5, 0, "q"), px(6, 0, "w"), px(7, 0, "w"), px(8, 0, "q"), px(9, 1, "q"),
  px(6, 2, "q"), px(7, 2, "q"),
  glow("qw", { r: 2, strength: 0.4 }))

// ================================================================ HUD / menu icons (12x12)

sprite("ui_shield", ui,
  poly([0, 0, 10, 0, 10, 6, 5, 10, 0, 6], "H"),
  poly([2, 2, 8, 2, 8, 6, 5, 8, 2, 6], "c"), poly([2, 2, 5, 2, 5, 8, 2, 6], "e"),
  hline(0, 0, 10, "j"), vline(0, 0, 6, "j"), vline(9, 1, 5, "h"), line(9, 6, 5, 9, "h"),
  px(3, 3, "w"),
  glow("e", { r: 1, strength: 0.3 }))

sprite("ui_xp", ui,
  poly([5, 0, 10, 4, 5, 10, 0, 4], "c"), poly([5, 0, 5, 10, 0, 4], "e"),
  line(1, 4, 9, 4, "C"), px(4, 2, "w"), px(3, 3, "w"),
  glow("e", { r: 2, strength: 0.4 }))

sprite("ui_star", ui,
  poly(star(5, 5.4, 5, 5.4, 2.4), "y"), poly(star(5, 5.4, 5, 3.4, 1.4), "z"),
  px(5, 6, "Y"), px(6, 7, "Y"), px(4, 3, "w"),
  glow("y", { r: 1, strength: 0.3 }))

sprite("ui_skull", { w: 10, h: 10, mx: true, outline: "k" }, `
  ..WWW
  .WWWW
  WWWWW
  WkkWW
  WkkjW
  jWWWk
  .jWWW
  .WkWk
  .jWjW`)

sprite("ui_flag", ui,
  vline(1, 0, 10, "j"), vline(2, 0, 10, "h"), rect(0, 9, 4, 1, "H"),
  poly([3, 0, 10, 1, 8, 3, 10, 5, 3, 5], "p"), hline(3, 0, 6, "q"), poly([3, 3, 9, 3, 10, 5, 3, 5], "P"),
  px(4, 1, "w"),
  glow("q", { r: 1, strength: 0.3 }))

sprite("ui_trophy", { w: 10, h: 10, mx: true, outline: "k" }, `
  .zzyy
  yzyyy
  y.yyy
  .yzyy
  ..yyy
  ...yY
  ...yY
  ...yY
  ..YYY
  .YYYY`, px(2, 0, "w"))

sprite("ui_scrap", ui,
  circ(5, 5, 4, "y"),
  rect(4, 0, 2, 2, "y"), rect(4, 8, 2, 2, "Y"), rect(0, 4, 2, 2, "y"), rect(8, 4, 2, 2, "Y"),
  px(1, 1, "z"), px(8, 1, "y"), px(1, 8, "y"), px(8, 8, "Y"),
  circ(5, 5, 1, "n"), px(3, 2, "w"), px(2, 3, "z"),
  px(7, 7, "Y"), px(6, 8, "Y"),
  glow("y", { r: 1, strength: 0.3 }))

sprite("ui_lock", ui,
  ring(5, 4, 3, "j"), rect(0, 4, 10, 6, "_"),
  rect(1, 4, 8, 6, "y"), hline(1, 4, 8, "z"), vline(8, 5, 5, "Y"), hline(1, 9, 8, "Y"),
  rect(4, 6, 2, 2, "n"), px(4, 8, "n"), px(2, 5, "w"))

sprite("ui_check", ui,
  line(1, 5, 4, 8, "g", 2), line(4, 8, 9, 1, "g", 2), line(1, 4, 4, 7, "t"), line(4, 7, 8, 1, "t"),
  px(8, 1, "w"),
  glow("g", { r: 1, strength: 0.3 }))

sprite("ui_video", ui,
  rect(0, 1, 10, 8, "W"), px(0, 1, "_"), px(9, 1, "_"), px(0, 8, "_"), px(9, 8, "_"),
  hline(1, 1, 8, "w"), hline(1, 8, 8, "j"), vline(9, 2, 6, "j"),
  poly([3, 2, 3, 8, 8, 5], "v"), line(3, 2, 6, 4, "V"))

sprite("ui_pause", ui,
  rect(1, 0, 3, 10, "W"), rect(6, 0, 3, 10, "W"), vline(3, 0, 10, "j"), vline(8, 0, 10, "j"),
  px(1, 0, "w"), px(6, 0, "w"))

sprite("ui_play", ui,
  poly([1, 0, 1, 10, 10, 5], "W"), line(1, 0, 8, 4, "w"), line(2, 9, 8, 6, "j"))

sprite("_speaker", { w: 6, h: 10 },
  rect(0, 3, 3, 4, "W"), poly([2, 3, 6, 0, 6, 10, 2, 7], "W"), vline(5, 1, 8, "j"), px(0, 3, "w"))
sprite("ui_sound_on", ui,
  stamp("_speaker", 0, 0),
  vline(7, 3, 4, "e"), px(8, 1, "e"), vline(9, 2, 6, "e"), px(8, 8, "e"),
  glow("e", { r: 1, strength: 0.3 }))
sprite("ui_sound_off", ui,
  stamp("_speaker", 0, 0),
  line(7, 3, 10, 6, "r"), line(7, 6, 10, 3, "r"))

sprite("ui_arrow_l", ui,
  poly([7, 0, 9, 2, 6, 5, 9, 8, 7, 10, 2, 5], "W"), line(7, 0, 2, 5, "w"), line(3, 6, 7, 10, "j"))
sprite("ui_arrow_r", { base: "ui_arrow_l", flip: "x" })

sprite("ui_home", ui,
  poly([5, 0, 10, 5, 0, 5], "q"), line(5, 0, 0, 5, "w"),
  rect(1, 5, 8, 5, "W"), vline(8, 5, 5, "j"), hline(1, 9, 8, "j"),
  rect(4, 6, 2, 4, "h"), px(4, 6, "s"), rect(7, 1, 1, 2, "j"))

// ================================================================ main menu emblem (64x24)

sprite("ui_emblem", { w: 62, h: 22, mx: true, outline: "k" },
  // wings: three feather rows, light top row
  poly([31, 6, 31, 10, 9, 9, 0, 2, 13, 4], "c"),
  poly([31, 10, 31, 14, 11, 14, 3, 8, 15, 10], "C"),
  poly([31, 14, 31, 17, 15, 18, 8, 13, 17, 15], "h"),
  line(1, 2, 13, 4, "e"), line(13, 4, 30, 6, "e"),
  line(7, 6, 22, 9, "C"), line(12, 11, 24, 13, "s"), line(15, 15, 26, 16, "n"),
  px(0, 2, "w"), px(1, 2, "w"),
  // centre badge
  poly([31, 0, 31, 22, 25, 18, 24, 4], "n"), line(24, 4, 30, 0, "s"),
  poly([31, 4, 31, 9, 26, 14, 26, 10], "W"), line(26, 10, 30, 6, "w"),
  poly([31, 11, 31, 16, 26, 21, 26, 17], "e"), line(26, 17, 30, 13, "w"),
  glow("e", { r: 3, strength: 0.4 }))

// hangar / FLIGHT button: a small fighter, nose up
sprite("ui_ship", { w: 12, h: 12, mx: true, outline: "k" },
  poly([5, 0, 6, 0, 6, 11, 4, 11, 4, 4], "H"), poly([6, 5, 6, 9, 0, 10, 0, 8], "h"),
  line(0, 8, 5, 5, "e"), vline(5, 1, 3, "W"), rect(4, 4, 2, 2, "c"), px(5, 4, "e"), rect(3, 9, 2, 3, "s"))

// transform button (PALADIN): a robot head between two swap arrows
sprite("ui_transform", { w: 12, h: 12, outline: "k" },
  rect(4, 3, 4, 4, "H"), rect(4, 4, 4, 1, "g"), px(6, 4, "w"), rect(5, 7, 2, 1, "h"), // head + visor
  hline(1, 0, 7, "g"), px(8, 0, "g"), px(7, 1, "g"), px(8, 1, "g"), px(7, 0, "w"), // top arrow ->
  hline(4, 10, 7, "g"), px(3, 10, "g"), px(4, 11, "g"), px(3, 11, "g"), px(4, 9, "w"), // bottom arrow <-
  vline(1, 1, 3, "g"), vline(10, 7, 3, "g"))

sheet("atlas_ui", ["*"], { pad: 2 })
