"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { LOGO_LETTERS, LOGO_X } from "@/components/brand/logo-paths";
import { loadMicrobotSprite, microbotSprite } from "@/components/effects/microbot-sprite";

/**
 * Opening animation as a full-screen overlay on top of the server-rendered home page.
 * - Decided before first paint by the inline script in app/layout.tsx (sets html[data-intro]):
 *   never for reduced motion, crawlers/Lighthouse, or same-site reloads. Full on the first visit,
 *   short afterwards (localStorage), always skippable.
 * - Exit (~1s): the logo swarm shrinks into the header logo's exact position (shared-element feel),
 *   then flies right as a wipe that reveals the page; the hero then staggers in.
 */
type Bot = { sx: number; sy: number; tx: number; ty: number; hx: number; hy: number; c: string; delay: number; ring: boolean; a: number; x: number; y: number };
const SEEN_KEY = "synaxis-intro-seen";
const EXIT_MORPH = 380;
const EXIT_WIPE = 620;

export function IntroOverlay() {
  const [mode, setMode] = useState<"off" | "full" | "short">("off");
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const exitAt = useRef(0);
  const skipBtn = useRef<HTMLButtonElement>(null);
  const enterBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const m = document.documentElement.dataset.intro;
    if (m === "full" || m === "short") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the attribute set by the pre-paint script
      setMode(m);
      document.documentElement.style.overflow = "hidden";
    }
  }, []);

  // Modal focus: Skip on open, Enter once the logo has assembled (focus never sits behind the overlay).
  useEffect(() => {
    if (mode !== "off") skipBtn.current?.focus();
  }, [mode]);
  useEffect(() => {
    if (ready) enterBtn.current?.focus();
  }, [ready]);

  const finish = useCallback(() => {
    const html = document.documentElement;
    delete html.dataset.intro;
    html.style.overflow = "";
    document.querySelector<HTMLElement>("#main")?.focus({ preventScroll: true });
    html.dataset.heroEnter = "1"; // hero stagger (globals.css)
    setTimeout(() => delete html.dataset.heroEnter, 1400);
    setMode("off");
  }, []);

  const leave = useCallback(() => {
    if (exitAt.current) return;
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
    exitAt.current = performance.now();
    setLeaving(true);
    setTimeout(finish, EXIT_MORPH + EXIT_WIPE + 40);
  }, [finish]);

  useEffect(() => {
    if (mode === "off") return;
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    const SPEED = mode === "short" ? 0.35 : 1;
    loadMicrobotSprite();
    let W = 0, H = 0, dpr = 1, raf = 0;
    let bots: Bot[] = [];
    const t0 = performance.now();

    const build = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = innerWidth;
      H = innerHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      cv.style.width = `${W}px`;
      cv.style.height = `${H}px`;
      const lw = Math.min(W * 0.84, 760), scale = lw / 890, lh = 126 * scale;
      const ox = (W - lw) / 2, oy = H * 0.38 - lh / 2;
      // header logo rect = shared-element destination
      const hl = document.querySelector<HTMLElement>("[data-header-logo]")?.getBoundingClientRect();
      const hx0 = hl?.left ?? 16, hy0 = hl?.top ?? 20, hw = hl?.width ?? 120, hh = hl?.height ?? 17;
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
      const budget = W * H < 500_000 ? 1000 : W * H < 1_200_000 ? 1600 : 2300;
      const step = Math.max(3, Math.round(Math.sqrt((lw * lh * 0.42) / (budget * 0.8))));
      const edge = () => {
        const s = Math.floor(Math.random() * 4);
        return s === 0 ? [Math.random() * W, -20] : s === 1 ? [W + 20, Math.random() * H] : s === 2 ? [Math.random() * W, H + 20] : [-20, Math.random() * H];
      };
      bots = [];
      for (let y = 0; y < off.height; y += step)
        for (let x = 0; x < off.width; x += step) {
          const i = (y * off.width + x) * 4;
          if (img[i + 3] < 140) continue;
          const [sx, sy] = edge();
          bots.push({
            sx, sy, tx: ox + x, ty: oy + y,
            hx: hx0 + (x / off.width) * hw, hy: hy0 + (y / off.height) * hh,
            c: img[i] > 180 && img[i + 1] < 90 ? "#F24B59" : "#C9C9CE",
            delay: Math.random() * 0.35 + (x / lw) * 0.25, ring: false, a: 0, x: sx, y: sy,
          });
        }
      const ringN = W < 640 ? 60 : 96, cx = W / 2, cy = H * 0.72, rx = Math.min(W * 0.34, 200), ry = Math.min(H * 0.09, 60);
      for (let i = 0; i < ringN; i++) {
        const a = (i / ringN) * Math.PI * 2;
        const [sx, sy] = edge();
        bots.push({ sx, sy, tx: cx + Math.cos(a) * rx, ty: cy + Math.sin(a) * ry, hx: cx, hy: cy, c: i % 7 ? "#8B93F0" : "#F24B59", delay: 0.55 + Math.random() * 0.3, ring: true, a, x: sx, y: sy });
      }
    };
    build();

    const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const ASSEMBLE = 2600 * SPEED;
    let shown = false;

    const frame = (now: number) => {
      const el = now - t0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const ex = exitAt.current ? now - exitAt.current : -1;
      const morph = ex < 0 ? 0 : inOut(Math.min(1, ex / EXIT_MORPH));
      const wipe = ex < EXIT_MORPH ? 0 : ease((ex - EXIT_MORPH) / EXIT_WIPE);
      // the dark backdrop is wiped away left→right in step with the swarm
      if (shell.current) shell.current.style.clipPath = wipe > 0 ? `inset(0 0 0 ${Math.min(100, wipe * 108)}%)` : "";
      const spin = (el / 4000) % (Math.PI * 2);
      const cx = W / 2, cy = H * 0.72, rx = Math.min(W * 0.34, 200), ry = Math.min(H * 0.09, 60);
      for (let i = 0; i < bots.length; i++) {
        const b = bots[i];
        const p = ease((el / ASSEMBLE - b.delay * SPEED) / 0.65);
        let x = b.sx + (b.tx - b.sx) * p, y = b.sy + (b.ty - b.sy) * p;
        if (b.ring && p >= 1) {
          x = cx + Math.cos(b.a + spin) * rx;
          y = cy + Math.sin(b.a + spin) * ry;
        }
        if (morph > 0) {
          // shared element: logo bots converge on the header logo; ring bots collapse to centre
          x += (b.hx - x) * morph;
          y += (b.hy - y) * morph;
        }
        if (wipe > 0) {
          // sweep right, staggered by vertical position so it reads as a wipe
          const lag = Math.min(0.35, (y / H) * 0.25);
          const w = Math.max(0, (wipe - lag) / (1 - lag));
          x += w * w * (W * 1.3);
        }
        b.x = x;
        b.y = y;
        const big = b.ring;
        const spr = microbotSprite(b.c, big ? 7 : 4.5, big ? 5 : 3.2);
        ctx.globalAlpha = 1 - wipe * 0.6;
        if (spr) ctx.drawImage(spr, x - (big ? 3.5 : 2.25), y - (big ? 2.5 : 1.6), big ? 7 : 4.5, big ? 5 : 3.2);
        else {
          ctx.fillStyle = b.c;
          ctx.fillRect(x - (big ? 2.6 : 1.6), y - (big ? 1.8 : 1.1), big ? 5.2 : 3.2, big ? 3.6 : 2.2);
        }
      }
      if (!shown && el > ASSEMBLE * 0.95) {
        shown = true;
        setReady(true);
        if (mode === "short") setTimeout(leave, 500); // repeat visits continue on their own
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

  return (
    <>
      {/* Pre-hydration cover (shown by html[data-intro] before first paint, so the page never flashes) */}
      <div aria-hidden className="intro-cover fixed inset-0 z-[200] hidden bg-[#0B1220]" />
      {mode !== "off" && (
        <div role="dialog" aria-modal="true" aria-label="Synaxis intro" className="fixed inset-0 z-[201]">
          <div ref={shell} className="absolute inset-0 bg-[#0B1220]" />
          <canvas ref={canvas} aria-hidden className="absolute inset-0" />
          <p className={`absolute inset-x-0 top-[50%] px-6 text-center font-mono text-[11px] uppercase tracking-[0.32em] text-[#9a9aa0] transition-opacity duration-500 sm:text-xs ${ready && !leaving ? "opacity-100" : "opacity-0"}`}>
            Heuser Science Society · Season 1 · 15–17 Jan 2027
          </p>
          <div className={`absolute inset-x-0 top-[72%] flex -translate-y-1/2 justify-center transition-opacity duration-300 ${ready && !leaving ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <button ref={enterBtn} type="button" onClick={leave} className="btn btn-onred px-8 text-base" tabIndex={ready ? 0 : -1}>
              Enter
            </button>
          </div>
          <button ref={skipBtn} type="button" onClick={leave} className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] rounded-full border border-white/30 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white/85 hover:bg-white/10">
            Skip intro
          </button>
        </div>
      )}
    </>
  );
}
