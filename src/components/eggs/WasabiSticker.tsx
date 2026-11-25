"use client";
import { useState } from "react";
import { foundSecret } from "./secrets";

/** A slightly tilted sticker. Hover and Wasabi straightens it: "There's a place for everything." */
export function WasabiSticker() {
  const [neat, setNeat] = useState(false);
  return (
    <button
      type="button"
      onPointerEnter={() => {
        if (!neat) {
          setNeat(true);
          foundSecret("wasabi");
        }
      }}
      onFocus={() => setNeat(true)}
      aria-label={neat ? "There's a place for everything." : "A tilted sticker"}
      className="absolute -right-2 -top-3 rounded-md border-2 border-[#2BB673] bg-[var(--surface)] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#1f8a5b] shadow transition-transform duration-300"
      style={{ transform: neat ? "rotate(0deg)" : "rotate(-7deg)" }}
    >
      {neat ? "There's a place for everything" : "Eligibility"}
    </button>
  );
}
