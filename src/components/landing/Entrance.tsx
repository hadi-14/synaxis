"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { LOGO_LETTERS, LOGO_X } from "@/components/brand/logo-paths";
import { loadMicrobotSprite, microbotSprite } from "@/components/effects/microbot-sprite";

/**
 * Landing: a swarm of microbots assembles the SYNAXIS logo (traced from /public/logo), then the spare
 * bots form a gateway ring. "Enter" parts the swarm and pulls you into the portal.
 * - First visit: full sequence (~4.2s). Repeat visits: short (~1.4s). "Skip" always available.
 * - Reduced motion or no canvas: static logo + Enter.
 * - The <h1> logo stays in the DOM for SEO and screen readers.
 */
type Bot = { x: number; y: number; sx: number; sy: number; tx: number; ty: number; c: string; delay: number; ring: boolean; a: number };

const SEEN_KEY = "synaxis-intro-seen";

export function Entrance() {
  const router = useRouter();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"pending" | "static" | "anim">("pending");
  const [ready, setReady] = useState(false);
  const leaving = useRef(false);
  const leaveAt = useRef(0);
  const pointer = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    router.prefetch("/portal");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMode(reduced || !canvas.current?.getContext ? "static" : "anim");
  }, [router]);

  const enter = useCallback(() => {
    if (leaving.current) return;
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
    if (mode !== "anim") {
      router.push("/portal");
      return;
    }
    leaving.current = true;
    leaveAt.current = performance.now();
    setTimeout(() => router.push("/portal"), 650);
  }, [mode, router]);

  useEffect(() => {
    if (mode !== "anim") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- static mode is ready immediately
      if (mode === "static") setReady(true);
      return;
    }
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    const seen = (() => {
      try {
        return localStorage.getItem(SEEN_KEY) === "1";
      } catch {
        return false;
      }
    })();
    const SPEED = seen ? 0.35 : 1;
    loadMicrobotSprite();
    let W = 0, H = 0, dpr = 1;
    let bots: Bot[] = [];
    let raf = 0;
    const t0 = performance.now();

    const build = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = innerWidth;
      H = innerHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      cv.style.width = `${W}px`;
      cv.style.height = `${H}px`;
      // Logo target area
      const lw = Math.min(W * 0.84, 760);
      const scale = lw / 890;
      const lh = 126 * scale;
      const ox = (W - lw) / 2;
      const oy = H * 0.36 - lh / 2;
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
      const area = W * H;
      const budget = area < 500_000 ? 1100 : area < 1_200_000 ? 1800 : 2600; // thousands on desktop, lighter on phones
      const step = Math.max(3, Math.round(Math.sqrt((lw * lh * 0.42) / (budget * 0.78))));
      const targets: { x: number; y: number; c: string }[] = [];
      for (let y = 0; y < off.height; y += step)
        for (let x = 0; x < off.width; x += step) {
          const i = (y * off.width + x) * 4;
          if (img[i + 3] > 140) targets.push({ x: ox + x, y: oy + y, c: img[i] > 180 && img[i + 1] < 90 ? "#F24B59" : "#B4B4B9" });
        }
      const ringN = W < 640 ? 70 : 110; // sparse, readable gateway ring
      const cx = W / 2, cy = H * 0.72, rx = Math.min(W * 0.34, 200), ry = Math.min(H * 0.09, 62);
      bots = [];
      const edge = () => {
        const side = Math.floor(Math.random() * 4);
        return side === 0 ? [Math.random() * W, -20] : side === 1 ? [W + 20, Math.random() * H] : side === 2 ? [Math.random() * W, H + 20] : [-20, Math.random() * H];
      };
      for (const t of targets) {
        const [sx, sy] = edge();
        bots.push({ x: sx, y: sy, sx, sy, tx: t.x, ty: t.y, c: t.c, delay: Math.random() * 0.35 + (t.x - ox) / lw * 0.25, ring: false, a: 0 });
      }
      for (let i = 0; i < ringN; i++) {
        const a = (i / ringN) * Math.PI * 2;
        const [sx, sy] = edge();
        bots.push({ x: sx, y: sy, sx, sy, tx: cx + Math.cos(a) * rx, ty: cy + Math.sin(a) * ry, c: i % 7 === 0 ? "#F24B59" : "#8B93F0", delay: 0.55 + Math.random() * 0.3, ring: true, a });
      }
    };
    build();

    const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    const ASSEMBLE = 2600 * SPEED;
    let shown = false;

    const frame = (now: number) => {
      const el = now - t0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const leave = leaving.current ? Math.min(1, (now - leaveAt.current) / 600) : 0;
      if (leave > 0) {
        // pull the viewer in: zoom from the gateway centre
        const z = 1 + leave * leave * 2.2;
        ctx.translate(W / 2, H * 0.62);
        ctx.scale(z, z);
        ctx.translate(-W / 2, -H * 0.62);
      }
      const px = pointer.current.x, py = pointer.current.y;
      ctx.globalAlpha = 1 - leave * 0.85;
      let prev: Bot | null = null;
      ctx.lineWidth = 0.6;
      for (let i = 0; i < bots.length; i++) {
        const b = bots[i];
        const p = ease((el / ASSEMBLE - b.delay * SPEED) / (1 - 0.35));
        let x = b.sx + (b.tx - b.sx) * p;
        let y = b.sy + (b.ty - b.sy) * p;
        if (b.ring && p >= 1) {
          const spin = (el / 4000) % (Math.PI * 2);
          const cx = W / 2, cy = H * 0.72, rx = Math.min(W * 0.34, 200), ry = Math.min(H * 0.09, 62);
          x = cx + Math.cos(b.a + spin) * rx;
          y = cy + Math.sin(b.a + spin) * ry;
        }
        if (p >= 1 && !b.ring) {
          // idle shimmer + gentle scatter around the pointer, then re-form
          const dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
          if (d2 < 3600) {
            const f = (1 - d2 / 3600) * 10;
            x += (dx / Math.sqrt(d2 + 1)) * f;
            y += (dy / Math.sqrt(d2 + 1)) * f;
          }
          y += Math.sin(el / 500 + i) * 0.4;
        }
        if (leave > 0) {
          // part the swarm sideways from the centre
          const dir = x < W / 2 ? -1 : 1;
          x += dir * leave * leave * W * 0.6;
          y += (y - H * 0.5) * leave * 0.4;
        }
        const spr = microbotSprite(b.c, b.ring ? 7 : 4.5, b.ring ? 5 : 3.2);
        if (spr) ctx.drawImage(spr, x - (b.ring ? 3.5 : 2.25), y - (b.ring ? 2.5 : 1.6), b.ring ? 7 : 4.5, b.ring ? 5 : 3.2);
        else {
          ctx.fillStyle = b.c;
          if (b.ring) ctx.fillRect(x - 2.6, y - 1.8, 5.2, 3.6);
          else ctx.fillRect(x - 1.6, y - 1.1, 3.2, 2.2);
        }
        if (prev && !b.ring && i % 2 === 0 && p > 0.2) {
          const ddx = prev.x - x, ddy = prev.y - y;
          if (ddx * ddx + ddy * ddy < 900) {
            ctx.strokeStyle = b.ring ? "rgba(139,147,240,.35)" : "rgba(180,180,185,.28)";
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(x, y);
            ctx.stroke();
          }
        }
        b.x = x;
        b.y = y;
        prev = b;
      }
      if (!shown && el > ASSEMBLE * 0.95) {
        shown = true;
        setReady(true);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onResize = () => build();
    const onMove = (e: PointerEvent) => (pointer.current = { x: e.clientX, y: e.clientY });
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(frame);
    };
    addEventListener("resize", onResize);
    addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
      removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Enter" && ready && enter();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [ready, enter]);

  return (
    <main id="main" className="relative min-h-dvh overflow-hidden bg-[#0B1220] text-[#F7F5F0]">
      <canvas ref={canvas} aria-hidden className={`absolute inset-0 ${mode === "anim" ? "" : "hidden"}`} />
      {/* soft glow behind the logo */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[36%] h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,75,89,.22),transparent_65%)]" />

      <h1 className={mode === "anim" ? "sr-only" : "absolute inset-x-0 top-[36%] -translate-y-1/2 px-6"}>
        <Logo className="mx-auto h-auto w-[min(84vw,760px)] [--logo-letters:#b4b4b9]" title="Synaxis Season 1" />
      </h1>

      <p className={`absolute inset-x-0 top-[50%] px-6 text-center font-mono text-[11px] uppercase tracking-[0.32em] text-[#9a9aa0] transition-opacity duration-500 sm:text-xs ${ready ? "opacity-100" : "opacity-0"}`}>
        Heuser Science Society · Season 1 · 15–17 Jan 2027
      </p>
      <div className={`absolute inset-x-0 top-[72%] flex -translate-y-1/2 flex-col items-center px-6 text-center transition-opacity duration-500 ${ready ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <button
          type="button"
          onClick={enter}
          className="btn btn-primary px-8 text-base shadow-[0_0_40px_rgba(242,75,89,.45)]"
          tabIndex={ready ? 0 : -1}
        >
          Enter the portal
        </button>
      </div>

      {mode === "anim" && (
        <Link
          href="/portal"
          onClick={() => {
            try {
              localStorage.setItem(SEEN_KEY, "1");
            } catch {}
          }}
          className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] rounded-full border border-white/25 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white/80 hover:bg-white/10"
        >
          Skip intro
        </Link>
      )}
      <noscript>
        <div className="absolute inset-x-0 bottom-16 text-center"><a href="/portal" className="btn btn-primary">Enter the portal</a></div>
      </noscript>
    </main>
  );
}
