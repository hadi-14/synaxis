"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Decorative effects load after the page is idle so they never compete with first paint / interaction.
const EasterEggs = dynamic(() => import("@/components/eggs/EasterEggs").then((m) => m.EasterEggs), { ssr: false });
const MicrobotBurst = dynamic(() => import("./MicrobotBurst").then((m) => m.MicrobotBurst), { ssr: false });

export function whenIdle(cb: () => void, timeout = 2500) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(cb, { timeout });
  else setTimeout(cb, 1200);
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
