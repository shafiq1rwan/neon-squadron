# Credits and third-party notices

Neon Squadron's game code, sprites (the `art/*.px.js` sources and the atlases built from them in `public/assets/`),
level design and sound effects are original to this project. It uses or includes the following third-party work.

## Bundled in the game

**Phaser 3** (v3.90): game framework, bundled into the build.
MIT License. https://github.com/phaserjs/phaser

**pixelfx** by Patch: the visual effects in `public/assets/fx/` (explosions, hit sparks, pickup bursts, level-up,
EMP, shield bubble and shield block) are rendered from pixelfx effects by `scripts/export-fx.mjs`, recoloured and
downscaled for this game.
MIT License, Copyright (c) 2026 Patch, Copyright (c) 2026 Hugo Duprez. https://github.com/patch-gg/pixelfx
pixelfx in turn adapts Sprite Fusion's open-source pixel art VFX (https://www.spritefusion.com/pixel-art-vfx),
Copyright (c) 2026 Hugo Duprez, MIT License, and ideas from Hollow Crown
(https://github.com/rehan-remade/hollow-crown), Copyright (c) 2026 rehan-remade, MIT License.

**Silkscreen** font (`public/fonts/`): Copyright 2001 The Silkscreen Project Authors
(https://github.com/googlefonts/silkscreen). Licensed under the SIL Open Font License 1.1, included as
`public/fonts/OFL.txt`.

## Loaded at runtime (not bundled)

**Poki SDK** (`https://game-cdn.poki.com/scripts/v2/poki-sdk.js`): ads and platform events on Poki.

## Development tools

**pxl / claude-pxl** by crsolver: the pixel-art DSL all sprites are written in. MIT License, Copyright (c) 2026
crsolver. https://github.com/crsolver/claude-pxl

**pixelfx** (see above) is also used as a Claude Code skill (`.claude/skills/pixelfx`, MIT).

**Vite**, **TypeScript** and **Playwright** (playwright-core, for `npm run audit`) are build and test tools.

## Permissive license text (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
