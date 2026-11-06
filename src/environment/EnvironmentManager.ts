/**
 * Scrolling neon battlefield: the floor grid plus chunked, recycled scenery.
 *
 * The "track" coordinate t = gameplayY + distance is fixed to the ground. Chunk k covers
 * t ∈ [k·L, (k+1)·L). Only chunks overlapping the visible floor are active; props come
 * from per-type pools and are returned when their chunk scrolls away. Scroll distance is
 * advanced by the fixed-step simulation and interpolated for rendering.
 */
import { Entity, type AppBase } from 'playcanvas';
import { GameConfig, type QualityProfile } from '../app/GameConfig';
import { ObjectPool } from '../core/ObjectPool';
import type { MaterialManager } from '../rendering/MaterialManager';
import { NeonRenderable } from '../rendering/NeonRenderable';
import type { ProceduralMeshCache } from '../rendering/ProceduralMeshCache';
import type { Rect } from '../rendering/WorldSpace';
import { generateChunkLayout, PropTypes, type PropPlacement, type PropType } from '../procedural/EnvironmentGenerator';
import { GridRenderer } from './GridRenderer';
import { buildPropGeometry } from './PropMeshes';

interface ActiveProp {
  renderable: NeonRenderable;
  pool: ObjectPool<NeonRenderable>;
  placement: PropPlacement;
}

interface ActiveChunk {
  index: number;
  props: ActiveProp[];
}

export class EnvironmentManager {
  readonly grid: GridRenderer;
  private readonly root: Entity;
  private readonly pools = new Map<string, ObjectPool<NeonRenderable>>();
  private readonly chunks = new Map<number, ActiveChunk>();
  private seed: string;
  private propsPerChunk: number;

  distance = 0;
  private previousDistance = 0;
  private scrollSpeed: number = GameConfig.environment.scrollSpeed;

  constructor(
    app: AppBase,
    materials: MaterialManager,
    meshes: ProceduralMeshCache,
    seed: string,
    quality: QualityProfile,
  ) {
    this.seed = seed;
    this.propsPerChunk = quality.propsPerChunk;
    this.grid = new GridRenderer(app, materials);
    this.root = new Entity('Scenery');
    app.root.addChild(this.root);

    for (const type of PropTypes) {
      for (const accent of [false, true]) {
        const key = poolKey(type, accent);
        const pair = meshes.getOrCreate(`prop:${key}`, () => buildPropGeometry(type, accent));
        this.pools.set(
          key,
          new ObjectPool<NeonRenderable>({
            create: () => {
              const r = new NeonRenderable(`prop-${key}`, pair, materials);
              this.root.addChild(r.entity);
              return r;
            },
            onAcquire: (r) => (r.entity.enabled = true),
            onRelease: (r) => (r.entity.enabled = false),
          }),
        );
      }
    }
  }

  get activeChunkCount(): number {
    return this.chunks.size;
  }

  get activePropCount(): number {
    let n = 0;
    for (const c of this.chunks.values()) n += c.props.length;
    return n;
  }

  get pooledPropCount(): number {
    let n = 0;
    for (const p of this.pools.values()) n += p.total;
    return n;
  }

  setScrollSpeed(speed: number): void {
    this.scrollSpeed = speed;
  }

  /** Changing density regenerates chunks lazily as they scroll in. */
  setPropsPerChunk(count: number): void {
    this.propsPerChunk = count;
  }

  /** Fixed-step advance. */
  simulate(dt: number): void {
    this.previousDistance = this.distance;
    this.distance += this.scrollSpeed * dt;
  }

  /** Recycles all chunks; a new seed changes the scenery layout for the next run. */
  reset(seed: string = this.seed): void {
    for (const chunk of this.chunks.values()) this.releaseChunk(chunk);
    this.chunks.clear();
    this.seed = seed;
    this.distance = this.previousDistance = 0;
  }

  render(alpha: number, time: number, visibleFloor: Rect): void {
    const d = this.previousDistance + (this.distance - this.previousDistance) * alpha;
    this.grid.update(d, time);

    const L = GameConfig.environment.chunkLength;
    const margin = 6;
    const first = Math.floor((visibleFloor.minY - margin + d) / L);
    const last = Math.floor((visibleFloor.maxY + margin + d) / L);

    for (const [index, chunk] of this.chunks) {
      if (index < first || index > last) {
        this.releaseChunk(chunk);
        this.chunks.delete(index);
      }
    }
    for (let k = first; k <= last; k++) {
      if (!this.chunks.has(k)) this.chunks.set(k, this.buildChunk(k));
    }

    const floorY = -GameConfig.world.floorDepth;
    for (const chunk of this.chunks.values()) {
      const base = chunk.index * L - d;
      for (const prop of chunk.props) {
        const p = prop.placement;
        prop.renderable.entity.setPosition(p.x, floorY, -(base + p.along));
      }
    }
  }

  private buildChunk(index: number): ActiveChunk {
    const layout = generateChunkLayout(index, {
      seed: this.seed,
      chunkLength: GameConfig.environment.chunkLength,
      laneHalfWidth: GameConfig.world.combatWidth / 2,
      laneClearance: 1.6,
      sideDepth: 22,
      propCount: this.propsPerChunk,
    });
    const props: ActiveProp[] = [];
    for (const placement of layout) {
      const pool = this.pools.get(poolKey(placement.type, placement.accent));
      const renderable = pool?.acquire();
      if (!pool || !renderable) continue;
      renderable.entity.setLocalScale(placement.scale, placement.scale, placement.scale);
      props.push({ renderable, pool, placement });
    }
    return { index, props };
  }

  private releaseChunk(chunk: ActiveChunk): void {
    for (const prop of chunk.props) prop.pool.release(prop.renderable);
    chunk.props.length = 0;
  }
}

function poolKey(type: PropType, accent: boolean): string {
  return `${type}:${accent ? 'accent' : 'base'}`;
}
