"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Skyline } from "@/components/decor/Skyline";
import { HeuserMark } from "@/components/brand/Heuser";
import { HEUSER_WORD, HEUSER_WORD_VIEWBOX } from "@/components/brand/heuser-paths";
import { bh6 } from "@/lib/bh6-assets";
import { createIntroScene, type IntroScene, type SceneLayout, type SceneMode } from "./intro-scene";

/**
 * Opening sequence (canvas + smoke in ./intro-scene.ts and ./smoke-gl.ts).
 * - Decided before first paint by the inline script in app/layout.tsx (html[data-intro]), which also shows
 *   an opaque cover from the very first frame (globals.css), so the page never shows through.
 *   It plays in full on every full page load of "/" (never on client-side navigation). ?intro=full|off overrides.
 * - Full: "HELLO." types where the logo will be → microbots assemble SYNAXIS and lock into the crisp logo,
 *   a smoke nebula churns behind it in a soft energy ring → Heuser mark, subtitle, "Enter the portal" →
 *   dive into the vortex → the smoke parts onto the real hero.
 * - Nothing but the Enter button starts the dive: stray keys while the page opens do nothing.
 * - Reduced motion: a still frame, then a crossfade. Skip intro is always there (and Escape); it skips only this time.
 */
const HELLO = "HELLO.";

type Stage = 0 | 1 | 2 | 3 | 4 | 5; // hello · bots (hello fades) · Heuser · subtitle · Enter ready · diving

/** A few paper lanterns at the edges, out of focus (blurred, dim) and swaying slowly: depth, not decoration. */
function Lanterns() {
  const L = [
    { x: "4%", y: 70, s: 1.1, d: 0, blur: 3 },
    { x: "13%", y: 128, s: 0.7, d: 2.2, blur: 1.5 },
    { x: "88%", y: 112, s: 0.75, d: 1.1, blur: 1.5 },
    { x: "96%", y: 56, s: 1.15, d: 3.4, blur: 3 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[40vh] opacity-60">
      {L.map((l, i) => (
        <div key={i} className={`absolute top-0 -translate-x-1/2 ${i === 1 || i === 2 ? "hidden sm:block" : ""}`} style={{ left: l.x, filter: `blur(${l.blur}px)` }}>
          <div className="flex origin-top flex-col items-center motion-safe:animate-[lantern-sway_9s_ease-in-out_infinite]" style={{ animationDelay: `-${l.d}s` }}>
            <div className="w-px bg-white/15" style={{ height: l.y }} />
            <svg viewBox="0 0 40 56" className="-mt-px drop-shadow-[0_0_14px_rgba(242,75,89,.45)]" style={{ width: 40 * l.s }}>
              <rect x="13" y="0" width="14" height="5" rx="1.5" fill="#2a0c14" />
              <ellipse cx="20" cy="28" rx="18" ry="22" fill="#B3202C" />
              <ellipse cx="20" cy="28" rx="11" ry="18" fill="#DC4250" />
              <ellipse cx="20" cy="27" rx="5" ry="11" fill="#FFD6DA" opacity=".4" />
              <rect x="13" y="48" width="14" height="5" rx="1.5" fill="#2a0c14" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}

export function IntroOverlay() {
  const [mode, setMode] = useState<SceneMode | "off">("off");
  const [stage, setStage] = useState<Stage>(0);
  const [typed, setTyped] = useState(0);
  const [box, setBox] = useState<SceneLayout | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const glCanvas = useRef<HTMLCanvasElement>(null);
  const fallback = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const enterBtn = useRef<HTMLButtonElement>(null);
  const scene = useRef<IntroScene | null>(null);
  const started = useRef(false);
  const skipQueued = useRef(false); // Skip pressed before the scene existed: applied as soon as it does

  useEffect(() => {
    const html = document.documentElement;
    const m = html.dataset.intro;
    if (m !== "full") return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* eslint-disable react-hooks/set-state-in-effect -- reads what the pre-paint script decided */
    setMode(reduced ? "reduced" : "full");
    if (reduced) setStage(4);
    /* eslint-enable react-hooks/set-state-in-effect */
    html.dataset.introLive = "1"; // tells the pre-paint safety timer the intro is running
    scrollTo({ top: 0, left: 0, behavior: "instant" }); // land on the hero (a reload may have restored the old position)
    html.style.overflow = "hidden";
  }, []);

  // Modal focus: the dialog itself first (so a stray key does nothing), the Enter button once it is ready.
  useEffect(() => {
    if (mode !== "off") root.current?.focus({ preventScroll: true });
  }, [mode]);
  // (focus moves to the button only for keyboard users; on touch/mouse a programmatic focus would show a ring)
  const usedKeys = useRef(false);
  useEffect(() => {
    const k = () => (usedKeys.current = true);
    addEventListener("keydown", k, { once: true });
    return () => removeEventListener("keydown", k);
  }, []);
  useEffect(() => {
    if (stage === 4 && usedKeys.current) enterBtn.current?.focus({ preventScroll: true });
  }, [stage, mode]);

  // "HELLO." types out first, where the logo will form (one character per 90 ms)
  useEffect(() => {
    if (mode !== "full" || typed >= HELLO.length) return;
    const t = setTimeout(() => setTyped((n) => n + 1), typed === 0 ? 150 : 90);
    return () => clearTimeout(t);
  }, [mode, typed]);

  const finish = useCallback(() => {
    const html = document.documentElement;
    delete html.dataset.intro;
    delete html.dataset.introLive;
    delete html.dataset.introReady;
    html.style.overflow = "";
    if ("scrollRestoration" in history) history.scrollRestoration = "auto"; // turned off by the pre-paint script
    document.querySelector<HTMLElement>("#main")?.focus({ preventScroll: true });
    setTimeout(() => {
      delete html.dataset.heroEnter;
      document.querySelectorAll<HTMLElement>("[data-hero-fly]").forEach((el) => {
        el.style.removeProperty("--fly-x");
        el.style.removeProperty("--fly-y");
      });
    }, 1800);
    setMode("off");
  }, []);

  const enter = useCallback(() => {
    if (started.current || !scene.current) return;
    started.current = true;
    scene.current.hover(false);
    setStage(5);
    scene.current.activate();
  }, []);

  const skip = useCallback(() => {
    started.current = true;
    setStage(5);
    if (scene.current) scene.current.skip();
    else skipQueued.current = true;
  }, []);

  useEffect(() => {
    if (mode === "off") return;
    const html = document.documentElement;
    const s = createIntroScene({
      canvas: canvas.current!,
      glCanvas: glCanvas.current!,
      fallback: fallback.current!,
      root: root.current!,
      shell: shell.current!,
      mode,
      forceCss: new URLSearchParams(location.search).get("smoke") === "css", // testing aid: the no-WebGL path
      baymaxSrc: `/_next/image?url=${encodeURIComponent(bh6("hiro-baymax-flying").src)}&w=640&q=75`,
      ev: {
        stage: (n) => setStage((cur) => (cur >= 5 ? cur : n)),
        layout: setBox,
        // the cover (pre-paint) stays visible until the scene has drawn its first frame; then the intro takes over
        ready: () => (html.dataset.introReady = "1"),
        open: (x, y) => {
          scrollTo({ top: 0, left: 0, behavior: "instant" }); // still covered: the page is revealed at the hero
          // Baymax lands in the hero from the portal's centre (globals.css: hero-fly)
          document.querySelectorAll<HTMLElement>("[data-hero-fly]").forEach((el) => {
            const r = el.getBoundingClientRect();
            el.style.setProperty("--fly-x", `${(x - (r.left + r.width / 2)).toFixed(0)}px`);
            el.style.setProperty("--fly-y", `${(y - (r.top + r.height / 2)).toFixed(0)}px`);
          });
          html.dataset.heroEnter = "1";
          html.dataset.intro = "open"; // drops the pre-paint cover: the smoke now reveals the real page
        },
        done: finish,
      },
    });
    scene.current = s;
    if (skipQueued.current) s.skip();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && skip();
    addEventListener("keydown", onKey);
    return () => {
      s.destroy();
      scene.current = null;
      removeEventListener("keydown", onKey);
    };
  }, [mode, finish, skip]);

  if (mode === "off") return null;
  const ui = stage < 5;
  const glow = (on: boolean) => scene.current?.hover(on && !started.current);
  const show = (on: boolean, slow = "duration-700") => (on && ui ? `opacity-100 ${slow}` : "opacity-0 duration-150");

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="Synaxis intro"
      tabIndex={-1}
      className="intro-root fixed inset-0 z-[201] select-none outline-none"
      onPointerMove={(e) => e.pointerType === "mouse" && scene.current?.pointer({ x: e.clientX, y: e.clientY })}
      onPointerLeave={() => scene.current?.pointer(null)}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse" && !(e.target as HTMLElement).closest("button")) scene.current?.tap(e.clientX, e.clientY);
      }}
    >
      {/* the night sky: deep navy, a few out-of-focus lanterns, the skyline silhouette */}
      <div ref={shell} className="absolute inset-0 overflow-hidden bg-[radial-gradient(120%_90%_at_50%_45%,#11102e_0%,#090a1c_55%,#05060f_100%)]">
        <Lanterns />
        <Skyline variant="night" eager className="absolute inset-x-0 bottom-0 h-[min(32vh,max(130px,16vw))] w-full opacity-80" />
      </div>
      {/* the smoke: WebGL, or (no WebGL / slow device) layered CSS gradients */}
      <canvas ref={glCanvas} aria-hidden className="absolute inset-0" />
      <div ref={fallback} aria-hidden className="intro-smoke-css absolute inset-0 hidden" />
      <canvas ref={canvas} aria-hidden className="pointer-events-none absolute inset-0" />
      {/* film grain over everything */}
      <div aria-hidden className="intro-grain pointer-events-none absolute -inset-[50%]" />

      {box && (
        <>
          {/* "HELLO." types first, in the logo's place, and fades as the bots arrive */}
          <p
            aria-live="polite"
            className={`pointer-events-none absolute inset-x-0 -translate-y-1/2 text-center font-mono text-3xl font-bold tracking-[0.32em] text-white [text-shadow:0_0_18px_rgba(192,75,217,.8)] transition-opacity sm:text-5xl ${stage === 0 && ui ? "opacity-100 duration-200" : "opacity-0 duration-500"}`}
            style={{ top: box.logoCy }}
          >
            {HELLO.slice(0, typed)}
            <span aria-hidden className="ml-1 inline-block h-[.9em] w-[.5em] translate-y-[.1em] bg-[#C04BD9] motion-safe:animate-[blink_1s_steps(2)_infinite]" />
          </p>
          {/* Heuser mark + traced HEUSER lettering */}
          <div className={`pointer-events-none absolute left-1/2 flex h-8 -translate-x-1/2 items-center gap-3 text-white transition-opacity sm:h-10 ${show(stage >= 2)}`} style={{ top: box.heuserTop }}>
            <HeuserMark className="h-8 w-auto sm:h-10" />
            <svg viewBox={HEUSER_WORD_VIEWBOX} className="h-3 w-auto sm:h-3.5" role="img" aria-label="Heuser">
              <path d={HEUSER_WORD} fill="currentColor" fillRule="evenodd" />
            </svg>
          </div>
          {/* one subtitle line */}
          <p
            className={`pointer-events-none absolute inset-x-0 flex h-4 items-center justify-center px-4 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#E9E4F5] [text-shadow:0_1px_10px_rgba(5,5,20,.9)] transition-opacity sm:h-6 sm:text-sm sm:tracking-[0.3em] ${show(stage >= 3)}`}
            style={{ top: box.subTop }}
          >
            Season 1 · 15–17 Jan 2027 · Karachi
          </p>
          {/* Enter the portal */}
          <div className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 transition-[opacity,transform] duration-500 ${stage === 4 && ui ? "opacity-100" : "pointer-events-none translate-y-1 opacity-0"}`} style={{ top: box.btnCy }}>
            <button
              ref={enterBtn}
              type="button"
              onClick={enter}
              onPointerEnter={() => glow(true)}
              onPointerLeave={() => glow(false)}
              onFocus={(e) => glow(e.currentTarget.matches(":focus-visible"))}
              onBlur={() => glow(false)}
              tabIndex={stage === 4 ? 0 : -1}
              aria-hidden={stage !== 4}
              className="intro-enter inline-flex h-12 items-center whitespace-nowrap rounded-full bg-[#DC2A35] px-6 font-mono text-[13px] font-bold uppercase tracking-[0.16em] sm:text-sm sm:tracking-[0.22em] text-white transition-[transform,background-color,box-shadow] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-1 hover:bg-[#E8323E] active:translate-y-0 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white sm:h-14 sm:px-9"
            >
              Enter the portal
            </button>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={skip}
        className={`absolute right-4 top-[max(1rem,env(safe-area-inset-top))] rounded-full border border-white/25 bg-[#090a1c]/40 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white/80 backdrop-blur-sm transition-opacity hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${ui ? "" : "pointer-events-none opacity-0"}`}
      >
        Skip intro
      </button>
      <style>{`@keyframes blink{50%{opacity:0}}@keyframes lantern-sway{0%,100%{transform:rotate(-1.8deg)}50%{transform:rotate(1.8deg)}}`}</style>
    </div>
  );
}
