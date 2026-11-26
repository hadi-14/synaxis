"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const IntroOverlay = dynamic(() => import("./IntroOverlay").then((m) => m.IntroOverlay), { ssr: false });

/**
 * Server-renders only the solid cover (shown pre-paint via html[data-intro]); the intro code itself is
 * downloaded only when the pre-paint script decided to play it, so normal visits never pay for it.
 */
export function IntroGate() {
  const [play, setPlay] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the attribute set before first paint
    if (document.documentElement.dataset.intro) setPlay(true);
  }, []);
  return (
    <>
      <div aria-hidden className="intro-cover fixed inset-0 z-[200] hidden bg-[#0B1220]" />
      {play && <IntroOverlay />}
    </>
  );
}
