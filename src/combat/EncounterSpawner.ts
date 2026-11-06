/**
 * Continuous encounter spawner used until the procedural wave director (Phase 4) arrives.
 *
 * Every few seconds it picks a small formation from weighted templates whose minimum time has
 * passed, using the run's seeded wave stream. Same seed and same timing produce the same
 * sequence. Enemies always enter from above the visible combat area, never on the player.
 */
import { GameConfig } from '../app/GameConfig';
import type { SeededRandom } from '../core/SeededRandom';
import type { EnemyManager } from '../enemies/EnemyManager';

interface SpawnContext {
  enemies: EnemyManager;
  rng: SeededRandom;
  /** Spawn line (gameplay y) just above the visible top edge. */
  top: number;
  halfWidth: number;
  healthMult: number;
}

interface FormationTemplate {
  id: string;
  /** Seconds into the run before this formation can appear. */
  minTime: number;
  weight: number;
  spawn(ctx: SpawnContext): void;
}

const TAU = Math.PI * 2;

const FORMATIONS: readonly FormationTemplate[] = [
  {
    id: 'drone-line',
    minTime: 0,
    weight: 3,
    spawn({ enemies, rng, top, halfWidth, healthMult }) {
      const n = rng.int(4, 6);
      const span = Math.min(halfWidth - 1.5, 1.6 * (n - 1));
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : i / (n - 1) - 0.5;
        enemies.spawn('drone', t * span * 2, top + Math.abs(t) * 1.5, { healthMult });
      }
    },
  },
  {
    id: 'drone-snake',
    minTime: 4,
    weight: 3,
    spawn({ enemies, rng, top, halfWidth, healthMult }) {
      const n = 5;
      const amp = rng.range(2, 3.5);
      const x0 = rng.range(-(halfWidth - amp - 1), halfWidth - amp - 1);
      const phase = rng.next() * TAU;
      for (let i = 0; i < n; i++) {
        enemies.spawn('drone', x0, top + i * 1.7, {
          healthMult,
          movement: { kind: 'sine', speed: 3.6, amplitude: amp, frequency: 0.32 },
          phase: phase - i * 0.55,
        });
      }
    },
  },
  {
    id: 'drone-zigzag',
    minTime: 10,
    weight: 2,
    spawn({ enemies, rng, top, halfWidth, healthMult }) {
      const side = rng.sign();
      for (let i = 0; i < 4; i++) {
        enemies.spawn('drone', side * (halfWidth - 3), top + i * 1.4, {
          healthMult,
          movement: { kind: 'zigzag', speed: 3.2, amplitude: 2.5, frequency: 0.45, driftX: -side * 0.9 },
          phase: i * 0.12,
        });
      }
    },
  },
  {
    id: 'interceptor-v',
    minTime: 12,
    weight: 2.5,
    spawn({ enemies, rng, top, halfWidth, healthMult }) {
      const n = rng.int(3, 5);
      const cx = rng.range(-halfWidth + 4, halfWidth - 4);
      const holdY = rng.range(7, 10);
      for (let i = 0; i < n; i++) {
        const t = i - (n - 1) / 2;
        enemies.spawn('interceptor', cx + t * 1.5, top + Math.abs(t) * 1.1, {
          healthMult,
          movement: { holdY: holdY + Math.abs(t) * 0.6, holdTime: 0.55 + Math.abs(t) * 0.18 },
        });
      }
    },
  },
  {
    id: 'interceptor-sweep',
    minTime: 25,
    weight: 1.5,
    spawn({ enemies, rng, top, halfWidth, healthMult }) {
      const side = rng.sign();
      for (let i = 0; i < 5; i++) {
        enemies.spawn('interceptor', side * (halfWidth + 1), top - 2 + i * 1.3, {
          healthMult,
          movement: { kind: 'straight', speed: 6, driftX: -side * 5.5 },
        });
      }
    },
  },
  {
    id: 'shooter-pair',
    minTime: 18,
    weight: 2,
    spawn({ enemies, rng, top, halfWidth, healthMult }) {
      const holdY = rng.range(8.5, 11.5);
      const spread = rng.range(3, halfWidth - 3);
      for (const s of [-1, 1]) {
        enemies.spawn('shooter', s * spread, top, {
          healthMult,
          movement: { holdY },
          phase: s > 0 ? 0 : Math.PI,
        });
      }
    },
  },
  {
    id: 'tank-escort',
    minTime: 40,
    weight: 1.2,
    spawn({ enemies, rng, top, halfWidth, healthMult }) {
      const x = rng.range(-halfWidth + 4, halfWidth - 4);
      enemies.spawn('tank', x, top + 1, { healthMult });
      for (const s of [-1, 1]) enemies.spawn('drone', x + s * 2.4, top + 2.2, { healthMult });
    },
  },
];

export class EncounterSpawner {
  private readonly enemies: EnemyManager;
  private rng: SeededRandom;
  private timer = 0;
  private lastId = '';

  constructor(enemies: EnemyManager, rng: SeededRandom) {
    this.enemies = enemies;
    this.rng = rng;
  }

  reset(rng: SeededRandom): void {
    this.rng = rng;
    // A short breather, then the first formation.
    this.timer = 1.2;
    this.lastId = '';
  }

  step(dt: number, elapsed: number): void {
    this.timer -= dt;
    if (this.timer > 0) return;

    const ramp = Math.min(1, elapsed / 150);
    const maxAlive = 14 + Math.floor(ramp * 10);
    if (this.enemies.active.length >= maxAlive) {
      this.timer = 0.5;
      return;
    }

    const eligible = FORMATIONS.filter((f) => f.minTime <= elapsed);
    // Avoid repeating the same formation back to back.
    const weights = eligible.map((f) => (f.id === this.lastId ? f.weight * 0.25 : f.weight));
    const pick = eligible[this.rng.weightedIndex(weights)] ?? FORMATIONS[0]!;
    const w = GameConfig.world;
    pick.spawn({
      enemies: this.enemies,
      rng: this.rng,
      top: w.combatHeight / 2 + GameConfig.combat.spawnOffsetY,
      halfWidth: w.combatWidth / 2,
      healthMult: 1 + elapsed / 240,
    });
    this.lastId = pick.id;
    this.timer = 3.0 - 1.4 * ramp + this.rng.range(-0.3, 0.3);
  }
}
