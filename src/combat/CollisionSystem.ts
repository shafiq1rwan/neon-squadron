/**
 * 2D collision resolution on the gameplay plane (circles only).
 *
 * - Player projectiles vs enemies: spatial-grid broad phase, swept test (segment from the
 *   previous to the current position vs. circle) so fast shots never tunnel through targets.
 * - Enemy projectiles vs player: swept test against the player's small hitbox.
 * - Enemy bodies vs player: ramming damages both.
 *
 * This system only detects; DamageSystem decides what a hit does.
 */
import { GameConfig } from '../app/GameConfig';
import type { Enemy } from '../enemies/EnemyManager';
import type { DamageSystem } from './DamageSystem';
import type { ProjectileManager } from './ProjectileManager';
import { SpatialGrid } from './SpatialGrid';

/** Squared distance from point (cx, cy) to segment (ax, ay)-(bx, by). */
export function segmentPointDistSq(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  let t = lenSq > 1e-12 ? ((cx - ax) * abx + (cy - ay) * aby) / lenSq : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const dx = ax + abx * t - cx;
  const dy = ay + aby * t - cy;
  return dx * dx + dy * dy;
}

export interface PlayerCollider {
  x: number;
  y: number;
  radius: number;
  alive: boolean;
  invulnerable: boolean;
}

export class CollisionSystem {
  readonly grid: SpatialGrid;
  private readonly candidates: number[] = [];
  /** Number of exact narrow-phase tests last step (diagnostics). */
  narrowTests = 0;

  constructor() {
    const w = GameConfig.world;
    const c = GameConfig.combat;
    const margin = c.despawnMargin + 2;
    this.grid = new SpatialGrid(
      -w.combatWidth / 2 - margin,
      -w.combatHeight / 2 - margin,
      w.combatWidth + margin * 2,
      w.combatHeight + margin * 4,
      c.gridCellSize,
    );
  }

  /** Rebuilds the broad phase from live enemies. Indices refer to `enemies`. */
  rebuild(enemies: readonly Enemy[]): void {
    this.grid.clear();
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i]!;
      if (e.alive) this.grid.insert(i, e.x, e.y, e.radius);
    }
  }

  /** Enemies whose circle overlaps (x, y, radius). Writes indices into `out`. */
  enemiesInRadius(enemies: readonly Enemy[], x: number, y: number, radius: number, out: number[]): number {
    const n = this.grid.query(x, y, radius, this.candidates);
    let m = 0;
    for (let k = 0; k < n; k++) {
      const idx = this.candidates[k]!;
      const e = enemies[idx]!;
      if (!e.alive) continue;
      const rr = radius + e.radius;
      const dx = e.x - x;
      const dy = e.y - y;
      if (dx * dx + dy * dy <= rr * rr) out[m++] = idx;
    }
    return m;
  }

  resolve(
    enemies: readonly Enemy[],
    playerShots: ProjectileManager,
    enemyShots: ProjectileManager,
    player: PlayerCollider,
    damage: DamageSystem,
  ): void {
    this.narrowTests = 0;
    this.rebuild(enemies);
    const cand = this.candidates;

    // Player projectiles vs enemies.
    const p = playerShots;
    for (let i = p.count - 1; i >= 0; i--) {
      const ax = p.px[i]!;
      const ay = p.py[i]!;
      const bx = p.x[i]!;
      const by = p.y[i]!;
      const r = p.radius[i]!;
      // Reach covers the swept segment.
      const midX = (ax + bx) * 0.5;
      const midY = (ay + by) * 0.5;
      const reach = r + Math.hypot(bx - ax, by - ay) * 0.5;
      const n = this.grid.query(midX, midY, reach, cand);

      // Pick the earliest enemy along the path so piercing order is consistent.
      let best = -1;
      let bestT = Infinity;
      for (let k = 0; k < n; k++) {
        const e = enemies[cand[k]!]!;
        if (!e.alive || e.id === p.lastHit[i]) continue;
        this.narrowTests++;
        const rr = r + e.radius;
        if (segmentPointDistSq(ax, ay, bx, by, e.x, e.y) <= rr * rr) {
          const t = (e.x - ax) * (bx - ax) + (e.y - ay) * (by - ay);
          if (t < bestT) {
            bestT = t;
            best = cand[k]!;
          }
        }
      }
      if (best < 0) continue;

      const target = enemies[best]!;
      damage.projectileHitEnemy(target, p.damage[i]!, bx, by, p.areaRadius[i]!, enemies, this);
      if (p.pierce[i]! > 0) {
        p.pierce[i]!--;
        p.lastHit[i] = target.id;
      } else {
        p.remove(i);
      }
    }

    if (!player.alive) return;

    // Enemy projectiles vs player. Bullets pass through during invulnerability frames.
    if (!player.invulnerable) {
      const q = enemyShots;
      for (let i = q.count - 1; i >= 0; i--) {
        const rr = q.radius[i]! + player.radius;
        if (segmentPointDistSq(q.px[i]!, q.py[i]!, q.x[i]!, q.y[i]!, player.x, player.y) <= rr * rr) {
          damage.projectileHitPlayer(q.damage[i]!, q.x[i]!, q.y[i]!);
          q.remove(i);
          break; // one hit grants invulnerability; remaining bullets are checked next step
        }
      }
    }

    // Ramming.
    const n = this.grid.query(player.x, player.y, player.radius, cand);
    for (let k = 0; k < n; k++) {
      const e = enemies[cand[k]!]!;
      if (!e.alive) continue;
      const rr = e.radius + player.radius;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (dx * dx + dy * dy <= rr * rr) {
        damage.ram(e, player.x, player.y);
      }
    }
  }
}
