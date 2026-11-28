"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BH6Image } from "@/components/brand/BH6Image";
import { FistBump } from "@/components/effects/FistBump";
import { SECRET_TOTAL, foundSecret } from "./secrets";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

/** Global easter eggs: Konami fist bump, "hairy baby", Mochi peeking, dev-console note. Never blocks input. */
export function EasterEggs() {
  const [overlay, setOverlay] = useState<"fist" | "hairy" | null>(null);
  const [mochi, setMochi] = useState<{ top: number } | null>(null);
  const path = usePathname();

  // Konami + "hairy baby"
  useEffect(() => {
    let k = 0;
    let typed = "";
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      k = key === KONAMI[k] ? k + 1 : key === KONAMI[0] ? 1 : 0;
      if (k === KONAMI.length) {
        k = 0;
        setOverlay("fist");
        foundSecret("fist-bump");
        setTimeout(() => setOverlay(null), 2200);
      }
      if (e.key.length === 1) {
        typed = (typed + e.key.toLowerCase()).slice(-10);
        if (typed.endsWith("hairy baby")) {
          setOverlay("hairy");
          foundSecret("hairy-baby");
          setTimeout(() => setOverlay(null), 2600);
        }
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  // Mochi peeks from a section edge on ~1 in 4 home page views
  useEffect(() => {
    if (path !== "/" || Math.random() > 0.25 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => {
      const sections = [...document.querySelectorAll("main section")];
      const s = sections[1 + Math.floor(Math.random() * Math.max(1, sections.length - 1))] as HTMLElement | undefined;
      if (!s) return;
      setMochi({ top: s.getBoundingClientRect().top + scrollY + 40 });
      setTimeout(() => setMochi(null), 9000);
    }, 6000);
    return () => clearTimeout(t);
  }, [path]);

  // A note for curious CS students
  useEffect(() => {
    if ((window as unknown as { __synaxisHello?: boolean }).__synaxisHello) return;
    (window as unknown as { __synaxisHello?: boolean }).__synaxisHello = true;
    console.log(
      `%cSYNA%cX%cIS%c\n\nHello. I am Baymax. I noticed you opened the console.\nOn a scale of 1 to 10, how curious are you?\n\n> There are ${SECRET_TOTAL} secrets on this site. One of them is up up down down…\n> Hamada's Hangar (Computer Science) might be your module.\n> Built with Next.js + Supabase by the Heuser Science Society.\n\nType baymax() to say hello.`,
      "font:900 28px system-ui;color:#737375",
      "font:900 28px system-ui;color:#DC2A35",
      "font:900 28px system-ui;color:#737375",
      "font:13px ui-monospace,monospace;color:#F24B59",
    );
    (window as unknown as { baymax: () => string }).baymax = () => {
      foundSecret("console");
      return "Hello. I am satisfied with your curiosity. 👊 (secret unlocked)";
    };
  }, []);

  return (
    <>
      {overlay && (
        <div className="pointer-events-none fixed inset-0 z-[95] grid place-items-center bg-[#0b1220]/40 backdrop-blur-[1px]" aria-live="polite">
          {overlay === "fist" ? (
            <div className="chest-toast rounded-[28px] bg-[var(--surface)] p-8 text-center shadow-2xl">
              <FistBump />
              <p className="mt-2 font-display text-xl font-extrabold">Ba-la-la-la-la!</p>
            </div>
          ) : (
            <div className="chest-toast flex flex-col items-center">
              <svg width="0" height="0" aria-hidden>
                <filter id="fuzz"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" /><feDisplacementMap in="SourceGraphic" scale="9" /></filter>
              </svg>
              <div style={{ filter: "url(#fuzz)" }}><BH6Image id="baymax-healthcare" decorative sizes="160px" className="h-auto w-40" fallback="icon" iconClassName="h-32 w-32" /></div>
              <p className="mt-3 rounded-full bg-[var(--surface)] px-4 py-2 font-display text-lg font-extrabold shadow">Hairy baby! Hairy baby!</p>
            </div>
          )}
        </div>
      )}
      {mochi && (
        <button
          type="button"
          onClick={() => {
            foundSecret("mochi");
            setMochi(null);
          }}
          aria-label="Mochi the cat is peeking. Say hi"
          className="absolute right-0 z-30 w-16 translate-x-2 motion-safe:animate-[peek_9s_ease-in-out_forwards]"
          style={{ top: mochi.top }}
        >
          <BH6Image id="mochi" decorative sizes="64px" className="h-auto w-full -scale-x-100" fallback="icon" iconClassName="h-14 w-14" />
          <style>{`@keyframes peek{0%{transform:translateX(100%)}12%,80%{transform:translateX(8px)}100%{transform:translateX(100%)}}`}</style>
        </button>
      )}
    </>
  );
}
