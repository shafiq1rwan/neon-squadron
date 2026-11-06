/**
 * One run of the game: player, weapons, enemies, projectiles, collisions, effects and the
 * encounter spawner. GameApp owns the engine, camera, input, UI and state machine; the
 * session owns everything that must be reset between runs, so restarting is just start().
 *
 * Fixed-step order per step():
 *   player move → player stats → weapons fire → spawner → enemies move/attack
 *   → projectiles move → collisions/damage → remove dead → particles
 */
import { Layer, type AppBase } from 'playcanvas';
import { createRunStreams, type RunRandomStreams } from '../core/SeededRandom';
import { CollisionSystem, type PlayerCollider } from '../combat/CollisionSystem';
import { DamageSystem } from '../combat/DamageSystem';
import { EncounterSpawner } from '../combat/EncounterSpawner';
import { ProjectileManager } from '../combat/ProjectileManager';
import { WEAPONS } from '../combat/WeaponDefinitions';
import { Weapon } from '../combat/WeaponSystem';
import { EnemyManager } from '../enemies/EnemyManager';
import type { MoveIntent } from '../input/InputManager';
import { PlayerController } from '../player/PlayerController';
import { PlayerRenderer } from '../player/PlayerRenderer';
import { PlayerStats } from '../player/PlayerStats';
import type { CameraManager } from '../rendering/CameraManager';
import { EffectsManager } from '../rendering/EffectsManager';
import type { MaterialManager } from '../rendering/MaterialManager';
import { ParticleManager } from '../rendering/ParticleManager';
import type { ProceduralMeshCache } from '../rendering/ProceduralMeshCache';
import { SpriteBatch } from '../rendering/SpriteBatch';
import { rectFromCentre, shrinkRect, type Rect } from '../rendering/WorldSpace';
import type { EventBus } from './EventBus';
import { GameConfig, type QualityProfile } from './GameConfig';
import type { GameEvents, RunSummary } from './GameEvents';

export interface SessionDeps {
  app: AppBase;
  materials: MaterialManager;
  meshes: ProceduralMeshCache;
  camera: CameraManager;
  events: EventBus<GameEvents>;
  quality: QualityProfile;
}

export class GameSession {
  readonly player: PlayerController;
  readonly stats: PlayerStats;
  readonly playerProjectiles: ProjectileManager;
  readonly enemyProjectiles: ProjectileManager;
  readonly enemies: EnemyManager;
  readonly particles: ParticleManager;
  readonly collision = new CollisionSystem();

  private readonly events: EventBus<GameEvents>;
  private readonly playerRenderer: PlayerRenderer;
  private readonly effects: EffectsManager;
  private readonly damage: DamageSystem;
  private readonly spawner: EncounterSpawner;
  private readonly weapon: Weapon;
  private readonly effectsBatch: SpriteBatch;
  private readonly playerShotBatch: SpriteBatch;
  private readonly enemyShotBatch: SpriteBatch;
  private readonly projectileBounds: Rect;
  private readonly collider: PlayerCollider = { x: 0, y: 0, radius: 0, alive: true, invulnerable: false };

  private streams: RunRandomStreams;
  private seedValue = '';
  elapsed = 0;
  kills = 0;
  coins = 0;
  private deathTimer = 0;
  private dying = false;
  private ended = false;
  private hitFlash = 0;
  private readonly unsubscribe: Array<() => void> = [];

  constructor(deps: SessionDeps) {
    const { app, materials, meshes, camera, events, quality } = deps;
    this.events = events;
    this.streams = createRunStreams('init');
    const world = GameConfig.world;
    const combat = rectFromCentre(world.combatWidth / 2, world.combatHeight / 2);
    const c = GameConfig.combat;

    this.player = new PlayerController(GameConfig.player, GameConfig.input, shrinkRect(combat, world.playerEdgeMargin));
    this.stats = new PlayerStats(GameConfig.player, c);
    this.playerRenderer = new PlayerRenderer(app, materials, meshes);
    this.weapon = new Weapon(WEAPONS.pulseCannon);

    this.playerProjectiles = new ProjectileManager(c.playerProjectileCapacity);
    this.enemyProjectiles = new ProjectileManager(c.enemyProjectileCapacity);
    this.projectileBounds = shrinkRect(combat, -3);

    // Enemy bullets get their own layer, drawn after the world, without depth testing,
    // so nothing (effects, scenery, ships) can ever hide them.
    const bulletLayer = new Layer({ name: 'EnemyBullets' });
    app.scene.layers.push(bulletLayer);
    const cam = camera.entity.camera!;
    cam.layers = [...cam.layers, bulletLayer.id];
    const worldLayer = app.scene.layers.getLayerByName('World')!;

    const maxParticles = GameConfig.quality.high.maxParticles;
    this.particles = new ParticleManager(maxParticles, quality.maxParticles);
    this.effectsBatch = new SpriteBatch(app, 'EffectsBatch', maxParticles, materials.sprite, worldLayer.id);
    this.playerShotBatch = new SpriteBatch(app, 'PlayerShots', c.playerProjectileCapacity, materials.sprite, worldLayer.id);
    this.enemyShotBatch = new SpriteBatch(app, 'EnemyShots', c.enemyProjectileCapacity, materials.spriteOverlay, bulletLayer.id);

    this.effects = new EffectsManager(this.particles, camera, this.streams.cosmetic);
    this.enemies = new EnemyManager(app, materials, meshes, this.streams.enemy);
    this.damage = new DamageSystem(this.enemies, this.stats, this.effects, events);
    this.spawner = new EncounterSpawner(this.enemies, this.streams.wave);

    this.unsubscribe.push(
      events.on('enemyKilled', ({ reward }) => {
        this.kills++;
        this.coins += reward;
      }),
      events.on('playerDamaged', () => {
        this.hitFlash = 1;
      }),
    );
  }

  get seed(): string {
    return this.seedValue;
  }

  get isPlayerAlive(): boolean {
    return this.stats.alive;
  }

  /** Begins a fresh run. Everything run-specific is reset here. */
  start(seed: string): void {
    this.seedValue = seed;
    this.streams = createRunStreams(seed);
    this.effects.setRandom(this.streams.cosmetic);
    this.enemies.reset(this.streams.enemy);
    this.spawner.reset(this.streams.wave);
    this.playerProjectiles.clear();
    this.enemyProjectiles.clear();
    this.particles.clear();
    this.stats.reset();
    this.player.speedMultiplier = 1;
    this.player.reset(0, -GameConfig.world.combatHeight / 2 + 5);
    this.weapon.reset(0.3);
    this.playerRenderer.setVisible(true);
    this.elapsed = 0;
    this.kills = 0;
    this.coins = 0;
    this.deathTimer = 0;
    this.dying = false;
    this.ended = false;
    this.hitFlash = 0;
  }

  /** Death is driven by PlayerStats (single source of truth), not by any one event. */
  private beginDeath(): void {
    this.dying = true;
    this.deathTimer = GameConfig.combat.deathDelay;
    this.playerRenderer.setVisible(false);
    this.events.emit('playerDied', undefined);
  }

  step(dt: number, intent: MoveIntent): void {
    const alive = this.stats.alive;
    if (alive) {
      this.elapsed += dt;
      this.player.speedMultiplier = this.stats.moveSpeedMult;
      this.player.step(dt, intent);
      this.stats.step(dt);
      const muzzleY = this.player.position.y + 0.95;
      if (this.weapon.update(dt, this.player.position.x, muzzleY, this.stats.weaponMods, this.playerProjectiles) > 0) {
        this.effects.muzzleFlash(this.player.position.x, muzzleY);
      }
      this.spawner.step(dt, this.elapsed);
    } else if (!this.ended) {
      if (!this.dying) this.beginDeath();
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) {
        this.ended = true;
        this.events.emit('runEnded', this.summary());
      }
    }

    this.enemies.step(dt, {
      playerX: this.player.position.x,
      playerY: this.player.position.y,
      playerAlive: alive,
      enemyProjectiles: this.enemyProjectiles,
    });
    this.playerProjectiles.step(dt, this.projectileBounds);
    this.enemyProjectiles.step(dt, this.projectileBounds);

    const col = this.collider;
    col.x = this.player.position.x;
    col.y = this.player.position.y;
    col.radius = GameConfig.player.collisionRadius;
    col.alive = this.stats.alive;
    col.invulnerable = this.stats.isInvulnerable;
    this.collision.resolve(this.enemies.active, this.playerProjectiles, this.enemyProjectiles, col, this.damage);

    if (!this.stats.alive && !this.dying) this.beginDeath();
    this.enemies.removeDead();
    this.particles.step(dt);
    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt * 6);
  }

  render(alpha: number, frameDt: number, time: number): void {
    if (this.stats.alive) {
      this.playerRenderer.render(this.player, alpha, frameDt, time);
      // Blink during invulnerability (visual only; ~12 Hz).
      const blink = this.stats.isInvulnerable && Math.floor(this.stats.invulnerable * 12) % 2 === 0;
      this.playerRenderer.setVisible(!blink);
      this.playerRenderer.setFlash(this.hitFlash);
    }
    this.enemies.render(alpha, frameDt, time);

    const h = GameConfig.combat.projectileHeight;
    this.effectsBatch.begin();
    this.particles.render(this.effectsBatch, alpha, h + 0.05);
    this.effectsBatch.end();

    this.playerShotBatch.begin();
    this.playerProjectiles.render(this.playerShotBatch, alpha, h);
    this.playerShotBatch.end();

    this.enemyShotBatch.begin();
    this.enemyProjectiles.render(this.enemyShotBatch, alpha, h + 0.1);
    this.enemyShotBatch.end();
  }

  summary(): RunSummary {
    return { seed: this.seedValue, duration: this.elapsed, enemiesDefeated: this.kills, coinsEarned: this.coins };
  }

  setParticleBudget(budget: number): void {
    this.particles.budget = Math.min(budget, this.particles.capacity);
  }

  destroy(): void {
    for (const u of this.unsubscribe) u();
    this.playerRenderer.destroy();
    this.effectsBatch.destroy();
    this.playerShotBatch.destroy();
    this.enemyShotBatch.destroy();
  }
}
