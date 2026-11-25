"use client";
/**
 * Shared microbot mesh for headings (one rAF loop, one canvas per active heading, IO-gated).
 * Each heading samples its own glyph pixels into target points; microbots fly from a scatter
 * into those points while the real text fades in underneath, then the mesh fades out.
 * Hover makes the swarm ripple and re-form. Reduced motion: nothing runs.
 */
type Bot = { x: number; y: number; tx: number; ty: number; vx: number; vy: number };
type Entry = { el: HTMLElement; canvas: HTMLCanvasElement; bots: Bot[]; t0: number; active: boolean; done: boolean; hoverAt: number };

const entries = new Set<Entry>();
let raf = 0;
const DURATION = 900;

function sample(el: HTMLElement, w: number, h: number) {
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const ctx = off.getContext("2d")!;
  const cs = getComputedStyle(el);
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  ctx.textBaseline = "top";
  // wrap like the DOM does
  const words = (el.textContent ?? "").split(" ");
  const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.1;
  let line = "",
    y = (lh - parseFloat(cs.fontSize)) / 2;
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > w && line) {
      ctx.fillText(line, 0, y);
      line = word;
      y += lh;
    } else line = test;
  }
  ctx.fillText(line, 0, y);
  const data = ctx.getImageData(0, 0, w, h).data;
  const pts: [number, number][] = [];
  const step = Math.max(4, Math.round(parseFloat(cs.fontSize) / 9));
  for (let yy = 0; yy < h; yy += step)
    for (let xx = 0; xx < w; xx += step) if (data[(yy * w + xx) * 4 + 3] > 128) pts.push([xx, yy]);
  return pts;
}

function tick(now: number) {
  let any = false;
  for (const e of entries) {
    if (!e.active || e.done) continue;
    any = true;
    const ctx = e.canvas.getContext("2d")!;
    const { width: w, height: h } = e.canvas;
    const dpr = devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const t = Math.min(1, (now - e.t0) / DURATION);
    const ease = 1 - Math.pow(1 - t, 3);
    const ripple = Math.max(0, 1 - (now - e.hoverAt) / 500);
    const color = getComputedStyle(e.el).color;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 1 - Math.max(0, (t - 0.75) / 0.25) * (ripple > 0 ? 0.3 : 1);
    for (let i = 0; i < e.bots.length; i++) {
      const b = e.bots[i];
      const wob = ripple * Math.sin(now / 60 + i) * 6;
      const x = b.x + (b.tx - b.x) * ease + wob;
      const y = b.y + (b.ty - b.y) * ease + wob * 0.6;
      ctx.fillRect(x - 1.5, y - 1, 3, 2);
      if (i % 3 === 0 && i + 3 < e.bots.length) {
        const n = e.bots[i + 3];
        ctx.globalAlpha *= 0.25;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(n.x + (n.tx - n.x) * ease, n.y + (n.ty - n.y) * ease);
        ctx.stroke();
        ctx.globalAlpha /= 0.25;
      }
    }
    e.el.style.setProperty("--mb-text", String(Math.max(0, (t - 0.45) / 0.55)));
    if (t >= 1 && ripple === 0) {
      ctx.clearRect(0, 0, w, h);
      e.done = true;
    }
  }
  raf = any ? requestAnimationFrame(tick) : 0;
}
const kick = () => {
  if (!raf) raf = requestAnimationFrame(tick);
};

export function registerHeading(el: HTMLElement) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (sessionStorage.getItem("synaxis-skip-fx") === "1") return;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "pointer-events-none absolute left-0 top-0";
  el.appendChild(canvas);
  el.classList.add("mb-pending");
  const entry: Entry = { el, canvas, bots: [], t0: 0, active: false, done: false, hoverAt: -1e9 };

  const build = () => {
    const r = el.getBoundingClientRect();
    const dpr = devicePixelRatio || 1;
    const w = Math.ceil(r.width),
      h = Math.ceil(r.height);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const pts = sample(el, w, h);
    const max = 900;
    const stride = Math.max(1, Math.ceil(pts.length / max));
    entry.bots = pts
      .filter((_, i) => i % stride === 0)
      .map(([tx, ty]) => ({ tx, ty, x: tx + (Math.random() - 0.5) * w * 0.8, y: ty + (Math.random() - 0.5) * 160, vx: 0, vy: 0 }));
  };

  const io = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting && !entry.active) {
        build();
        entry.active = true;
        entry.t0 = performance.now();
        el.classList.remove("mb-pending");
        el.classList.add("mb-run");
        kick();
        // Failsafe: text must always end up visible even if rAF is throttled (background tab, low power).
        setTimeout(() => {
          el.style.setProperty("--mb-text", "1");
          entry.done = true;
          canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
        }, DURATION + 700);
      }
    },
    { rootMargin: "0px 0px -15% 0px" },
  );
  io.observe(el);
  const onHover = () => {
    if (!entry.done) return;
    entry.done = false;
    entry.hoverAt = performance.now();
    entry.t0 = performance.now() - DURATION; // stay formed, just ripple
    kick();
  };
  el.addEventListener("pointerenter", onHover);
  entries.add(entry);
  return () => {
    io.disconnect();
    el.removeEventListener("pointerenter", onHover);
    canvas.remove();
    entries.delete(entry);
  };
}
