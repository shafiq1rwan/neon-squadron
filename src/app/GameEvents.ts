/**
 * Events exchanged between systems through the EventBus. Payload shapes are the contract;
 * HUD, audio, statistics and progression subscribe without coupling to combat internals.
 */
import type { EnemyTypeId } from '../enemies/EnemyDefinitions';
import type { DamageOutcome } from '../player/PlayerStats';

export interface RunSummary {
  seed: string;
  /** Seconds survived. */
  duration: number;
  enemiesDefeated: number;
  coinsEarned: number;
}

export interface GameEvents extends Record<string, unknown> {
  pauseRequested: void;
  resized: { width: number; height: number };
  enemyKilled: { type: EnemyTypeId; x: number; y: number; reward: number };
  playerDamaged: { outcome: DamageOutcome; health: number; shield: number };
  playerDied: void;
  runEnded: RunSummary;
}
