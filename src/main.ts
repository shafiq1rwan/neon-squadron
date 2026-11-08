import Phaser from "phaser";
import { BootScene } from "./scenes/Boot";
import { GameScene } from "./scenes/Game";
import { HudScene } from "./scenes/Hud";
import { computeLayout, Layouts } from "./layout";
import { Poki } from "./poki";

/** Bundled pixel font (SIL OFL, public/fonts). Loaded before Phaser so text never renders in a fallback. */
async function loadFonts() {
  const base = import.meta.env.BASE_URL;
  const faces = [
    new FontFace("Silkscreen", `url(${base}fonts/Silkscreen-Regular.ttf)`, { weight: "400" }),
    new FontFace("Silkscreen", `url(${base}fonts/Silkscreen-Bold.ttf)`, { weight: "700" }),
  ];
  await Promise.all(faces.map(async (f) => {
    try { document.fonts.add(await f.load()); } catch { /* fall back to monospace */ }
  }));
}

async function start() {
  await Promise.all([Poki.init(), loadFonts()]);

  const L = Layouts.current;
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    width: L.width,
    height: L.height,
    backgroundColor: "#06040f",
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 2 },
    audio: { noAudio: true }, // sounds are synthesized in sfx.ts
    render: { powerPreference: "high-performance" },
    scene: [BootScene, GameScene, HudScene], // HUD last so it draws on top
  });

  // Dev only (stripped from production builds): lets test scripts inspect the running game.
  if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;

  // Phones rotate and desktop windows resize: rebuild the layout, then let FIT rescale.
  let timer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      const next = computeLayout(window.innerWidth, window.innerHeight);
      const cur = Layouts.current;
      if (next.width === cur.width && next.height === cur.height) return;
      Layouts.set(next);
      game.scale.setGameSize(next.width, next.height);
      game.events.emit("layout", next);
    }, 120);
  });
}

void start();
