// Captures the intro's cover still from the real smoke shader (src/components/landing/smoke-gl.ts) at its opening
// state over the intro's night sky, and writes public/intro/smoke-{landscape,portrait}.{avif,webp}.
// Re-run after changing the shader:
//   npx esbuild scripts/intro-still/entry.ts --bundle --format=iife --outfile=scripts/intro-still/entry.js
//   npm i --no-save playwright-core && node scripts/intro-still/capture.mjs
// Needs a Chromium with WebGL (set CHROME_PATH, or a Playwright-installed Chromium).
import { chromium } from "playwright-core";
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const dir = new URL(".", import.meta.url).pathname;
mkdirSync("public/intro", { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ["--use-angle=gl", "--ignore-gpu-blocklist", "--enable-gpu"] });
// same octaves / render scale as the live scene (desktop 5 @ 0.5, phone 4 @ 0.4)
for (const [name, w, h, oct, scale] of [["landscape", 1600, 1000, 5, 0.5], ["portrait", 900, 1600, 4, 0.4]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`file://${dir}index.html?t=1.5&oct=${oct}&scale=${scale}`);
  await page.waitForFunction(() => window.__done);
  const png = await page.screenshot();
  await sharp(png).avif({ quality: 64, effort: 9, bitdepth: 10 }).toFile(`public/intro/smoke-${name}.avif`);
  await sharp(png).webp({ quality: 82, effort: 6 }).toFile(`public/intro/smoke-${name}.webp`);
  await page.close();
}
await browser.close();
console.log("wrote public/intro/smoke-*.{avif,webp}");
