/**
 * Deterministic scenery layout for environment chunks.
 *
 * A chunk's content depends only on (environment seed, chunk index), so chunks can be
 * generated in any order, recycled and regenerated identically. Props are always placed
 * outside the combat lane so scenery never hides projectiles.
 */
import { SeededRandom } from '../core/SeededRandom';

export const PropTypes = ['pillar', 'tower', 'pyramid', 'pad', 'arch'] as const;
export type PropType = (typeof PropTypes)[number];

export interface PropPlacement {
  type: PropType;
  /** Gameplay-plane x. */
  x: number;
  /** Position along the chunk (0..chunkLength). */
  along: number;
  /** Uniform scale variation. */
  scale: number;
  /** Uses the accent palette instead of the base palette. */
  accent: boolean;
}

export interface ChunkLayoutOptions {
  seed: string;
  chunkLength: number;
  /** Half width of the combat lane; props stay outside it. */
  laneHalfWidth: number;
  /** Clear gap between the lane edge and the nearest prop. */
  laneClearance: number;
  /** How far out from the lane props may be placed. */
  sideDepth: number;
  propCount: number;
}

const TYPE_WEIGHTS: Record<PropType, number> = {
  pillar: 4,
  tower: 2,
  pyramid: 2,
  pad: 2,
  arch: 1,
};

export function generateChunkLayout(index: number, opts: ChunkLayoutOptions): PropPlacement[] {
  const rng = new SeededRandom(`${opts.seed}/chunk/${index}`);
  const props: PropPlacement[] = [];
  const weights = PropTypes.map((t) => TYPE_WEIGHTS[t]);
  const minX = opts.laneHalfWidth + opts.laneClearance;
  const maxX = minX + opts.sideDepth;

  // Evenly spaced slots along the chunk with jitter, alternating sides, avoids clumping.
  const slots = Math.max(0, Math.floor(opts.propCount));
  for (let i = 0; i < slots; i++) {
    const type = PropTypes[rng.weightedIndex(weights)] as PropType;
    const side = i % 2 === 0 ? rng.sign() : -1 * (props[i - 1] ? Math.sign(props[i - 1]!.x) : 1);
    const slotLength = opts.chunkLength / slots;
    const along = (i + rng.range(0.15, 0.85)) * slotLength;
    // Arches straddle nothing; they sit at the outer edge to frame the lane.
    const distance = type === 'arch' ? rng.range(0.1, 0.4) : rng.range(0, 1) ** 1.4;
    const x = side * (minX + distance * (maxX - minX));
    props.push({
      type,
      x,
      along,
      scale: rng.range(0.75, 1.25),
      accent: rng.chance(0.18),
    });
  }
  return props;
}
