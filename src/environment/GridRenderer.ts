/**
 * Infinite scrolling floor grid drawn as one large quad with a procedural shader.
 * Scrolling is a single uniform update per frame — no geometry moves.
 */
import { Entity, Mesh, MeshInstance, PRIMITIVE_TRIANGLES, type AppBase } from 'playcanvas';
import { GameConfig } from '../app/GameConfig';
import type { MaterialManager } from '../rendering/MaterialManager';
import type { Rect } from '../rendering/WorldSpace';
import { hexToRgb, Palette } from '../ui/Theme';

const rgbArray = (hex: string): number[] => {
  const c = hexToRgb(hex);
  return [c.r, c.g, c.b];
};

export class GridRenderer {
  readonly entity: Entity;
  private readonly instance: MeshInstance;

  constructor(app: AppBase, materials: MaterialManager) {
    const env = GameConfig.environment;
    const y = -GameConfig.world.floorDepth;

    // Generous fixed extents: off-screen pixels cost nothing, and the camera never moves.
    const halfW = 160;
    const zFar = -260;
    const zNear = 80;
    const mesh = new Mesh(app.graphicsDevice);
    mesh.setPositions([-halfW, y, zNear, halfW, y, zNear, halfW, y, zFar, -halfW, y, zFar]);
    mesh.setIndices([0, 1, 2, 0, 2, 3]);
    mesh.update(PRIMITIVE_TRIANGLES);

    this.instance = new MeshInstance(mesh, materials.grid);
    this.entity = new Entity('FloorGrid');
    this.entity.addComponent('render', {
      meshInstances: [this.instance],
      castShadows: false,
      receiveShadows: false,
    });
    app.root.addChild(this.entity);

    const mi = this.instance;
    mi.setParameter('uCell', env.gridMinorCell);
    mi.setParameter('uMajorEvery', env.gridMajorEvery);
    mi.setParameter('uBg', rgbArray(Palette.bgPrimary));
    mi.setParameter('uMinor', rgbArray(Palette.gridMinor));
    mi.setParameter('uMajor', rgbArray(Palette.gridMajor));
    mi.setParameter('uRail', rgbArray(Palette.player));
    mi.setParameter('uLaneHalfWidth', GameConfig.world.combatWidth / 2);
    mi.setParameter('uIntensity', 1);
    mi.setParameter('uScroll', 0);
    mi.setParameter('uTime', 0);
    mi.setParameter('uFade', [-40, -80, 200, 300]);
  }

  /** Fades the far edge into the background based on what the camera can see. */
  updateFade(visibleFloor: Rect): void {
    const top = visibleFloor.maxY;
    const bottom = visibleFloor.minY;
    // World z = -gameplay y. Far fade from 60% of the view to just past the top edge.
    const farStart = -(bottom + (top - bottom) * 0.55);
    const farEnd = -(top + 2);
    this.instance.setParameter('uFade', [farStart, farEnd, 200, 300]);
  }

  update(distance: number, time: number): void {
    this.instance.setParameter('uScroll', distance);
    this.instance.setParameter('uTime', time);
  }
}
