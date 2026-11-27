"use client";
/**
 * Microbot headings (one shared rAF loop, IntersectionObserver-gated, once per heading per visit).
 *
 * Targets come from the REAL rendered text: after document.fonts.ready, each glyph's box is read with
 * Range.getClientRects() and the glyph is drawn into an offscreen canvas at exactly that spot (same font,
 * size and weight; letter-spacing and line wrapping come from the DOM boxes themselves). Pixels are
 * sampled into particle targets, so the swarm always forms on top of the real text at any width.
 *
 * Sequence: fly in → assemble → swarm fades to 0 while the real text fades in → canvas removed.
 * Bots are microbot.png rods one sample-step long, so a docked row reads as a linked chain. Reduced motion: plain text.
 */
import { drawMicrobot, loadMicrobotSprite } from "./microbot-sprite";

type Bot = { sx: number; sy: number; tx: number; ty: number; d: number };
type Entry = { el: HTMLElement; canvas: HTMLCanvasElement; bots: Bot[]; t0: number; w: number; h: number; color: string; finished: boolean; rod: number };

const entries = new Set<Entry>();
let raf = 0;
const DURATION = 560; // fly in + assemble (≈0.8 s with the fade)
const FADE = 240; // swarm out / text in

function sampleTargets(el: HTMLElement, w: number, h: number) {
  const dpr = Math.min(2, devicePixelRatio || 1);
  const off = document.createElement("canvas");
  off.width = Math.ceil(w * dpr);
  off.height = Math.ceil(h * dpr);
  const ctx = off.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(dpr, dpr);
  const cs = getComputedStyle(el);
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000";
  const box = el.getBoundingClientRect();
  const range = document.createRange();
  // Walk text nodes only (the heading also contains our canvas).
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const text = node.data;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (!ch.trim()) continue;
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const r = range.getClientRects()[0];
      if (!r) continue;
      ctx.fillText(ch, r.left - box.left, r.top - box.top + r.height / 2);
    }
  }
  const data = ctx.getImageData(0, 0, off.width, off.height).data;
  const fs = parseFloat(cs.fontSize);
  const step = Math.max(4, Math.round(fs / 8)) * dpr; // = rod length, so neighbours in a row touch end to end
  const pts: [number, number][] = [];
  for (let y = 0; y < off.height; y += step)
    for (let x = 0; x < off.width; x += step) if (data[(y * off.width + x) * 4 + 3] > 120) pts.push([x / dpr, y / dpr]);
  return pts;
}

function tick(now: number) {
  let any = false;
  for (const e of entries) {
    if (e.finished || !e.t0) continue;
    any = true;
    const t = (now - e.t0) / DURATION;
    const ctx = e.canvas.getContext("2d")!;
    const dpr = Math.min(2, devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, e.w, e.h);
    const fadeT = Math.max(0, (now - e.t0 - DURATION) / FADE); // 0..1 after assembly
    const swarmAlpha = 1 - Math.min(1, fadeT);
    e.el.style.setProperty("--mb-text", String(Math.min(1, fadeT)));
    if (swarmAlpha <= 0) {
      finish(e);
      continue;
    }
    ctx.globalAlpha = swarmAlpha;
    for (const b of e.bots) {
      const p = Math.min(1, Math.max(0, (t - b.d) / (1 - 0.3)));
      const k = 1 - Math.pow(1 - p, 3);
      const x = b.sx + (b.tx - b.sx) * k, y = b.sy + (b.ty - b.sy) * k;
      // rotate along the flight path, then snap level as it docks
      const heading = Math.atan2(b.ty - b.sy, b.tx - b.sx);
      const angle = heading * (1 - Math.min(1, p * 1.25));
      drawMicrobot(ctx, x, y, angle, e.rod, e.color, dpr);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  raf = any ? requestAnimationFrame(tick) : 0;
}
const kick = () => {
  if (!raf) raf = requestAnimationFrame(tick);
};

function finish(e: Entry) {
  if (e.finished) return;
  e.finished = true;
  e.el.style.setProperty("--mb-text", "1");
  e.el.classList.remove("mb-pending", "mb-run");
  e.canvas.remove(); // nothing left behind
  entries.delete(e);
}

export function registerHeading(el: HTMLElement) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const key = `mb:${location.pathname}:${el.textContent?.trim()}`;
  try {
    if (sessionStorage.getItem(key)) return; // once per heading per visit
  } catch {}
  loadMicrobotSprite();
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "pointer-events-none absolute left-0 top-0";
  el.appendChild(canvas);
  el.classList.add("mb-pending");
  const entry: Entry = { el, canvas, bots: [], t0: 0, w: 0, h: 0, color: "#000", finished: false, rod: 6 };
  entries.add(entry);

  const build = () => {
    const r = el.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    entry.w = Math.ceil(r.width);
    entry.h = Math.ceil(r.height);
    canvas.width = entry.w * dpr;
    canvas.height = entry.h * dpr;
    canvas.style.width = `${entry.w}px`;
    canvas.style.height = `${entry.h}px`;
    entry.color = getComputedStyle(el).color;
    const pts = sampleTargets(el, entry.w, entry.h);
    entry.rod = Math.max(4, Math.round(parseFloat(getComputedStyle(el).fontSize) / 8));
    const stride = Math.max(1, Math.ceil(pts.length / 700));
    const kept = pts.filter((_, i) => i % stride === 0);
    entry.bots = kept.map(([tx, ty]) => ({
      tx, ty,
      sx: tx + (Math.random() - 0.5) * Math.min(entry.w, 600) * 0.6,
      sy: ty + 40 + Math.random() * 90, // pour up from below
      d: Math.random() * 0.3,
    }));
  };

  let started = false;
  const start = async () => {
    if (started) return;
    started = true;
    try {
      await document.fonts?.ready;
    } catch {}
    build();
    if (!entry.bots.length) return finish(entry);
    try {
      sessionStorage.setItem(key, "1");
    } catch {}
    el.classList.remove("mb-pending");
    el.classList.add("mb-run");
    el.style.setProperty("--mb-text", "0");
    entry.t0 = performance.now();
    kick();
    // Failsafe: the real text always ends up visible (throttled rAF, background tabs).
    setTimeout(() => finish(entry), DURATION + FADE + 500);
  };

  const io = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting) start();
      else if (started && !entry.finished) finish(entry); // scrolled past mid-animation: show the text, never a half state
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  io.observe(el);
  const onResize = () => {
    if (started && !entry.finished) finish(entry); // never animate against stale geometry
  };
  addEventListener("resize", onResize);
  return () => {
    io.disconnect();
    removeEventListener("resize", onResize);
    finish(entry);
  };
}
