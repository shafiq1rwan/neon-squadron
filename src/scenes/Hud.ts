import Phaser from "phaser";
import { Layouts, Layout } from "../layout";
import { UPGRADES, UpgradeId, Choice } from "../data/upgrades";
import { PLANETS, Planet, WAVE_COUNT } from "../data/planets";
import { SHIPS, ShipDef, shipById } from "../data/ships";
import { Art } from "../art";
import { Save } from "../save";
import { Sfx } from "../sfx";
import type { GameScene, RunResult } from "./Game";

// All HUD coordinates are screen units (the playfield column is 720 wide here, 3x the world).
// Silkscreen is a pixel font: sizes are kept to multiples of 8 so it stays crisp.

export const FONT = "Silkscreen, ui-monospace, Consolas, monospace";
const C = {
  cyan: 0x2df4ff, pink: 0xff3d9a, yellow: 0xffe24a, violet: 0xb46cff, white: 0xe8ecff, red: 0xff3b3b, green: 0x4dff8a,
  hull: 0x8f9ae8, dim: 0x5a6094, card: 0x100c26, dark: 0x06040f, line: 0x2b2a5e, bar: 0x171233,
};
const PLANET_COLOR = [0xff8a3a, 0x7ad0ff, 0x9cff4a, 0xffe84a, 0xff3b4a];
const css = (c: number) => "#" + c.toString(16).padStart(6, "0");

type Container = Phaser.GameObjects.Container;
type G = Phaser.GameObjects.Graphics;

export class HudScene extends Phaser.Scene {
  private g!: GameScene;
  private L!: Layout;
  private mode: "menu" | "run" = "menu";

  private hpG!: G;
  private xpG!: G;
  private waveG!: G;
  private hpText!: Phaser.GameObjects.Text;
  private lvText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private waveFlag!: Phaser.GameObjects.Image;
  private bossBox!: Container;
  private bossG!: G;
  private hurtTint!: Phaser.GameObjects.Rectangle;
  private loadoutBox!: Container;
  private statsText: Phaser.GameObjects.Text | null = null;
  private runHud: Phaser.GameObjects.GameObject[] = [];
  private loadoutSig = "";
  private transformLabel: Phaser.GameObjects.Text | null = null;
  private transformCdG: G | null = null;
  private transformPos = { x: 0, y: 0 };

  private overlay: Container | null = null;
  private overlayFn: (() => void) | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private overlayTimers: Phaser.Time.TimerEvent[] = [];
  private menuArgs: [(i: number) => void, (i: number) => void] | null = null;
  private busy = false; // blocks double taps while an ad request is running

  constructor() {
    super("hud");
  }

  create() {
    this.g = this.scene.get("game") as GameScene;
    this.build();
    this.game.events.on("layout", this.build, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off("layout", this.build, this));
    this.input.keyboard!.on("keydown", (e: KeyboardEvent) => this.keyHandler?.(e));
  }

  /** Mouse-and-keyboard player (the ship follows the cursor) vs touch (drag). */
  private desktop() {
    return this.sys.game.device.os.desktop;
  }

  // ================================================================== drawing helpers

  private text(x: number, y: number, s: string, size: number, color = C.white, opts: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}) {
    return this.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color: css(color), ...opts });
  }

  private title(x: number, y: number, s: string, size: number, color: number) {
    return this.text(x, y, s, size, color, { fontStyle: "bold", stroke: css(C.dark), strokeThickness: Math.max(4, size / 6),
      shadow: { offsetX: 0, offsetY: size / 12, color: css(0x000000), fill: true, stroke: true } }).setOrigin(0.5);
  }

  private icon(frame: string, x: number, y: number, scale: number) {
    return this.add.image(x, y, Art.key(frame), frame).setScale(scale);
  }

  /** Notched-corner panel with accent corner brackets. */
  private panel(g: G, x: number, y: number, w: number, h: number, accent: number, alpha = 0.94, cut = 10) {
    const p = (px: number, py: number) => new Phaser.Math.Vector2(px, py);
    const pts = [p(x + cut, y), p(x + w - cut, y), p(x + w, y + cut), p(x + w, y + h - cut), p(x + w - cut, y + h), p(x + cut, y + h), p(x, y + h - cut), p(x, y + cut)];
    g.fillStyle(C.card, alpha).fillPoints(pts, true);
    g.lineStyle(2, C.line, 1).strokePoints(pts, true, true);
    const L = Math.min(22, w / 4, h / 4);
    g.lineStyle(3, accent, 1);
    g.strokePoints([p(x, y + cut + L), p(x, y + cut), p(x + cut, y), p(x + cut + L, y)]);
    g.strokePoints([p(x + w - cut - L, y), p(x + w - cut, y), p(x + w, y + cut), p(x + w, y + cut + L)]);
    g.strokePoints([p(x + w, y + h - cut - L), p(x + w, y + h - cut), p(x + w - cut, y + h), p(x + w - cut - L, y + h)]);
    g.strokePoints([p(x + cut + L, y + h), p(x + cut, y + h), p(x, y + h - cut), p(x, y + h - cut - L)]);
    return g;
  }

  private button(parent: Container, x: number, y: number, w: number, h: number, label: string,
    opts: { color?: number; video?: boolean; icon?: string; size?: number; disabled?: boolean }, onClick: () => void | Promise<void>) {
    const col = opts.disabled ? C.dim : opts.color ?? C.cyan;
    const g = this.add.graphics();
    this.panel(g, -w / 2, -h / 2, w, h, col, 1, 12);
    g.fillStyle(col, 0.14).fillRect(-w / 2 + 6, -h / 2 + 6, w - 12, h / 2 - 6); // top sheen
    const t = this.text(0, 0, label, opts.size ?? 24, col, { fontStyle: "bold" }).setOrigin(0.5);
    const items: Phaser.GameObjects.GameObject[] = [g, t];
    const ic = opts.video ? "ui_video" : opts.icon;
    if (ic) {
      // Poki: rewarded buttons show a video icon (and are never green)
      const s = Math.max(2, Math.round(h / 30));
      const iw = 12 * s + 12;
      t.x = iw / 2;
      items.push(this.icon(ic, t.x - t.width / 2 - iw / 2, 0, s));
    }
    const btn = this.add.container(x, y, items);
    // Phaser offsets a container's hit test by its display origin (half its size): (0, 0, w, h) covers it.
    btn.setSize(w, h).setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    if (btn.input) btn.input.cursor = opts.disabled ? "default" : "pointer";
    if (!opts.disabled) {
      btn.on("pointerdown", () => btn.setScale(0.95));
      btn.on("pointerout", () => btn.setScale(1));
      btn.on("pointerup", async () => {
        btn.setScale(1);
        if (this.busy) return;
        Sfx.unlock();
        Sfx.play("click");
        this.busy = true;
        try { await onClick(); } finally { this.busy = false; }
      });
    }
    parent.add(btn);
    return btn;
  }

  /** Small square icon button (pause, sound, arrows). */
  private iconButton(parent: Container | null, x: number, y: number, size: number, frame: string, color: number, onClick: () => void) {
    const g = this.add.graphics();
    this.panel(g, -size / 2, -size / 2, size, size, color, 0.92, 8);
    const ic = this.icon(frame, 0, 0, Math.floor((size - 16) / 12));
    const b = this.add.container(x, y, [g, ic]).setSize(size, size)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, size, size), Phaser.Geom.Rectangle.Contains);
    if (b.input) b.input.cursor = "pointer";
    b.on("pointerdown", () => b.setScale(0.92));
    b.on("pointerout", () => b.setScale(1));
    b.on("pointerup", () => { b.setScale(1); Sfx.unlock(); Sfx.play("click"); onClick(); });
    parent?.add(b);
    return b;
  }

  // ================================================================== static HUD

  private build() {
    this.children.removeAll(true);
    this.overlay = null;
    this.statsText = null;
    this.runHud = [];
    this.loadoutSig = "";
    const L = (this.L = Layouts.current);
    this.cameras.main.setSize(L.width, L.height);
    const px = L.playX, pw = L.playW, H = L.height;

    // side areas
    if (L.width > pw) {
      const sides = this.add.graphics();
      sides.fillStyle(C.dark, 1).fillRect(0, 0, px, H).fillRect(px + pw, 0, L.width - px - pw, H);
      sides.fillStyle(C.violet, 0.5).fillRect(px - 3, 0, 3, H).fillRect(px + pw, 0, 3, H);
    }
    this.hurtTint = this.add.rectangle(px, 0, pw, H, 0xff2050, 0).setOrigin(0);

    this.loadoutBox = this.add.container(0, 0).setDepth(5); // above the side panel frame
    if (L.panels) this.buildPanels();
    if (this.mode === "run") this.buildRunHud();
    if (this.overlayFn) this.overlayFn();
  }

  /** The in-run HUD across the top of the playfield. */
  private buildRunHud() {
    const L = this.L, px = L.playX, pw = L.playW;
    const add = <T extends Phaser.GameObjects.GameObject>(o: T) => (this.runHud.push(o), o);

    const top = add(this.add.graphics());
    top.fillStyle(0x05030c, 0.7).fillRect(px, 0, pw, 104);
    top.fillStyle(C.violet, 0.45).fillRect(px, 104, pw, 2);

    // hull: shield + 10 segments
    add(this.icon("ui_shield", px + 34, 30, 3));
    this.hpG = add(this.add.graphics());
    this.hpText = add(this.text(px + 64, 44, "", 16, C.hull));
    // level + xp
    add(this.icon("ui_xp", px + 34, 78, 2.5));
    this.lvText = add(this.text(px + 64, 66, "LV 1", 24, C.cyan, { fontStyle: "bold" }));
    this.xpG = add(this.add.graphics());

    // wave tracker, centre
    this.waveText = add(this.text(px + pw / 2 + 14, 16, "", 16, C.white, { fontStyle: "bold" }).setOrigin(0.5, 0));
    this.waveFlag = add(this.icon("ui_flag", 0, 24, 2));
    this.waveG = add(this.add.graphics());

    // score + pause, right
    this.scoreText = add(this.text(px + pw - 92, 16, "000000", 24, C.white, { fontStyle: "bold" }).setOrigin(1, 0));
    add(this.icon("ui_star", px + pw - 92 - this.scoreText.width - 22, 28, 2));
    add(this.text(px + pw - 92, 52, this.g.planet.name, 16, PLANET_COLOR[this.g.planet.index]).setOrigin(1, 0));
    add(this.iconButton(null, px + pw - 46, 44, 60, "ui_pause", C.cyan, () => this.g.pause()));

    // TRANSFORM button (only for ships that can): bottom-right, shows the form and refills on cooldown
    if (this.g.shipDef.transform) {
      const bx = px + pw - 52, by = this.L.height - 128;
      add(this.iconButton(null, bx, by, 76, "ui_transform", C.green, () => this.g.tryTransform()));
      this.transformLabel = add(this.text(bx, by + 46, "", 16, C.green, { fontStyle: "bold" }).setOrigin(0.5, 0));
      this.transformCdG = add(this.add.graphics());
      this.transformPos = { x: bx, y: by };
    } else this.transformLabel = null;

    // boss bar
    const bw = pw - 120;
    this.bossBox = add(this.add.container(px + pw / 2, 146).setVisible(false));
    const frameG = this.add.graphics();
    this.panel(frameG, -bw / 2 - 12, -30, bw + 24, 64, C.pink, 0.85, 8);
    this.bossG = this.add.graphics();
    this.bossBox.add([frameG, this.bossG, this.icon("ui_skull", -bw / 2 + 12, -12, 2),
      this.text(-bw / 2 + 32, -24, this.g.planet.bossName, 16, C.pink, { fontStyle: "bold" })]);
  }

  private buildPanels() {
    const L = this.L, px = L.playX, pw = L.playW, H = L.height;
    const lw = Math.min(px - 48, 420), lx = (px - lw) / 2;
    const rx0 = px + pw, rw = Math.min(L.width - rx0 - 48, 420), rx = rx0 + (L.width - rx0 - rw) / 2;
    const g = this.add.graphics();

    if (this.mode === "menu") {
      this.panel(g, lx, 40, lw, 420, C.cyan, 0.9);
      this.text(lx + lw / 2, 70, "HOW TO PLAY", 24, C.cyan, { fontStyle: "bold" }).setOrigin(0.5, 0);
      this.text(lx + lw / 2, 130, (this.desktop() ? "MOVE THE MOUSE\nOR ARROW KEYS" : "DRAG ANYWHERE") + "\nTO FLY\n\nYOUR GUNS FIRE\nON THEIR OWN\n\nGRAB CRYSTALS\nTO LEVEL UP\n\nEVERY UPGRADE\nCHANGES YOUR SHIP",
        16, C.hull, { align: "center", lineSpacing: 8 }).setOrigin(0.5, 0);
      this.panel(g, rx, 40, rw, 110 + PLANETS.length * 56, C.violet, 0.9);
      this.text(rx + rw / 2, 70, "CAMPAIGN", 24, C.violet, { fontStyle: "bold" }).setOrigin(0.5, 0);
      PLANETS.forEach((p, i) => {
        const y = 124 + i * 56, unlocked = i < Save.data.unlocked;
        this.icon(p.icon, rx + 52, y + 18, 1);
        this.text(rx + 92, y, unlocked ? p.name : "???", 24, unlocked ? PLANET_COLOR[i] : C.dim, { fontStyle: "bold" });
        this.text(rx + 92, y + 28, unlocked ? p.title : "LOCKED", 16, C.dim);
        if (Save.data.cleared[i]) this.icon("ui_check", rx + rw - 40, y + 18, 3);
        else if (!unlocked) this.icon("ui_lock", rx + rw - 40, y + 18, 3);
      });
      return;
    }

    this.panel(g, lx, 40, lw, H - 80, C.cyan, 0.9);
    this.text(lx + lw / 2, 64, "LOADOUT", 24, C.cyan, { fontStyle: "bold" }).setOrigin(0.5, 0);
    this.loadoutBox.setPosition(lx + 24, 120);

    const p = this.g.planet;
    this.panel(g, rx, 40, rw, H - 80, PLANET_COLOR[p.index], 0.9);
    this.icon(p.icon, rx + rw / 2, 150, 3);
    this.text(rx + rw / 2, 238, p.name, 32, PLANET_COLOR[p.index], { fontStyle: "bold" }).setOrigin(0.5, 0);
    this.text(rx + rw / 2, 280, p.title, 16, C.hull).setOrigin(0.5, 0);
    this.statsText = this.text(rx + 70, 340, "", 24, C.white, { lineSpacing: 26 });
    ["ui_flag", "ui_star", "ui_skull", "ui_trophy"].forEach((f, i) => this.icon(f, rx + 40, 354 + i * 50, 2));
    this.text(rx + rw / 2, H - 170, "MOUSE / ARROWS  MOVE\nESC / SPACE  PAUSE\n1 2 3  PICK CARD" + (this.g.shipDef.transform ? "\nE / RIGHT CLICK  TRANSFORM" : ""), 16, C.dim, { align: "center", lineSpacing: 10 }).setOrigin(0.5, 0);
  }

  private refreshLoadout() {
    const lv = this.g.levels;
    const owned = (Object.keys(UPGRADES) as UpgradeId[]).filter((id) => lv[id] > 0);
    const sig = this.mode + owned.map((id) => id + lv[id]).join(",");
    if (sig === this.loadoutSig) return;
    this.loadoutSig = sig;
    this.loadoutBox.removeAll(true);
    if (this.mode !== "run") return;
    const slot = (x: number, y: number, size: number, id: UpgradeId) => {
      const def = UPGRADES[id];
      const g = this.add.graphics();
      this.panel(g, x - size / 2, y - size / 2, size, size, def.color, 0.9, 6);
      this.loadoutBox.add([g, this.icon(def.icon, x, y, Math.floor((size - 12) / 16))]);
    };
    const pips = (x: number, y: number, id: UpgradeId, w: number, h: number) => {
      const def = UPGRADES[id];
      for (let k = 0; k < def.max; k++) {
        const core = def.core.includes(k + 1);
        this.loadoutBox.add(this.add.rectangle(x + k * (w + 4), y, w, core ? h + 4 : h, k < lv[id] ? (core ? C.yellow : def.color) : C.line).setOrigin(0, 0.5));
      }
    };
    if (this.L.panels) {
      owned.forEach((id, i) => {
        const y = i * 76 + 30;
        slot(30, y, 60, id);
        this.loadoutBox.add(this.text(76, y - 26, UPGRADES[id].name, 16, UPGRADES[id].color, { fontStyle: "bold" }));
        pips(76, y + 12, id, 18, 8);
      });
    } else {
      const y = this.L.height - 46;
      owned.forEach((id, i) => {
        const x = this.L.playX + 40 + i * 70;
        slot(x, y - 6, 56, id);
        pips(x - 24, y + 28, id, 4, 4);
      });
    }
  }

  update(_t: number, dms: number) {
    const g = this.g;
    if (!g || !this.hurtTint) return;
    this.hurtTint.fillAlpha = Math.max(0, this.hurtTint.fillAlpha - dms / 600);
    this.refreshLoadout();
    if (this.mode !== "run" || !this.hpG) return;
    const px = this.L.playX, pw = this.L.playW;

    // hull segments
    const frac = Phaser.Math.Clamp(g.hp / g.maxHp, 0, 1), segs = 10, sw = 15, sh = 18, gap = 3, x0 = px + 64, y0 = 16;
    const col = frac < 0.3 ? C.red : C.pink;
    this.hpG.clear();
    for (let i = 0; i < segs; i++) {
      const f = Phaser.Math.Clamp(frac * segs - i, 0, 1);
      this.hpG.fillStyle(C.bar, 1).fillRect(x0 + i * (sw + gap), y0, sw, sh);
      if (f > 0) {
        this.hpG.fillStyle(col, 1).fillRect(x0 + i * (sw + gap), y0, Math.ceil(sw * f), sh);
        this.hpG.fillStyle(0xffffff, 0.35).fillRect(x0 + i * (sw + gap), y0, Math.ceil(sw * f), 4);
      }
    }
    // shield charges, as cyan cells after the hull bar
    for (let i = 0; i < g.shieldHits; i++) {
      const sx0 = x0 + segs * (sw + gap) + 6 + i * 13;
      this.hpG.fillStyle(C.cyan, 1).fillRect(sx0, y0, 10, sh).fillStyle(0xffffff, 0.6).fillRect(sx0, y0, 10, 4);
    }
    this.hpText.setText(`${Math.ceil(g.hp)}/${g.maxHp}${g.shieldHits > 0 ? "  SHIELD" : ""}`);

    // xp
    this.lvText.setText(`LV ${g.level}`);
    const xw = 150, xx = px + 64 + this.lvText.width + 14;
    this.xpG.clear().fillStyle(C.bar, 1).fillRect(xx, 74, xw, 10).fillStyle(C.cyan, 1)
      .fillRect(xx, 74, xw * Phaser.Math.Clamp(g.xp / g.xpNeed, 0, 1), 10).lineStyle(2, C.line, 1).strokeRect(xx, 74, xw, 10);

    // waves: pips, the last one is the boss
    const w = Math.max(1, g.wave);
    this.waveText.setText(w >= WAVE_COUNT ? "BOSS" : `WAVE ${w}/${WAVE_COUNT}`);
    this.waveText.setColor(css(w >= WAVE_COUNT ? C.pink : C.white));
    this.waveFlag.x = this.waveText.x - this.waveText.width / 2 - 16;
    const pw0 = 8, pg = 3, total = WAVE_COUNT * pw0 + (WAVE_COUNT - 1) * pg, wx = px + pw / 2 - total / 2;
    this.waveG.clear();
    for (let i = 0; i < WAVE_COUNT; i++) {
      const boss = i === WAVE_COUNT - 1;
      const c = i + 1 < w ? C.cyan : i + 1 === w ? C.yellow : boss ? 0x5a1030 : C.line;
      this.waveG.fillStyle(c, 1).fillRect(wx + i * (pw0 + pg), boss ? 42 : 46, pw0, boss ? 14 : 6);
    }

    this.scoreText.setText(String(g.score).padStart(6, "0"));

    if (this.transformLabel && this.transformCdG) {
      this.transformLabel.setText(g.robot ? "ROBOT" : "FIGHTER");
      // cooldown: a dark shade over the button that drains from the top
      const k = Phaser.Math.Clamp(g.transformCd / 1.2, 0, 1), s = 76, { x, y } = this.transformPos;
      this.transformCdG.clear();
      if (k > 0) this.transformCdG.fillStyle(0x05030c, 0.65).fillRect(x - s / 2 + 4, y - s / 2 + 4 + (s - 8) * (1 - k), s - 8, (s - 8) * k);
    }

    const boss = g.boss;
    this.bossBox.setVisible(!!boss && boss.alive);
    if (boss) {
      const bw = pw - 120, f = Phaser.Math.Clamp(boss.hp / boss.maxHp, 0, 1);
      this.bossG.clear().fillStyle(C.bar, 1).fillRect(-bw / 2 + 4, 4, bw - 8, 18).fillStyle(C.pink, 1).fillRect(-bw / 2 + 4, 4, (bw - 8) * f, 18)
        .fillStyle(0xffffff, 0.3).fillRect(-bw / 2 + 4, 4, (bw - 8) * f, 4);
      for (const m of [1 / 3, 2 / 3]) this.bossG.fillStyle(C.dark, 1).fillRect(-bw / 2 + 4 + (bw - 8) * m - 1, 2, 3, 22); // phase marks
    }

    if (this.statsText) {
      const best = Math.max(Save.data.best[g.planet.index], g.score);
      this.statsText.setText(`${w >= WAVE_COUNT ? "BOSS" : `WAVE ${w}`}\n${g.score}\n${g.kills}\n${best}`);
    }
  }

  flashDamage() {
    if (this.hurtTint) this.hurtTint.fillAlpha = 0.35;
  }

  /** Called by the game when a run starts: switch the HUD into run mode. */
  startHud(_p: Planet) {
    this.mode = "run";
    this.hideOverlay();
    this.build();
    this.toast(this.desktop() ? "MOVE THE MOUSE TO FLY" : "DRAG ANYWHERE TO MOVE");
    if (this.g.shipDef.transform)
      this.time.delayedCall(2300, () => this.toast(this.desktop() ? "E OR RIGHT CLICK: TRANSFORM" : "TAP THE BUTTON TO TRANSFORM", 0.7));
  }

  // ================================================================== overlays

  private open(fn: (c: Container, cx: number, H: number) => void, keys: ((e: KeyboardEvent) => void) | null = null) {
    this.overlayFn = () => {
      this.clearTimers();
      this.overlay?.destroy();
      const c = (this.overlay = this.add.container(0, 0).setDepth(100));
      fn(c, this.L.playX + this.L.playW / 2, this.L.height);
    };
    this.keyHandler = keys;
    this.overlayFn();
  }

  private clearTimers() {
    for (const t of this.overlayTimers) t.remove();
    this.overlayTimers = [];
  }

  /** A ship image that slowly banks left and right (uses the generated rolled frames). */
  private bankingShip(c: Container, ship: ShipDef, x: number, y: number, scale: number, tint?: number) {
    const flame = this.add.image(x, y + 17 * scale, "atlas", "flame").setScale(scale).setBlendMode(Phaser.BlendModes.ADD);
    const img = this.add.image(x, y, "atlas", ship.frame).setScale(scale);
    if (tint !== undefined) { img.setTint(tint); flame.setVisible(false); }
    c.add([flame, img]);
    this.tweens.add({ targets: [img, flame], y: `-=${scale * 3}`, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    this.tweens.add({ targets: flame, scaleY: scale * 1.2, duration: 90, yoyo: true, repeat: -1 });
    if (ship.transform) {
      // transforming ships show off: fighter -> robot -> fighter on a loop
      img.setVisible(false);
      const mech = this.add.sprite(x, y, "atlas", ship.frame).setScale(scale);
      if (tint !== undefined) mech.setTint(tint);
      c.add(mech);
      this.tweens.add({ targets: mech, y: `-=${scale * 3}`, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.InOut" });
      let robot = false;
      this.overlayTimers.push(this.time.addEvent({ delay: 1600, loop: true, callback: () => {
        robot = !robot;
        if (robot) mech.play(`${ship.id}_morph`);
        else mech.playReverse(`${ship.id}_morph`);
        this.time.delayedCall(360, () => { if (mech.active) Art.set(mech, robot ? `mech_${ship.id}_00` : ship.frame); });
      } }));
      return img;
    }
    const steps = [0, 1, 2, 2, 1, 0, -1, -2, -2, -1];
    let i = 0;
    this.overlayTimers.push(this.time.addEvent({ delay: 260, loop: true, callback: () => {
      const s = steps[i++ % steps.length], suffix = s === 0 ? "" : `@${Math.abs(s)}`;
      Art.set(img, ship.frame + suffix).setFlipX(s < 0);
      Art.set(flame, "flame" + suffix).setFlipX(s < 0);
    } }));
    return img;
  }

  /** True when some hangar ship can be bought right now (drives the FLIGHT button's dot). */
  private canBuyShip() {
    const s = Save.data;
    return SHIPS.some((sh) => !s.ships.includes(sh.id) && s.scrap >= sh.cost && (sh.requires === undefined || s.cleared[sh.requires]));
  }

  hideOverlay() {
    this.clearTimers();
    this.overlayFn = null;
    this.keyHandler = null;
    this.overlay?.destroy();
    this.overlay = null;
  }

  private dim(c: Container, alpha = 0.72) {
    // Not interactive on purpose: Phaser sorts nested container children below an interactive
    // sibling, so a tap-swallowing backdrop would steal clicks from the buttons.
    c.add(this.add.rectangle(this.L.playX, 0, this.L.playW, this.L.height, 0x05030c, alpha).setOrigin(0));
  }

  // ------------------------------------------------------------------ main menu

  showMenu(onSelect: (i: number) => void, onPlay: (i: number) => void) {
    this.menuArgs = [onSelect, onPlay];
    this.mode = "menu";
    this.build();
    let sel = Math.min(Save.data.selected, Save.data.unlocked - 1);
    const change = (d: number) => {
      sel = (sel + d + PLANETS.length) % PLANETS.length;
      Save.update({ selected: Math.min(sel, Save.data.unlocked - 1) });
      onSelect(sel);
      Sfx.play("click");
      this.overlayFn?.();
    };
    const play = () => { if (sel < Save.data.unlocked) onPlay(sel); };
    this.open((c, cx, H) => {
      const pw = this.L.playW;
      const p = PLANETS[sel], locked = sel >= Save.data.unlocked, accent = PLANET_COLOR[sel];
      c.add(this.add.rectangle(this.L.playX, 0, pw, H, 0x05030c, 0.35).setOrigin(0));

      // title
      const ty = H * 0.13;
      c.add(this.icon("ui_emblem", cx, ty, 6).setAlpha(0.9));
      c.add(this.title(cx, ty + 92, "NEON", 64, C.cyan));
      c.add(this.title(cx, ty + 156, "SQUADRON", 48, C.white));

      // the equipped ship
      this.bankingShip(c, shipById(Save.data.ship), cx, H * 0.42, 3);

      // planet card
      const cw = pw - 150, ch = 210, cy = H * 0.56, x0 = cx - cw / 2;
      const g = this.add.graphics();
      this.panel(g, x0, cy, cw, ch, locked ? C.dim : accent, 0.94);
      c.add(g);
      const planetImg = this.icon(p.icon, x0 + 100, cy + ch / 2, 3);
      if (locked) planetImg.setTint(0x303040);
      c.add(planetImg);
      c.add(this.text(x0 + 190, cy + 22, `PLANET ${sel + 1}/${PLANETS.length}`, 16, C.dim));
      c.add(this.text(x0 + 190, cy + 46, locked ? "???" : p.name, 40, locked ? C.dim : accent, { fontStyle: "bold" }));
      c.add(this.text(x0 + 190, cy + 96, locked ? "LOCKED" : p.title, 24, C.white));
      c.add(this.text(x0 + 190, cy + 132, `${WAVE_COUNT} WAVES · BOSS`, 16, C.hull));
      c.add(this.text(x0 + 190, cy + 154, locked ? "CLEAR " + PLANETS[sel - 1].name : p.bossName, 16, locked ? C.dim : C.pink));
      if (locked) c.add(this.icon("ui_lock", x0 + cw - 44, cy + 40, 3));
      else if (Save.data.cleared[sel]) c.add(this.icon("ui_check", x0 + cw - 44, cy + 40, 3));
      if (!locked && Save.data.best[sel] > 0) {
        c.add(this.icon("ui_trophy", x0 + 202, cy + ch - 18, 2));
        c.add(this.text(x0 + 222, cy + ch - 30, String(Save.data.best[sel]), 16, C.yellow));
      }
      this.iconButton(c, x0 - 36, cy + ch / 2, 56, "ui_arrow_l", C.hull, () => change(-1));
      this.iconButton(c, x0 + cw + 36, cy + ch / 2, 56, "ui_arrow_r", C.hull, () => change(1));

      // play + flight (hangar), side by side
      const by = H * 0.8, pwB = 380, fwB = 240, gapB = 20, left = cx - (pwB + gapB + fwB) / 2;
      this.button(c, left + pwB / 2, by, pwB, 96, locked ? "LOCKED" : "PLAY", { color: C.cyan, icon: locked ? "ui_lock" : "ui_play", size: 40, disabled: locked }, play);
      const fb = this.button(c, left + pwB + gapB + fwB / 2, by, fwB, 96, "FLIGHT", { color: C.violet, icon: "ui_ship", size: 24 }, () => this.showHangar());
      if (this.canBuyShip()) {
        const dot = this.add.circle(fwB / 2 - 12, -48 + 12, 9, C.yellow).setStrokeStyle(3, C.dark);
        fb.add(dot);
        this.tweens.add({ targets: dot, scale: 1.3, duration: 450, yoyo: true, repeat: -1 });
      }

      // footer: scrap + sound
      const fy = H - 56;
      c.add(this.icon("ui_scrap", this.L.playX + 44, fy, 3));
      c.add(this.text(this.L.playX + 72, fy - 12, String(Save.data.scrap), 24, C.yellow, { fontStyle: "bold" }));
      this.iconButton(c, this.L.playX + pw - 46, fy, 60, Sfx.muted ? "ui_sound_off" : "ui_sound_on", C.hull, () => {
        Sfx.setMuted(!Sfx.muted);
        Save.update({ muted: Sfx.muted });
        this.overlayFn?.();
      });
    }, (e) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") change(-1);
      else if (e.code === "ArrowRight" || e.code === "KeyD") change(1);
      else if (e.code === "Enter" || e.code === "Space") play();
      else if (e.code === "KeyF") this.showHangar();
    });
  }

  // ------------------------------------------------------------------ hangar ("FLIGHT")

  showHangar() {
    let sel = Math.max(0, SHIPS.findIndex((s) => s.id === Save.data.ship));
    const back = () => { if (this.menuArgs) this.showMenu(...this.menuArgs); };
    const browse = (d: number) => {
      sel = (sel + d + SHIPS.length) % SHIPS.length;
      Sfx.play("click");
      this.overlayFn?.();
    };
    const status = (s: ShipDef) => {
      const d = Save.data;
      if (d.ships.includes(s.id)) return d.ship === s.id ? "equipped" : "owned";
      if (s.requires !== undefined && !d.cleared[s.requires]) return "gated";
      return d.scrap >= s.cost ? "buyable" : "poor";
    };
    const act = () => {
      const s = SHIPS[sel], st = status(s), d = Save.data;
      if (st === "owned") {
        Save.update({ ship: s.id });
        Sfx.play("pick");
        this.toast(`${s.name} EQUIPPED`, 0.66);
      } else if (st === "buyable") {
        Save.update({ scrap: d.scrap - s.cost, ships: [...d.ships, s.id], ship: s.id });
        Sfx.play("levelup");
        this.toast(`${s.code} ${s.name} UNLOCKED`, 0.66);
        this.cameras.main.flash(250, 255, 255, 255);
      } else return;
      this.overlayFn?.();
    };

    this.open((c, cx, H) => {
      const pw = this.L.playW, x0 = this.L.playX;
      const s = SHIPS[sel], st = status(s), owned = st === "owned" || st === "equipped";
      c.add(this.add.rectangle(x0, 0, pw, H, 0x05030c, 0.6).setOrigin(0));

      // header
      this.iconButton(c, x0 + 46, 50, 60, "ui_arrow_l", C.hull, back);
      c.add(this.title(cx, 52, "FLIGHT", 48, C.violet));
      c.add(this.text(cx, 88, "HANGAR", 16, C.dim).setOrigin(0.5, 0));
      c.add(this.icon("ui_scrap", x0 + pw - 120, 50, 3));
      c.add(this.text(x0 + pw - 96, 38, String(Save.data.scrap), 24, C.yellow, { fontStyle: "bold" }));

      // big preview
      const py = H * 0.29;
      const g = this.add.graphics();
      g.fillStyle(s.color, 0.07).fillCircle(cx, py, 150).lineStyle(2, s.color, 0.35).strokeCircle(cx, py, 150);
      c.add(g);
      this.bankingShip(c, s, cx, py, 6, owned ? undefined : 0x404058);
      if (!owned) c.add(this.icon("ui_lock", cx, py + 6, 5));
      this.iconButton(c, cx - 250, py, 60, "ui_arrow_l", C.hull, () => browse(-1));
      this.iconButton(c, cx + 250, py, 60, "ui_arrow_r", C.hull, () => browse(1));

      // name, stats, perk
      let y = H * 0.29 + 170;
      c.add(this.text(cx, y, s.code, 16, C.dim).setOrigin(0.5, 0));
      c.add(this.title(cx, y + 48, s.name, 48, s.color));
      y += 96;
      const bars: [string, number][] = [["POWER", s.stats.power], ["ARMOR", s.stats.armor], ["RATE", s.stats.rate]];
      const sg = this.add.graphics();
      bars.forEach(([label, v], i) => {
        const by = y + i * 34;
        c.add(this.text(cx - 200, by, label, 16, C.hull));
        for (let k = 0; k < 5; k++) sg.fillStyle(k < v ? s.color : C.line, 1).fillRect(cx - 60 + k * 52, by + 2, 46, 14);
      });
      c.add(sg);
      y += 3 * 34 + 14;
      c.add(this.text(cx, y, s.desc.join("\n"), 16, C.white, { align: "center", lineSpacing: 10 }).setOrigin(0.5, 0));

      // thumbnails
      // 7 ships fit the 720-wide column
      const ty = H * 0.78, tw = 92, tgap = 6, tx0 = cx - (SHIPS.length * tw + (SHIPS.length - 1) * tgap) / 2 + tw / 2;
      SHIPS.forEach((sh, i) => {
        const x = tx0 + i * (tw + tgap), tst = status(sh), mine = tst === "owned" || tst === "equipped";
        const tg = this.add.graphics();
        this.panel(tg, x - tw / 2, ty - tw / 2, tw, tw, i === sel ? sh.color : C.line, 0.95, 8);
        const im = this.add.image(x, ty - 6, "atlas", sh.frame).setScale(3);
        if (!mine) im.setTint(0x404058);
        const items: Phaser.GameObjects.GameObject[] = [tg, im];
        if (tst === "equipped") items.push(this.icon("ui_check", x + tw / 2 - 18, ty - tw / 2 + 18, 2));
        else if (!mine) items.push(this.icon("ui_lock", x + tw / 2 - 18, ty - tw / 2 + 18, 2));
        items.push(this.text(x, ty + tw / 2 - 22, sh.code, 16, i === sel ? sh.color : C.dim).setOrigin(0.5, 0));
        const zone = this.add.zone(x, ty, tw, tw).setInteractive({ useHandCursor: true });
        zone.on("pointerup", () => { sel = i; Sfx.play("click"); this.overlayFn?.(); });
        c.add([...items, zone]);
      });

      // action
      const ay = H * 0.9;
      if (st === "equipped") this.button(c, cx, ay, 380, 88, "EQUIPPED", { icon: "ui_check", size: 24, disabled: true }, () => {});
      else if (st === "owned") this.button(c, cx, ay, 380, 88, "EQUIP", { color: s.color, icon: "ui_ship", size: 32 }, act);
      else if (st === "buyable") this.button(c, cx, ay, 380, 88, `UNLOCK ${s.cost}`, { color: C.yellow, icon: "ui_scrap", size: 32 }, act);
      else if (st === "gated") this.button(c, cx, ay, 420, 88, `CLEAR ${PLANETS[s.requires!].name} FIRST`, { icon: "ui_lock", size: 16, disabled: true }, () => {});
      else this.button(c, cx, ay, 380, 88, `NEED ${s.cost}`, { icon: "ui_scrap", size: 24, disabled: true }, () => {});
    }, (e) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") browse(-1);
      else if (e.code === "ArrowRight" || e.code === "KeyD") browse(1);
      else if (e.code === "Enter" || e.code === "Space") act();
      else if (e.code === "Escape" || e.code === "Backspace") back();
    });
  }

  // ------------------------------------------------------------------ level up

  showCards(choices: Choice[], rerolls: number, onPick: (c: Choice) => void, onReroll: () => Promise<void>) {
    let picked = false;
    const pick = (i: number) => {
      if (picked || !choices[i]) return;
      picked = true;
      onPick(choices[i]);
    };
    this.open((c, cx, H) => {
      this.dim(c);
      const cw = this.L.playW - 64, ch = 176, gap = 20;
      const top = Math.max(170, H / 2 - (3 * ch + 2 * gap) / 2 - 20);
      c.add(this.title(cx, top - 66, "LEVEL UP", 48, C.yellow));
      choices.forEach((ch0, i) => {
        const y = top + i * (ch + gap), x = cx - cw / 2;
        const col = ch0.isCore ? C.yellow : ch0.def.color;
        const card = this.add.container(x, y);
        const bg = this.add.graphics();
        this.panel(bg, 0, 0, cw, ch, col, 0.97);
        if (ch0.isCore) bg.fillStyle(C.yellow, 0.08).fillRect(4, 4, cw - 8, ch - 8);
        card.add(bg);
        const slot = this.add.graphics();
        this.panel(slot, 20, ch / 2 - 56, 112, 112, col, 1, 8);
        card.add(slot);
        card.add(this.icon(ch0.def.icon, 76, ch / 2, 6));
        card.add(this.text(152, 18, ch0.def.name.toUpperCase(), 24, col, { fontStyle: "bold" }));
        card.add(this.text(cw - 20, 22, ch0.isNew ? "NEW" : `LV ${ch0.level}`, 16, ch0.isNew ? C.pink : C.hull).setOrigin(1, 0));
        if (ch0.isCore) {
          const core = this.text(cw - 20, 56, "CORE", 24, C.yellow, { fontStyle: "bold" }).setOrigin(1, 0);
          card.add([core, this.icon("ui_star", cw - 20 - core.width - 18, 68, 2)]);
        }
        card.add(this.text(152, 60, ch0.text, 16, C.white, { wordWrap: { width: cw - (ch0.isCore ? 290 : 180) }, lineSpacing: 8 }));
        for (let k = 0; k < ch0.def.max; k++) {
          const core = ch0.def.core.includes(k + 1);
          card.add(this.add.rectangle(152 + k * 30, ch - 26, 24, core ? 12 : 8, k < ch0.level ? col : C.line).setOrigin(0, 0.5));
        }
        if (!this.sys.game.device.input.touch) card.add(this.text(10, 6, String(i + 1), 16, C.dim));
        // drawn from its top-left corner, so shift the hit area by the display origin
        card.setSize(cw, ch).setInteractive(new Phaser.Geom.Rectangle(cw / 2, ch / 2, cw, ch), Phaser.Geom.Rectangle.Contains);
        if (card.input) card.input.cursor = "pointer";
        card.on("pointerover", () => bg.setAlpha(0.85));
        card.on("pointerout", () => bg.setAlpha(1));
        card.on("pointerup", () => pick(i));
        card.setAlpha(0).setScale(0.96);
        this.tweens.add({ targets: card, alpha: 1, scale: 1, duration: 160, delay: i * 60 });
        c.add(card);
      });
      if (rerolls > 0) this.button(c, cx, top + 3 * (ch + gap) + 34, 380, 76, `REROLL (${rerolls})`, { color: C.violet, video: true, size: 24 }, onReroll);
    }, (e) => {
      const i = ["Digit1", "Digit2", "Digit3"].indexOf(e.code), j = ["Numpad1", "Numpad2", "Numpad3"].indexOf(e.code);
      if (i >= 0 || j >= 0) pick(Math.max(i, j));
    });
  }

  // ------------------------------------------------------------------ pause / revive / results

  showPause(onResume: () => void, onQuit: () => void) {
    this.open((c, cx, H) => {
      this.dim(c, 0.8);
      const g = this.add.graphics();
      this.panel(g, cx - 230, H * 0.27, 460, 460, C.cyan);
      c.add(g);
      c.add(this.title(cx, H * 0.27 + 70, "PAUSED", 48, C.cyan));
      this.button(c, cx, H * 0.27 + 180, 360, 88, "RESUME", { color: C.cyan, icon: "ui_play", size: 32 }, onResume);
      const label = () => `SOUND ${Sfx.muted ? "OFF" : "ON"}`;
      this.button(c, cx, H * 0.27 + 290, 360, 72, label(), { color: C.hull, icon: Sfx.muted ? "ui_sound_off" : "ui_sound_on", size: 24 }, () => {
        Sfx.setMuted(!Sfx.muted);
        Save.update({ muted: Sfx.muted });
        this.overlayFn?.();
      });
      this.button(c, cx, H * 0.27 + 384, 360, 72, "QUIT", { color: C.pink, icon: "ui_home", size: 24 }, onQuit);
    });
  }

  showRevive(canRevive: boolean, onRevive: () => Promise<void>, onContinue: () => void) {
    this.open((c, cx, H) => {
      this.dim(c, 0.78);
      const g = this.add.graphics();
      this.panel(g, cx - 320, H * 0.3, 640, 340, C.pink);
      c.add(g);
      c.add(this.title(cx, H * 0.3 + 70, "HULL BREACHED", 40, C.pink));
      // Poki: the plain "continue" button sits next to the rewarded one and is the same size.
      if (canRevive) {
        c.add(this.text(cx, H * 0.3 + 130, "WATCH A VIDEO TO REVIVE\nWITH 60% HULL (ONCE)", 16, C.hull, { align: "center", lineSpacing: 8 }).setOrigin(0.5, 0));
        const bw = 270;
        this.button(c, cx - bw / 2 - 12, H * 0.3 + 260, bw, 88, "REVIVE", { color: C.violet, video: true, size: 24 }, onRevive);
        this.button(c, cx + bw / 2 + 12, H * 0.3 + 260, bw, 88, "CONTINUE", { color: C.cyan, size: 24 }, onContinue);
      } else {
        this.button(c, cx, H * 0.3 + 230, 360, 88, "CONTINUE", { color: C.cyan, size: 24 }, onContinue);
      }
    });
  }

  showResults(r: RunResult, onDouble: () => Promise<void>, onPrimary: () => Promise<void>, onMenu: () => void, hasNext: boolean) {
    this.open((c, cx, H) => {
      this.dim(c, 0.82);
      const accent = r.victory ? C.cyan : C.pink;
      const unlockLine = r.unlockedNext && hasNext;
      const ph = 168 + 6 * 56 + (unlockLine ? 40 : 0) + 230;
      const top = Math.max(40, (H - ph) / 2);
      const g = this.add.graphics();
      this.panel(g, cx - 320, top, 640, ph, accent);
      c.add(g);
      c.add(this.title(cx, top + 64, r.victory ? "PLANET CLEARED" : "MISSION FAILED", 40, accent));
      c.add(this.text(cx, top + 108, `${r.planet.name} · ${r.planet.title}`, 16, PLANET_COLOR[r.planet.index]).setOrigin(0.5, 0));
      const mm = Math.floor(r.time / 60), ss = Math.floor(r.time % 60);
      const rows: [string, string, string, number][] = [
        ["ui_flag", "WAVE", r.victory ? "ALL CLEAR" : `${r.wave}/${WAVE_COUNT}`, C.white],
        ["ui_skull", "KILLS", String(r.kills), C.white],
        ["ui_star", "SCORE", String(r.score), C.white],
        ["ui_trophy", "BEST", r.newBest ? `${r.best} NEW!` : String(r.best), r.newBest ? C.yellow : C.white],
        ["ui_xp", "TIME", `${mm}:${String(ss).padStart(2, "0")}`, C.white],
        ["ui_scrap", "SCRAP", `+${r.scrap}${r.doubled ? " X2" : ""}`, C.yellow],
      ];
      rows.forEach(([ic, k, v, col], i) => {
        const y = top + 168 + i * 56;
        c.add(this.icon(ic, cx - 236, y + 12, 2.5));
        c.add(this.text(cx - 200, y, k, 24, C.hull));
        c.add(this.text(cx + 250, y, v, 24, col, { fontStyle: "bold" }).setOrigin(1, 0));
      });
      let y = top + 168 + rows.length * 56 + 6;
      if (unlockLine) {
        c.add(this.text(cx, y, `NEW PLANET UNLOCKED: ${PLANETS[r.planet.index + 1].name}`, 16, C.green).setOrigin(0.5, 0));
        y += 40;
      }
      y += 64;
      const label = r.victory ? (hasNext ? "NEXT PLANET" : "PLAY AGAIN") : "RETRY";
      if (!r.doubled && r.scrap > 0) {
        const bw = 280;
        this.button(c, cx - bw / 2 - 12, y, bw, 88, "X2 SCRAP", { color: C.violet, video: true, size: 24 }, onDouble);
        this.button(c, cx + bw / 2 + 12, y, bw, 88, label, { color: C.cyan, size: 24 }, onPrimary);
      } else {
        this.button(c, cx, y, 380, 88, label, { color: C.cyan, size: 24 }, onPrimary);
      }
      this.button(c, cx, y + 96, 280, 64, "MENU", { color: C.hull, icon: "ui_home", size: 16 }, onMenu);
    });
  }

  /** Non-blocking banner across the playfield (waves, boss warning, planet cleared). */
  banner(msg: string, color: number, flash = false, sub?: string) {
    const cx = this.L.playX + this.L.playW / 2, y = this.L.height * 0.36;
    const band = this.add.rectangle(cx, y, this.L.playW, sub ? 132 : 100, color, 0.14).setDepth(90);
    const edge = this.add.rectangle(cx, y - (sub ? 66 : 50), this.L.playW, 3, color, 0.8).setDepth(90);
    const edge2 = this.add.rectangle(cx, y + (sub ? 66 : 50), this.L.playW, 3, color, 0.8).setDepth(90);
    const t = this.title(cx, y - (sub ? 16 : 0), msg, 48, color).setDepth(91);
    const parts: Phaser.GameObjects.GameObject[] = [band, edge, edge2, t];
    if (sub) parts.push(this.text(cx, y + 34, sub, 16, C.white).setOrigin(0.5).setDepth(91));
    band.scaleY = 0;
    this.tweens.add({ targets: band, scaleY: 1, duration: 180, ease: "Back.Out" });
    t.setScale(1.4).setAlpha(0);
    this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 220, ease: "Back.Out" });
    if (flash) this.tweens.add({ targets: parts, alpha: 0.25, duration: 250, yoyo: true, repeat: 5, delay: 220 });
    this.tweens.add({ targets: parts, alpha: 0, delay: 2200, duration: 400, onComplete: () => parts.forEach((p) => p.destroy()) });
  }

  toast(msg: string, yFrac = 0.8) {
    const cx = this.L.playX + this.L.playW / 2, y = this.L.height * yFrac;
    const t = this.text(cx, y, msg, 16, C.white, { fontStyle: "bold" }).setOrigin(0.5).setDepth(201);
    const g = this.add.graphics().setDepth(200);
    this.panel(g, cx - t.width / 2 - 24, y - 26, t.width + 48, 52, C.cyan, 0.92, 8);
    this.tweens.add({ targets: [t, g], alpha: 0, delay: 1800, duration: 400, onComplete: () => { t.destroy(); g.destroy(); } });
  }
}
