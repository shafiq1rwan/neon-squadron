/**
 * Player survivability: health, shield, temporary invulnerability and shield regeneration.
 * Pure simulation state with no rendering, advanced by the fixed timestep.
 *
 * Damage hits the shield first. Any hit grants invulnerability frames. The shield regains
 * one point every `shieldRegenInterval` once `shieldRegenDelay` seconds pass without damage.
 */
import type { PlayerConfig } from '../app/GameConfig';
import { defaultWeaponModifiers, type WeaponModifiers } from '../combat/WeaponSystem';

export type DamageOutcome = 'ignored' | 'shield' | 'health' | 'killed';

export interface ShieldRegenConfig {
  shieldRegenDelay: number;
  shieldRegenInterval: number;
}

export class PlayerStats {
  maxHealth = 0;
  health = 0;
  maxShield = 0;
  shield = 0;
  invulnerable = 0;
  alive = true;
  /** Multiplier applied to movement speed (upgrades). */
  moveSpeedMult = 1;
  readonly weaponMods: WeaponModifiers = defaultWeaponModifiers();

  private sinceDamage = 0;
  private regenTimer = 0;
  private readonly config: PlayerConfig;
  private readonly regen: ShieldRegenConfig;

  constructor(config: PlayerConfig, regen: ShieldRegenConfig) {
    this.config = config;
    this.regen = regen;
    this.reset();
  }

  reset(): void {
    this.maxHealth = this.config.maxHealth;
    this.health = this.maxHealth;
    this.maxShield = this.config.maxShield;
    this.shield = this.maxShield;
    this.invulnerable = 0;
    this.alive = true;
    this.moveSpeedMult = 1;
    Object.assign(this.weaponMods, defaultWeaponModifiers());
    this.sinceDamage = 0;
    this.regenTimer = 0;
  }

  get isInvulnerable(): boolean {
    return this.invulnerable > 0;
  }

  step(dt: number): void {
    if (!this.alive) return;
    if (this.invulnerable > 0) this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.sinceDamage += dt;
    if (this.shield < this.maxShield && this.sinceDamage >= this.regen.shieldRegenDelay) {
      this.regenTimer += dt;
      if (this.regenTimer >= this.regen.shieldRegenInterval) {
        this.regenTimer = 0;
        this.shield = Math.min(this.maxShield, this.shield + 1);
      }
    } else {
      this.regenTimer = 0;
    }
  }

  /** Applies damage unless invulnerable or dead. */
  applyDamage(amount: number): DamageOutcome {
    if (!this.alive || this.invulnerable > 0 || amount <= 0) return 'ignored';
    this.sinceDamage = 0;
    this.regenTimer = 0;
    this.invulnerable = this.config.invulnerabilityDuration;

    let remaining = amount;
    let outcome: DamageOutcome = 'shield';
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, remaining);
      this.shield -= absorbed;
      remaining -= absorbed;
    }
    if (remaining > 0) {
      outcome = 'health';
      this.health = Math.max(0, this.health - remaining);
      if (this.health <= 0) {
        this.alive = false;
        this.invulnerable = 0;
        return 'killed';
      }
    }
    return outcome;
  }
}
