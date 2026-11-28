"use client";
import { useIdleImport } from "./DeferredEffects";

const load = () =>
  Promise.all([import("./RocketFist"), import("./CursorTrail"), import("./DecorObservers")]).then(([a, b, c]) => ({
    RocketFist: a.RocketFist,
    CursorTrail: b.CursorTrail,
    DecorObservers: c.DecorObservers,
  }));

/** Site-layout effects (rocket-fist scroll indicator, cursor trail, decor observers), loaded when idle. */
export function DeferredSiteEffects() {
  const m = useIdleImport(load);
  if (!m) return null;
  return (
    <>
      <m.RocketFist />
      <m.CursorTrail />
      <m.DecorObservers />
    </>
  );
}
