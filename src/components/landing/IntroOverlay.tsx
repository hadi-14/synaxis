"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { LOGO_LETTERS, LOGO_X } from "@/components/brand/logo-paths";
import { drawMicrobot, loadMicrobotSprite } from "@/components/effects/microbot-sprite";
import { Skyline } from "@/components/decor/Skyline";

/**
 * Opening animation as a full-screen overlay on top of the server-rendered home page.
 * - Decided before first paint by the inline script in app/layout.tsx (sets html[data-intro]):
 *   never for reduced motion, crawlers/Lighthouse, or same-site reloads. Full (~5.5 s) on the first
 *   visit, short (~1.5 s, auto-continues) afterwards, always skippable.
 * - Full: microbots (the team's microbot.png) pour up from the bottom and dock into the SYNAXIS logo in a
 *   woven lattice → red glow → "HELLO." types out → the bots build a torii gate around Enter.
 * - Exit (~1.2 s): push through the gate (scale + blur) → bots surge into a red wall in the hero's own red
 *   → the overlay fades away over the hero, which staggers in (Baymax flies in, digits flip, ticker slides up).
 */
type Bot = { sx: number; sy: number; tx: number; ty: number; rx: number; ry: number; c: string; delay: number; ring: boolean; a: number; side: number; dock: number; len: number };
const SEEN_KEY = "synaxis-intro-seen";
const HELLO = "HELLO.";
const PUSH = 250; // camera pushes through the gate
const SURGE = 400; // bots surge into the red wall
const REVEAL = 550; // wall fades over the entering hero


/** Evenly spaced points along a torii-gate outline (pillars, curved top beam, tie beam). */
function toriiPoints(n: number, cx: number, cy: number, w: number, h: number) {
  const top = cy - h * 0.62, bottom = cy + h * 0.5, half = w / 2;
  const segs: [number, number, number, number, (t: number) => number][] = [
    [cx - half * 0.78, bottom, cx - half * 0.72, top + h * 0.16, () => 0], // left pillar
    [cx + half * 0.78, bottom, cx + half * 0.72, top + h * 0.16, () => 0], // right pillar
    [cx - half * 1.08, top, cx + half * 1.08, top, (t) => -Math.sin(t * Math.PI) * h * 0.12 + Math.abs(t - 0.5) * -h * 0.1], // kasagi (curved)
    [cx - half * 0.92, top + h * 0.2, cx + half * 0.92, top + h * 0.2, () => 0], // nuki (tie beam)
  ];
  const lens = segs.map(([x1, y1, x2, y2]) => Math.hypot(x2 - x1, y2 - y1));
  const total = lens.reduce((a, b) => a + b, 0);
  const pts: { x: number; y: number; side: number }[] = [];
  segs.forEach(([x1, y1, x2, y2, bend], si) => {
    const k = Math.max(2, Math.round((lens[si] / total) * n));
    for (let i = 0; i < k; i++) {
      const t = i / (k - 1);
      const x = x1 + (x2 - x1) * t;
      pts.push({ x, y: y1 + (y2 - y1) * t + bend(t), side: Math.sign(x - cx) || 1 });
    }
  });
  return pts;
}

export function IntroOverlay() {
  const [mode, setMode] = useState<"off" | "full" | "short">("off");
  const [phase, setPhase] = useState<"build" | "glow" | "hello" | "ready">("build");
  const [typed, setTyped] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const exitAt = useRef(0);
  const hover = useRef(false);
  const skipBtn = useRef<HTMLButtonElement>(null);
  const enterBtn = useRef<HTMLButtonElement>(null);
  const ready = phase === "ready";

  useEffect(() => {
    const m = document.documentElement.dataset.intro;
    if (m === "full" || m === "short") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the attribute set by the pre-paint script
      setMode(m);
      document.documentElement.style.overflow = "hidden";
    }
  }, []);

  // Modal focus: Skip on open, Enter once the gate is up (focus never sits behind the overlay).
  useEffect(() => {
    if (mode !== "off") skipBtn.current?.focus();
  }, [mode]);
  useEffect(() => {
    if (ready && mode === "full") enterBtn.current?.focus();
  }, [ready, mode]);

  // "HELLO." types out on the display (one character per 110 ms).
  useEffect(() => {
    if (phase !== "hello" && phase !== "ready") return;
    if (typed >= HELLO.length) return;
    const t = setTimeout(() => setTyped((n) => n + 1), mode === "short" ? 30 : 110);
    return () => clearTimeout(t);
  }, [phase, typed, mode]);

  const finish = useCallback(() => {
    const html = document.documentElement;
    delete html.dataset.intro;
    html.style.overflow = "";
    document.querySelector<HTMLElement>("#main")?.focus({ preventScroll: true });
    setTimeout(() => delete html.dataset.heroEnter, 1800);
    setMode("off");
  }, []);

  const leave = useCallback(() => {
    if (exitAt.current) return;
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
    exitAt.current = performance.now();
    setLeaving(true);
    // the hero starts entering under the red wall, so it is mid-stagger when the wall fades
    setTimeout(() => (document.documentElement.dataset.heroEnter = "1"), PUSH + SURGE - 80);
    setTimeout(finish, PUSH + SURGE + REVEAL + 40);
  }, [finish]);

  useEffect(() => {
    if (mode === "off") return;
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    const short = mode === "short";
    loadMicrobotSprite();
    let W = 0, H = 0, dpr = 1, raf = 0;
    let bots: Bot[] = [];
    const t0 = performance.now();
    const band = getComputedStyle(document.documentElement).getPropertyValue("--band").trim() || "#DC2A35";
    const T = short ? { logo: 700, glow: 200, hello: 0, gate: 0 } : { logo: 2400, glow: 600, hello: 1200, gate: 1300 };
    const GATE_AT = T.logo + T.glow + T.hello * 0.4;
    const READY_AT = short ? T.logo + T.glow : GATE_AT + T.gate;

    const build = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = innerWidth;
      H = innerHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      cv.style.width = `${W}px`;
      cv.style.height = `${H}px`;
      const lw = Math.min(W * 0.84, 760), scale = lw / 890, lh = 126 * scale;
      const ox = (W - lw) / 2, oy = H * 0.34 - lh / 2;
      const off = document.createElement("canvas");
      off.width = Math.ceil(lw);
      off.height = Math.ceil(lh);
      const o = off.getContext("2d")!;
      o.scale(scale, scale);
      o.fillStyle = "#737375";
      o.fill(new Path2D(LOGO_LETTERS), "evenodd");
      o.fillStyle = "#DC2A35";
      o.fill(new Path2D(LOGO_X), "evenodd");
      const img = o.getImageData(0, 0, off.width, off.height).data;
      const budget = W * H < 500_000 ? 900 : W * H < 1_200_000 ? 1400 : 2000;
      const step = Math.max(4, Math.round(Math.sqrt((lw * lh * 0.42) / budget)));
      const len = step * 1.5; // rods overlap a little so the lattice reads as solid
      const below = () => [Math.random() * W, H + 20 + Math.random() * H * 0.5];
      bots = [];
      for (let y = 0, iy = 0; y < off.height; y += step, iy++)
        for (let x = 0, ix = 0; x < off.width; x += step, ix++) {
          const i = (y * off.width + x) * 4;
          if (img[i + 3] < 140) continue;
          const [sx, sy] = below();
          bots.push({
            sx, sy, tx: ox + x, ty: oy + y, rx: Math.random() * W, ry: Math.random() * H,
            c: img[i] > 180 && img[i + 1] < 90 ? "#F24B59" : "#C9C9CE",
            delay: Math.random() * 0.25 + (1 - y / off.height) * 0.3, // bottom rows dock first: they pour UP
            ring: false, a: 0, side: 0, dock: ((ix + iy * 2) % 3) * (Math.PI / 3), len,
          });
        }
      if (!short) {
        const gw = Math.min(W * 0.62, 300), gh = Math.min(H * 0.26, 170);
        const gate = toriiPoints(W < 640 ? 60 : 90, W / 2, H * 0.74, gw, gh);
        gate.forEach((g, i) => {
          const [sx, sy] = below();
          // along the beams the rods lie flat; on the pillars they stand up: a chain that follows the gate
          const vertical = Math.abs(g.x - W / 2) > gw * 0.3 && g.y > H * 0.74 - gh * 0.4;
          bots.push({ sx, sy, tx: g.x, ty: g.y, rx: Math.random() * W, ry: Math.random() * H, c: i % 5 ? "#F24B59" : "#FFD6DA", delay: Math.random() * 0.4, ring: true, a: i, side: g.side, dock: vertical ? Math.PI / 2 : 0, len: 9 });
        });
      }
    };
    build();

    const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    let stage2 = "build";
    const go = (p: typeof phase) => {
      if (stage2 === p) return;
      stage2 = p;
      setPhase(p);
    };

    const frame = (now: number) => {
      const el = now - t0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      const ex = exitAt.current ? now - exitAt.current : -1;
      const push = ex < 0 ? 0 : inOut(Math.min(1, ex / PUSH));
      const surge = ex < PUSH ? 0 : ease((ex - PUSH) / SURGE);
      const reveal = ex < PUSH + SURGE ? 0 : ease((ex - PUSH - SURGE) / REVEAL);
      // camera pushes through the gate
      if (stage.current) {
        stage.current.style.transform = push > 0 ? `scale(${1 + push * 0.9 + surge * 0.4})` : "";
        stage.current.style.filter = push > 0 ? `blur(${(push * 5 + surge * 4).toFixed(1)}px)` : "";
      }
      if (shell.current && surge > 0) shell.current.style.opacity = String(1 - surge);
      if (root.current) root.current.style.opacity = reveal > 0 ? String(1 - reveal) : "";

      for (const b of bots) {
        const start = b.ring ? GATE_AT : 0;
        const dur = b.ring ? T.gate : T.logo;
        const p = ease(((el - start) / Math.max(1, dur) - b.delay) / 0.6);
        if (p <= 0 && surge === 0) continue;
        let x = b.sx + (b.tx - b.sx) * p, y = b.sy + (b.ty - b.sy) * p;
        if (b.ring && p >= 1) y += Math.sin(el / 420 + b.a * 0.4) * (0.5 + (hover.current ? 2.5 : 0));
        // flight: rod points along its path; docking: rotates into its lattice angle
        const heading = Math.atan2(b.ty - b.sy, b.tx - b.sx);
        let angle = heading + (b.dock - heading) * Math.min(1, p * 1.3);
        let len = b.len;
        if (surge > 0) {
          // bots surge outward into a wall
          x += (b.rx - x) * surge;
          y += (b.ry - y) * surge;
          angle += surge * 2;
          len *= 1 + surge * 3;
        }
        ctx.globalAlpha = 1;
        drawMicrobot(ctx, x, y, angle, len, b.c, dpr);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (surge > 0) {
        // the red wall: same colour as the hero band, so fading the overlay reveals the hero seamlessly
        ctx.globalAlpha = Math.min(1, surge * 1.15);
        ctx.fillStyle = band;
        ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.globalAlpha = 1;
      }

      if (!exitAt.current) {
        if (el > T.logo) go("glow");
        if (!short && el > T.logo + T.glow) go("hello");
        if (el > READY_AT) {
          go("ready");
          if (short) leave();
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const onResize = () => build();
    const onKey = (e: KeyboardEvent) => (e.key === "Enter" || e.key === "Escape") && leave();
    addEventListener("resize", onResize);
    addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
      removeEventListener("keydown", onKey);
    };
  }, [mode, leave]);

  if (mode === "off") return null;
  const glow = phase !== "build";
  return (
    <div ref={root} role="dialog" aria-modal="true" aria-label="Synaxis intro" className="fixed inset-0 z-[201]">
      <div ref={stage} className="absolute inset-0 origin-[50%_74%] will-change-transform">
        <div ref={shell} className="absolute inset-0 overflow-hidden bg-[#0B1220]">
          {/* lab glow from the floor, the red logo glow, the night skyline */}
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(60%_60%_at_50%_100%,rgba(120,140,200,.16),transparent)]" />
          <div
            aria-hidden
            className={`absolute left-1/2 top-[34%] h-[60vmin] w-[95vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(220,42,53,.5),rgba(220,42,53,0))] transition-opacity duration-700 ${glow ? "opacity-100" : "opacity-25"}`}
          />
          <Skyline variant="night" eager className="absolute inset-x-0 bottom-0 h-[min(36vh,max(150px,18.75vw))] w-full" />
        </div>
        <canvas ref={canvas} aria-hidden className="absolute inset-0" />
        {/* display screen: HELLO. + event line */}
        <div className="absolute inset-x-0 top-[calc(34%+min(9vw,72px))] flex flex-col items-center gap-2 px-6 text-center">
          <p aria-live="polite" className={`font-mono text-2xl font-bold tracking-[0.3em] text-[#FFD6DA] [text-shadow:0_0_12px_rgba(242,75,89,.8)] sm:text-3xl ${phase === "hello" || phase === "ready" ? "" : "invisible"}`}>
            {HELLO.slice(0, typed)}
            <span aria-hidden className="ml-1 inline-block h-[1em] w-[.55em] translate-y-[.12em] bg-[#F24B59] motion-safe:animate-[blink_1s_steps(2)_infinite]" />
          </p>
          <p className={`font-mono text-xs font-semibold uppercase tracking-[0.28em] text-[#E4E4E8] transition-opacity duration-500 sm:text-sm ${glow ? "opacity-100" : "opacity-0"}`}>
            Heuser Science Society · Season 1 · 15–17 Jan 2027
          </p>
        </div>
        <div className={`absolute inset-x-0 top-[74%] flex -translate-y-1/2 justify-center transition-opacity duration-300 ${ready && !leaving && mode === "full" ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <button
            ref={enterBtn}
            type="button"
            onClick={leave}
            onPointerEnter={() => (hover.current = true)}
            onPointerLeave={() => (hover.current = false)}
            onFocus={() => (hover.current = true)}
            onBlur={() => (hover.current = false)}
            className="btn bg-[#DC2A35] px-10 text-base text-white shadow-[0_6px_0_#7d0f18] hover:bg-[#c42634] active:shadow-[0_2px_0_#7d0f18] motion-safe:animate-[enter-pulse_2.2s_ease-in-out_infinite]"
            tabIndex={ready ? 0 : -1}
          >
            Enter
          </button>
        </div>
      </div>
      <button ref={skipBtn} type="button" onClick={leave} className={`absolute right-4 top-[max(1rem,env(safe-area-inset-top))] rounded-full border border-white/30 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white/85 hover:bg-white/10 ${leaving ? "opacity-0" : ""}`}>
        Skip intro
      </button>
      <style>{`@keyframes blink{50%{opacity:0}}@keyframes enter-pulse{0%,100%{box-shadow:0 6px 0 #7d0f18,0 0 0 0 rgba(242,75,89,.55)}50%{box-shadow:0 6px 0 #7d0f18,0 0 0 14px rgba(242,75,89,0)}}`}</style>
    </div>
  );
}
