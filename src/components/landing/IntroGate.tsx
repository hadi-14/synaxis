"use client";
import { useEffect, useState } from "react";
import { IntroOverlay } from "./IntroOverlay";

/**
 * The cover is pure CSS (html[data-intro], globals.css). The intro code is part of the home page's own bundle
 * (about 10 KB gzipped), so it downloads with the page instead of after hydration; it only runs when the
 * pre-paint script decided to play it. Bots get /home-static, which has no IntroGate at all (src/proxy.ts).
 */
export function IntroGate() {
  const [play, setPlay] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the attribute set before first paint
    if (document.documentElement.dataset.intro) setPlay(true);
  }, []);
  return play ? <IntroOverlay /> : null;
}
