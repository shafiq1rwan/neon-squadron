/**
 * Chooses and applies the graphics quality profile. Mobile devices start conservatively.
 * The current profile drives render resolution (device pixel ratio cap) and glow strength;
 * later phases extend it with bloom, particle budgets and adaptive switching.
 */
import type { GraphicsDevice } from 'playcanvas';
import { GameConfig, type QualityLevel, type QualityProfile } from '../app/GameConfig';
import type { MaterialManager } from './MaterialManager';

export function isLikelyMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const small = Math.min(window.screen?.width ?? 1920, window.screen?.height ?? 1080) < 820;
  return coarse && small;
}

export function defaultQualityLevel(): QualityLevel {
  return isLikelyMobile() ? 'medium' : 'high';
}

export class QualityManager {
  private levelValue: QualityLevel;
  private readonly device: GraphicsDevice;
  private readonly materials: MaterialManager;

  constructor(device: GraphicsDevice, materials: MaterialManager, level: QualityLevel) {
    this.device = device;
    this.materials = materials;
    this.levelValue = level;
    this.apply();
  }

  get level(): QualityLevel {
    return this.levelValue;
  }

  get profile(): QualityProfile {
    return GameConfig.quality[this.levelValue];
  }

  /** Ratio between the backbuffer resolution and the CSS pixel size of the canvas. */
  get renderScale(): number {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    return Math.min(dpr, this.profile.maxPixelRatio);
  }

  setLevel(level: QualityLevel): void {
    if (level === this.levelValue) return;
    this.levelValue = level;
    this.apply();
  }

  private apply(): void {
    this.device.maxPixelRatio = this.renderScale;
    this.materials.setGlowIntensity(this.profile.glowIntensity);
  }
}
