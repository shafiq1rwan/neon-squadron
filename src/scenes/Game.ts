import Phaser from "phaser";
import {
  ENEMIES, EnemyDef, eliteOf, Fire, Group, PLANETS, Planet, WAVES, WAVE_COUNT, WAVE_TIMEOUT, BULLET_DAMAGE, hpMul, xpNeeded,
} from "../data/planets";
import { emptyLevels, Levels, rollChoices, Choice, attachmentFrame, ATTACH_OVER, ATTACH_UNDER, UpgradeId, shipFrame } from "../data/upgrades";
import { ShipDef, shipById, ROBOT } from "../data/ships";
import { Layouts, Layout, PLAY_W, ZOOM } from "../layout";
import { canyonShape, CanyonShape, groundX, Ground, CANYON_H } from "../canyon";
import { GROUND_ROLES } from "../data/planets";
import { Art } from "../art";
import { Poki } from "../poki";
import { Sfx } from "../sfx";
import { Save } from "../save";
import type { HudScene } from "./Hud";

type Sprite = Phaser.GameObjects.Sprite;
export type GameState = "menu" | "play" | "levelup" | "paused" | "dead" | "over" | "clear";

export interface Enemy {
  s: Sprite; alive: boolean; def: EnemyDef;
  hp: number; maxHp: number; r: number;
  vx: number; vy: number; ang: number; t: number;
  baseX: number; amp: number; phase: number; stopY: number; mode: number;
  fireT: number; fire2T: number; fire3T: number; fire4T: number; spin: number; spin2: number;
  flash: number; bladeCd: number;
  head: Sprite | null; // turret gun, drawn over the base
  intro: number; // > 0 while it is visibly emerging (launched / hatched mid-screen); harmless until done
  emerged: boolean; // spawned mid-screen with an entrance (checked by the spawn audit)
}
const INTRO = 0.3;
interface Shot {
  s: Sprite; alive: boolean; kind: "pulse" | "seeker";
  vx: number; vy: number; dmg: number; r: number; life: number;
  bounces: number; cluster: boolean; lastHit: Enemy | null; target: Enemy | null;
}
interface EShot { s: Sprite; alive: boolean; vx: number; vy: number; r: number; bx: number; by: number; t: number; wav: number; split: number }
type OrbKind = "xp" | "xp_big" | "heart" | "magnet" | "shield";
const SHIELD_HITS = 2; // a shield pickup absorbs this many hits
interface Orb { s: Sprite; alive: boolean; kind: OrbKind; vx: number; vy: number; pulled: boolean }
interface Chunk { s: Sprite; alive: boolean; vx: number; vy: number; vr: number; life: number; max: number; flash: number }
/** Anything painted on the scrolling ground: landmarks, decorations, scorch marks. */
interface Landmark { s: Sprite; alive: boolean; pulse: boolean; phase: number }
/** Ground props whose light gently pulses. */
const PULSING = new Set(["deco_1_vent", "deco_2_tower", "deco_3_shroom", "deco_3_eggs", "deco_3_pod", "lm_outpost", "lm_hive"]);
interface Puff { s: Sprite; alive: boolean; life: number; max: number; vx: number; vy: number; smoke: boolean }

export interface RunResult {
  victory: boolean; planet: Planet; wave: number; time: number; kills: number; score: number; best: number; newBest: boolean;
  scrap: number; totalScrap: number; doubled: boolean; unlockedNext: boolean;
}

const TAU = Math.PI * 2;
// World units: the playfield is PLAY_W (240) wide; see layout.ts.
const SHIP_HIT_R = 2.5; // tiny hitbox, shmup style
const SHIP_BODY_R = 8; // for ramming enemies
const SHIP_SPEED = 140; // keyboard
const FOLLOW_RATE = 22; // mouse follow: fraction of the gap closed per second (exponential, frame-rate independent)
const FOLLOW_MAX = 700; // ...capped so a huge flick still reads as flight, not a teleport
const SHOT_SPEED = 350;
const DRAG_SENS = 1.2;
const CANYON_SPEED = 22;
const DUST_SPEED = 52;

// Debug switches for `npm run dev` only (stripped from production builds):
// ?planet=2 (1-3) starts there, ?wave=9 skips ahead, ?god makes you invincible.
const params = new URLSearchParams(location.search);
const DEV_WAVE = import.meta.env.DEV ? Number(params.get("wave") ?? 0) || 0 : 0;
const DEV_PLANET = import.meta.env.DEV ? Number(params.get("planet") ?? 0) || 0 : 0;
const DEV_GOD = import.meta.env.DEV && params.has("god");

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const turnToward = (a: number, target: number, step: number) =>
  a + Phaser.Math.Clamp(Phaser.Math.Angle.Wrap(target - a), -step, step);

export class GameScene extends Phaser.Scene {
  // run state, read by the HUD
  state: GameState = "menu";
  planet: Planet = PLANETS[0];
  wave = 0;
  runT = 0;
  score = 0;
  kills = 0;
  level = 1;
  xp = 0;
  hp = 100;
  maxHp = 100;
  levels: Levels = emptyLevels();
  boss: Enemy | null = null;
  shipDef: ShipDef = shipById("vanguard"); // the hangar ship flown this run
  shieldHits = 0; // hits the shield bubble will still absorb
  private bubble!: Sprite;

  private worldH = 640;
  private ship!: Sprite;
  private flame!: Sprite;
  private attUnder: Sprite[] = [];
  private attOver: Sprite[] = [];
  private magnetRing!: Phaser.GameObjects.Arc;
  private bgCanyon!: Phaser.GameObjects.TileSprite;
  private bgDust!: Phaser.GameObjects.TileSprite;
  private laserG!: Phaser.GameObjects.Graphics;
  private bladeG!: Phaser.GameObjects.Graphics; // sword slash trails
  private stormG!: Phaser.GameObjects.Graphics; // TEMPEST ENGINE lightning: warning lines and bolts
  private strikes: { x: number; y0: number; t: number; hit: boolean }[] = [];
  private puffs: Puff[] = []; // missile exhaust
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  private enemies: Enemy[] = [];
  private shots: Shot[] = [];
  private eshots: EShot[] = [];
  private orbs: Orb[] = [];
  private chunks: Chunk[] = [];
  private landmarks: Landmark[] = [];
  private canyons: CanyonShape[] = PLANETS.map((p) => canyonShape(p.name)); // same shapes the textures were drawn from
  private nextDeco = 0;
  private nextStructure = 6;
  private fxPool: Sprite[] = [];
  private blades: Sprite[] = [];

  private iframes = 0;
  private pending = 0;
  private revived = false;
  private rerolls = 2;
  private waveT = 0;
  private groupIdx = 0;
  private nextWaveIn = -1; // countdown to the next wave, -1 = not scheduled
  private nextLandmark = 4;
  private wT = { cannon: 0, seeker: 1, laser: 1.5, laserOn: 0, laserTick: 0, seekerQueue: -1 };
  private bladeAng = 0;
  private bank = 0; // -1 (left) .. 1 (right)
  private lastShipX = 0;
  private dragId: number | null = null;
  private drag = { sx: 0, sy: 0, px: 0, py: 0 };
  // Desktop mouse steering. The cursor position is polled every frame (not taken from pointermove events,
  // which another scene can swallow); the ship only starts following once the mouse actually moves.
  private mouseActive = false;
  private lastMouse = { x: -1, y: -1 };
  private cursorHidden = false;
  private shipVx = 0; // smoothed horizontal speed, drives banking
  robot = false; // PALADIN in robot form
  transformCd = 0; // seconds until the next transform is allowed
  private morphT = 0; // > 0 while the morph animation plays
  private dragTarget: { x: number; y: number } | null = null; // touch target while in (slower) robot form
  private bankStep = 0; // 0 level, 1 half roll, 2 full roll (with hysteresis)

  constructor() {
    super("game");
  }

  private get hud(): HudScene {
    return this.scene.get("hud") as HudScene;
  }

  get xpNeed(): number {
    return xpNeeded(this.level);
  }

  // ------------------------------------------------------------------ setup

  create() {
    this.bgCanyon = this.add.tileSprite(0, 0, PLAY_W, 640, "canyon_0").setOrigin(0).setDepth(0);
    // dust sits above the canyon and landmarks but below everything you have to read
    this.bgDust = this.add.tileSprite(0, 0, PLAY_W, 640, "dust_0").setOrigin(0).setDepth(2).setAlpha(0.6);

    this.magnetRing = this.add.circle(0, 0, 30).setStrokeStyle(1, 0xff7cc0, 0.25).setDepth(18).setVisible(false);
    this.flame = this.add.sprite(0, 0, "atlas", "flame").setDepth(19).setBlendMode(Phaser.BlendModes.ADD);
    this.ship = this.add.sprite(PLAY_W / 2, 560, "atlas", "ship_vanguard_00").setDepth(20);
    this.laserG = this.add.graphics().setDepth(17).setBlendMode(Phaser.BlendModes.ADD);
    this.bladeG = this.add.graphics().setDepth(20.5).setBlendMode(Phaser.BlendModes.ADD);
    this.stormG = this.add.graphics().setDepth(29).setBlendMode(Phaser.BlendModes.ADD);
    // shield bubble (pixelfx "divine shield", recoloured cyan), shown while the shield holds
    this.bubble = this.add.sprite(0, 0, "bubble").setDepth(21.5).setBlendMode(Phaser.BlendModes.ADD).setScale(0.9).setVisible(false);
    this.bubble.play("bubble");

    this.cameras.main.setBackgroundColor("#090616");
    this.applyLayout(Layouts.current);
    this.game.events.on("layout", this.applyLayout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off("layout", this.applyLayout, this));

    this.setupInput();

    // Pause when the player leaves the tab or the window loses focus.
    this.game.events.on(Phaser.Core.Events.BLUR, () => this.autoPause());
    this.game.events.on(Phaser.Core.Events.HIDDEN, () => { this.autoPause(); Sfx.suspend(); });
    this.game.events.on(Phaser.Core.Events.VISIBLE, () => Sfx.resume());

    Sfx.setMuted(Save.data.muted);
    // The HUD scene starts in the same frame; let it finish create() before talking to it.
    this.time.delayedCall(0, () => {
      if (DEV_PLANET || DEV_WAVE) this.startRun(Math.max(0, DEV_PLANET - 1));
      else this.showMenu();
    });
  }

  private applyLayout(L: Layout) {
    this.worldH = L.worldH;
    const cam = this.cameras.main;
    cam.setViewport(L.playX, 0, L.playW, L.height);
    cam.setZoom(ZOOM);
    cam.centerOn(PLAY_W / 2, this.worldH / 2);
    this.bgCanyon.setSize(PLAY_W, this.worldH);
    this.bgDust.setSize(PLAY_W, this.worldH);
    this.moveShipTo(this.ship.x, this.ship.y);
  }

  private setupInput() {
    this.input.addPointer(1);
    this.keys = this.input.keyboard!.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT") as Record<string, Phaser.Input.Keyboard.Key>;
    // Poki: these must not scroll the page. Phaser calls preventDefault after handling captured keys.
    this.input.keyboard!.addCapture("UP,DOWN,LEFT,RIGHT,SPACE");

    // Touch: relative drag anywhere. Mouse: the ship simply follows the cursor, no click needed.
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      Sfx.unlock();
      if (!p.wasTouch) return;
      if (this.state === "play" && this.dragId === null) {
        this.dragId = p.id;
        this.drag = { sx: p.x, sy: p.y, px: this.ship.x, py: this.ship.y };
      }
    });
    // (the mouse is polled every frame in update(), not read from these events)
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!p.wasTouch || p.id !== this.dragId || this.state !== "play") return;
      const x = this.drag.px + ((p.x - this.drag.sx) / ZOOM) * DRAG_SENS;
      const y = this.drag.py + ((p.y - this.drag.sy) / ZOOM) * DRAG_SENS;
      if (this.robot) {
        // the robot is slower: the finger sets a target the ship walks toward (stepPlayer)
        this.dragTarget = { x: Phaser.Math.Clamp(x, 13, PLAY_W - 13), y: Phaser.Math.Clamp(y, 18, this.worldH - 20) };
        return;
      }
      this.moveShipTo(x, y);
      // Re-anchor so pushing against an edge doesn't leave the finger "behind".
      this.drag.px = this.ship.x - ((p.x - this.drag.sx) / ZOOM) * DRAG_SENS;
      this.drag.py = this.ship.y - ((p.y - this.drag.sy) / ZOOM) * DRAG_SENS;
    });
    const release = (p: Phaser.Input.Pointer) => { if (p.id === this.dragId) this.dragId = null; };
    this.input.on("pointerup", release);
    this.input.on("pointerupoutside", release);

    this.input.keyboard!.on("keydown", (e: KeyboardEvent) => {
      Sfx.unlock();
      if (e.code === "Escape" || e.code === "Space" || e.code === "KeyP") {
        if (this.state === "play") this.pause();
        else if (this.state === "paused") this.resume();
      }
      if (e.code === "KeyE" || e.code === "KeyQ") this.tryTransform();
    });
    // right-click transforms too (and never opens the browser menu over the game)
    this.input.mouse?.disableContextMenu();
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => { if (!p.wasTouch && p.rightButtonDown()) this.tryTransform(); });
  }

  // ------------------------------------------------------------------ transform (PALADIN)

  /** Fighter <-> robot. Plays the morph animation; the robot is slower, tougher and hits harder. */
  tryTransform() {
    if (!this.shipDef.transform || this.state !== "play" || this.transformCd > 0 || this.morphT > 0) return;
    this.robot = !this.robot;
    this.morphT = ROBOT.morphTime;
    this.transformCd = ROBOT.cooldown;
    this.dragTarget = null;
    // the morph runs fighter -> robot; backwards to become a fighter again
    this.ship.setFlipX(false);
    if (this.robot) this.ship.play(`${this.shipDef.id}_morph`);
    else this.ship.playReverse(`${this.shipDef.id}_morph`);
    for (const s of [...this.attUnder, ...this.attOver]) s.setVisible(false);
    this.playFx("spark", this.ship.x - 9, this.ship.y, 0.8, Math.PI);
    this.playFx("spark", this.ship.x + 9, this.ship.y, 0.8, 0);
    Sfx.play("transform");
  }

  /** Called when the morph animation finishes. */
  private finishMorph() {
    this.ship.stop();
    this.setShipVisible(this.ship.visible);
    this.applyBank();
    this.playFx("collect", this.ship.x, this.ship.y, 1);
    this.hud.toast(this.robot ? "ROBOT MODE" : "FIGHTER MODE", 0.62);
  }

  private moveShipTo(x: number, y: number) {
    this.ship.x = Phaser.Math.Clamp(x, 13, PLAY_W - 13);
    this.ship.y = Phaser.Math.Clamp(y, 18, this.worldH - 20);
  }

  private setPlanetBackground(p: Planet) {
    this.bgCanyon.setTexture(`canyon_${p.index}`);
    this.bgDust.setTexture(`dust_${p.index}`);
  }

  // ------------------------------------------------------------------ run flow

  private clearWorld() {
    for (const list of [this.enemies, this.shots, this.eshots, this.orbs, this.chunks, this.landmarks, this.puffs] as { alive: boolean; s: Sprite }[][])
      for (const o of list) { o.alive = false; o.s.setVisible(false).setActive(false); }
    for (const e of this.enemies) e.head?.setVisible(false).setActive(false);
    for (const f of this.fxPool) f.setVisible(false).setActive(false).stop();
    this.laserG.clear();
    this.bladeG.clear();
    this.strikes = [];
    this.stormG.clear();
    this.boss = null;
  }

  /** Main screen: the selected planet's canyon scrolls behind the menu. */
  showMenu() {
    this.state = "menu";
    this.clearWorld();
    this.levels = emptyLevels();
    this.syncLoadout();
    this.setShipVisible(false);
    this.setPlanetBackground(PLANETS[Math.min(Save.data.selected, Save.data.unlocked - 1)]);
    this.hud.showMenu((i) => this.setPlanetBackground(PLANETS[i]), (i) => this.playFromMenu(i));
  }

  private async playFromMenu(i: number) {
    this.hud.hideOverlay();
    await Poki.commercialBreak(this.adHook); // natural break before a run; Poki decides if an ad plays
    this.startRun(i);
  }

  startRun(index: number) {
    this.clearWorld();
    this.planet = PLANETS[index];
    Save.update({ selected: index });
    this.setPlanetBackground(this.planet);
    this.state = "play";
    this.wave = 0;
    this.runT = 0;
    this.score = 0;
    this.kills = 0;
    this.level = 1;
    this.xp = 0;
    // the equipped hangar ship sets the starting hull and weapon
    this.shipDef = shipById(Save.data.ship);
    this.maxHp = 100 + (this.shipDef.perk.hp ?? 0);
    this.hp = this.maxHp;
    this.levels = emptyLevels();
    if (this.shipDef.perk.start) this.levels[this.shipDef.perk.start] = 1;
    this.shieldHits = this.shipDef.perk.shield ?? 0; // HALO launches with its shield up
    this.robot = false; // PALADIN always launches as a fighter
    this.morphT = 0;
    this.transformCd = 0;
    this.dragTarget = null;
    this.ship.stop();
    this.iframes = 0;
    this.pending = 0;
    this.revived = false;
    this.rerolls = 2;
    this.nextWaveIn = 1.2;
    this.nextLandmark = 3;
    this.nextStructure = 5;
    this.wT = { cannon: 0, seeker: 1, laser: 1.5, laserOn: 0, laserTick: 0, seekerQueue: -1 };
    this.dragId = null;
    this.mouseActive = false; // the ship waits for the first mouse move
    const mp = this.input.mousePointer;
    this.lastMouse = { x: mp?.x ?? -1, y: mp?.y ?? -1 };
    this.bank = 0;
    this.shipVx = 0;
    this.bankStep = 0;
    this.ship.setPosition(PLAY_W / 2, this.worldH - 64);
    this.lastShipX = this.ship.x;
    this.syncLoadout();
    this.setShipVisible(true);
    if (DEV_WAVE > 1) {
      this.wave = Math.min(DEV_WAVE, WAVE_COUNT) - 1;
      this.level = 1 + this.wave;
      this.pending = this.wave; // a few upgrades so a skipped-ahead test run can fight back
    }
    this.hud.startHud(this.planet);
    Poki.gameplayStart();
  }

  pause() {
    if (this.state !== "play") return;
    this.state = "paused";
    this.dragId = null;
    Poki.gameplayStop();
    this.hud.showPause(() => this.resume(), () => this.quitToMenu());
  }

  resume() {
    if (this.state !== "paused") return;
    this.state = "play";
    this.hud.hideOverlay();
    Poki.gameplayStart();
  }

  private quitToMenu() {
    Poki.gameplayStop();
    this.hud.hideOverlay();
    this.showMenu();
  }

  private autoPause() {
    if (this.state === "play") this.pause();
  }

  /** Ads: mute audio and block input while a video plays. */
  private adHook = (on: boolean) => {
    Sfx.setAdMuted(on);
    this.game.input.enabled = !on;
    for (const key of ["game", "hud"]) {
      const kb = this.scene.get(key).input.keyboard;
      if (kb) kb.enabled = !on;
    }
  };

  private setShipVisible(v: boolean) {
    this.ship.setVisible(v);
    this.flame.setVisible(v);
    // external hardware (missile racks, laser cannon) is stowed in robot form and during the morph
    for (const s of [...this.attUnder, ...this.attOver]) s.setVisible(v && !this.robot && this.morphT <= 0);
    for (const b of this.blades) b.setVisible(v);
    this.magnetRing.setVisible(v && this.levels.magnet > 0);
  }

  private playerDown() {
    this.state = "dead";
    this.dragId = null;
    this.laserG.clear();
    this.bladeG.clear();
    this.strikes = [];
    this.stormG.clear();
    this.breakApart(this.ship, 3, 3, 0, 0, 1);
    this.setShipVisible(false);
    this.playFx("boom", this.ship.x, this.ship.y, 1.1);
    this.cameras.main.shake(300, 0.012);
    Sfx.play("bigboom");
    this.time.delayedCall(900, () => {
      Poki.gameplayStop();
      this.hud.showRevive(!this.revived, () => this.tryRevive(), () => this.endRun(false));
    });
  }

  private async tryRevive() {
    const ok = await Poki.rewardedBreak(this.adHook);
    if (!ok) {
      this.hud.toast("No video available right now");
      return;
    }
    this.revived = true;
    this.hp = Math.round(this.maxHp * 0.6);
    this.iframes = 2.5;
    this.setShipVisible(true);
    this.syncLoadout();
    // clear the screen around the player so the revive isn't an instant death
    this.playFx("emp", this.ship.x, this.ship.y, 1.4);
    for (const b of this.eshots) if (b.alive) this.killEShot(b);
    for (const e of this.enemies)
      if (e.alive && e.def.role !== "boss" && e.def.role !== "elite" && Phaser.Math.Distance.Between(e.s.x, e.s.y, this.ship.x, this.ship.y) < 80)
        this.killEnemy(e, true);
    this.state = "play";
    this.hud.hideOverlay();
    Poki.gameplayStart();
  }

  private endRun(victory: boolean) {
    this.state = victory ? "clear" : "over";
    Poki.gameplayStop();
    const i = this.planet.index;
    const scrap = Math.floor(this.score / 40) + (victory ? 100 + 50 * i : 0);
    const prev = Save.data;
    const best = [...prev.best];
    const newBest = this.score > best[i];
    best[i] = Math.max(best[i], this.score);
    const cleared = [...prev.cleared];
    if (victory) cleared[i] = true;
    const unlocked = victory ? Math.max(prev.unlocked, Math.min(PLANETS.length, i + 2)) : prev.unlocked;
    const saved = Save.update({ scrap: prev.scrap + scrap, best, cleared, unlocked, runs: prev.runs + 1 });
    const result: RunResult = {
      victory, planet: this.planet, wave: this.wave, time: this.runT, kills: this.kills, score: this.score, best: best[i], newBest,
      scrap, totalScrap: saved.scrap, doubled: false, unlockedNext: unlocked > prev.unlocked,
    };
    const hasNext = victory && i + 1 < PLANETS.length;
    const show = () => this.hud.showResults(result, onDouble, onPrimary, onMenu, hasNext);
    const onDouble = async () => {
      const ok = await Poki.rewardedBreak(this.adHook);
      if (!ok) { this.hud.toast("No video available right now"); return; }
      result.totalScrap = Save.update({ scrap: Save.data.scrap + result.scrap }).scrap;
      result.scrap *= 2;
      result.doubled = true;
      show();
    };
    // Primary: next planet after a win, retry after a loss. A natural break comes first.
    const onPrimary = async () => {
      this.hud.hideOverlay();
      await Poki.commercialBreak(this.adHook);
      this.startRun(hasNext ? i + 1 : i);
    };
    const onMenu = () => {
      this.hud.hideOverlay();
      this.showMenu();
    };
    show();
  }

  // ------------------------------------------------------------------ level ups

  private addXp(v: number) {
    this.xp += v;
    while (this.xp >= this.xpNeed) {
      this.xp -= this.xpNeed;
      this.level++;
      this.pending++;
    }
  }

  private openLevelUp() {
    const choices = rollChoices(this.levels);
    if (!choices.length) {
      this.pending = 0;
      this.hp = Math.min(this.maxHp, this.hp + 20);
      return;
    }
    this.state = "levelup";
    this.dragId = null;
    Sfx.play("levelup");
    this.playFx("levelup", this.ship.x, this.ship.y, 0.7);
    this.hud.showCards(choices, this.rerolls, (c) => this.pick(c), () => this.reroll());
  }

  private pick(c: Choice) {
    this.levels[c.def.id] = c.level;
    if (c.def.id === "hull") {
      this.maxHp += 20;
      this.hp = Math.min(this.maxHp, this.hp + 20);
    }
    this.syncLoadout();
    this.upgradeFlash();
    Sfx.play("pick");
    this.pending--;
    if (this.pending > 0) {
      this.openLevelUp();
    } else {
      this.state = "play";
      this.hud.hideOverlay();
    }
  }

  private async reroll() {
    if (this.rerolls <= 0) return;
    const ok = await Poki.rewardedBreak(this.adHook);
    Poki.gameplayStart(); // rewardedBreak stopped gameplay; the level-up screen is still part of the run
    if (!ok) { this.hud.toast("No video available right now"); return; }
    this.rerolls--;
    this.hud.showCards(rollChoices(this.levels), this.rerolls, (c) => this.pick(c), () => this.reroll());
  }

  // ------------------------------------------------------------------ ship look: attachments, banking, flash

  /** Rebuild the attachment sprites from the current upgrade levels. */
  private syncLoadout() {
    const build = (ids: UpgradeId[], list: Sprite[], depth: number) => {
      const frames = ids.map((id) => attachmentFrame(id, this.levels[id])).filter((f): f is string => !!f);
      while (list.length < frames.length) list.push(this.add.sprite(0, 0, "atlas", frames[0]));
      while (list.length > frames.length) list.pop()!.destroy();
      list.forEach((s, i) => s.setData("frame", frames[i]).setDepth(depth + i * 0.01).setVisible(this.ship.visible));
    };
    build(ATTACH_UNDER, this.attUnder, 19.5);
    build(ATTACH_OVER, this.attOver, 20.1);
    this.syncBlades();
    this.applyBank();
  }

  /** Pick the rolled frame for the ship, its flame and every attachment. */
  private applyBank() {
    const suffix = this.bankStep === 0 ? "" : `@${this.bankStep}`;
    const flip = this.bank < 0;
    const set = (s: Sprite, base: string) => Art.set(s, base + suffix).setFlipX(flip);
    // Pulse Cannon + Hull Plating are drawn into the hull (and into the robot); the morph animation owns the frame while it plays
    if (this.morphT <= 0) set(this.ship, shipFrame(this.shipDef.id, this.levels, this.robot));
    set(this.flame, "flame");
    for (const s of [...this.attUnder, ...this.attOver]) set(s, s.getData("frame") as string);
  }

  private upgradeFlash() {
    const parts = [this.ship, ...this.attUnder, ...this.attOver];
    for (const s of parts) s.setTintFill(0xffffff);
    this.time.delayedCall(90, () => { for (const s of parts) s.clearTint(); });
    this.tweens.add({ targets: parts, scale: { from: 1.3, to: 1 }, duration: 260, ease: "Back.Out" });
    this.playFx("collect", this.ship.x, this.ship.y, 1.2);
  }

  // ------------------------------------------------------------------ main loop

  update(_time: number, deltaMs: number) {
    const real = Math.min(deltaMs, 50) / 1000;
    const playing = this.state === "play";
    this.anims.globalTimeScale = this.state === "paused" || this.state === "levelup" ? 0 : 1;

    const scroll = this.state === "paused" || this.state === "levelup" ? 0 : real;
    this.bgCanyon.tilePositionY -= CANYON_SPEED * scroll;
    this.bgDust.tilePositionY -= DUST_SPEED * scroll;
    this.bgDust.tilePositionX = Math.sin(this.time.now / 1800) * 12;

    // desktop: poll the mouse; any real movement hands steering to the mouse
    const mp = this.input.mousePointer;
    if (this.sys.game.device.os.desktop && mp && (mp.x !== this.lastMouse.x || mp.y !== this.lastMouse.y)) {
      const first = this.lastMouse.x < 0;
      this.lastMouse.x = mp.x;
      this.lastMouse.y = mp.y;
      if (playing && !first) this.mouseActive = true;
    }

    if (playing) {
      const dt = real;
      this.runT += dt;
      this.stepPlayer(dt);
      this.stepWaves(dt);
      this.stepWeapons(dt);
      this.stepShots(dt);
      this.stepEnemies(dt);
      this.stepEShots(dt);
      this.stepStrikes(dt);
      this.stepOrbs(dt);
      if (this.pending > 0 && this.state === "play") this.openLevelUp();
    }
    if (this.state !== "paused" && this.state !== "levelup") {
      this.stepChunks(real);
      this.stepPuffs(real);
      this.stepLandmarks(real, this.state === "play" || this.state === "menu");
    }

    // banking: roll toward the (smoothed) horizontal speed
    if (playing) {
      const vx = (this.ship.x - this.lastShipX) / Math.max(real, 0.001);
      this.shipVx += (vx - this.shipVx) * Math.min(1, real * 14);
      this.bank += (Phaser.Math.Clamp(this.shipVx / 100, -1, 1) - this.bank) * Math.min(1, real * 9);
    } else this.bank *= 0.9;
    this.lastShipX = this.ship.x;
    // hysteresis: a roll frame needs a clear margin to switch in and out, so it never flickers
    const b = Math.abs(this.bank);
    if (this.bankStep === 0 && b > 0.35) this.bankStep = 1;
    else if (this.bankStep === 1 && b > 0.8) this.bankStep = 2;
    else if (this.bankStep === 2 && b < 0.6) this.bankStep = 1;
    else if (this.bankStep === 1 && b < 0.18) this.bankStep = 0;
    this.applyBank();

    // Hide the mouse cursor while it is steering the ship; show it on menus, pause and level-ups.
    const hide = playing && this.mouseActive;
    if (hide !== this.cursorHidden) {
      this.cursorHidden = hide;
      this.input.setDefaultCursor(hide ? "none" : "default");
    }

    // Overclock: longer, wider and hotter (white-blue) engine flames
    const rate = this.levels.rate;
    this.flame.setPosition(this.ship.x, this.ship.y + 17 + rate * 0.6);
    this.flame.setScale(1 + 0.06 * rate, (0.8 + Math.random() * 0.6) * (1 + 0.18 * rate));
    if (rate >= 4) this.flame.setTint(0xb8e8ff);
    else if (rate >= 2) this.flame.setTint(0xfff0c0);
    else this.flame.clearTint();
    for (const s of [...this.attUnder, ...this.attOver]) s.setPosition(this.ship.x, this.ship.y).setAlpha(this.ship.alpha);
    // shield bubble: steady at full strength, flickering when one hit is left
    const showBubble = this.ship.visible && this.shieldHits > 0 && this.state !== "menu";
    this.bubble.setVisible(showBubble);
    if (showBubble) {
      this.bubble.setPosition(this.ship.x, this.ship.y + 1);
      this.bubble.setAlpha(this.shieldHits >= SHIELD_HITS ? 0.95 : 0.35 + 0.25 * Math.abs(Math.sin(this.time.now / 90)));
    }
    if (this.magnetRing.visible) {
      this.magnetRing.setPosition(this.ship.x, this.ship.y).setRadius(this.pickupRange());
      this.magnetRing.setStrokeStyle(1, 0xff7cc0, 0.15 + 0.1 * Math.sin(this.time.now / 200));
    }
  }

  private stepPlayer(dt: number) {
    // transform timers
    if (this.transformCd > 0) this.transformCd = Math.max(0, this.transformCd - dt);
    if (this.morphT > 0 && (this.morphT -= dt) <= 0) { this.morphT = 0; this.finishMorph(); }
    const speed = this.robot ? ROBOT.speed : 1; // the robot is the slow, tough form

    const k = this.keys;
    const dx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    const dy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    // ease toward a point: closes most of the gap quickly at any frame rate, capped at the form's top speed
    const easeTo = (tx: number, ty: number) => {
      const gx = tx - this.ship.x, gy = ty - this.ship.y;
      const k = 1 - Math.exp(-FOLLOW_RATE * dt);
      let sx = gx * k, sy = gy * k;
      const len = Math.hypot(sx, sy), max = (this.robot ? ROBOT.maxSpeed : FOLLOW_MAX) * dt;
      if (len > max) { sx *= max / len; sy *= max / len; }
      this.moveShipTo(this.ship.x + sx, this.ship.y + sy);
    };
    if (dx || dy) {
      this.mouseActive = false; // keys take over until the mouse moves again
      const len = Math.hypot(dx, dy);
      this.moveShipTo(this.ship.x + (dx / len) * SHIP_SPEED * speed * dt, this.ship.y + (dy / len) * SHIP_SPEED * speed * dt);
    } else if (this.robot && this.dragTarget) {
      easeTo(this.dragTarget.x, this.dragTarget.y); // touch, robot form
    } else if (this.mouseActive) {
      const t = this.cameras.main.getWorldPoint(this.lastMouse.x, this.lastMouse.y);
      easeTo(t.x, t.y);
    }
    this.iframes = Math.max(0, this.iframes - dt);
    this.ship.setAlpha(this.iframes > 0 && Math.floor(this.runT * 18) % 2 ? 0.35 : 1);
  }

  // ------------------------------------------------------------------ waves

  private stepWaves(dt: number) {
    if (this.nextWaveIn >= 0) {
      if ((this.nextWaveIn -= dt) < 0) this.startWave(this.wave + 1);
      return;
    }
    this.waveT += dt;
    if (this.wave === WAVE_COUNT) {
      if (!this.boss && this.waveT >= 3) {
        this.boss = this.spawnEnemy(ENEMIES[this.planet.boss], PLAY_W / 2, -40);
        this.boss.baseX = PLAY_W / 2;
      }
      return;
    }
    const groups = WAVES[this.wave - 1];
    while (this.groupIdx < groups.length && this.waveT >= groups[this.groupIdx].at) this.spawnGroup(groups[this.groupIdx++]);
    if (this.groupIdx < groups.length) return;
    const lastAt = groups[groups.length - 1].at;
    // ground targets and mines scroll away on their own; only the air fight decides when a wave is over
    const clear = !this.enemies.some((e) => e.alive && e.def.role !== "missile" && e.def.role !== "mine" && !GROUND_ROLES.includes(e.def.role));
    if ((clear && this.waveT > lastAt + 1) || this.waveT > lastAt + WAVE_TIMEOUT) this.nextWaveIn = 1.4;
  }

  private startWave(n: number) {
    this.wave = n;
    this.waveT = 0;
    this.groupIdx = 0;
    this.nextWaveIn = -1;
    if (n === WAVE_COUNT) {
      this.hud.banner("WARNING", 0xff3d9a, true, this.planet.bossName + " APPROACHING");
      Sfx.play("warn");
    } else {
      this.hud.banner(`WAVE ${n}`, 0x2df4ff, false, WAVES[n - 1].some((g) => g.role === "elite") ? "ELITE INBOUND" : undefined);
    }
  }

  private spawnGroup(g: Group) {
    const P = this.planet;
    if (g.role === "turret") {
      // dug into the ground: on a plateau or the canyon floor, never in the river
      for (let i = 0; i < (g.n ?? 1); i++) {
        const y = -16 - i * 34, x = this.groundSpot(10, "any", y);
        if (x !== null) this.spawnEnemy(ENEMIES[P.turret], x, y);
      }
      return;
    }
    if (g.role === "mine") {
      for (let i = 0; i < (g.n ?? 1); i++) this.spawnEnemy(ENEMIES.mine, rand(20, PLAY_W - 20), -12 - i * 30);
      return;
    }
    if (g.role === "elite") {
      const e = this.spawnEnemy(eliteOf(ENEMIES[P.roles.heavy]), PLAY_W / 2, -30);
      e.baseX = PLAY_W / 2;
      return;
    }
    const def = ENEMIES[P.roles[g.role]];
    const n = g.n ?? 1;
    if (g.role === "swarm") {
      const pattern = g.pattern ?? "line";
      if (pattern === "line") {
        const k = this.wave > 5 ? 4 : 3, gap = 30, half = ((k - 1) / 2) * gap;
        const cx = rand(half + 18, PLAY_W - half - 18);
        for (let i = 0; i < k; i++) this.spawnEnemy(def, cx - half + i * gap, -14).amp = 8;
      } else if (pattern === "v") {
        const cx = rand(70, PLAY_W - 70);
        [-2, -1, 0, 1, 2].forEach((i) => (this.spawnEnemy(def, cx + i * 25, -14 - Math.abs(i) * 16).amp = 5));
      } else if (pattern === "snake") {
        const cx = rand(50, PLAY_W - 50), ph = rand(0, TAU);
        for (let i = 0; i < 4; i++) {
          const e = this.spawnEnemy(def, cx, -14 - i * 24);
          e.amp = 30;
          e.phase = ph + i * 0.55;
        }
      } else {
        for (let i = 0; i < 3; i++) {
          this.spawnEnemy(def, 26, -14 - i * 26).amp = 6;
          this.spawnEnemy(def, PLAY_W - 26, -27 - i * 26).amp = 6;
        }
      }
    } else if (g.role === "chaser") {
      for (let i = 0; i < n; i++) this.spawnEnemy(def, rand(16, PLAY_W - 16), -14 - i * 24);
    } else if (g.role === "gunner") {
      for (let i = 0; i < n; i++) {
        const x = n === 1 ? rand(40, PLAY_W - 40) : (PLAY_W / (n + 1)) * (i + 1) + rand(-15, 15);
        this.spawnEnemy(def, x, -16 - i * 10).stopY = rand(40, 100);
      }
    } else {
      for (let i = 0; i < n; i++) {
        const x = n === 1 ? rand(40, PLAY_W - 40) : (PLAY_W / (n + 1)) * (i + 1);
        this.spawnEnemy(def, x, -22 - i * 20);
      }
    }
  }

  private take<T extends { alive: boolean }>(list: T[], make: () => T): T {
    for (const o of list) if (!o.alive) return o;
    const o = make();
    list.push(o);
    return o;
  }

  spawnEnemy(def: EnemyDef, x: number, y: number): Enemy {
    const e = this.take(this.enemies, () => ({
      s: this.add.sprite(0, 0, "atlas", "drone"), alive: false, def,
      hp: 0, maxHp: 0, r: 0, vx: 0, vy: 0, ang: 0, t: 0, baseX: 0, amp: 0, phase: 0, stopY: 0, mode: 0,
      fireT: 0, fire2T: 0, fire3T: 0, fire4T: 0, spin: 0, spin2: 0, flash: 0, bladeCd: 0, head: null, intro: 0, emerged: false,
    }));
    // buildings only get the gentle per-wave ramp, not the planet multiplier (a 160 hp bunker read as indestructible)
    const w = Math.max(1, this.wave);
    const mul = def.role === "missile" ? 1 : def.role === "boss" ? this.planet.hpMul
      : def.role === "structure" ? 1 + 0.05 * (w - 1) : hpMul(this.planet, w);
    Object.assign(e, {
      alive: true, def, hp: def.hp * mul, maxHp: def.hp * mul, r: def.radius, vx: 0, vy: def.speed, ang: Math.PI / 2, t: 0,
      baseX: x, amp: 0, phase: rand(0, TAU), stopY: 0, mode: 0,
      fireT: def.fire ? rand(0.8, 1.6) : 1, fire2T: 2, fire3T: 0, fire4T: 3, spin: 0, spin2: 0, flash: 0, bladeCd: 0,
      intro: 0, emerged: false,
    });
    const ground = GROUND_ROLES.includes(def.role);
    Art.set(e.s, def.frame).setPosition(x, y).setScale(def.scale ?? 1).setRotation(0)
      .setDepth(def.role === "boss" ? 12 : ground ? 3 : 10).setVisible(true).setActive(true);
    if (def.tint) e.s.setTint(def.tint);
    else e.s.clearTint();
    if (def.head) {
      // turret gun: a separate sprite that turns to track the player
      e.head ??= this.add.sprite(0, 0, "atlas", "drone");
      Art.set(e.head, def.head).setPosition(x, y).setDepth(3.5).setVisible(true).setActive(true).clearTint();
      e.ang = Math.PI / 2;
      e.head.rotation = e.ang + Math.PI / 2;
    } else e.head?.setVisible(false).setActive(false);
    return e;
  }

  /**
   * Spawn something in the middle of the screen with a visible entrance, so nothing pops into existence:
   * "launch" = fired out of a cannon (muzzle flash), "hatch" = bursts out of a body or brood sac.
   * It grows in over INTRO seconds and can't hurt the player until it is fully out.
   */
  private emerge(def: EnemyDef, x: number, y: number, how: "launch" | "hatch", dir = Math.PI / 2): Enemy {
    const e = this.spawnEnemy(def, x, y);
    e.intro = INTRO;
    e.emerged = true;
    e.ang = dir;
    e.s.setScale((def.scale ?? 1) * 0.3).setAlpha(0.2);
    if (how === "launch") {
      this.playFx("fx_launch", x, y - 3, 1); // muzzle blast at the cannon
      Sfx.play("seeker");
    } else {
      this.playFx("fx_hatch", x, y, 1, 0, Phaser.BlendModes.NORMAL); // brood sac bursts (normal blend: shell bits are dark)
      Sfx.play("hit");
    }
    return e;
  }

  // ------------------------------------------------------------------ enemies

  private stepEnemies(dt: number) {
    const sx = this.ship.x, sy = this.ship.y;
    const lv = this.levels;
    const bladeDmg = 2.2 * (lv.blade >= 4 ? 1.4 : 1) * this.damageMul();
    const bladeR = lv.blade >= 3 ? 9 : 7;

    for (const e of this.enemies) {
      if (!e.alive) continue;
      const s = e.s, d = e.def;
      e.t += dt;
      if (e.intro > 0) {
        // emerging: grow in and fade up
        e.intro = Math.max(0, e.intro - dt);
        const k = 1 - e.intro / INTRO;
        s.setScale((d.scale ?? 1) * (0.3 + 0.7 * k)).setAlpha(0.2 + 0.8 * k);
      }

      switch (d.role) {
        case "swarm":
          s.y += e.vy * dt;
          if (d.zigzag) {
            const tri = (2 / Math.PI) * Math.asin(Math.sin(e.t * 2.2 + e.phase)); // triangle wave
            s.x = e.baseX + tri * Math.max(e.amp, 12);
          } else s.x = e.baseX + Math.sin(e.t * 1.8 + e.phase) * e.amp;
          break;
        case "chaser": {
          if (s.y < sy - 24) e.ang = turnToward(e.ang, Math.atan2(sy - s.y, sx - s.x), 2.4 * dt);
          const sp = Math.min(d.speed * 1.6, d.speed + e.t * 28);
          s.x += Math.cos(e.ang) * sp * dt;
          s.y += Math.sin(e.ang) * sp * dt;
          s.rotation = e.ang - Math.PI / 2;
          break;
        }
        case "gunner":
          if (e.mode === 0) {
            s.y += Math.max(20, (e.stopY - s.y) * 2) * dt;
            if (s.y >= e.stopY - 2) { e.mode = 1; e.t = 0; }
          } else if (e.mode === 1) {
            s.x += Math.sin(e.t * 1.3 + e.phase) * 10 * dt;
            if ((e.fireT -= dt) <= 0 && d.fire) { e.fireT = d.fire.every; this.fire(e, d.fire, 10); }
            if (e.t > 5.5) e.mode = 2;
          } else s.y += 45 * dt;
          break;
        case "heavy":
          s.y += e.vy * dt;
          if ((e.fireT -= dt) <= 0 && d.fire) { e.fireT = d.fire.every; this.fire(e, d.fire, 0); }
          break;
        case "elite":
          if (e.mode === 0) {
            s.y += 22 * dt;
            if (s.y >= 80) { e.mode = 1; e.t = 0; }
          } else {
            s.x = e.baseX + Math.sin(e.t * 0.6) * 72;
            if ((e.fireT -= dt) <= 0) { e.fireT = 2.6; this.ring(s.x, s.y, 14, 52, e.spin); e.spin += 0.13; }
            if ((e.fire2T -= dt) <= 0) { e.fire2T = 1.9; this.aimed(s.x, s.y + 14, 5, 0.18, 82); }
          }
          break;
        case "boss":
          this.stepBoss(e, dt);
          break;
        case "missile":
          e.ang = turnToward(e.ang, Math.atan2(sy - s.y, sx - s.x), 1.7 * dt);
          s.x += Math.cos(e.ang) * Math.min(80, 52 + e.t * 8) * dt;
          s.y += Math.sin(e.ang) * Math.min(80, 52 + e.t * 8) * dt;
          s.rotation = e.ang - Math.PI / 2;
          if (e.t > 7) { this.killEnemy(e, false); continue; }
          break;
        case "turret": {
          // fixed to the ground; the gun tracks the player and fires once it's on screen
          s.y += CANYON_SPEED * dt;
          e.ang = turnToward(e.ang, Math.atan2(sy - s.y, sx - s.x), 2.2 * dt);
          e.head!.setPosition(s.x, s.y).setRotation(e.ang + Math.PI / 2);
          const f = d.fire;
          if (f && (e.fireT -= dt) <= 0 && s.y > 12 && s.y < this.worldH - 70) {
            e.fireT = f.every;
            const mx = s.x + Math.cos(e.ang) * 9, my = s.y + Math.sin(e.ang) * 9;
            for (let i = 0; i < f.n; i++) this.fireAt(mx, my, e.ang + (i - (f.n - 1) / 2) * (f.spread ?? 0), f.speed, f.kind === "wavy" ? 8 : 0);
            this.playFx("spark", mx, my, 0.5, e.ang);
          }
          break;
        }
        case "structure":
          s.y += CANYON_SPEED * dt;
          break;
        case "mine":
          // a drifting obstacle: blinks, bobs, rams you if you fly into it
          s.y += e.vy * dt;
          s.x = e.baseX + Math.sin(e.t * 1.4 + e.phase) * 7;
          Art.set(s, Math.floor(e.t * 2.5 + e.phase) % 2 ? "mine_lit" : "mine");
          break;
      }

      if (e.flash > 0 && (e.flash -= dt) <= 0) {
        if (d.tint) s.setTint(d.tint);
        else s.clearTint();
        e.head?.clearTint();
      }

      if (d.role !== "boss" && d.role !== "elite" && (s.y > this.worldH + 40 || s.x < -60 || s.x > PLAY_W + 60)) {
        e.alive = false;
        s.setVisible(false).setActive(false);
        e.head?.setVisible(false).setActive(false);
        continue;
      }

      const dx = s.x - sx, dy = s.y - sy;
      const reach = e.r + SHIP_BODY_R;
      if (d.contact > 0 && e.intro <= 0 && dx * dx + dy * dy < reach * reach && this.iframes <= 0) {
        this.hurtPlayer(d.contact);
        if (d.rams) { this.killEnemy(e, true); continue; }
      }

      if (this.blades.length && (e.bladeCd -= dt) <= 0) {
        for (const b of this.blades) {
          const bx = b.x - s.x, by = b.y - s.y, rr = e.r + bladeR;
          if (bx * bx + by * by < rr * rr) {
            e.bladeCd = 0.25;
            this.damageEnemy(e, bladeDmg, b.x, b.y, Math.atan2(-by, -bx));
            break;
          }
        }
      }
      if (this.state !== "play") return; // the player died mid-loop
    }
  }

  private fire(e: Enemy, f: Fire, yOff: number) {
    const x = e.s.x, y = e.s.y + yOff;
    switch (f.kind) {
      case "aimed": this.aimed(x, y, f.n, f.spread ?? 0.2, f.speed); break;
      case "fan":
        for (let i = 0; i < f.n; i++) this.fireAt(x, y, Math.PI / 2 + (i - (f.n - 1) / 2) * (f.spread ?? 0.2), f.speed);
        break;
      case "wavy": this.aimed(x, y, f.n, f.spread ?? 0.3, f.speed, 9); break;
      case "ring": this.ring(x, y, f.n, f.speed, e.spin); e.spin += 0.2; break;
      case "split":
        for (let i = 0; i < f.n; i++) this.fireAt(x, y, e.spin + (i * TAU) / f.n, f.speed, 0, 0.8);
        e.spin += 0.4;
        break;
    }
  }

  private stepBoss(e: Enemy, dt: number) {
    const s = e.s;
    if (e.mode === 0) {
      s.y += 30 * dt;
      if (s.y >= 72) { e.mode = 1; e.t = 0; }
      return;
    }
    s.x = e.baseX + Math.sin(e.t * 0.5) * 60;
    s.y = 72 + Math.sin(e.t * 0.9) * 8;
    const phase = e.hp / e.maxHp;
    const x = s.x, y = s.y;

    if (e.def.id === "boss_warden") {
      // The first boss teaches the patterns: sparse rings with wide gaps, small aimed spreads,
      // then a slow two-arm spiral and occasional homing missiles.
      if ((e.fireT -= dt) <= 0) { e.fireT = phase > 0.33 ? 2.4 : 1.8; this.ring(x, y - 4, 12, 52, e.spin); e.spin += 0.2; }
      if ((e.fire2T -= dt) <= 0) { e.fire2T = 2.8; this.aimed(x, y + 24, 3, 0.2, 75); }
      if (phase <= 0.66) {
        if ((e.fire3T -= dt) <= 0) {
          e.fire3T = phase <= 0.33 ? 0.17 : 0.22;
          for (let k = 0; k < 2; k++) this.fireAt(x, y - 4, e.ang + k * Math.PI, 56);
          e.ang += 0.33;
        }
        if ((e.fire4T -= dt) <= 0) {
          e.fire4T = 6;
          this.emerge(ENEMIES.missile, x - 22, y + 22, "launch"); // fired out of the twin cannons
          this.emerge(ENEMIES.missile, x + 22, y + 22, "launch");
        }
      }
    } else if (e.def.id === "boss_rimejaw") {
      // a sweeping stream from the jaw (two mirrored streams later), splitting ice shards, then rings
      if ((e.fire3T -= dt) <= 0) {
        e.fire3T = phase > 0.66 ? 0.15 : 0.12;
        const a = Math.PI / 2 + Math.sin(e.t * 1.3) * 0.95;
        this.fireAt(x, y + 22, a, 72);
        if (phase <= 0.66) this.fireAt(x, y + 22, Math.PI - a, 72);
      }
      if ((e.fireT -= dt) <= 0) {
        e.fireT = phase > 0.33 ? 2.6 : 1.8;
        const base = Math.atan2(this.ship.y - y, this.ship.x - x);
        for (let k = -1; k <= 1; k++) this.fireAt(x, y + 22, base + k * 0.35, 60, 0, 0.75);
      }
      if (phase <= 0.33 && (e.fire2T -= dt) <= 0) { e.fire2T = 2.2; this.ring(x, y, 16, 55, e.spin); e.spin += 0.2; }
    } else if (e.def.id === "boss_tempest") {
      // TEMPEST ENGINE: telegraphed lightning strikes on your lane, aimed bursts, then a 4-arm stream and rings
      if ((e.fire4T -= dt) <= 0) {
        e.fire4T = phase > 0.66 ? 3.2 : phase > 0.33 ? 2.6 : 2.1;
        const lanes = phase > 0.33 ? [0] : [-46, 0, 46];
        const cx = Phaser.Math.Clamp(this.ship.x + rand(-8, 8), 14, PLAY_W - 14);
        for (const off of lanes) this.strikes.push({ x: Phaser.Math.Clamp(cx + off, 8, PLAY_W - 8), y0: y + 20, t: 0, hit: false });
      }
      if ((e.fireT -= dt) <= 0) {
        e.fireT = 2.3;
        for (let k = 0; k < 3; k++) this.time.delayedCall(k * 160, () => { if (e.alive && this.state === "play") this.aimed(e.s.x, e.s.y + 24, 3, 0.14, 88); });
      }
      if (phase <= 0.66 && (e.fire3T -= dt) <= 0) {
        e.fire3T = 0.17;
        for (let k = 0; k < 4; k++) this.fireAt(x, y + 6, e.ang + (k * TAU) / 4, 60);
        e.ang += 0.21;
      }
      if (phase <= 0.33 && (e.fire2T -= dt) <= 0) { e.fire2T = 2.6; this.ring(x, y, 14, 50, e.spin); e.spin += 0.22; }
    } else if (e.def.id === "boss_sovereign") {
      // THE SOVEREIGN: crown fans and rings, then escorts and a 4-arm spiral, then bullet curtains with one gap
      if ((e.fireT -= dt) <= 0) {
        e.fireT = 1.7;
        const off = (e.mode++ % 2) * 0.1;
        for (let i = 0; i < 7; i++) this.fireAt(x, y + 26, Math.PI / 2 + (i - 3) * 0.2 + off, 64);
      }
      if ((e.fire2T -= dt) <= 0) { e.fire2T = 3; this.ring(x, y, 16, 48, e.spin); e.spin += 0.2; }
      if (phase <= 0.66) {
        if ((e.fire4T -= dt) <= 0) {
          e.fire4T = 7;
          for (const side of [-1, 1]) this.emerge(ENEMIES.shade, x + side * 30, y + 14, "launch").amp = 18; // escorts launched from the wings
        }
        if ((e.fire3T -= dt) <= 0) {
          e.fire3T = phase <= 0.33 ? 0.24 : 0.16;
          for (let k = 0; k < 4; k++) this.fireAt(x, y, e.ang + (k * TAU) / 4, 58);
          e.ang += 0.27;
        }
      }
      if (phase <= 0.33 && (e.spin2 -= dt) <= 0) {
        // curtain: a full row of bullets with one gap to slip through
        e.spin2 = 1.6;
        const gap = Phaser.Math.Clamp(this.ship.x + rand(-50, 50), 26, PLAY_W - 26);
        for (let bx = 8; bx <= PLAY_W - 8; bx += 14) if (Math.abs(bx - gap) > 21) this.fireAt(bx, y + 34, Math.PI / 2, 52);
      }
    } else {
      // hive queen: broods of mites, wavy acid spreads, wavy rings, then a spiral
      if ((e.fire4T -= dt) <= 0) {
        e.fire4T = phase > 0.5 ? 4 : 2.8;
        for (const side of [-1, 1]) this.emerge(ENEMIES.mite, x + side * 24, y + 8, "hatch").amp = 14; // out of her brood sacs
      }
      if ((e.fireT -= dt) <= 0) { e.fireT = 2.2; this.aimed(x, y + 26, 7, 0.2, 70, 8); }
      if (phase <= 0.66 && (e.fire2T -= dt) <= 0) { e.fire2T = 2.6; this.ring(x, y, 12, 50, e.spin, 6); e.spin += 0.25; }
      if (phase <= 0.33 && (e.fire3T -= dt) <= 0) {
        e.fire3T = 0.14;
        for (let k = 0; k < 2; k++) this.fireAt(x, y, e.ang + k * Math.PI, 60);
        e.ang += 0.28;
      }
    }
  }

  damageEnemy(e: Enemy, dmg: number, hx: number, hy: number, dir: number) {
    if (!e.alive) return;
    e.hp -= dmg;
    // small enemies flash pure white; bosses and elites take hits constantly, so they only blush red
    // (a white fill would hide their art most of the fight)
    if (e.def.role === "boss" || e.def.role === "elite") e.s.setTint(0xffb0b0);
    else e.s.setTintFill(0xffffff);
    e.head?.setTintFill(0xffffff);
    e.flash = 0.05;
    Sfx.play("hit");
    if (Math.random() < 0.5) this.playFx("spark", hx, hy, 0.9, dir);
    if (e.hp <= 0) this.killEnemy(e, true);
  }

  private killEnemy(e: Enemy, reward: boolean) {
    const d = e.def;
    const { x, y } = e.s;
    e.alive = false;
    const big = d.role === "heavy" || d.role === "elite" || d.role === "boss" || d.id === "bunker";
    const ground = GROUND_ROLES.includes(d.role);
    this.breakApart(e.s, big ? 3 : 2, big ? 3 : 2, 0, d.role === "swarm" || d.role === "chaser" ? 20 : ground ? CANYON_SPEED : 0, d.role === "boss" ? 1.6 : 1);
    e.s.setVisible(false).setActive(false);
    if (e.head?.visible) {
      this.breakApart(e.head, 2, 2, 0, CANYON_SPEED, 1);
      e.head.setVisible(false).setActive(false);
    }
    const boom = d.blast || (big && d.role !== "heavy") ? "boom_big" : [1, 3].includes(this.planet.index) ? "boom" : "boom_pink"; // blue plasma on the ice and storm planets
    this.playFx(boom, x, y, d.blast ? d.blast.radius / 60 : d.boomScale);
    Sfx.play(d.role === "boss" || d.role === "elite" || d.blast ? "bigboom" : "boom");
    if (d.role === "elite" || d.role === "heavy" || d.blast) this.cameras.main.shake(120, 0.004);
    if (ground) this.paintGround("scorch", x, y); // a burn mark stays on the ground
    if (d.onDeath) for (let i = 0; i < d.onDeath.n; i++) this.emerge(ENEMIES[d.onDeath.spawn], x + (i - 0.5) * 18, y, "hatch").amp = 10; // burst out of the shell
    if (d.blast) {
      // fuel tanks and mines take nearby enemies with them (chains into other tanks and mines)
      const r2 = d.blast.radius ** 2;
      this.time.delayedCall(60, () => {
        for (const o of this.enemies)
          if (o.alive && o !== e && o.def.role !== "boss" && (o.s.x - x) ** 2 + (o.s.y - y) ** 2 < r2)
            this.damageEnemy(o, d.blast!.dmg * this.damageMul(), o.s.x, o.s.y, Math.atan2(o.s.y - y, o.s.x - x));
      });
    }
    if (!reward) return;
    if (d.loot) this.spawnOrb(Phaser.Math.RND.pick(["shield", "heart", "magnet", "xp_big", "xp_big"]) as OrbKind, x, y);

    this.score += d.score;
    this.kills++;
    for (let i = 0; i < Math.floor(d.xp / 5); i++) this.spawnOrb("xp_big", x, y);
    for (let i = 0; i < d.xp % 5; i++) this.spawnOrb("xp", x, y);
    if (d.role === "elite") {
      this.spawnOrb("heart", x - 10, y);
      this.spawnOrb("shield", x, y);
      this.spawnOrb("magnet", x + 10, y);
    } else if (d.role !== "missile" && d.role !== "boss" && d.role !== "structure") {
      const r = Math.random(), tough = d.role === "heavy" || d.role === "gunner";
      if (r < 0.02) this.spawnOrb("heart", x, y);
      else if (r < 0.027) this.spawnOrb("magnet", x, y);
      else if (r < (tough ? 0.08 : 0.04)) this.spawnOrb("shield", x, y); // shields mostly from tougher enemies
    }
    if (d.role === "boss") this.bossDefeated(x, y);
  }

  private bossDefeated(x: number, y: number) {
    this.boss = null;
    this.state = "clear";
    this.laserG.clear();
    this.strikes = [];
    this.stormG.clear();
    for (const b of this.eshots) if (b.alive) this.killEShot(b);
    for (const e of this.enemies) if (e.alive) this.killEnemy(e, false);
    for (let i = 0; i < 6; i++)
      this.time.delayedCall(i * 220, () => {
        this.playFx("boom_big", x + rand(-32, 32), y + rand(-22, 22), rand(0.8, 1.3));
        this.cameras.main.shake(200, 0.01);
        Sfx.play("bigboom");
      });
    this.hud.banner("PLANET CLEARED", 0x2df4ff, false, this.planet.name);
    this.time.delayedCall(2600, () => this.endRun(true));
  }

  // ------------------------------------------------------------------ death debris

  /** Flash white, then split the sprite into cols x rows chunks that tumble outward and fade. */
  private breakApart(src: Sprite, cols: number, rows: number, vx: number, vy: number, lifeMul: number) {
    const frame = src.frame;
    const fw = frame.width, fh = frame.height;
    const cw = Math.ceil(fw / cols), ch = Math.ceil(fh / rows);
    const scale = src.scaleX, rot = src.rotation, cos = Math.cos(rot), sin = Math.sin(rot);
    for (let cy = 0; cy < rows; cy++)
      for (let cx = 0; cx < cols; cx++) {
        const c = this.take(this.chunks, () => ({ s: this.add.sprite(0, 0, "atlas", "drone").setDepth(11), alive: false, vx: 0, vy: 0, vr: 0, life: 0, max: 0, flash: 0 }));
        const x0 = cx * cw, y0 = cy * ch, w = Math.min(cw, fw - x0), h = Math.min(ch, fh - y0);
        if (w <= 0 || h <= 0) continue;
        c.s.setTexture(src.texture.key, frame.name).setCrop(x0, y0, w, h).setOrigin((x0 + w / 2) / fw, (y0 + h / 2) / fh);
        const ox = (x0 + w / 2 - fw / 2) * scale, oy = (y0 + h / 2 - fh / 2) * scale;
        const rx = ox * cos - oy * sin, ry = ox * sin + oy * cos;
        c.s.setPosition(src.x + rx, src.y + ry).setRotation(rot).setScale(scale).setFlipX(src.flipX).setAlpha(1)
          .setVisible(true).setActive(true).setTintFill(0xffffff);
        const len = Math.hypot(rx, ry) || 1, sp = rand(35, 85);
        Object.assign(c, { alive: true, vx: vx + (rx / len) * sp + rand(-15, 15), vy: vy + (ry / len) * sp + rand(-15, 15),
          vr: rand(-7, 7), life: 0, max: rand(0.45, 0.7) * lifeMul, flash: 0.07 });
      }
  }

  private stepChunks(dt: number) {
    for (const c of this.chunks) {
      if (!c.alive) continue;
      c.life += dt;
      if (c.flash > 0 && (c.flash -= dt) <= 0) c.s.setTint(0xffb0c8);
      const s = c.s;
      s.x += c.vx * dt;
      s.y += c.vy * dt + CANYON_SPEED * 0.3 * dt;
      c.vx *= 1 - 2 * dt;
      c.vy *= 1 - 2 * dt;
      s.rotation += c.vr * dt;
      const k = c.life / c.max;
      s.setAlpha(1 - k * k);
      if (k > 0.4) s.setTint(Phaser.Display.Color.GetColor(255 - 150 * k, 150 - 100 * k, 170 - 110 * k));
      if (c.life >= c.max) { c.alive = false; s.setVisible(false).setActive(false); }
    }
  }

  // ------------------------------------------------------------------ landmarks

  /** An x on solid ground (floor or plateau, never the river) at world row y, for the current background. */
  private groundSpot(halfW: number, where: Ground, y: number): number | null {
    const p = this.planetForBackground();
    const ty = (((y + this.bgCanyon.tilePositionY) % CANYON_H) + CANYON_H) % CANYON_H;
    return groundX(this.canyons[p.index], ty, where, halfW, Math.random);
  }

  /** Paint a prop on the scrolling ground (decoration, landmark, scorch mark). */
  private paintGround(frame: string, x: number, y: number, depth = 1.5, tint = 0xffffff) {
    if (!Art.has(frame)) return;
    const l = this.take(this.landmarks, () => ({ s: this.add.sprite(0, 0, "atlas", "drone"), alive: false, pulse: false, phase: 0 }));
    Art.set(l.s, frame);
    Object.assign(l, { alive: true, pulse: PULSING.has(frame), phase: rand(0, TAU) });
    l.s.setPosition(x, y).setDepth(depth).setVisible(true).setActive(true).setFlipX(frame !== "scorch" && Math.random() < 0.5)
      .setTint(tint).setAlpha(1).setRotation(frame === "scorch" ? rand(0, TAU) : 0);
  }

  private stepLandmarks(dt: number, spawn: boolean) {
    const now = this.time.now / 1000;
    for (const l of this.landmarks) {
      if (!l.alive) continue;
      l.s.y += CANYON_SPEED * dt;
      if (l.pulse) l.s.setAlpha(0.78 + 0.22 * Math.sin(now * 3 + l.phase)); // glowing vents, mushrooms, lights
      if (l.s.y - l.s.height / 2 > this.worldH) { l.alive = false; l.s.setVisible(false).setActive(false); }
    }
    if (!spawn) return;
    const p = this.planetForBackground();

    // big landmarks now and then
    if ((this.nextLandmark -= dt) <= 0) {
      this.nextLandmark = rand(9, 16);
      const frame = Phaser.Math.RND.pick(p.landmarks);
      if (Art.has(frame)) {
        const h = this.textures.getFrame(Art.key(frame), frame).height, w = this.textures.getFrame(Art.key(frame), frame).width;
        const x = this.groundSpot(w / 2, "any", -h / 2) ?? rand(36, PLAY_W - 36);
        this.paintGround(frame, x, -h / 2, 1, 0xc8c8d4);
      }
    }
    // small props, often: spires, vents, wrecks, ice spikes, mushrooms...
    if ((this.nextDeco -= dt) <= 0) {
      this.nextDeco = rand(0.5, 1.3);
      const frame = Phaser.Math.RND.pick(p.deco);
      const x = this.groundSpot(10, Math.random() < 0.55 ? "plateau" : "floor", -14);
      if (x !== null) this.paintGround(frame, x, -14, 1.2);
    }
    // buildings during a run: supply crates, fuel tanks, armoured bunkers on the canyon floor
    if (this.state === "play" && this.wave >= 1 && this.wave < WAVE_COUNT && (this.nextStructure -= dt) <= 0) {
      this.nextStructure = rand(6, 11);
      const kind = Phaser.Math.RND.pick(this.wave >= 3 ? ["crate", "fuel_tank", "fuel_tank", "bunker"] : ["crate", "fuel_tank"]);
      const half = kind === "bunker" ? 17 : 9;
      const x = this.groundSpot(half, "floor", -20) ?? this.groundSpot(half, "plateau", -20);
      if (x !== null) {
        this.spawnEnemy(ENEMIES[kind], x, -20);
        // fuel tanks come in small depots, so one shot can chain them
        if (kind === "fuel_tank" && Math.random() < 0.5) {
          const x2 = this.groundSpot(9, "floor", -44);
          if (x2 !== null) this.spawnEnemy(ENEMIES.fuel_tank, x2, -44);
        }
      }
    }
  }

  /** In the menu the background shows the selected planet; in a run it is the run's planet. */
  private planetForBackground(): Planet {
    if (this.state !== "menu") return this.planet;
    const key = this.bgCanyon.texture.key;
    return PLANETS[Number(key.split("_")[1]) || 0];
  }

  // ------------------------------------------------------------------ enemy fire

  private fireAt(x: number, y: number, ang: number, speed: number, wav = 0, split = 0) {
    const b = this.take(this.eshots, () => ({ s: this.add.sprite(0, 0, "atlas", "xp").setDepth(30), alive: false, vx: 0, vy: 0, r: 3, bx: 0, by: 0, t: 0, wav: 0, split: 0 }));
    Object.assign(b, { alive: true, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, r: split ? 2.5 : 3, bx: x, by: y, t: 0, wav, split });
    Art.set(b.s, split ? "eshard" : this.planet.bullet).setPosition(x, y).setVisible(true).setActive(true)
      .setRotation(split ? ang - Math.PI / 2 : 0);
  }

  private ring(x: number, y: number, n: number, speed: number, offset: number, wav = 0) {
    for (let i = 0; i < n; i++) this.fireAt(x, y, offset + (i * TAU) / n, speed, wav);
  }

  private aimed(x: number, y: number, n: number, spread: number, speed: number, wav = 0) {
    const base = Math.atan2(this.ship.y - y, this.ship.x - x);
    for (let i = 0; i < n; i++) this.fireAt(x, y, base + (i - (n - 1) / 2) * spread, speed, wav);
  }

  /**
   * TEMPEST ENGINE lightning: each strike shows a flickering warning line for 0.85 s, then a jagged bolt for 0.25 s.
   * Standing in the lane when the bolt lands costs hull (shields absorb it as usual).
   */
  private stepStrikes(dt: number) {
    const g = this.stormG.clear();
    if (!this.strikes.length) return;
    const WARN = 0.85, BOLT = 0.25, bottom = this.worldH + 4;
    for (const s of this.strikes) {
      s.t += dt;
      if (s.t < WARN) {
        const flick = 0.25 + 0.25 * Math.abs(Math.sin(s.t * 30));
        g.lineStyle(1, 0xffe84a, flick).lineBetween(s.x, s.y0, s.x, bottom);
        g.lineStyle(1, 0xffe84a, flick * 0.6).lineBetween(s.x - 6, s.y0, s.x - 6, bottom).lineBetween(s.x + 6, s.y0, s.x + 6, bottom);
        const r = 4 + (1 - s.t / WARN) * 6; // a ring closing in on the ship's row
        g.lineStyle(1, 0xffe84a, 0.5).strokeCircle(s.x, this.ship.y, r);
      } else if (s.t < WARN + BOLT) {
        if (!s.hit) {
          s.hit = true;
          Sfx.play("zap");
          this.cameras.main.shake(80, 0.004);
          this.playFx("spark", s.x, this.ship.y, 1.2, -Math.PI / 2);
          if (Math.abs(this.ship.x - s.x) < 7) this.hurtPlayer(18);
        }
        // jagged bolt: outer glow, yellow body, white core
        const pts: number[] = [];
        for (let y = s.y0; y <= bottom; y += 10) pts.push(s.x + (y === s.y0 ? 0 : rand(-4, 4)), y);
        for (const [w, col, a] of [[9, 0xffe84a, 0.25], [4, 0xffe84a, 0.9], [1.5, 0xffffff, 1]] as const) {
          g.lineStyle(w, col, a).beginPath().moveTo(pts[0], pts[1]);
          for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
          g.strokePath();
        }
      }
    }
    this.strikes = this.strikes.filter((s) => s.t < WARN + BOLT);
  }

  private killEShot(b: EShot) {
    b.alive = false;
    b.s.setVisible(false).setActive(false);
  }

  private stepEShots(dt: number) {
    const sx = this.ship.x, sy = this.ship.y;
    for (const b of this.eshots) {
      if (!b.alive) continue;
      const s = b.s;
      b.t += dt;
      b.bx += b.vx * dt;
      b.by += b.vy * dt;
      if (b.wav) {
        const sp = Math.hypot(b.vx, b.vy) || 1, off = Math.sin(b.t * 6) * b.wav;
        s.setPosition(b.bx - (b.vy / sp) * off, b.by + (b.vx / sp) * off);
      } else s.setPosition(b.bx, b.by);
      if (b.split && b.t >= b.split) {
        // ice shard bursts into three
        const a = Math.atan2(b.vy, b.vx), sp = Math.hypot(b.vx, b.vy) * 1.15;
        this.killEShot(b);
        for (const k of [-0.4, 0, 0.4]) this.fireAt(s.x, s.y, a + k, sp, 0, 0);
        continue;
      }
      if (s.y > this.worldH + 10 || s.y < -20 || s.x < -10 || s.x > PLAY_W + 10) { this.killEShot(b); continue; }
      const dx = s.x - sx, dy = s.y - sy, rr = b.r + (this.robot ? ROBOT.hitRadius : SHIP_HIT_R);
      if (dx * dx + dy * dy < rr * rr && this.iframes <= 0) {
        this.killEShot(b);
        this.hurtPlayer(BULLET_DAMAGE);
        if (this.state !== "play") return;
      }
    }
  }

  private hurtPlayer(dmg: number) {
    if (this.iframes > 0 || DEV_GOD || this.state !== "play") return;
    if (this.shieldHits > 0) {
      // the bubble takes the hit instead of the hull
      this.shieldHits--;
      this.iframes = 0.7;
      this.playFx("shield_hit", this.ship.x, this.ship.y - 8, 0.9, -Math.PI / 2);
      this.cameras.main.shake(90, 0.004);
      Sfx.play(this.shieldHits > 0 ? "shield" : "shieldbreak");
      if (this.shieldHits === 0) this.playFx("collect", this.ship.x, this.ship.y, 1.2);
      return;
    }
    this.hp -= this.robot ? Math.round(dmg * ROBOT.damageTaken) : dmg; // robot armour
    this.iframes = 1.1;
    this.cameras.main.shake(150, 0.008);
    this.hud.flashDamage();
    Sfx.play("hurt");
    this.playFx("spark", this.ship.x, this.ship.y, 1.2, -Math.PI / 2);
    if (this.hp <= 0) {
      this.hp = 0;
      this.playerDown();
    }
  }

  // ------------------------------------------------------------------ weapons

  /** Payload passive x the ship's damage perk. */
  private damageMul() {
    return (1 + 0.15 * this.levels.damage) * (1 + (this.shipDef.perk.damage ?? 0)) * (this.robot ? ROBOT.damage : 1);
  }

  private stepWeapons(dt: number) {
    const lv = this.levels;
    const rate = (1 + 0.12 * lv.rate) * (1 + (this.shipDef.perk.rate ?? 0));
    const dmgMul = this.damageMul();
    const sx = this.ship.x, sy = this.ship.y;

    if (lv.cannon > 0 && (this.wT.cannon -= dt) <= 0) {
      const iv = (0.17 / (rate * (lv.cannon >= 4 ? 1.25 : 1))) * (this.robot ? ROBOT.fireInterval : 1);
      this.wT.cannon = Math.max(this.wT.cannon + iv, 0);
      const dmg = (lv.cannon >= 2 ? 1.3 : 1) * (lv.cannon >= 5 ? 1.3 : 1) * dmgMul;
      const bounce = lv.cannon >= 6 ? 1 : 0;
      if (this.robot) {
        // robot: twin heavy rounds from the arm cannons; from CORE 1 they fan out, plus a chest shot
        const a = ROBOT.arm, fan = lv.cannon >= 3 ? 0.12 : 0;
        for (const side of [-1, 1])
          this.spawnShot("pulse", sx + side * a.x, sy + a.y, Math.sin(side * fan) * SHOT_SPEED, -Math.cos(fan) * SHOT_SPEED, dmg, bounce, false, 1.35);
        if (lv.cannon >= 3) this.spawnShot("pulse", sx, sy - 10, 0, -SHOT_SPEED, dmg, bounce, false, 1.35);
      } else
      // fighter: the nose gun always fires; from CORE 1 the wing guns drawn on this ship fire the spread
      this.spawnShot("pulse", sx, sy - 15, 0, -SHOT_SPEED, dmg, bounce, false);
      if (lv.cannon >= 3 && !this.robot) {
        const gun = this.shipDef.gun;
        for (const side of [-1, 1])
          this.spawnShot("pulse", sx + side * gun.x, sy + gun.y, Math.sin(side * 0.16) * SHOT_SPEED, -Math.cos(0.16) * SHOT_SPEED, dmg, bounce, false);
      }
      Sfx.play("shoot");
    }

    if (lv.seeker > 0) {
      if ((this.wT.seeker -= dt) <= 0) {
        this.wT.seeker = (lv.seeker >= 5 ? 1.0 : 1.35) / rate;
        this.seekerVolley(dmgMul);
        if (lv.seeker >= 6) this.wT.seekerQueue = 0.2;
      }
      if (this.wT.seekerQueue > 0 && (this.wT.seekerQueue -= dt) <= 0) this.seekerVolley(dmgMul);
    }

    this.bladeG.clear();
    if (this.blades.length) {
      const spin = 3.4 * (lv.blade >= 6 ? 2 : 1);
      this.bladeAng += dt * spin;
      const R = lv.blade >= 3 ? 34 : 26;
      this.blades.forEach((b, i) => {
        const a = this.bladeAng + (i * TAU) / this.blades.length;
        // the sword's handle sits near the ship and the blade points outward, like it's being swung
        b.setPosition(sx + Math.cos(a) * (R - 4), sy + Math.sin(a) * (R - 4)).setRotation(a + Math.PI / 2);
        // slash trail: a fading arc behind the blade tip and edge
        const sweep = Math.min(1.1, spin * 0.22);
        for (let k = 0; k < 3; k++) {
          const r = R + 4 - k * 5;
          this.bladeG.lineStyle(3 - k * 0.7, k === 0 ? 0xffffff : 0x2df4ff, 0.35 - k * 0.08);
          this.bladeG.beginPath().arc(sx, sy, r, a - sweep, a, false).strokePath();
        }
      });
    }

    this.laserG.clear();
    if (lv.laser > 0) {
      if (this.wT.laserOn > 0) {
        this.wT.laserOn -= dt;
        const width = lv.laser >= 6 ? 8 : 5;
        const angles = lv.laser >= 3 ? [-0.3, 0, 0.3] : [0];
        if ((this.wT.laserTick -= dt) <= 0) {
          this.wT.laserTick = 0.1;
          const dps = 12 * (lv.laser >= 2 ? 1.4 : 1) * (lv.laser >= 5 ? 1.4 : 1) * dmgMul;
          for (const a of angles) this.laserHits(sx, sy - 16, a, width, dps * 0.1);
        }
        this.drawLaser(sx, sy - 16, angles, width);
      } else if ((this.wT.laser -= dt) <= 0) {
        this.wT.laser = (lv.laser >= 6 ? 2.6 : 3.6) / rate;
        this.wT.laserOn = lv.laser >= 4 ? 1.6 : 1.1;
        this.wT.laserTick = 0;
        Sfx.play("laser");
      }
    }
  }

  private seekerVolley(dmgMul: number) {
    const L = this.levels.seeker;
    const n = 2 + (L >= 2 ? 1 : 0) + (L >= 5 ? 1 : 0);
    const dmg = 2.4 * (L >= 4 ? 1.3 : 1) * dmgMul;
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      // launched from the wing racks
      this.spawnShot("seeker", this.ship.x + side * 15, this.ship.y + 4, side * (48 + i * 15), -35, dmg, 0, L >= 3);
    }
    Sfx.play("seeker");
  }

  private laserHits(ox: number, oy: number, a: number, width: number, dmg: number) {
    const dx = Math.sin(a), dy = -Math.cos(a);
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const ex = e.s.x - ox, ey = e.s.y - oy;
      const along = ex * dx + ey * dy;
      if (along < 0) continue;
      const perp = Math.abs(ex * dy - ey * dx);
      if (perp < width / 2 + e.r) this.damageEnemy(e, dmg, e.s.x, e.s.y + e.r, -Math.PI / 2 + a);
      if (this.state !== "play") return;
    }
  }

  private drawLaser(ox: number, oy: number, angles: number[], width: number) {
    const lv = this.levels.laser;
    const total = lv >= 4 ? 1.6 : 1.1;
    const left = this.wT.laserOn, age = total - left;
    const env = Math.min(1, age / 0.08, left / 0.15) * (0.85 + Math.random() * 0.15);
    const g = this.laserG;
    for (const a of angles) {
      const ex = ox + Math.sin(a) * 900, ey = oy - Math.cos(a) * 900;
      g.lineStyle(width * 2.4 * env, 0xff3d9a, 0.22).lineBetween(ox, oy, ex, ey);
      g.lineStyle(width * env, 0xff3d9a, 0.75).lineBetween(ox, oy, ex, ey);
      g.lineStyle(Math.max(1, width * 0.4 * env), 0xffffff, 1).lineBetween(ox, oy, ex, ey);
    }
    g.fillStyle(0xffffff, 0.9).fillCircle(ox, oy, width * 0.7 * env);
  }

  private syncBlades() {
    const L = this.levels.blade;
    const n = L > 0 ? 1 + (L >= 2 ? 1 : 0) + (L >= 5 ? 1 : 0) : 0;
    while (this.blades.length < n)
      this.blades.push(this.add.sprite(0, 0, "atlas", "blade").setDepth(21)); // normal blend: hilt and crossguard must show
    while (this.blades.length > n) this.blades.pop()!.destroy();
    for (const b of this.blades) b.setScale(L >= 3 ? 1.25 : 1).setVisible(this.ship.visible);
    this.magnetRing.setVisible(this.ship.visible && this.levels.magnet > 0);
  }

  private spawnShot(kind: "pulse" | "seeker", x: number, y: number, vx: number, vy: number, dmg: number, bounces: number, cluster: boolean, size = 1) {
    const sh = this.take(this.shots, () => ({
      s: this.add.sprite(0, 0, "atlas", "bullet").setDepth(15).setBlendMode(Phaser.BlendModes.ADD),
      alive: false, kind, vx: 0, vy: 0, dmg: 0, r: 3, life: 0, bounces: 0, cluster: false, lastHit: null, target: null,
    }));
    Object.assign(sh, { alive: true, kind, vx, vy, dmg, r: kind === "pulse" ? 3 : 3.5, life: kind === "pulse" ? 2 : 3, bounces, cluster, lastHit: null, target: null });
    sh.s.setFrame(kind === "pulse" ? "bullet" : "seeker").setPosition(x, y).setRotation(Math.atan2(vy, vx) + Math.PI / 2).setVisible(true).setActive(true);
    if (kind === "pulse") {
      // Payload: rounds get bigger and burn warmer with each level
      const p = this.levels.damage;
      sh.s.setBlendMode(Phaser.BlendModes.ADD).setScale((1 + 0.1 * p) * size, (1 + 0.06 * p) * size); // size: robot heavy rounds
      if (p >= 3) sh.s.setTint(p >= 5 ? 0xffc080 : 0xffe0b0);
      else sh.s.clearTint();
    } else {
      // a missile: drawn normally so the white body, red nose and fins read
      sh.s.setBlendMode(Phaser.BlendModes.NORMAL).setScale(1).clearTint();
    }
  }

  private spawnPuff(x: number, y: number, vx: number, vy: number, smoke: boolean) {
    const p = this.take(this.puffs, () => ({ s: this.add.sprite(0, 0, "atlas", "puff").setDepth(14), alive: false, life: 0, max: 0, vx: 0, vy: 0, smoke: false }));
    Object.assign(p, { alive: true, life: 0, max: smoke ? rand(0.35, 0.5) : rand(0.12, 0.2), vx, vy, smoke });
    p.s.setPosition(x, y).setVisible(true).setActive(true).setAlpha(1).setScale(smoke ? 1.2 : 1)
      .setBlendMode(smoke ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD).setTint(smoke ? 0x5a5a78 : 0xffffff);
  }

  private stepPuffs(dt: number) {
    for (const p of this.puffs) {
      if (!p.alive) continue;
      p.life += dt;
      const k = p.life / p.max;
      p.s.x += p.vx * dt;
      p.s.y += p.vy * dt;
      if (p.smoke) p.s.setScale(0.8 + k * 0.8).setAlpha(0.35 * (1 - k));
      else p.s.setScale(1 - k * 0.6).setAlpha(1 - k).setTint(k < 0.3 ? 0xffffff : k < 0.6 ? 0xffb04a : 0xd8661c);
      if (p.life >= p.max) { p.alive = false; p.s.setVisible(false).setActive(false); }
    }
  }

  /** Homing priority: 1 = things that fight back (aircraft, turrets, boss), 2 = mines, 3 = buildings. */
  private targetTier(e: Enemy): number {
    return e.def.role === "structure" ? 3 : e.def.role === "mine" ? 2 : 1;
  }

  /**
   * Best target within maxDist for seekers and ricochets: the nearest one in the highest-priority tier,
   * so missiles never spend themselves on crates and bunkers while something is shooting at you.
   */
  private nearestEnemy(x: number, y: number, maxDist: number, exclude: Enemy | null): Enemy | null {
    let best: Enemy | null = null, bestTier = 4;
    let bd = maxDist * maxDist;
    for (const e of this.enemies) {
      if (!e.alive || e === exclude || e.s.y < -10) continue;
      const d = (e.s.x - x) ** 2 + (e.s.y - y) ** 2;
      if (d > maxDist * maxDist) continue;
      const tier = this.targetTier(e);
      if (tier < bestTier || (tier === bestTier && d < bd)) { best = e; bestTier = tier; bd = d; }
    }
    return best;
  }

  private stepShots(dt: number) {
    for (const sh of this.shots) {
      if (!sh.alive) continue;
      const s = sh.s;
      if (sh.kind === "seeker") {
        // lock on; a missile settled on a building/mine re-checks a few times a second for a real threat
        if (!sh.target?.alive || (this.targetTier(sh.target) > 1 && Math.random() < dt * 5))
          sh.target = this.nearestEnemy(s.x, s.y, 400, null);
        let ang = Math.atan2(sh.vy, sh.vx);
        const sp = Math.min(230, Math.hypot(sh.vx, sh.vy) + 340 * dt);
        if (sh.target) ang = turnToward(ang, Math.atan2(sh.target.s.y - s.y, sh.target.s.x - s.x), 6 * dt);
        else ang = turnToward(ang, -Math.PI / 2, 3 * dt);
        sh.vx = Math.cos(ang) * sp;
        sh.vy = Math.sin(ang) * sp;
        s.rotation = ang + Math.PI / 2;
        // exhaust: fire puffs at the nozzle, a little smoke behind
        const tx = s.x - Math.cos(ang) * 8, ty = s.y - Math.sin(ang) * 8;
        if (Math.random() < 0.8) this.spawnPuff(tx, ty, -Math.cos(ang) * 20, -Math.sin(ang) * 20, false);
        if (Math.random() < 0.08) this.spawnPuff(tx, ty, rand(-4, 4), rand(-4, 4), true);
      }
      s.x += sh.vx * dt;
      s.y += sh.vy * dt;
      if ((sh.life -= dt) <= 0 || s.y < -20 || s.y > this.worldH + 20 || s.x < -20 || s.x > PLAY_W + 20) {
        sh.alive = false;
        s.setVisible(false).setActive(false);
        continue;
      }
      for (const e of this.enemies) {
        if (!e.alive || e === sh.lastHit) continue;
        const dx = e.s.x - s.x, dy = e.s.y - s.y, rr = e.r + sh.r;
        if (dx * dx + dy * dy >= rr * rr) continue;
        const dir = Math.atan2(sh.vy, sh.vx);
        this.damageEnemy(e, sh.dmg, s.x, s.y, dir);
        if (sh.cluster) {
          this.playFx("boom", s.x, s.y, 0.4);
          for (const o of this.enemies)
            if (o.alive && o !== e && (o.s.x - s.x) ** 2 + (o.s.y - s.y) ** 2 < 22 * 22) this.damageEnemy(o, sh.dmg * 0.5, o.s.x, o.s.y, dir);
        }
        const next = sh.bounces > 0 ? this.nearestEnemy(s.x, s.y, 100, e) : null;
        if (next) {
          sh.bounces--;
          sh.lastHit = e;
          const a = Math.atan2(next.s.y - s.y, next.s.x - s.x);
          sh.vx = Math.cos(a) * SHOT_SPEED;
          sh.vy = Math.sin(a) * SHOT_SPEED;
          s.rotation = a + Math.PI / 2;
        } else {
          sh.alive = false;
          s.setVisible(false).setActive(false);
        }
        break;
      }
      if (this.state !== "play") return;
    }
  }

  // ------------------------------------------------------------------ pickups

  private pickupRange() {
    return 28 * (1 + 0.4 * this.levels.magnet);
  }

  private spawnOrb(kind: OrbKind, x: number, y: number) {
    const o = this.take(this.orbs, () => ({ s: this.add.sprite(0, 0, "atlas", "xp").setDepth(5), alive: false, kind, vx: 0, vy: 0, pulled: false }));
    Object.assign(o, { alive: true, kind, vx: rand(-35, 35), vy: rand(-50, -8), pulled: false });
    o.s.setFrame(kind).setPosition(x + rand(-4, 4), y + rand(-4, 4)).setVisible(true).setActive(true);
  }

  private stepOrbs(dt: number) {
    const sx = this.ship.x, sy = this.ship.y;
    const R = this.pickupRange();
    for (const o of this.orbs) {
      if (!o.alive) continue;
      const s = o.s;
      const dx = sx - s.x, dy = sy - s.y, d = Math.hypot(dx, dy);
      if (o.pulled || d < R) {
        o.pulled = true;
        const sp = Math.min(360, Math.hypot(o.vx, o.vy) + 760 * dt);
        o.vx = (dx / (d || 1)) * sp;
        o.vy = (dy / (d || 1)) * sp;
      } else {
        const f = Math.max(0, 1 - 3 * dt);
        o.vx *= f;
        o.vy = o.vy * f + 22 * (1 - f);
      }
      s.x += o.vx * dt;
      s.y += o.vy * dt;
      if (d < 10) { this.collect(o); continue; }
      if (s.y > this.worldH + 10) { o.alive = false; s.setVisible(false).setActive(false); }
    }
  }

  private collect(o: Orb) {
    o.alive = false;
    o.s.setVisible(false).setActive(false);
    if (o.kind === "xp" || o.kind === "xp_big") {
      this.addXp(o.kind === "xp" ? 1 : 5);
      Sfx.play("pickup");
    } else if (o.kind === "heart") {
      this.hp = Math.min(this.maxHp, this.hp + 25);
      this.playFx("collect", this.ship.x, this.ship.y, 1);
      Sfx.play("heal");
    } else if (o.kind === "shield") {
      this.shieldHits = SHIELD_HITS;
      this.playFx("collect", this.ship.x, this.ship.y, 1.2);
      Sfx.play("shieldup");
      this.hud.toast("SHIELD UP", 0.62);
    } else {
      for (const other of this.orbs) if (other.alive && (other.kind === "xp" || other.kind === "xp_big")) other.pulled = true;
      this.playFx("collect", this.ship.x, this.ship.y, 1);
      Sfx.play("heal");
    }
  }

  // ------------------------------------------------------------------ fx

  playFx(key: string, x: number, y: number, scale = 1, rotation = 0, blend: Phaser.BlendModes = Phaser.BlendModes.ADD) {
    let s = this.fxPool.find((f) => !f.active);
    if (!s) {
      // pool sprites start on any texture: play() switches to the animation's own frames (sheet or atlas)
      s = this.add.sprite(0, 0, "atlas", "puff").setDepth(25);
      s.on(Phaser.Animations.Events.ANIMATION_COMPLETE, function (this: Sprite) { this.setVisible(false).setActive(false); }, s);
      this.fxPool.push(s);
    }
    s.setPosition(x, y).setScale(scale).setRotation(rotation).setBlendMode(blend).setVisible(true).setActive(true);
    s.play(key);
  }
}
