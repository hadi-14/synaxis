// Renders one frame of the real intro smoke (see capture.mjs).
import { createSmoke } from "../../src/components/landing/smoke-gl";
// Render one frame of the real intro smoke at its opening state (no ring, at rest), like the live scene.
const q = new URLSearchParams(location.search);
const W = innerWidth, H = innerHeight, t = Number(q.get("t") ?? 1.5);
const cv = document.getElementById("c") as HTMLCanvasElement;
const smoke = createSmoke(cv, Number(q.get("scale") ?? 0.5), Number(q.get("oct") ?? 5), true)!;
smoke.resize(W, H);
smoke.render({ time: t, cx: W / 2, cy: Math.round((H * 0.46) / 8) * 8, ring: 0, ringA: 0, twist: 0.16 * t, bright: 0, zoom: 1, dive: 0, cover: 0, burst: 1, part: 0, heat: 0, heatCol: [0.86, 0.165, 0.21] });
(window as unknown as { __done: boolean }).__done = true;
