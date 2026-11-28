/**
 * The portal's smoke: a full-screen WebGL fragment shader (original art).
 * A nebula of domain-warped fractal noise (fbm) in three depth layers, twisting into a vortex at the
 * centre, fading softly into the night sky (vignette, thinner toward the skyline). On top: a soft energy
 * ring (bloom), a highlight boost on the brightest wisps, and a noisy "curtain" (uPart) that opens from
 * the centre. The camera can push in (uZoom) and fly through the layers (uDive).
 * Output is premultiplied alpha, so wherever the smoke is thin or parted the page underneath shows.
 * Rendered at a fraction of CSS resolution; the browser's bilinear upscale keeps it soft.
 */
export type SmokeFrame = {
  time: number; // seconds
  cx: number; cy: number; // vortex centre, CSS px
  ring: number; ringA: number; // energy ring radius (CSS px) and strength
  twist: number; // accumulated swirl angle
  bright: number; // 0..1 (hover)
  zoom: number; // camera push into the centre (1 = at rest)
  dive: number; // travel through the layers (~1 per layer)
  cover: number; // 0..1: vignette/skyline fade off, smoke fully opaque (during the dive)
  burst: number; // 0..1: the smoke spreading out from the centre, 1 = everywhere (the intro always uses 1)
  part: number; // 0..1 curtain opening
};

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const frag = (oct: number) => `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes; uniform float uScale; uniform vec2 uC; uniform vec2 uRing;
uniform float uTime, uTwist, uBright, uZoom, uDive, uCover, uBurst, uPart;

float hash(vec2 p){ p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < ${oct}; i++) { v += a * noise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + vec2(3.1, 1.7); a *= 0.5; }
  return v;
}
vec3 palette(float f, float hot){
  vec3 navy = vec3(0.03, 0.035, 0.11), indigo = vec3(0.26, 0.30, 0.74), violet = vec3(0.42, 0.18, 0.84);
  vec3 magenta = vec3(0.75, 0.29, 0.85), wisp = vec3(0.98, 0.86, 1.0);
  vec3 c = mix(navy, indigo, smoothstep(0.3, 0.52, f));
  c = mix(c, violet, smoothstep(0.47, 0.66, f));
  c = mix(c, magenta, smoothstep(0.64, 0.84, f) * 0.45);
  return mix(c, wisp, smoothstep(0.76, 0.96, f) * hot);
}
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y * uScale - gl_FragCoord.y) / uScale; // CSS px, y down
  float m = min(uRes.x, uRes.y);
  vec2 uv0 = (px - uC) / m;
  vec2 uv = uv0 / uZoom; // the camera pushes into the centre
  float r = length(uv), ang = atan(uv.y, uv.x);
  float r0 = length(uv0);
  float hot = exp(-r0 * 3.2) * (1.0 - 0.5 * uCover); // pinned to the screen: does not balloon as the camera pushes in

  vec3 col = vec3(0.025, 0.025, 0.08);
  float dens = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float z = uDive + fi + 0.35;
    float d = 3.0 - mod(z, 3.0); // depth: 3 = far, 0 = at the camera
    float la = smoothstep(0.05, 0.75, d) * (1.0 - smoothstep(2.3, 3.0, d));
    float seed = floor(z / 3.0) * 17.3 + fi * 5.7;
    float aa = ang + uTwist * (0.75 + 0.22 * fi) + 0.7 / (r + 0.2); // the vortex: tighter toward the centre
    vec2 p = vec2(cos(aa), sin(aa)) * r * (1.25 + d * 1.1);
    p.x += sign(uv.x) * uPart * 2.0; // smoke pushed aside as it parts
    p += vec2(seed, seed * 0.37);
    float t = uTime * (0.1 + 0.03 * fi);
    vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
    float f = fbm(p + 2.6 * q + vec2(t * 0.6, -t * 0.4));
    vec3 c = palette(f, 0.3 + 0.7 * hot) * (0.55 + uBright * 0.45 + hot * 0.7);
    float k = smoothstep(0.24, 0.74, f) * la;
    col = mix(col, c, k);
    dens = max(dens, k);
  }
  col += vec3(0.48, 0.34, 0.95) * exp(-r0 * 7.0) * (0.22 + uBright * 0.35) * (1.0 - 0.6 * uCover); // light through the vortex
  // bloom: the brightest wisps glow a little beyond themselves
  float lum = dot(col, vec3(0.3, 0.5, 0.2));
  col += col * smoothstep(0.38, 0.9, lum) * 0.4;

  // soft edges: vignette into the night sky and thinner smoke over the skyline (both gone during the dive)
  vec2 sq = px / uRes - 0.5;
  float vig = 1.0 - smoothstep(0.32, 0.78, length(sq * vec2(1.0, 1.15)));
  float sky = 1.0 - smoothstep(0.62, 0.98, px.y / uRes.y) * 0.8;
  float a = mix(0.5, 1.0, dens) * mix(vig * sky, 1.0, uCover);
  a = mix(a, 1.0, uCover);

  // the energy ring: a thin hot core with a wide soft bloom
  float rd = (length(uv0) - uRing.x / m);
  float core = exp(-pow(rd / 0.0045, 2.0)), bloom = exp(-pow(rd / 0.07, 2.0));
  vec3 ringCol = mix(vec3(0.55, 0.26, 0.92), vec3(0.86, 0.45, 1.0), 0.5 + 0.5 * sin(ang * 3.0 + uTime * 1.5));
  float ra = uRing.y * (core * 0.5 + bloom * (0.2 + uBright * 0.25));
  col += ringCol * ra;
  a = max(a, min(1.0, ra));

  // short version: the smoke spreads out from the centre
  if (uBurst < 1.0) a *= 1.0 - smoothstep(uBurst * 1.3 - 0.12, uBurst * 1.3 + 0.12, length(uv0) + (fbm(uv0 * 4.0 + uTime) - 0.5) * 0.3);
  // the curtain: opens from the centre, wider than tall, with a smoky edge
  if (uPart > 0.0) {
    float pn = fbm(uv0 * 3.5 + vec2(uTime * 0.5, -uTime * 0.3));
    float open = uPart * 1.8 - 0.12;
    a *= smoothstep(open - 0.14, open + 0.14, length(uv0 * vec2(0.62, 1.3)) + (pn - 0.5) * 0.42);
  }
  gl_FragColor = vec4(col * a, a);
}`;

/** `still`: one frame that must stay on screen (reduced motion), so the drawing buffer is kept. */
export function createSmoke(canvas: HTMLCanvasElement, scale: number, octaves: number, still = false) {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false, depth: false, stencil: false, powerPreference: "high-performance", preserveDrawingBuffer: still });
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, frag(octaves));
  if (!vs || !fs) return null;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // one big triangle
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const u = { res: U("uRes"), scale: U("uScale"), c: U("uC"), ring: U("uRing"), time: U("uTime"), twist: U("uTwist"), bright: U("uBright"), zoom: U("uZoom"), dive: U("uDive"), cover: U("uCover"), burst: U("uBurst"), part: U("uPart") };
  let W = 0, H = 0;

  return {
    resize(w: number, h: number) {
      W = w;
      H = h;
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    render(f: SmokeFrame) {
      gl.uniform2f(u.res, W, H);
      gl.uniform1f(u.scale, canvas.width / Math.max(1, W));
      gl.uniform2f(u.c, f.cx, f.cy);
      gl.uniform2f(u.ring, f.ring, f.ringA);
      gl.uniform1f(u.time, f.time);
      gl.uniform1f(u.twist, f.twist);
      gl.uniform1f(u.bright, f.bright);
      gl.uniform1f(u.zoom, f.zoom);
      gl.uniform1f(u.dive, f.dive);
      gl.uniform1f(u.cover, f.cover);
      gl.uniform1f(u.burst, f.burst);
      gl.uniform1f(u.part, f.part);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
export type Smoke = NonNullable<ReturnType<typeof createSmoke>>;
