"use client";
import { bh6 } from "@/lib/bh6-assets";

/**
 * Microbot sprites from the team's /assets/bh6/microbot.png (a vertical rod).
 * Sprites are pre-rendered once per colour and length bucket, laid HORIZONTALLY (pointing +x), so callers
 * rotate them along the direction of motion. Below ~5px length a plain rounded dash is drawn instead.
 */
const cache = new Map<string, HTMLCanvasElement>();
let img: HTMLImageElement | null = null;
let ready = false;
const waiters: (() => void)[] = [];
const ASPECT = 82 / 360; // processed microbot.png width / height

export function loadMicrobotSprite(onReady?: () => void) {
  if (ready) return onReady?.();
  if (onReady) waiters.push(onReady);
  const a = bh6("microbot");
  if (!a.real || img) return;
  img = new Image();
  img.decoding = "async";
  img.src = a.src;
  img.onload = () => {
    ready = true;
    waiters.splice(0).forEach((f) => f());
  };
}

export const microbotReady = () => ready;

function sprite(color: string, len: number) {
  const bucket = Math.max(4, Math.round(len));
  const key = `${color}|${bucket}`;
  let c = cache.get(key);
  if (!c && img) {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = Math.ceil(bucket * dpr), h = Math.max(2, Math.ceil(bucket * ASPECT * dpr));
    c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const x = c.getContext("2d")!;
    x.translate(w / 2, h / 2);
    x.rotate(Math.PI / 2); // vertical source → horizontal sprite
    x.drawImage(img, -h / 2, -w / 2, h, w);
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = "source-atop";
    x.globalAlpha = 0.5;
    x.fillStyle = color;
    x.fillRect(0, 0, w, h);
    cache.set(key, c);
  }
  return c;
}

/** Draw one microbot centred at (x, y), rotated by `angle` (radians), `len` px long. Caller restores transform. */
export function drawMicrobot(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, len: number, color: string, dpr: number) {
  const s = ready && len >= 5 ? sprite(color, len) : null;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  ctx.setTransform(cos * dpr, sin * dpr, -sin * dpr, cos * dpr, x * dpr, y * dpr);
  const h = Math.max(1.6, len * ASPECT);
  if (s) ctx.drawImage(s, -len / 2, -h / 2, len, h);
  else {
    ctx.fillStyle = color;
    ctx.fillRect(-len / 2, -h / 2, len, h);
  }
}

/** Legacy helper (intro): returns a horizontal sprite canvas or null. */
export function microbotSprite(color: string, w: number): HTMLCanvasElement | null {
  return ready ? (sprite(color, w) ?? null) : null;
}
