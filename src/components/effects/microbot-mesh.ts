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
 * Short links only (nearest neighbours) and only while assembling. Reduced motion: plain text.
 */
import { loadMicrobotSprite, microbotSprite } from "./microbot-sprite";

type Bot = { sx: number; sy: number; tx: number; ty: number; d: number };
type Entry = { el: HTMLElement; canvas: HTMLCanvasElement; bots: Bot[]; links: [number, number][]; t0: number; w: number; h: number; color: string; finished: boolean };

const entries = new Set<Entry>();
let raf = 0;
const DURATION = 1000; // fly in + assemble
const FADE = 380; // swarm out / text in
const LINK_MAX = 9; // px: only close neighbours are linked

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
  const step = Math.max(3, Math.round(fs / 10)) * dpr;
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
    const pos: [number, number][] = [];
    for (const b of e.bots) {
      const p = Math.min(1, Math.max(0, (t - b.d) / (1 - 0.3)));
      const k = 1 - Math.pow(1 - p, 3);
      pos.push([b.sx + (b.tx - b.sx) * k, b.sy + (b.ty - b.sy) * k]);
    }
    // short links only while assembling
    if (t < 0.85) {
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 0.6;
      ctx.globalAlpha = swarmAlpha * 0.3 * (1 - t / 0.85);
      ctx.beginPath();
      for (const [a, b] of e.links) {
        const [ax, ay] = pos[a], [bx, by] = pos[b];
        if ((ax - bx) ** 2 + (ay - by) ** 2 > LINK_MAX * LINK_MAX * 4) continue;
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
      }
      ctx.stroke();
      ctx.globalAlpha = swarmAlpha;
    }
    const spr = microbotSprite(e.color, 4, 3);
    for (const [x, y] of pos) {
      if (spr) ctx.drawImage(spr, x - 2, y - 1.5, 4, 3);
      else {
        ctx.fillStyle = e.color;
        ctx.fillRect(x - 1.5, y - 1, 3, 2);
      }
    }
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
  const entry: Entry = { el, canvas, bots: [], links: [], t0: 0, w: 0, h: 0, color: "#000", finished: false };
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
    const stride = Math.max(1, Math.ceil(pts.length / 900));
    const kept = pts.filter((_, i) => i % stride === 0);
    entry.bots = kept.map(([tx, ty]) => ({
      tx, ty,
      sx: tx + (Math.random() - 0.5) * Math.min(entry.w, 600) * 0.6,
      sy: ty + (Math.random() - 0.5) * 140,
      d: Math.random() * 0.3,
    }));
    // link each point to its nearest neighbour to the right on the same scan row (short by construction)
    entry.links = [];
    for (let i = 0; i + 1 < kept.length; i++) {
      const [x1, y1] = kept[i], [x2, y2] = kept[i + 1];
      if (y1 === y2 && x2 - x1 <= LINK_MAX) entry.links.push([i, i + 1]);
    }
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
    setTimeout(() => finish(entry), DURATION + FADE + 900);
  };

  const io = new IntersectionObserver(([e]) => e.isIntersecting && start(), { rootMargin: "0px 0px -15% 0px" });
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
