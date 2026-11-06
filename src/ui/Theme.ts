/**
 * Central design tokens. Every colour used by rendering or UI must come from here.
 * CSS custom properties are generated from these values at boot (see applyThemeToDocument),
 * so stylesheets reference var(--color-*) instead of duplicating hex codes.
 */

export const Palette = {
  bgPrimary: '#080C18',
  bgSecondary: '#111A2E',
  player: '#00E5FF',
  wingman: '#A855F7',
  enemy: '#FF365E',
  elite: '#FF00D4',
  projectile: '#00FFFF',
  legendary: '#FFB800',
  textPrimary: '#F2F6FF',
  textSecondary: '#92A4C0',
  // Supporting tones derived from the primary palette.
  gridMinor: '#16243F',
  gridMajor: '#1D6F8C',
  engineCore: '#E8FDFF',
  enemyCore: '#FFE1E8',
  shieldHit: '#7DF9FF',
  danger: '#FF365E',
  rarityCommon: '#00E5FF',
  rarityRare: '#3B82F6',
  rarityEpic: '#A855F7',
  rarityLegendary: '#FFB800',
} as const;

export type PaletteKey = keyof typeof Palette;

export const Typography = {
  display: "'Orbitron', 'Rajdhani', 'Segoe UI', system-ui, sans-serif",
  body: "'Rajdhani', 'Segoe UI', system-ui, sans-serif",
  numeric: "'Share Tech Mono', 'Consolas', ui-monospace, monospace",
} as const;

export const Spacing = {
  unit: 8,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Motion = {
  fast: 120,
  normal: 220,
  slow: 400,
} as const;

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Parses '#RRGGBB' into 0..1 sRGB components. */
export function hexToRgb(hex: string): RGB {
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`Invalid colour: ${hex}`);
  }
  const n = parseInt(clean, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

export function mixRgb(a: RGB, b: RGB, t: number): RGB {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}

function toKebab(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/** Publishes the design tokens as CSS custom properties on :root. */
export function applyThemeToDocument(doc: Document = document): void {
  const style = doc.documentElement.style;
  for (const [key, value] of Object.entries(Palette)) {
    style.setProperty(`--color-${toKebab(key)}`, value);
  }
  style.setProperty('--font-display', Typography.display);
  style.setProperty('--font-body', Typography.body);
  style.setProperty('--font-numeric', Typography.numeric);
  for (const [key, value] of Object.entries(Spacing)) {
    style.setProperty(`--space-${key}`, `${value}px`);
  }
  for (const [key, value] of Object.entries(Motion)) {
    style.setProperty(`--motion-${key}`, `${value}ms`);
  }
}
