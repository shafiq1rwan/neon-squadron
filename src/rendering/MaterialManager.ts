/**
 * Creates and owns the shared materials. Materials are created once and reused by every
 * mesh instance; per-object variation (tint, hit flash) uses per-mesh-instance parameters.
 */
import {
  BLENDEQUATION_ADD,
  BLENDMODE_ONE,
  BLENDMODE_ONE_MINUS_SRC_ALPHA,
  BlendState,
  CULLFACE_NONE,
  ShaderMaterial,
} from 'playcanvas';
import { gridShader, neonGlowShader, neonSolidShader, neonSpriteShader } from './NeonShaders';

/** Premultiplied alpha: additive where alpha = 0, "over" where alpha > 0. */
const PREMULTIPLIED = new BlendState(true, BLENDEQUATION_ADD, BLENDMODE_ONE, BLENDMODE_ONE_MINUS_SRC_ALPHA);

export class MaterialManager {
  readonly solid: ShaderMaterial;
  readonly glow: ShaderMaterial;
  readonly grid: ShaderMaterial;
  /** Batched sprites that respect depth (player shots, effects). */
  readonly sprite: ShaderMaterial;
  /** Batched sprites drawn on top of everything (enemy bullets must always be visible). */
  readonly spriteOverlay: ShaderMaterial;

  constructor() {
    this.solid = new ShaderMaterial(neonSolidShader);
    this.solid.cull = CULLFACE_NONE;
    this.solid.setParameter('uTint', [1, 1, 1]);
    this.solid.setParameter('uFlash', 0);
    this.solid.update();

    this.glow = new ShaderMaterial(neonGlowShader);
    this.glow.cull = CULLFACE_NONE;
    this.glow.blendState = BlendState.ADDBLEND;
    this.glow.depthWrite = false;
    this.glow.setParameter('uTint', [1, 1, 1]);
    this.glow.setParameter('uFlash', 0);
    this.glow.setParameter('uIntensity', 1);
    this.glow.update();

    this.grid = new ShaderMaterial(gridShader);
    this.grid.cull = CULLFACE_NONE;
    this.grid.update();

    this.sprite = this.createSpriteMaterial(true);
    this.spriteOverlay = this.createSpriteMaterial(false);
  }

  private createSpriteMaterial(depthTest: boolean): ShaderMaterial {
    const m = new ShaderMaterial(neonSpriteShader);
    m.cull = CULLFACE_NONE;
    m.blendState = PREMULTIPLIED;
    m.depthWrite = false;
    m.depthTest = depthTest;
    m.setParameter('uIntensity', 1);
    m.update();
    return m;
  }

  /** Global glow strength, driven by the quality profile. */
  setGlowIntensity(value: number): void {
    this.glow.setParameter('uIntensity', value);
  }

  destroy(): void {
    for (const m of [this.solid, this.glow, this.grid, this.sprite, this.spriteOverlay]) m.destroy();
  }
}
