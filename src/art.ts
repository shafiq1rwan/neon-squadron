import Phaser from "phaser";

// Frames live in several atlases (atlas, atlas_planets, atlas_ui) plus the generated "bank" texture
// (rolled ship frames, named "<frame>@1" / "<frame>@2"). This resolves a frame name to its texture.

export const ATLASES = ["atlas", "atlas_planets", "atlas_ui", "atlas_ground", "atlas_deco", "atlas_p4", "atlas_p5"] as const;
const where = new Map<string, string>();

export const Art = {
  /** Call once after loading. Later atlases don't override earlier ones. */
  index(textures: Phaser.Textures.TextureManager) {
    for (const key of [...ATLASES, "bank"]) {
      if (!textures.exists(key)) continue;
      for (const f of textures.get(key).getFrameNames()) if (!where.has(f)) where.set(f, key);
    }
  },
  key(frame: string): string {
    return where.get(frame) ?? "atlas";
  },
  has(frame: string): boolean {
    return where.has(frame);
  },
  /** Point a sprite or image at a frame, whichever texture it lives in. */
  set<T extends Phaser.GameObjects.Sprite | Phaser.GameObjects.Image>(obj: T, frame: string): T {
    const key = Art.key(frame);
    if (obj.texture.key !== key) obj.setTexture(key, frame);
    else obj.setFrame(frame);
    return obj;
  },
};
