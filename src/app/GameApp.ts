/**
 * Application bootstrap and frame loop.
 *
 * Owns the PlayCanvas app, the game-state machine, camera, input, environment and UI.
 * Everything that belongs to a single run lives in GameSession. Each frame:
 *   1. TimeManager decides how many fixed simulation steps to run (zero unless the state
 *      machine says combat is active, so pause/upgrade/ad states freeze all gameplay timers);
 *   2. input is sampled once and the simulation steps run;
 *   3. renderers interpolate between the last two simulation states.
 */
import {
  AppBase,
  AppOptions,
  CameraComponentSystem,
  DEVICETYPE_WEBGL2,
  RenderComponentSystem,
  RESOLUTION_AUTO,
  createGraphicsDevice,
} from 'playcanvas';
import { TimeManager } from '../core/TimeManager';
import { createRunStreams, generateRunSeed } from '../core/SeededRandom';
import { PerformanceOverlay } from '../debug/PerformanceOverlay';
import { EnvironmentManager } from '../environment/EnvironmentManager';
import { InputManager } from '../input/InputManager';
import { CameraManager } from '../rendering/CameraManager';
import { MaterialManager } from '../rendering/MaterialManager';
import { ProceduralMeshCache } from '../rendering/ProceduralMeshCache';
import { QualityManager, defaultQualityLevel } from '../rendering/QualityManager';
import { GameOverOverlay } from '../ui/screens/GameOverOverlay';
import { Hud } from '../ui/screens/Hud';
import { PauseOverlay } from '../ui/screens/PauseOverlay';
import { EventBus } from './EventBus';
import { GameConfig, type QualityLevel } from './GameConfig';
import type { GameEvents } from './GameEvents';
import { GameSession } from './GameSession';
import { GameStateMachine } from './GameState';

export class GameApp {
  readonly app: AppBase;
  readonly events = new EventBus<GameEvents>();
  readonly state = new GameStateMachine();
  readonly time = new TimeManager(GameConfig.simulation);

  private readonly canvas: HTMLCanvasElement;
  private readonly uiRoot: HTMLElement;
  private readonly materials: MaterialManager;
  private readonly meshes: ProceduralMeshCache;
  private readonly quality: QualityManager;
  private readonly camera: CameraManager;
  private readonly input: InputManager;
  private readonly environment: EnvironmentManager;
  private readonly session: GameSession;
  private readonly hud: Hud;
  private readonly pauseOverlay: PauseOverlay;
  private readonly gameOver: GameOverOverlay;
  private readonly perfOverlay: PerformanceOverlay | null;
  /** Fixed seed from the URL (?seed=) — reused on retry for reproducible testing. */
  private readonly seedOverride: string | null;

  private resizeQueued = false;
  private lastSteps = 0;
  private readonly unsubscribers: Array<() => void> = [];

  /** Creates the graphics device (async) and the game. Rejects if WebGL2 is unavailable. */
  static async create(canvas: HTMLCanvasElement, uiRoot: HTMLElement): Promise<GameApp> {
    const level = readQualityOverride() ?? defaultQualityLevel();
    const profile = GameConfig.quality[level];
    const device = await createGraphicsDevice(canvas, {
      deviceTypes: [DEVICETYPE_WEBGL2],
      antialias: profile.antialias,
      alpha: false,
      depth: true,
      stencil: false,
      powerPreference: 'high-performance',
    });
    const app = new AppBase(canvas);
    const options = new AppOptions();
    options.graphicsDevice = device;
    options.componentSystems = [RenderComponentSystem, CameraComponentSystem];
    options.resourceHandlers = [];
    app.init(options);
    return new GameApp(app, canvas, uiRoot, level);
  }

  private constructor(app: AppBase, canvas: HTMLCanvasElement, uiRoot: HTMLElement, level: QualityLevel) {
    this.app = app;
    this.canvas = canvas;
    this.uiRoot = uiRoot;
    this.seedOverride = readSeedOverride();

    this.state.transition('LOADING');

    // Canvas CSS size is driven by the stylesheet; the backbuffer follows it automatically.
    app.setCanvasResolution(RESOLUTION_AUTO);

    this.materials = new MaterialManager();
    this.meshes = new ProceduralMeshCache(app.graphicsDevice);
    this.quality = new QualityManager(app.graphicsDevice, this.materials, level);
    this.camera = new CameraManager(app);
    this.input = new InputManager(canvas, this.camera);

    const firstSeed = this.seedOverride ?? generateRunSeed();
    this.environment = new EnvironmentManager(
      app,
      this.materials,
      this.meshes,
      createRunStreams(firstSeed).environment.seed,
      this.quality.profile,
    );
    this.session = new GameSession({
      app,
      materials: this.materials,
      meshes: this.meshes,
      camera: this.camera,
      events: this.events,
      quality: this.quality.profile,
    });

    this.hud = new Hud(uiRoot, () => this.state.pause());
    this.pauseOverlay = new PauseOverlay(uiRoot, () => this.state.resume());
    this.gameOver = new GameOverOverlay(uiRoot, () => this.retry());
    this.perfOverlay = import.meta.env.DEV ? new PerformanceOverlay(uiRoot) : null;

    this.bindEvents();
    this.startRun(firstSeed);
    this.applyResize();
    app.on('update', this.frame, this);
    app.start();

    this.state.transition('PLAYING');
  }

  private startRun(seed: string): void {
    this.session.start(seed);
    this.environment.reset(createRunStreams(seed).environment.seed);
    this.time.reset();
    this.gameOver.hide();
    this.hud.setVisible(true);
  }

  /** Starts a new run straight from the game-over screen. */
  private retry(): void {
    if (this.state.state !== 'GAME_OVER') return;
    this.startRun(this.seedOverride ?? generateRunSeed());
    this.state.transition('PLAYING');
    this.canvas.focus({ preventScroll: true });
  }

  private bindEvents(): void {
    this.input.keyboard.onPause = () => this.events.emit('pauseRequested', undefined);
    this.input.keyboard.onKey = (code) => {
      if (this.perfOverlay && (code === 'Backquote' || code === 'F3')) this.perfOverlay.toggle();
    };
    this.unsubscribers.push(
      this.events.on('pauseRequested', () => this.state.togglePause()),
      this.events.on('runEnded', (summary) => {
        if (!this.state.tryTransition('GAME_OVER')) return;
        this.hud.setVisible(false);
        this.gameOver.show(summary);
      }),
      this.state.onChange(({ to }) => {
        this.input.setEnabled(this.state.acceptsPlayerInput);
        this.pauseOverlay.setVisible(to === 'PAUSED');
      }),
    );

    // Resizes are coalesced into one per animation frame.
    const queueResize = () => {
      if (this.resizeQueued) return;
      this.resizeQueued = true;
      requestAnimationFrame(() => {
        this.resizeQueued = false;
        this.applyResize();
      });
    };
    window.addEventListener('resize', queueResize);
    window.addEventListener('orientationchange', queueResize);
    window.visualViewport?.addEventListener('resize', queueResize);
    const observer = new ResizeObserver(queueResize);
    observer.observe(this.canvas);
    this.unsubscribers.push(() => {
      window.removeEventListener('resize', queueResize);
      window.removeEventListener('orientationchange', queueResize);
      window.visualViewport?.removeEventListener('resize', queueResize);
      observer.disconnect();
    });

    // Losing focus or hiding the tab pauses gameplay automatically.
    const autoPause = () => {
      if (!this.state.isPaused) this.state.pause();
    };
    const onVisibility = () => {
      if (document.hidden) autoPause();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', autoPause);
    this.unsubscribers.push(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', autoPause);
    });
  }

  private applyResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    // Re-apply the pixel ratio cap in case devicePixelRatio changed (zoom, monitor move).
    this.app.graphicsDevice.maxPixelRatio = this.quality.renderScale;
    this.app.updateCanvasSize();
    this.camera.resize(rect.width, rect.height);
    this.environment.grid.updateFade(this.camera.visibleFloor);
    this.events.emit('resized', { width: rect.width, height: rect.height });
  }

  private frame(dt: number): void {
    const steps = this.time.advance(dt, this.state.isSimulationActive);
    const intent = this.input.update(this.session.player.position, this.session.player.bounds);
    const fixedDt = this.time.fixedDt;
    for (let i = 0; i < steps; i++) {
      // A step can end the run (state change); stop simulating immediately if so.
      if (!this.state.isSimulationActive) break;
      this.session.step(fixedDt, intent);
      this.environment.simulate(fixedDt);
    }
    this.lastSteps = steps;

    const alpha = this.time.alpha;
    const t = this.time.renderTime;
    this.session.render(alpha, dt, t);
    this.environment.render(alpha, t, this.camera.visibleFloor);
    this.camera.update(dt);

    const stats = this.session.stats;
    this.hud.update({
      health: stats.health,
      maxHealth: stats.maxHealth,
      shield: stats.shield,
      maxShield: stats.maxShield,
      seconds: this.session.elapsed,
      kills: this.session.kills,
    });

    this.perfOverlay?.update(dt, this.lastSteps, () => {
      const device = this.app.graphicsDevice;
      const s = this.session;
      return {
        drawCalls: this.app.stats.drawCalls.total,
        renderScale: this.quality.renderScale,
        backbuffer: `${device.width}x${device.height}`,
        state: this.state.state,
        seed: s.seed,
        inputMode: this.input.mode,
        quality: this.quality.level,
        simSteps: this.lastSteps,
        droppedMs: this.time.droppedTime * 1000,
        activeChunks: this.environment.activeChunkCount,
        activeProps: this.environment.activePropCount,
        pooledProps: this.environment.pooledPropCount,
        meshCacheSize: this.meshes.size,
        enemies: s.enemies.active.length,
        pooledEnemies: s.enemies.pooledTotal,
        playerProjectiles: s.playerProjectiles.count,
        enemyProjectiles: s.enemyProjectiles.count,
        particles: s.particles.count,
        narrowTests: s.collision.narrowTests,
      };
    });
  }

  get seed(): string {
    return this.session.seed;
  }

  destroy(): void {
    for (const u of this.unsubscribers) u();
    this.app.off('update', this.frame, this);
    this.input.destroy();
    this.session.destroy();
    this.gameOver.destroy();
    this.meshes.clear();
    this.materials.destroy();
    this.events.clear();
    this.app.destroy();
    this.uiRoot.replaceChildren();
  }
}

/** Dev/testing aid: `?seed=ABC` reproduces a run. */
function readSeedOverride(): string | null {
  const seed = new URLSearchParams(window.location.search).get('seed');
  return seed && seed.trim() ? seed.trim().slice(0, 64) : null;
}

/** `?quality=low|medium|high` forces a profile (until the settings screen exists). */
function readQualityOverride(): QualityLevel | null {
  const q = new URLSearchParams(window.location.search).get('quality');
  return q === 'low' || q === 'medium' || q === 'high' ? q : null;
}
