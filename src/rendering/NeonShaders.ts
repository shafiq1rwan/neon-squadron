/**
 * GLSL sources for the game's custom materials (WebGL2).
 *
 * Colours are authored in sRGB (vertex colours / uniforms). Fragment shaders convert with
 * decodeGamma() + gammaCorrectOutput() from the engine's "gammaPS" chunk so output is correct
 * whatever gamma mode the camera uses.
 */
import { SEMANTIC_COLOR, SEMANTIC_POSITION, SEMANTIC_TEXCOORD0, type ShaderMaterial } from 'playcanvas';

/** PlayCanvas does not export ShaderDesc by name; derive it from the constructor. */
export type ShaderDesc = NonNullable<ConstructorParameters<typeof ShaderMaterial>[0]>;

const vertexColoredVS = /* glsl */ `
  attribute vec3 vertex_position;
  attribute vec4 vertex_color;

  uniform mat4 matrix_model;
  uniform mat4 matrix_viewProjection;

  varying vec4 vColor;

  void main(void) {
    vColor = vertex_color;
    gl_Position = matrix_viewProjection * matrix_model * vec4(vertex_position, 1.0);
  }
`;

/** Opaque faceted body: baked shading in vertex colours, optional tint and hit flash. */
export const neonSolidShader: ShaderDesc = {
  uniqueName: 'neon-solid',
  attributes: { vertex_position: SEMANTIC_POSITION, vertex_color: SEMANTIC_COLOR },
  vertexGLSL: vertexColoredVS,
  fragmentGLSL: /* glsl */ `
    #include "gammaPS"
    precision highp float;

    uniform vec3 uTint;
    uniform float uFlash;

    varying vec4 vColor;

    void main(void) {
      vec3 c = mix(vColor.rgb * uTint, vec3(1.0), clamp(uFlash, 0.0, 1.0));
      gl_FragColor = vec4(gammaCorrectOutput(decodeGamma(c)), 1.0);
    }
  `,
};

/** Additive neon lines and halos. Vertex alpha shapes the falloff; output is premultiplied. */
export const neonGlowShader: ShaderDesc = {
  uniqueName: 'neon-glow',
  attributes: { vertex_position: SEMANTIC_POSITION, vertex_color: SEMANTIC_COLOR },
  vertexGLSL: vertexColoredVS,
  fragmentGLSL: /* glsl */ `
    #include "gammaPS"
    precision highp float;

    uniform vec3 uTint;
    uniform float uFlash;
    uniform float uIntensity;

    varying vec4 vColor;

    void main(void) {
      vec3 c = mix(vColor.rgb * uTint, vec3(1.0), clamp(uFlash, 0.0, 1.0) * 0.7);
      float a = clamp(vColor.a * uIntensity, 0.0, 1.0);
      gl_FragColor = vec4(gammaCorrectOutput(decodeGamma(c)) * a, a);
    }
  `,
};

/**
 * Batched glowing sprites (projectiles, particles, rings). Each quad lies in the gameplay
 * plane; uv.xy spans -1..1, uv.z selects the shape and uv.w is the length/width aspect.
 * Output is premultiplied: additive shapes write alpha 0, the enemy orb writes alpha for a
 * dark rim so hostile bullets stay readable on top of bright effects.
 */
export const SpriteShape = {
  Bolt: 0,
  Dot: 1,
  Ring: 2,
  EnemyOrb: 3,
} as const;
export type SpriteShapeId = (typeof SpriteShape)[keyof typeof SpriteShape];

export const neonSpriteShader: ShaderDesc = {
  uniqueName: 'neon-sprite',
  attributes: {
    vertex_position: SEMANTIC_POSITION,
    vertex_texCoord0: SEMANTIC_TEXCOORD0,
    vertex_color: SEMANTIC_COLOR,
  },
  vertexGLSL: /* glsl */ `
    attribute vec3 vertex_position;
    attribute vec4 vertex_texCoord0;
    attribute vec4 vertex_color;

    uniform mat4 matrix_model;
    uniform mat4 matrix_viewProjection;

    varying vec4 vUv;
    varying vec4 vColor;

    void main(void) {
      vUv = vertex_texCoord0;
      vColor = vertex_color;
      gl_Position = matrix_viewProjection * matrix_model * vec4(vertex_position, 1.0);
    }
  `,
  fragmentGLSL: /* glsl */ `
    #include "gammaPS"
    precision highp float;

    uniform float uIntensity;

    varying vec4 vUv;
    varying vec4 vColor;

    // Distance from a capsule's centre segment, in half-width units.
    float capsule(vec2 p, float aspect) {
      float x = max(abs(p.x) * aspect - (aspect - 1.0), 0.0);
      return length(vec2(x, p.y));
    }

    void main(void) {
      vec2 p = vUv.xy;
      float shape = vUv.z;
      float aspect = max(vUv.w, 1.0);
      vec3 col = vColor.rgb;
      float a = vColor.a;
      vec3 outC = vec3(0.0);
      float outA = 0.0;

      if (shape < 0.5) {
        // Bolt: white-hot core inside a coloured halo.
        float d = capsule(p, aspect);
        float core = 1.0 - smoothstep(0.2, 0.45, d);
        float halo = exp(-d * d * 3.0) * (1.0 - smoothstep(0.75, 1.0, d));
        outC = (mix(col, vec3(1.0), 0.7) * core + col * halo * 0.85) * a * uIntensity;
      } else if (shape < 1.5) {
        // Soft dot (sparks, flashes).
        float d = length(p);
        float g = exp(-d * d * 4.5) * (1.0 - smoothstep(0.8, 1.0, d));
        outC = mix(col, vec3(1.0), 0.35 * g) * g * a * uIntensity;
      } else if (shape < 2.5) {
        // Expanding shockwave ring.
        float d = length(p);
        float r = exp(-pow((d - 0.8) * 8.0, 2.0)) * (1.0 - smoothstep(0.95, 1.0, d));
        outC = col * r * a * uIntensity;
      } else {
        // Enemy orb: dark rim (occludes), coloured body, white core.
        float d = capsule(p, aspect);
        float body = 1.0 - smoothstep(0.55, 0.68, d);
        float rim = 1.0 - smoothstep(0.68, 0.95, d);
        float core = 1.0 - smoothstep(0.12, 0.38, d);
        vec3 c = mix(col, vec3(1.0), core * 0.9);
        outC = c * body * a;
        outA = rim * 0.8 * a;
      }

      gl_FragColor = vec4(gammaCorrectOutput(decodeGamma(outC)), outA);
    }
  `,
};

/**
 * Infinite scrolling floor grid. Lines are anti-aliased with screen-space derivatives,
 * the far edge fades into the background, and the combat lane edges get soft rails.
 */
export const gridShader: ShaderDesc = {
  uniqueName: 'neon-grid',
  attributes: { vertex_position: SEMANTIC_POSITION },
  vertexGLSL: /* glsl */ `
    attribute vec3 vertex_position;

    uniform mat4 matrix_model;
    uniform mat4 matrix_viewProjection;

    varying vec3 vWorld;

    void main(void) {
      vec4 world = matrix_model * vec4(vertex_position, 1.0);
      vWorld = world.xyz;
      gl_Position = matrix_viewProjection * world;
    }
  `,
  fragmentGLSL: /* glsl */ `
    #include "gammaPS"
    precision highp float;

    uniform float uScroll;        // distance travelled (world units)
    uniform float uTime;          // seconds, for the subtle pulse
    uniform float uCell;          // minor cell size
    uniform float uMajorEvery;    // minor cells per major cell
    uniform vec3 uBg;
    uniform vec3 uMinor;
    uniform vec3 uMajor;
    uniform vec3 uRail;
    uniform vec4 uFade;           // x: far fade start z, y: far fade end z, z: near fade start z, w: near fade end z
    uniform float uLaneHalfWidth; // combat lane half width (world x)
    uniform float uIntensity;

    varying vec3 vWorld;

    float gridLine(vec2 coord, float widthPx) {
      vec2 d = fwidth(coord);
      vec2 g = abs(fract(coord - 0.5) - 0.5) / max(d, vec2(1e-5));
      float line = min(g.x, g.y);
      return 1.0 - clamp(line - widthPx * 0.5 + 0.5, 0.0, 1.0);
    }

    void main(void) {
      // The grid moves towards the camera (+z) as the squadron flies forward.
      vec2 p = vec2(vWorld.x, vWorld.z - uScroll);

      float minor = gridLine(p / uCell, 1.0);
      float major = gridLine(p / (uCell * uMajorEvery), 1.6);

      // Distance fades.
      // (smoothstep edges must be ascending; far edge is more negative z.)
      float far = smoothstep(uFade.y, uFade.x, vWorld.z);
      float near = 1.0 - smoothstep(uFade.z, uFade.w, vWorld.z);
      float fade = far * near;

      // Outside the combat lane the grid is dimmer so decoration never competes with combat.
      float lane = 1.0 - smoothstep(uLaneHalfWidth, uLaneHalfWidth + 6.0, abs(vWorld.x));
      float sideDim = mix(0.45, 1.0, lane);

      // Soft rails marking the lane edges.
      float railDist = abs(abs(vWorld.x) - uLaneHalfWidth);
      float rail = exp(-railDist * railDist * 10.0) * 0.3;

      // Slow travelling pulse along the major lines.
      float pulse = 0.75 + 0.25 * sin(p.y * 0.08 + uTime * 1.6);

      vec3 c = uBg;
      c = mix(c, uMinor, minor * 0.9 * sideDim);
      c = mix(c, uMajor, major * pulse * sideDim);
      c += uRail * rail * pulse;
      c = mix(uBg, c, fade * uIntensity);

      gl_FragColor = vec4(gammaCorrectOutput(decodeGamma(c)), 1.0);
    }
  `,
};
