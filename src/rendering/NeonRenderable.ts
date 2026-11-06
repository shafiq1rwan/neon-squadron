/**
 * Wraps a cached neon mesh pair in an entity with its own MeshInstances, so per-object
 * parameters (tint, hit flash) can change without touching the shared materials.
 */
import { Entity, MeshInstance } from 'playcanvas';
import type { MaterialManager } from './MaterialManager';
import type { NeonMeshPair } from './ProceduralMeshCache';

export class NeonRenderable {
  readonly entity: Entity;
  private readonly instances: MeshInstance[] = [];
  private flash = 0;

  constructor(name: string, meshes: NeonMeshPair, materials: MaterialManager) {
    this.entity = new Entity(name);
    if (meshes.solid) this.instances.push(new MeshInstance(meshes.solid, materials.solid));
    if (meshes.glow) this.instances.push(new MeshInstance(meshes.glow, materials.glow));
    this.entity.addComponent('render', {
      meshInstances: this.instances,
      castShadows: false,
      receiveShadows: false,
    });
  }

  /** Multiplies the vertex colours (1,1,1 = authored colour). */
  setTint(r: number, g: number, b: number): void {
    for (const mi of this.instances) mi.setParameter('uTint', [r, g, b]);
  }

  /** 0..1 white flash, e.g. for hit feedback. Only re-uploads when the value changes. */
  setFlash(value: number): void {
    const v = Math.min(Math.max(value, 0), 1);
    if (Math.abs(v - this.flash) < 1e-3) return;
    this.flash = v;
    for (const mi of this.instances) mi.setParameter('uFlash', v);
  }

  destroy(): void {
    this.entity.destroy();
  }
}
