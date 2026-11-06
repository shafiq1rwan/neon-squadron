/**
 * One draw call for many glowing quads (projectiles, particles, shockwaves).
 *
 * Owners call begin(), add() each visible sprite, then end(). Data is written straight into a
 * dynamic vertex buffer sized for `capacity` sprites; the static index buffer never changes and
 * only the primitive count is updated, so there are no per-frame allocations.
 */
import {
  BUFFER_DYNAMIC,
  BUFFER_STATIC,
  BoundingBox,
  Entity,
  INDEXFORMAT_UINT16,
  IndexBuffer,
  Mesh,
  MeshInstance,
  PRIMITIVE_TRIANGLES,
  SEMANTIC_COLOR,
  SEMANTIC_POSITION,
  SEMANTIC_TEXCOORD0,
  TYPE_FLOAT32,
  Vec3,
  VertexBuffer,
  VertexFormat,
  type AppBase,
  type Material,
} from 'playcanvas';
import type { SpriteShapeId } from './NeonShaders';

export class SpriteBatch {
  readonly entity: Entity;
  readonly capacity: number;
  private readonly vb: VertexBuffer;
  private readonly data: Float32Array;
  private readonly stride: number;
  private readonly posOffset: number;
  private readonly uvOffset: number;
  private readonly colorOffset: number;
  private readonly mesh: Mesh;
  private readonly instance: MeshInstance;
  private countValue = 0;

  constructor(app: AppBase, name: string, capacity: number, material: Material, layerId: number) {
    const device = app.graphicsDevice;
    this.capacity = Math.min(capacity, 16000); // 4 vertices each must fit 16-bit indices
    const format = new VertexFormat(device, [
      { semantic: SEMANTIC_POSITION, components: 3, type: TYPE_FLOAT32 },
      { semantic: SEMANTIC_TEXCOORD0, components: 4, type: TYPE_FLOAT32 },
      { semantic: SEMANTIC_COLOR, components: 4, type: TYPE_FLOAT32 },
    ]);
    // Read real offsets from the format rather than assuming a packing.
    const offsetOf = (semantic: string) => {
      const el = format.elements.find((e) => e.name === semantic);
      if (!el) throw new Error(`SpriteBatch: missing ${semantic}`);
      return el.offset / 4;
    };
    this.stride = format.size / 4;
    this.posOffset = offsetOf(SEMANTIC_POSITION);
    this.uvOffset = offsetOf(SEMANTIC_TEXCOORD0);
    this.colorOffset = offsetOf(SEMANTIC_COLOR);

    this.vb = new VertexBuffer(device, format, this.capacity * 4, { usage: BUFFER_DYNAMIC });
    this.data = new Float32Array(this.vb.lock() as ArrayBuffer);

    const indices = new Uint16Array(this.capacity * 6);
    for (let i = 0; i < this.capacity; i++) {
      const v = i * 4;
      indices.set([v, v + 1, v + 2, v, v + 2, v + 3], i * 6);
    }
    const ib = new IndexBuffer(device, INDEXFORMAT_UINT16, indices.length, BUFFER_STATIC, indices);

    this.mesh = new Mesh(device);
    this.mesh.vertexBuffer = this.vb;
    this.mesh.indexBuffer[0] = ib;
    this.mesh.primitive[0] = { type: PRIMITIVE_TRIANGLES, base: 0, baseVertex: 0, count: 0, indexed: true };
    this.mesh.aabb = new BoundingBox(new Vec3(0, 0, 0), new Vec3(500, 500, 500));

    this.instance = new MeshInstance(this.mesh, material);
    this.instance.cull = false;
    this.instance.visible = false;
    this.entity = new Entity(name);
    this.entity.addComponent('render', {
      meshInstances: [this.instance],
      layers: [layerId],
      castShadows: false,
      receiveShadows: false,
    });
    app.root.addChild(this.entity);
  }

  get count(): number {
    return this.countValue;
  }

  get isFull(): boolean {
    return this.countValue >= this.capacity;
  }

  begin(): void {
    this.countValue = 0;
  }

  /**
   * Adds a quad lying in the gameplay plane.
   * @param x,y   centre on the gameplay plane
   * @param h     height above the plane
   * @param dx,dy unit direction of the sprite's long axis
   * @param length,width full size in world units
   */
  add(
    x: number,
    y: number,
    h: number,
    dx: number,
    dy: number,
    length: number,
    width: number,
    r: number,
    g: number,
    b: number,
    a: number,
    shape: SpriteShapeId,
  ): void {
    if (this.countValue >= this.capacity) return;
    const hl = length * 0.5;
    const hw = width * 0.5;
    // Long axis (dx, dy) and perpendicular (-dy, dx) in gameplay space.
    const ax = dx * hl;
    const ay = dy * hl;
    const px = -dy * hw;
    const py = dx * hw;
    const aspect = width > 1e-6 ? length / width : 1;
    const d = this.data;
    let o = this.countValue * 4 * this.stride;
    // Corners: (-L,-W), (+L,-W), (+L,+W), (-L,+W) with matching uvs.
    for (let c = 0; c < 4; c++) {
      const su = c === 0 || c === 3 ? -1 : 1;
      const sv = c < 2 ? -1 : 1;
      const gx = x + ax * su + px * sv;
      const gy = y + ay * su + py * sv;
      const p = o + this.posOffset;
      d[p] = gx;
      d[p + 1] = h;
      d[p + 2] = -gy;
      const u = o + this.uvOffset;
      d[u] = su;
      d[u + 1] = sv;
      d[u + 2] = shape;
      d[u + 3] = aspect;
      const col = o + this.colorOffset;
      d[col] = r;
      d[col + 1] = g;
      d[col + 2] = b;
      d[col + 3] = a;
      o += this.stride;
    }
    this.countValue++;
  }

  end(): void {
    this.instance.visible = this.countValue > 0;
    this.mesh.primitive[0]!.count = this.countValue * 6;
    if (this.countValue > 0) this.vb.unlock();
  }

  destroy(): void {
    this.entity.destroy();
  }
}
