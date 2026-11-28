"use client";
import dynamic from "next/dynamic";
import { useIdle } from "./DeferredEffects";

const RocketFist = dynamic(() => import("./RocketFist").then((m) => m.RocketFist), { ssr: false });
const CursorTrail = dynamic(() => import("./CursorTrail").then((m) => m.CursorTrail), { ssr: false });
const DecorObservers = dynamic(() => import("./DecorObservers").then((m) => m.DecorObservers), { ssr: false });

/** Site-layout effects (rocket-fist scroll indicator, cursor trail, decor observers), loaded when idle. */
export function DeferredSiteEffects() {
  const idle = useIdle();
  if (!idle) return null;
  return (
    <>
      <RocketFist />
      <CursorTrail />
      <DecorObservers />
    </>
  );
}
