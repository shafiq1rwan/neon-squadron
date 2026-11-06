/**
 * Applies damage and reports consequences. Collision decides *that* something hit;
 * this system decides *what happens*: health changes, area damage, kills, rewards, events and
 * the matching visual feedback requests.
 */
import { GameConfig } from '../app/GameConfig';
import type { EventBus } from '../app/EventBus';
import type { GameEvents } from '../app/GameEvents';
import type { Enemy, EnemyManager } from '../enemies/EnemyManager';
import type { PlayerStats } from '../player/PlayerStats';
import type { EffectsManager } from '../rendering/EffectsManager';
import type { CollisionSystem } from './CollisionSystem';

export class DamageSystem {
  private readonly enemies: EnemyManager;
  private readonly stats: PlayerStats;
  private readonly effects: EffectsManager;
  private readonly events: EventBus<GameEvents>;
  private readonly areaHits: number[] = [];

  constructor(enemies: EnemyManager, stats: PlayerStats, effects: EffectsManager, events: EventBus<GameEvents>) {
    this.enemies = enemies;
    this.stats = stats;
    this.effects = effects;
    this.events = events;
  }

  /** Direct damage to one enemy. Returns true if it died. */
  damageEnemy(e: Enemy, amount: number, hitX: number, hitY: number): boolean {
    if (!e.alive || amount <= 0) return false;
    e.hp -= amount;
    e.hitFlash = GameConfig.combat.hitFlashDuration;
    if (e.hp > 0) {
      this.effects.hitSpark(hitX, hitY);
      return false;
    }
    this.enemies.kill(e);
    this.effects.explosion(e.x, e.y, e.def.explosionScale);
    this.events.emit('enemyKilled', { type: e.def.id, x: e.x, y: e.y, reward: e.def.reward });
    return true;
  }

  projectileHitEnemy(
    target: Enemy,
    amount: number,
    hitX: number,
    hitY: number,
    areaRadius: number,
    enemies: readonly Enemy[],
    collision: CollisionSystem,
  ): void {
    this.damageEnemy(target, amount, hitX, hitY);
    if (areaRadius <= 0) return;
    // Splash: reduced damage to everything else in the radius.
    this.effects.areaBurst(hitX, hitY, areaRadius);
    const n = collision.enemiesInRadius(enemies, hitX, hitY, areaRadius, this.areaHits);
    for (let k = 0; k < n; k++) {
      const e = enemies[this.areaHits[k]!]!;
      if (e !== target) this.damageEnemy(e, amount * 0.6, e.x, e.y);
    }
  }

  projectileHitPlayer(amount: number, x: number, y: number): void {
    this.damagePlayer(amount, x, y);
  }

  /**
   * Player and enemy collide: both take damage, once. While the player is invulnerable the
   * enemy passes through unharmed, so overlapping for several steps can't shred heavy targets.
   */
  ram(e: Enemy, playerX: number, playerY: number): void {
    if (this.stats.isInvulnerable || !this.stats.alive) return;
    this.damagePlayer(e.def.contactDamage, (e.x + playerX) / 2, (e.y + playerY) / 2);
    this.damageEnemy(e, GameConfig.combat.ramDamageToEnemy, e.x, e.y);
  }

  private damagePlayer(amount: number, x: number, y: number): void {
    const outcome = this.stats.applyDamage(amount);
    if (outcome === 'ignored') return;
    if (outcome === 'shield') this.effects.shieldHit(x, y);
    else this.effects.playerHit(x, y, outcome === 'killed');
    this.events.emit('playerDamaged', { outcome, health: this.stats.health, shield: this.stats.shield });
  }
}
