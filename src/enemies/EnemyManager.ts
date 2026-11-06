/**
 * Spawns, simulates, renders and recycles enemies.
 *
 * Enemy objects and their render entities are pooled per archetype, so spawning never builds
 * geometry or allocates entities after warm-up. Simulation is fixed-step; rendering
 * interpolates between the previous and current positions. Enemies killed during collision
 * resolution are flagged and removed in removeDead() so array indices stay stable mid-step.
 */
import { Entity, type AppBase } from 'playcanvas';
import { GameConfig } from '../app/GameConfig';
import { ObjectPool } from '../core/ObjectPool';
import type { SeededRandom } from '../core/SeededRandom';
import type { ProjectileManager } from '../combat/ProjectileManager';
import { buildAircraftGeometry, designKey } from '../procedural/AircraftGenerator';
import { CameraManager } from '../rendering/CameraManager';
import type { MaterialManager } from '../rendering/MaterialManager';
import { NeonRenderable } from '../rendering/NeonRenderable';
import type { ProceduralMeshCache } from '../rendering/ProceduralMeshCache';
import { hexToRgb, Palette } from '../ui/Theme';
import {
  advanceAttackTimer,
  fireAttack,
  stepMovement,
  type MovementParams,
  type MovementState,
} from './EnemyBehaviors';
import { ENEMIES, type EnemyDefinition, type EnemyTypeId } from './EnemyDefinitions';

const RAD_TO_DEG = 180 / Math.PI;

export class Enemy implements MovementState {
  id = 0;
  def: EnemyDefinition;
  readonly renderable: NeonRenderable;
  alive = false;
  /** True when destroyed by the player (earns rewards), false when it simply left the screen. */
  killed = false;
  hp = 0;
  maxHp = 0;
  radius = 0;
  x = 0;
  y = 0;
  px = 0;
  py = 0;
  x0 = 0;
  y0 = 0;
  vx = 0;
  vy = 0;
  age = 0;
  phase = 0;
  stage = 0;
  stageTime = 0;
  dirX = 0;
  dirY = 0;
  speedNow = 0;
  movement: MovementParams;
  fireTimer = 0;
  telegraphing = false;
  hitFlash = 0;
  bank = 0;

  constructor(def: EnemyDefinition, renderable: NeonRenderable) {
    this.def = def;
    this.renderable = renderable;
    this.movement = { ...def.movement };
  }
}

export interface SpawnOptions {
  movement?: Partial<MovementParams>;
  phase?: number;
  /** Multiplies base health (difficulty scaling). */
  healthMult?: number;
  /** Overrides the random first-attack delay. */
  firstAttackDelay?: number;
}

export interface EnemyStepContext {
  playerX: number;
  playerY: number;
  playerAlive: boolean;
  enemyProjectiles: ProjectileManager;
}

export class EnemyManager {
  readonly active: Enemy[] = [];
  private readonly pools = new Map<EnemyTypeId, ObjectPool<Enemy>>();
  private readonly root: Entity;
  private rng: SeededRandom;
  private readonly bulletColor = hexToRgb(Palette.enemy);
  private nextId = 1;
  /** Combined counter of spawned enemies (diagnostics). */
  spawnedTotal = 0;

  constructor(app: AppBase, materials: MaterialManager, meshes: ProceduralMeshCache, rng: SeededRandom) {
    this.rng = rng;
    this.root = new Entity('Enemies');
    app.root.addChild(this.root);
    const viewDir = CameraManager.viewDirection();

    for (const def of Object.values(ENEMIES)) {
      const pair = meshes.getOrCreate(`aircraft:${designKey(def.design)}`, () =>
        buildAircraftGeometry(def.design, { viewDir }),
      );
      const pool = new ObjectPool<Enemy>({
        create: () => {
          const r = new NeonRenderable(`enemy-${def.id}`, pair, materials);
          r.entity.setLocalScale(def.scale, def.scale, def.scale);
          this.root.addChild(r.entity);
          return new Enemy(def, r);
        },
        onAcquire: (e) => (e.renderable.entity.enabled = true),
        onRelease: (e) => {
          e.renderable.entity.enabled = false;
          e.alive = false;
        },
      });
      // Pre-build a few of each so the first waves cause no hitches.
      pool.prewarm(def.id === 'tank' ? 2 : 8);
      this.pools.set(def.id, pool);
    }
  }

  get pooledTotal(): number {
    let n = 0;
    for (const p of this.pools.values()) n += p.total;
    return n;
  }

  spawn(type: EnemyTypeId, x: number, y: number, options: SpawnOptions = {}): Enemy | null {
    const pool = this.pools.get(type);
    const e = pool?.acquire();
    if (!e) return null;
    const def = ENEMIES[type];
    e.def = def;
    e.id = this.nextId++;
    e.alive = true;
    e.killed = false;
    e.maxHp = e.hp = def.health * (options.healthMult ?? 1);
    e.radius = def.collisionRadius;
    e.x = e.px = e.x0 = x;
    e.y = e.py = e.y0 = y;
    e.vx = e.vy = 0;
    e.age = 0;
    e.phase = options.phase ?? 0;
    e.stage = 0;
    e.stageTime = 0;
    e.dirX = e.dirY = 0;
    e.speedNow = 0;
    Object.assign(e.movement, def.movement, options.movement);
    const delay = def.attack?.initialDelay;
    const firstDelay = options.firstAttackDelay ?? (delay ? this.rng.range(delay[0], delay[1]) : 0);
    // Every attack, including the first, must get a full warning window.
    e.fireTimer = Math.max(firstDelay, GameConfig.combat.telegraphDuration + 0.05);
    e.telegraphing = false;
    e.hitFlash = 0;
    e.bank = 0;
    this.active.push(e);
    this.spawnedTotal++;
    return e;
  }

  step(dt: number, ctx: EnemyStepContext): void {
    const cfg = GameConfig.combat;
    const world = GameConfig.world;
    const halfW = world.combatWidth / 2;
    const halfH = world.combatHeight / 2;
    const despawn = cfg.despawnMargin;
    const movementCtx = { playerX: ctx.playerX, playerY: ctx.playerY, laneHalfWidth: halfW };

    for (const e of this.active) {
      if (!e.alive) continue;
      e.px = e.x;
      e.py = e.y;
      stepMovement(e, dt, movementCtx);
      e.vx = (e.x - e.px) / dt;
      e.vy = (e.y - e.py) / dt;
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);

      if (e.x < -halfW - despawn || e.x > halfW + despawn || e.y < -halfH - despawn || e.y > halfH + despawn * 3) {
        e.alive = false; // left the arena: no reward
        continue;
      }

      const attack = e.def.attack;
      if (!attack) continue;
      if (advanceAttackTimer(e, dt, attack.interval, cfg.telegraphDuration, () => this.canFire(e, ctx))) {
        fireAttack(attack, e.x, e.y - e.radius * 0.6, ctx.playerX, ctx.playerY, this.bulletColor, ctx.enemyProjectiles, e.age * 0.7);
      }
    }
  }

  /** Fairness gates: on screen, above the player, not point-blank, bullet density under the cap. */
  private canFire(e: Enemy, ctx: EnemyStepContext): boolean {
    const cfg = GameConfig.combat;
    const halfW = GameConfig.world.combatWidth / 2;
    const halfH = GameConfig.world.combatHeight / 2;
    if (!ctx.playerAlive) return false;
    if (e.y >= halfH - cfg.enemyFireTopMargin || e.y <= -halfH + 1 || Math.abs(e.x) >= halfW + 0.5) return false;
    if (e.y <= ctx.playerY + 1) return false;
    if (Math.hypot(ctx.playerX - e.x, ctx.playerY - e.y) < cfg.enemyFireMinDistance) return false;
    return ctx.enemyProjectiles.count < cfg.maxEnemyProjectiles;
  }

  /** Marks an enemy destroyed by the player. */
  kill(e: Enemy): void {
    if (!e.alive) return;
    e.alive = false;
    e.killed = true;
  }

  /** Returns dead enemies to their pools. Call once per step after collisions. */
  removeDead(): void {
    let w = 0;
    for (let r = 0; r < this.active.length; r++) {
      const e = this.active[r]!;
      if (e.alive) {
        this.active[w++] = e;
      } else {
        this.pools.get(e.def.id)!.release(e);
      }
    }
    this.active.length = w;
  }

  clear(): void {
    for (const e of this.active) e.alive = false;
    this.removeDead();
  }

  /** Clears all enemies and switches to a new run's random stream. */
  reset(rng: SeededRandom): void {
    this.clear();
    this.rng = rng;
  }

  render(alpha: number, frameDt: number, time: number): void {
    const h = GameConfig.world.aircraftHeight;
    const k = 1 - Math.exp(-8 * frameDt);
    const flashDur = GameConfig.combat.hitFlashDuration;
    for (const e of this.active) {
      const x = e.px + (e.x - e.px) * alpha;
      const y = e.py + (e.y - e.py) * alpha;
      e.renderable.entity.setPosition(x, h, -y);
      const speedRef = Math.max(e.movement.speed, 1);
      const targetBank = Math.max(-1, Math.min(1, e.vx / speedRef)) * 0.5;
      e.bank += (targetBank - e.bank) * k;
      // Nose points down the screen (yaw 180°).
      e.renderable.entity.setLocalEulerAngles(0, 180, e.bank * RAD_TO_DEG);

      let flash = e.hitFlash > 0 ? 0.85 * (e.hitFlash / flashDur) : 0;
      if (e.telegraphing) flash = Math.max(flash, 0.25 + 0.25 * Math.sin(time * 38));
      e.renderable.setFlash(flash);
    }
  }
}
