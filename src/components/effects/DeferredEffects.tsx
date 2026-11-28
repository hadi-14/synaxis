"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Decorative effects load after the page is idle so they never compete with first paint / interaction.
const EasterEggs = dynamic(() => import("@/components/eggs/EasterEggs").then((m) => m.EasterEggs), { ssr: false });
const MicrobotBurst = dynamic(() => import("./MicrobotBurst").then((m) => m.MicrobotBurst), { ssr: false });

/**
 * Run when the page is idle. While the intro is playing (html[data-intro]) everything deferred (analytics,
 * easter eggs, decorative effects) waits until it has ended, so the intro gets the network and main thread.
 */
export function whenIdle(cb: () => void, timeout = 2500) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  const run = () => (w.requestIdleCallback ? w.requestIdleCallback(cb, { timeout }) : setTimeout(cb, 1200));
  if (document.documentElement.dataset.intro) addEventListener("synaxis:intro-done", run, { once: true });
  else run();
}

export function useIdle() {
  const [idle, setIdle] = useState(false);
  useEffect(() => whenIdle(() => setIdle(true)), []);
  return idle;
}

/** Global (root layout) effects, loaded when idle. */
export function DeferredEffects() {
  const idle = useIdle();
  if (!idle) return null;
  return (
    <>
      <EasterEggs />
      <MicrobotBurst />
    </>
  );
}
