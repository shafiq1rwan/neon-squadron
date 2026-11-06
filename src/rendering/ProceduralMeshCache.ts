/**
 * Converts procedural geometry buffers into GPU meshes once and shares them by key.
 * Entities reuse cached meshes through their own MeshInstances, so no geometry is ever
 * regenerated per frame or per spawn.
 */
import { Mesh, PRIMITIVE_TRIANGLES, type GraphicsDevice } from 'playcanvas';
import type { GeometryBuffers, NeonGeometryBuilder } from './NeonGeometryBuilder';

export interface NeonMeshPair {
  solid: Mesh | null;
  glow: Mesh | null;
}

export class ProceduralMeshCache {
  private readonly device: GraphicsDevice;
  private readonly cache = new Map<string, NeonMeshPair>();

  constructor(device: GraphicsDevice) {
    this.device = device;
  }

  get size(): number {
    return this.cache.size;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  /** Returns the cached meshes for `key`, building them with `build` on first use. */
  getOrCreate(key: string, build: () => NeonGeometryBuilder): NeonMeshPair {
    const existing = this.cache.get(key);
    if (existing) return existing;
    const builder = build();
    const pair: NeonMeshPair = {
      solid: this.toMesh(builder.solid),
      glow: this.toMesh(builder.glow),
    };
    // Shared meshes are reference-counted by the engine; hold a reference for the cache.
    pair.solid?.incRefCount();
    pair.glow?.incRefCount();
    this.cache.set(key, pair);
    return pair;
  }

  private toMesh(buf: GeometryBuffers): Mesh | null {
    if (buf.indices.length === 0) return null;
    const mesh = new Mesh(this.device);
    mesh.setPositions(buf.positions);
    mesh.setColors(buf.colors, 4);
    mesh.setIndices(buf.indices);
    mesh.update(PRIMITIVE_TRIANGLES);
    return mesh;
  }

  clear(): void {
    for (const pair of this.cache.values()) {
      for (const mesh of [pair.solid, pair.glow]) {
        if (!mesh) continue;
        mesh.decRefCount();
        if (mesh.refCount <= 0) mesh.destroy();
      }
    }
    this.cache.clear();
  }
}
