"use client";
import { useEffect, useState } from "react";

// Decorative effects load after the page is idle so they never compete with first paint / interaction.

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

/**
 * Import modules once the page is idle, then render them. A plain import() + setState on purpose, not
 * next/dynamic: dynamic() resolves through Suspense, and a Suspense reveal starts a React view transition,
 * which played the page's microbot dissolve over the hero right after the intro.
 */
export function useIdleImport<T>(load: () => Promise<T>): T | null {
  const [mod, setMod] = useState<{ m: T } | null>(null);
  useEffect(() => {
    let live = true;
    whenIdle(() => void load().then((m) => live && setMod({ m })));
    return () => {
      live = false;
    };
  }, [load]);
  return mod ? mod.m : null;
}

const loadGlobal = () =>
  Promise.all([import("@/components/eggs/EasterEggs"), import("./MicrobotBurst")]).then(([a, b]) => ({ EasterEggs: a.EasterEggs, MicrobotBurst: b.MicrobotBurst }));

/** Global (root layout) effects, loaded when idle. */
export function DeferredEffects() {
  const m = useIdleImport(loadGlobal);
  if (!m) return null;
  return (
    <>
      <m.EasterEggs />
      <m.MicrobotBurst />
    </>
  );
}
