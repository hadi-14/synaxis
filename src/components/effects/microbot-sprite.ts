"use client";
import { bh6 } from "@/lib/bh6-assets";

/**
 * Tinted microbot sprites from /assets/bh6/microbot.png (only when the real file exists).
 * Returns a draw function, or null so callers keep their rectangle fallback.
 */
const cache = new Map<string, HTMLCanvasElement>();
let img: HTMLImageElement | null = null;
let ready = false;

export function loadMicrobotSprite(onReady?: () => void) {
  const a = bh6("microbot");
  if (!a.real || img) return;
  img = new Image();
  img.decoding = "async";
  img.src = a.src;
  img.onload = () => {
    ready = true;
    onReady?.();
  };
}

export function microbotSprite(color: string, w: number, h: number): HTMLCanvasElement | null {
  if (!ready || !img) return null;
  const key = `${color}|${w}|${h}`;
  let c = cache.get(key);
  if (!c) {
    c = document.createElement("canvas");
    const dpr = Math.min(2, devicePixelRatio || 1);
    c.width = Math.ceil(w * dpr);
    c.height = Math.ceil(h * dpr);
    const x = c.getContext("2d")!;
    x.drawImage(img, 0, 0, c.width, c.height);
    x.globalCompositeOperation = "source-atop";
    x.globalAlpha = 0.55;
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    cache.set(key, c);
  }
  return c;
}
