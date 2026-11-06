/**
 * Visual representation of the player aircraft. Interpolates between simulation states,
 * applies a visual-only bank when strafing and a gentle hover bob. Never affects collision.
 */
import { Entity, type AppBase } from 'playcanvas';
import { GameConfig } from '../app/GameConfig';
import { CameraManager } from '../rendering/CameraManager';
import type { MaterialManager } from '../rendering/MaterialManager';
import { NeonRenderable } from '../rendering/NeonRenderable';
import type { ProceduralMeshCache } from '../rendering/ProceduralMeshCache';
import { buildAircraftGeometry, designKey, PLAYER_DESIGN } from '../procedural/AircraftGenerator';
import type { PlayerController } from './PlayerController';

const RAD_TO_DEG = 180 / Math.PI;

export class PlayerRenderer {
  readonly root: Entity;
  private readonly visual: NeonRenderable;
  private bank = 0;

  constructor(app: AppBase, materials: MaterialManager, meshes: ProceduralMeshCache) {
    const design = PLAYER_DESIGN;
    const pair = meshes.getOrCreate(`aircraft:${designKey(design)}`, () =>
      buildAircraftGeometry(design, { viewDir: CameraManager.viewDirection() }),
    );
    this.root = new Entity('Player');
    this.visual = new NeonRenderable('PlayerVisual', pair, materials);
    const s = GameConfig.playerVisual.scale;
    this.visual.entity.setLocalScale(s, s, s);
    this.root.addChild(this.visual.entity);
    app.root.addChild(this.root);
  }

  /**
   * @param alpha interpolation factor between previous and current simulation step
   * @param frameDt real frame time, used only for visual smoothing
   * @param time simulation time for idle animation
   */
  render(player: PlayerController, alpha: number, frameDt: number, time: number): void {
    const x = player.previous.x + (player.position.x - player.previous.x) * alpha;
    const y = player.previous.y + (player.position.y - player.previous.y) * alpha;
    const vis = GameConfig.playerVisual;
    const bob = Math.sin(time * 2.4) * vis.bobAmplitude;
    this.root.setPosition(x, GameConfig.world.aircraftHeight + bob, -y);

    const lateral = player.velocity.x / player.maxSpeed;
    const targetBank = -Math.max(-1, Math.min(1, lateral)) * vis.maxBank;
    const k = 1 - Math.exp(-vis.bankResponse * frameDt);
    this.bank += (targetBank - this.bank) * k;
    // Slight nose pitch when moving forward/back adds weight to the motion.
    const pitch = (player.velocity.y / player.maxSpeed) * 0.12;
    this.visual.entity.setLocalEulerAngles(-pitch * RAD_TO_DEG, 0, this.bank * RAD_TO_DEG);
  }

  setFlash(value: number): void {
    this.visual.setFlash(value);
  }

  /** Hides the ship (death) or blinks it (invulnerability). Visual only. */
  setVisible(visible: boolean): void {
    if (this.visual.entity.enabled !== visible) this.visual.entity.enabled = visible;
  }

  destroy(): void {
    this.root.destroy();
  }
}
