import { LOGO_LETTERS, LOGO_X } from "@/components/brand/logo-paths";
import { drawMicrobot, loadMicrobotSprite } from "@/components/effects/microbot-sprite";
import { createSmoke, type Smoke } from "./smoke-gl";

/**
 * The intro: "HELLO." → microbots assemble SYNAXIS and lock into the crisp logo, a full-screen smoke
 * nebula churns behind it inside a soft energy ring → (Enter) → the logo bursts into microbots that are
 * sucked into the vortex, the camera pushes in with speed streaks, Baymax (with Hiro on his back) flies out
 * of the vortex and past the camera, and the smoke parts onto the real hero. One continuous sequence.
 *
 * Layers (back to front): shell (night sky, lanterns, skyline) · smoke (WebGL ./smoke-gl.ts, or the CSS
 * fallback) · this 2D canvas (dust, orbiting bots, logo, streaks, Baymax) · DOM text and the Enter button.
 * - The mouse breaks bots off the formed logo near the cursor (a soft hole opens in the solid logo); they
 *   spring back. A tap sends a ripple through it.
 * - Reduced motion: a still frame, then a crossfade. No WebGL, or too slow → layered CSS gradients.
 * Time only advances while the tab is visible. All moves use expo/quint/cubic curves.
 */
export type SceneMode = "full" | "reduced";
export type SceneLayout = { cx: number; cy: number; ring: number; heuserTop: number; logoTop: number; logoBottom: number; logoCy: number; logoW: number; subTop: number; btnCy: number; phone: boolean };
export type SceneEvents = {
  /** 1 HELLO fades (bots arriving) · 2 Heuser mark · 3 subtitle · 4 Enter ready */
  stage(n: 1 | 2 | 3 | 4): void;
  layout(l: SceneLayout): void;
  /** the smoke now covers the screen (or the crossfade starts): start the hero entrance, drop the cover */
  open(x: number, y: number): void;
  done(): void;
};

type Bot = { sx: number; sy: number; tx: number; ty: number; c: string; delay: number; dock: number; len: number; ox: number; oy: number; vx: number; vy: number; fx: number; fy: number; fa: number; fl: number; lag: number };
type Orbiter = { a: number; w: number; dr: number; len: number; sx: number; sy: number; lag: number; c: string };
type Dust = { x: number; y: number; z: number; vx: number; vy: number };
type Streak = { a: number; d: number; w: number };

// assemble (ms from mount)
const A = { pour: 650, pourDur: 1500, lock: 2150, lockDur: 380, shimmer: 700, hello: 800, brand: 1900, sub: 2350, ready: 2650, ring: 900, ringDur: 1300, smokeDur: 1400 };
// dive (ms after Enter): ≈ 2.7 s, unhurried enough to read: a longer push-in and Baymax pass, then a slower parting
const D = { burst: 1100, zoom: 2050, ring: 1300, cover: 250, coverDur: 1000, baymax: 250, baymaxDur: 1700, open: 1530, part: 1650, partDur: 1050 };
const FADE = 480; // reduced motion / skip crossfade
const SLOW_MS = 28; // average frame time over the first smoke frames above which the CSS smoke takes over

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const outCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const outQuint = (x: number) => 1 - Math.pow(1 - clamp(x), 5);
const inQuint = (x: number) => Math.pow(clamp(x), 5);
const inCubic = (x: number) => Math.pow(clamp(x), 3);
const inExpo = (x: number) => (clamp(x) === 0 ? 0 : Math.pow(2, 10 * clamp(x) - 10));
const inOutCubic = (x: number) => { x = clamp(x); return x < 0.5 ? 4 * x ** 3 : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerpAngle = (a: number, b: number, t: number) => { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; };
const grid = (v: number) => Math.round(v / 8) * 8;

/** Soft glowing dot (dust, thruster glow). */
function glowSprite(inner: string, mid: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, inner);
  g.addColorStop(0.3, mid);
  g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 32, 32);
  return c;
}

export function createIntroScene(opts: {
  canvas: HTMLCanvasElement; glCanvas: HTMLCanvasElement; fallback: HTMLElement; root: HTMLElement; shell: HTMLElement;
  mode: SceneMode; baymaxSrc: string; forceCss?: boolean; ev: SceneEvents;
}) {
  const { canvas: cv, glCanvas, fallback, root, shell, mode, ev } = opts;
  const ctx = cv.getContext("2d")!;
  const reduced = mode === "reduced";
  const phone = innerWidth < 640;
  loadMicrobotSprite();
  const dustDot = glowSprite("rgba(255,244,255,1)", "rgba(214,170,255,.5)");
  const fireDot = glowSprite("rgba(255,250,230,1)", "rgba(255,170,80,.6)");
  const baymax = new Image();
  baymax.decoding = "async";
  if (mode === "full") baymax.src = opts.baymaxSrc;

  // smoke: WebGL unless unavailable (or forced off); a slow device switches to the CSS smoke after its first frames
  let smoke: Smoke | null = opts.forceCss ? null : createSmoke(glCanvas, phone ? 0.4 : 0.5, phone ? 4 : 5, reduced);
  const switchToCss = () => {
    smoke?.destroy();
    smoke = null;
    glCanvas.style.display = "none";
    fallback.style.display = "block";
  };
  if (!smoke) switchToCss();
  let perfN = 0, perfSum = 0, smokeDirty = true;

  let W = 0, H = 0, dpr = 1, raf = 0, last = 0;
  let clock = reduced ? A.ready + 400 : 0;
  let actAt = -1, skipAt = -1, openAt = -1, fadeT0 = -1, finished = false, stageSent = reduced ? 4 : 0;
  let cx = 0, cy = 0, R0 = 0, diag = 0, ox = 0, oy = 0, lw = 0, lh = 0;
  let twist = 0, bright = 0, hover = false;
  let bots: Bot[] = [], orbit: Orbiter[] = [], dust: Dust[] = [], streaks: Streak[] = [];
  let pointer: { x: number; y: number } | null = null;
  const ripples: { x: number; y: number; t: number }[] = [];
  // the crisp logo (white letters, red X) and a scratch layer to cut the cursor hole into
  const logoArt = document.createElement("canvas"), layer = document.createElement("canvas");
  const layerCtx = layer.getContext("2d")!;
  const PAD = 24;

  const sizeOnly = () => {
    dpr = Math.min(phone ? 1.5 : 2, devicePixelRatio || 1);
    W = innerWidth;
    H = innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = `${W}px`;
    cv.style.height = `${H}px`;
    smoke?.resize(W, H);
    smokeDirty = true;
    diag = Math.hypot(W, H);
  };

  /** Layout on an 8 px grid: Heuser → SYNAXIS → subtitle → Enter, centred in a ring larger than the logo. */
  const layout = () => {
    lw = grid(Math.min(W * 0.66, H * 0.7, 600));
    lh = (lw * 126) / 890;
    const heuserH = phone ? 32 : 40, g1 = phone ? 16 : 24, g2 = phone ? 16 : 24, subH = phone ? 16 : 24, g3 = phone ? 32 : 40, btnH = phone ? 48 : 56;
    const stack = heuserH + g1 + lh + g2 + subH + g3 + btnH;
    cx = W / 2;
    cy = grid(H * 0.46);
    R0 = Math.max(lw / 2 + 56, stack / 2 + 40);
    const top = grid(cy - stack / 2);
    oy = top + heuserH + g1;
    ox = cx - lw / 2;
    const subTop = oy + lh + g2;
    const l: SceneLayout = { cx, cy, ring: R0, heuserTop: top, logoTop: oy, logoBottom: oy + lh, logoCy: oy + lh / 2, logoW: lw, subTop, btnCy: subTop + subH + g3 + btnH / 2, phone };
    ev.layout(l);
    // crisp logo art at device resolution
    logoArt.width = layer.width = Math.ceil((lw + PAD * 2) * dpr);
    logoArt.height = layer.height = Math.ceil((lh + PAD * 2) * dpr);
    const o = logoArt.getContext("2d")!;
    o.setTransform(dpr * (lw / 890), 0, 0, dpr * (lw / 890), PAD * dpr, PAD * dpr);
    o.fillStyle = "#FFFFFF";
    o.fill(new Path2D(LOGO_LETTERS), "evenodd");
    o.fillStyle = "#DC2A35";
    o.fill(new Path2D(LOGO_X), "evenodd");
  };

  const build = () => {
    sizeOnly();
    layout();
    fallback.style.setProperty("--cx", `${cx}px`);
    fallback.style.setProperty("--cy", `${cy}px`);
    bots = [];
    {
      const off = document.createElement("canvas");
      off.width = Math.ceil(lw);
      off.height = Math.ceil(lh);
      const o = off.getContext("2d")!;
      o.scale(lw / 890, lw / 890);
      o.fillStyle = "#737375";
      o.fill(new Path2D(LOGO_LETTERS), "evenodd");
      o.fillStyle = "#DC2A35";
      o.fill(new Path2D(LOGO_X), "evenodd");
      const img = o.getImageData(0, 0, off.width, off.height).data;
      const budget = W * H < 500_000 ? 650 : 1300;
      const step = Math.max(3, Math.round(Math.sqrt((lw * lh * 0.42) / budget)));
      for (let y = 0, iy = 0; y < off.height; y += step, iy++)
        for (let x = 0, ix = 0; x < off.width; x += step, ix++) {
          const i = (y * off.width + x) * 4;
          if (img[i + 3] < 140) continue;
          bots.push({
            sx: Math.random() * W, sy: H + 20 + Math.random() * H * 0.5, tx: ox + x, ty: oy + y,
            c: img[i] > 180 && img[i + 1] < 90 ? "#F24B59" : "#EDEDF2",
            delay: Math.random() * 0.15 + (1 - y / off.height) * 0.25, // bottom rows dock first: they pour UP
            dock: ((ix + iy * 2) % 3) * (Math.PI / 3), len: step * 1.5,
            ox: 0, oy: 0, vx: 0, vy: 0, fx: 0, fy: 0, fa: 0, fl: 0, lag: 0,
          });
        }
    }
    orbit = Array.from({ length: phone ? 18 : 28 }, (_, i) => {
      const a = Math.random() * Math.PI * 2, far = diag * 0.7;
      return { a, w: (0.12 + Math.random() * 0.22) * (i % 3 === 0 ? -1 : 1), dr: (Math.random() - 0.5) * 14, len: 11 + Math.random() * 6, sx: cx + Math.cos(a + 1) * far, sy: cy + Math.sin(a + 1) * far, lag: Math.random() * 400, c: i % 5 === 0 ? "#F24B59" : "#EDEDF2" };
    });
    dust = Array.from({ length: phone ? 40 : 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random(), vx: (Math.random() - 0.5) * 6, vy: -3 - Math.random() * 8 }));
    streaks = Array.from({ length: phone ? 40 : 70 }, () => ({ a: Math.random() * Math.PI * 2, d: 0.04 + Math.random() * 0.6, w: 0.6 + Math.random() * 1.4 }));
  };

  const lockAmount = () => (reduced ? 1 : outCubic((clock - A.lock) / A.lockDur));

  const activate = () => {
    if (actAt >= 0 || finished) return;
    actAt = clock;
    for (const b of bots) {
      const p = reduced ? 1 : outQuint(((clock - A.pour) / A.pourDur - b.delay) / 0.6);
      b.fx = b.sx + (b.tx - b.sx) * p + b.ox;
      b.fy = b.sy + (b.ty - b.sy) * p + b.oy;
      b.fa = b.dock;
      b.fl = b.len;
      b.lag = Math.random() * 120;
    }
  };

  const doOpen = () => {
    if (openAt >= 0) return;
    openAt = clock;
    shell.style.visibility = "hidden"; // the smoke (or the crossfade) now carries the frame; the hero is underneath
    ev.open(cx, cy);
  };

  const skip = () => {
    if (skipAt >= 0 || finished) return;
    skipAt = clock;
    doOpen();
  };

  // ---------------------------------------------------------------- frame
  const frame = (now: number) => {
    const dt = Math.min(50, now - last);
    last = now;
    if (!reduced) clock += dt;
    const s = dt / 1000;
    const act = actAt < 0 ? -1 : clock - actAt;

    // crossfade (reduced motion after Enter / Skip)
    if (skipAt >= 0 || (reduced && act >= 0)) {
      doOpen();
      if (fadeT0 < 0) fadeT0 = now;
      const f = clamp((now - fadeT0) / FADE);
      root.style.opacity = String(1 - f);
      if (f >= 1) return end();
    }

    // hover: the vortex speeds up and brightens, the ring glows
    bright += ((hover ? 1 : 0) - bright) * Math.min(1, s * 5);
    const zt = act < 0 ? 0 : clamp(act / D.zoom);
    const speed = act < 0 ? 0 : smooth(0, 0.75, zt); // for streaks / dust / twist
    twist += s * (0.16 + bright * 0.7 + speed * 3.2);
    const part = act < 0 || reduced ? 0 : inOutCubic((act - D.part) / D.partDur);
    if (!reduced && act >= D.open) doOpen();
    if (!reduced && skipAt < 0 && act >= 0 && part >= 1) return end();

    const ringOpen = reduced ? 1 : outQuint((clock - A.ring) / A.ringDur);
    const ringR = act < 0 ? R0 * (0.8 + 0.2 * ringOpen) : R0 * (1 + 9 * inExpo(act / D.ring));
    const ringA = ringOpen * (0.7 + bright * 0.5) * (1 - smooth(diag * 0.45, diag * 0.9, ringR));
    const zoom = 1 + 7 * inExpo(zt);
    const fadeIn = reduced ? 1 : outCubic(clock / A.smokeDur);

    // smoke
    if (smoke) {
      if (!reduced || smokeDirty) {
        glCanvas.style.opacity = fadeIn < 1 ? fadeIn.toFixed(3) : "";
        smoke.render({
          time: clock / 1000, cx, cy, ring: ringR, ringA, twist, bright, zoom,
          dive: act < 0 ? 0 : 2 * inQuint(zt),
          cover: act < 0 ? 0 : inOutCubic((act - D.cover) / D.coverDur),
          burst: 1,
          part,
        });
        smokeDirty = false;
        if (!reduced && perfN < 24) {
          perfSum += dt;
          if (++perfN === 24 && perfSum / 24 > SLOW_MS) switchToCss();
        }
      }
    }
    if (!smoke) {
      // CSS smoke: full-screen layered gradients; pushes in with the camera, fades as the smoke parts
      fallback.style.transform = `scale(${zoom.toFixed(3)})`;
      fallback.style.opacity = String(fadeIn * (1 - part));
      fallback.style.setProperty("--spin", `${(twist * 57.3).toFixed(1)}deg`);
      fallback.style.filter = bright > 0.01 ? `brightness(${(1 + bright * 0.3).toFixed(2)})` : "";
    }

    // 2D layer
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    const a2 = 1 - part;
    if (a2 > 0) {
      drawDust(s, speed, a2 * fadeIn);
      if (!smoke && ringA > 0.01) drawRingGlow(ringR, ringA * a2);
      drawOrbit(act, ringR, ringA > 0 ? a2 * (1 - smooth(diag * 0.45, diag * 0.9, ringR)) : 0);
      if (actAt < 0) {
        drawHalo(fadeIn * smooth(A.pour, A.lock, clock));
        drawLogo(s);
      } else {
        drawBurst(act);
        drawStreaks(s, speed * a2);
        if (mode === "full") drawBaymax((act - D.baymax) / D.baymaxDur);
      }
    }

    if (!reduced && actAt < 0) {
      if (stageSent < 1 && clock > A.hello) ev.stage((stageSent = 1));
      if (stageSent < 2 && clock > A.brand) ev.stage((stageSent = 2));
      if (stageSent < 3 && clock > A.sub) ev.stage((stageSent = 3));
      if (stageSent < 4 && clock > A.ready) ev.stage((stageSent = 4));
    }
    if (!finished) raf = requestAnimationFrame(frame);
  };

  /** Dust drifting through the whole frame; during the dive it rushes outward past the camera. */
  const drawDust = (s: number, speed: number, alpha: number) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    for (const d of dust) {
      if (!reduced) {
        d.x += d.vx * s;
        d.y += d.vy * s;
        if (speed > 0) {
          const k = 1 + s * speed * (2 + d.z * 6);
          d.x = cx + (d.x - cx) * k;
          d.y = cy + (d.y - cy) * k;
        }
        if (d.x < -20 || d.x > W + 20 || d.y < -20 || d.y > H + 20) {
          if (speed > 0.05) { const a = Math.random() * Math.PI * 2, r = 10 + Math.random() * 80; d.x = cx + Math.cos(a) * r; d.y = cy + Math.sin(a) * r; }
          else { d.x = Math.random() * W; d.y = H + 10; }
        }
      }
      const size = 2 + d.z * 5 + speed * d.z * 6;
      ctx.globalAlpha = alpha * (0.18 + d.z * 0.45);
      ctx.drawImage(dustDot, d.x - size / 2, d.y - size / 2, size, size);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  };

  /** CSS-smoke path only: the energy ring drawn here (the shader draws it otherwise). */
  const drawRingGlow = (r: number, alpha: number) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // soft bloom: wide faint strokes under a thin violet core (no hard outline)
    ctx.globalCompositeOperation = "lighter";
    for (const [w, c] of [[44, "rgba(107,47,214,.10)"], [22, "rgba(192,75,217,.16)"], [9, "rgba(192,75,217,.28)"], [2.5, "rgba(226,170,255,.55)"]] as const) {
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  };

  /** A few microbots orbiting the energy ring. */
  const drawOrbit = (act: number, r: number, alpha: number) => {
    if (alpha <= 0) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = alpha;
    const k = r / R0;
    for (const b of orbit) {
      const p = reduced ? 1 : outQuint((clock - A.ring - b.lag) / A.ringDur);
      if (p <= 0) continue;
      const a = b.a + (clock / 1000) * b.w * (1 + bright * 1.5 + (act >= 0 ? 4 : 0));
      const rr = r + b.dr * k;
      const tx = cx + Math.cos(a) * rr, ty = cy + Math.sin(a) * rr;
      const heading = Math.atan2(ty - b.sy, tx - b.sx);
      drawMicrobot(ctx, b.sx + (tx - b.sx) * p, b.sy + (ty - b.sy) * p, lerpAngle(heading, a + Math.PI / 2, p), Math.min(200, b.len * k), b.c, dpr);
    }
    ctx.globalAlpha = 1;
  };

  /** A soft dark glow behind the logo, so it reads over the bright smoke. */
  const drawHalo = (alpha: number) => {
    if (alpha <= 0.01) return;
    ctx.setTransform(dpr * (lw / 2) * 1.15, 0, 0, dpr * lh * 1.6, dpr * cx, dpr * (oy + lh / 2));
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, "rgba(5,5,20,.7)");
    g.addColorStop(0.6, "rgba(5,5,20,.42)");
    g.addColorStop(1, "rgba(5,5,20,0)");
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  /** Bots pour in and dock; then the crisp logo locks in (with a shimmer). Near the cursor, bots break off. */
  const drawLogo = (s: number) => {
    for (let i = ripples.length - 1; i >= 0; i--) if (clock - ripples[i].t > 900) ripples.splice(i, 1);
    const RP = phone ? 64 : 96;
    const L = lockAmount();
    // physics for docked bots
    const loose = (b: Bot, x: number, y: number) => {
      let ax = -190 * b.ox - 12 * b.vx, ay = -190 * b.oy - 12 * b.vy;
      if (pointer) {
        const dx = x + b.ox - pointer.x, dy = y + b.oy - pointer.y, d = Math.hypot(dx, dy);
        if (d < RP && d > 0.01) { const f = (1 - d / RP) * 9000; ax += (dx / d) * f; ay += (dy / d) * f; }
      }
      for (const r of ripples) {
        const age = (clock - r.t) / 1000, front = age * 700;
        const dx = x - r.x, dy = y - r.y, d = Math.hypot(dx, dy) || 1;
        const near = 1 - Math.abs(d - front) / 40;
        if (near > 0) { const f = near * 7000 * (1 - age / 0.9); ax += (dx / d) * f; ay += (dy / d) * f; }
      }
      b.vx += ax * s; b.vy += ay * s; b.ox += b.vx * s; b.oy += b.vy * s;
    };
    // the solid logo, with a soft hole where bots have broken off
    if (L > 0) {
      layerCtx.setTransform(1, 0, 0, 1, 0, 0);
      layerCtx.globalCompositeOperation = "source-over";
      layerCtx.clearRect(0, 0, layer.width, layer.height);
      layerCtx.globalAlpha = L;
      layerCtx.drawImage(logoArt, 0, 0);
      layerCtx.globalAlpha = 1;
      const st = (clock - A.lock) / A.shimmer;
      if (!reduced && st > 0 && st < 1) {
        const bx = (-0.25 + 1.5 * inOutCubic(st)) * layer.width, bw = layer.width * 0.16;
        const g = layerCtx.createLinearGradient(bx - bw, 0, bx + bw, 0);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.5, "rgba(255,236,255,.9)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        layerCtx.globalCompositeOperation = "source-atop";
        layerCtx.fillStyle = g;
        layerCtx.fillRect(0, 0, layer.width, layer.height);
      }
      layerCtx.globalCompositeOperation = "destination-out";
      const lx = ox - PAD, ly = oy - PAD;
      if (pointer && !reduced) {
        const px = (pointer.x - lx) * dpr, py = (pointer.y - ly) * dpr, rr = RP * dpr;
        const g = layerCtx.createRadialGradient(px, py, 0, px, py, rr);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(0.55, "rgba(0,0,0,.9)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        layerCtx.fillStyle = g;
        layerCtx.fillRect(px - rr, py - rr, rr * 2, rr * 2);
      }
      for (const r of ripples) {
        const age = (clock - r.t) / 1000;
        layerCtx.strokeStyle = `rgba(0,0,0,${Math.max(0, 1 - age / 0.9)})`;
        layerCtx.lineWidth = 70 * dpr;
        layerCtx.beginPath();
        layerCtx.arc((r.x - lx) * dpr, (r.y - ly) * dpr, age * 700 * dpr, 0, Math.PI * 2);
        layerCtx.stroke();
      }
      layerCtx.globalCompositeOperation = "source-over";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(layer, Math.round(lx * dpr), Math.round(ly * dpr));
    }
    // the bots: all of them while assembling; once locked, only those broken off (or under the cursor/ripple)
    for (const b of bots) {
      const p = reduced ? 1 : outQuint(((clock - A.pour) / A.pourDur - b.delay) / 0.6);
      if (p <= 0) continue;
      let x = b.sx + (b.tx - b.sx) * p, y = b.sy + (b.ty - b.sy) * p;
      if (p >= 1 && !reduced) loose(b, x, y);
      x += b.ox;
      y += b.oy;
      let show = 1 - L;
      if (L > 0) {
        const off = Math.abs(b.ox) + Math.abs(b.oy);
        let near = off > 0.8;
        if (!near && pointer) near = Math.hypot(b.tx - pointer.x, b.ty - pointer.y) < RP;
        if (!near) for (const r of ripples) if (Math.abs(Math.hypot(b.tx - r.x, b.ty - r.y) - (clock - r.t) * 0.7) < 45) near = true;
        if (near) show = 1;
      }
      if (show <= 0.01) continue;
      const heading = Math.atan2(b.ty - b.sy, b.tx - b.sx);
      let angle = heading + (b.dock - heading) * Math.min(1, p * 1.3);
      let len = b.len;
      const v = Math.hypot(b.vx, b.vy);
      if (v > 20) { angle = lerpAngle(angle, Math.atan2(b.vy, b.vx), Math.min(0.85, v / 500)); len *= 1 + Math.min(1.2, v / 450); }
      ctx.globalAlpha = show;
      drawMicrobot(ctx, x, y, angle, len, b.c, dpr);
    }
    ctx.globalAlpha = 1;
  };

  /** Enter: the logo bursts into microbots (a quick outward kick), then they are sucked into the vortex. */
  const drawBurst = (act: number) => {
    for (const b of bots) {
      const t = (act - b.lag) / D.burst;
      if (t >= 1) continue;
      const tt = clamp(t);
      const k = tt < 0.22 ? 1 + 0.22 * outQuint(tt / 0.22) : 1.22 * (1 - inQuint((tt - 0.22) / 0.78));
      const a = 2.6 * inCubic(tt);
      const dx = b.fx - cx, dy = b.fy - cy;
      ctx.globalAlpha = 1 - inQuint(tt) * 0.6;
      drawMicrobot(ctx, cx + (dx * Math.cos(a) - dy * Math.sin(a)) * k, cy + (dx * Math.sin(a) + dy * Math.cos(a)) * k, b.fa + a, b.fl * (0.35 + 0.65 * (1 - tt)), b.c, dpr);
    }
    ctx.globalAlpha = 1;
  };

  /** Speed streaks rushing outward from the centre while the camera pushes in. */
  const drawStreaks = (s: number, speed: number) => {
    if (speed < 0.03) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    const half = diag / 2;
    for (const st of streaks) {
      st.d *= 1 + s * (1.2 + speed * 7);
      if (st.d > 1) { st.d = 0.03 + Math.random() * 0.12; st.a = Math.random() * Math.PI * 2; }
      const r1 = st.d * half, r2 = r1 * (1 + 0.12 + speed * 0.35);
      ctx.strokeStyle = `rgba(214,190,255,${(speed * 0.55 * Math.min(1, st.d * 4)).toFixed(3)})`;
      ctx.lineWidth = st.w * (1 + st.d * 2);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(st.a) * r1, cy + Math.sin(st.a) * r1);
      ctx.lineTo(cx + Math.cos(st.a) * r2, cy + Math.sin(st.a) * r2);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  };

  /**
   * Baymax with Hiro on his back, with real perspective: they come out of the vortex toward the camera
   * while it pushes in. Depth z falls exponentially (far → right beside the viewer), so size and offset
   * grow as 1/z and they pass just beside the camera at the lower left. Two trailing ghosts (further back,
   * toward the vortex) give motion blur; the thrusters (at their back) light them from behind.
   */
  const baymaxAt = (t: number) => {
    const z = 10 * Math.pow(0.3 / 10, Math.pow(t, 0.85)); // 10 (small, deep in the vortex) → 0.3 (beside the camera)
    const wx = -W * 0.3, wy = H * 0.28; // the line they fly along, beside the camera axis
    return { x: cx + wx / z, y: cy + wy / z, w: (Math.min(W, H) * 0.56) / z, rot: -0.08 + 0.12 * t };
  };
  const drawBaymax = (t: number) => {
    if (!baymax.complete || !baymax.naturalWidth || t <= 0 || t >= 1) return;
    const cur = baymaxAt(t);
    if (cur.w < 3) return;
    const passing = 1 - smooth(Math.min(W, H) * 1.1, Math.min(W, H) * 1.9, cur.w); // gone as they pass the camera
    const fade = smooth(0, 0.12, t) * passing;
    if (fade <= 0.01) return;
    const aspect = baymax.naturalHeight / baymax.naturalWidth;
    const draw = (b: ReturnType<typeof baymaxAt>, alpha: number, glow: boolean) => {
      const h = b.w * aspect;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      if (glow) {
        // thrusters at their back: a warm flickering glow behind the pair
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha * (0.45 + Math.random() * 0.12);
        const gs = b.w * 1.05;
        ctx.drawImage(fireDot, -gs / 2, -gs / 2 + h * 0.12, gs, gs);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.globalAlpha = alpha;
      ctx.drawImage(baymax, -b.w / 2, -h / 2, b.w, h);
      ctx.restore();
    };
    draw(baymaxAt(Math.max(0.001, t - 0.06)), 0.1 * fade, false);
    draw(baymaxAt(Math.max(0.001, t - 0.03)), 0.2 * fade, false);
    draw(cur, fade, true);
    ctx.globalAlpha = 1;
  };

  const end = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    ev.done();
  };

  // ---------------------------------------------------------------- lifecycle
  build();
  const start = () => {
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const onVis = () => {
    if (finished) return;
    if (document.hidden) cancelAnimationFrame(raf);
    else start();
  };
  const onResize = () => (actAt < 0 ? build() : sizeOnly());
  addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVis);
  if (!document.hidden) start();

  return {
    activate,
    skip,
    hover(on: boolean) {
      hover = on && !reduced;
    },
    pointer(p: { x: number; y: number } | null) {
      pointer = reduced ? null : p;
    },
    tap(x: number, y: number) {
      if (!reduced && actAt < 0) ripples.push({ x, y, t: clock });
    },
    destroy() {
      finished = true;
      cancelAnimationFrame(raf);
      // the WebGL context is left to be collected with the canvas: losing it here would break a remount
      // on the same canvas (React Strict Mode runs effects twice in development)
      removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    },
  };
}
export type IntroScene = ReturnType<typeof createIntroScene>;
