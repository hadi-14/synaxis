"use client";
import { useState } from "react";
import { foundSecret } from "./secrets";

const FACES = ["😀", "🙂", "😐", "😕", "🙁", "😟", "😣", "😖", "😫", "😭"];

export function PainScale() {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div className="mt-6">
      <div role="radiogroup" aria-label="Pain scale from 1 to 10" className="flex flex-wrap justify-center gap-1.5">
        {FACES.map((f, i) => (
          <button
            key={i}
            role="radio"
            aria-checked={pick === i + 1}
            aria-label={`${i + 1}`}
            onClick={() => {
              setPick(i + 1);
              foundSecret("pain-scale");
            }}
            className={`flex h-14 w-11 flex-col items-center justify-center rounded-[12px] border-2 text-xl transition-transform hover:-translate-y-0.5 ${pick === i + 1 ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--line)] bg-[var(--surface)]"}`}
          >
            <span aria-hidden>{f}</span>
            <span className="font-mono text-[10px]">{i + 1}</span>
          </button>
        ))}
      </div>
      {pick !== null && (
        <p role="status" className="mt-4 font-semibold">
          {pick <= 3 ? "I am glad. This page does not exist, but you will be fine." : pick <= 7 ? "There, there. A lollipop would help, but the home page is closer." : "I will scan you. Diagnosis: wrong URL. Treatment: the button below."}
        </p>
      )}
    </div>
  );
}
