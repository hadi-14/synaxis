"use client";
import { useState } from "react";
import { foundSecret } from "./secrets";

const FACES = ["😀", "🙂", "😐", "😕", "🙁", "😟", "😣", "😖", "😫", "😭"];
const REPLIES = [
  "A one. Excellent. You are in perfect health, just slightly lost.",
  "A two. I prescribe one (1) click on “Back to home”.",
  "A three. Mild URL discomfort detected. It will pass.",
  "A four. I have scanned you. Diagnosis: a typo.",
  "A five. Would you like a lollipop? I only have a home page.",
  "A six. There, there. I will stay with you until you are satisfied with your care.",
  "A seven. Your pain is valid. This page, however, is not.",
  "An eight. Deep breaths. Hiro also makes mistakes, mostly with microbots.",
  "A nine. Initiating emergency protocol: registering for Synaxis will make you feel better.",
  "A ten. Okay. Fist bump? Ba-la-la-la-la. Now let's go home.",
];

/** Baymax's 1–10 pain scale: each face gets its own reply. */
export function PainScale() {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div>
      <div role="radiogroup" aria-label="Pain scale from 1 to 10" className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
        {FACES.map((f, i) => (
          <button
            key={i}
            role="radio"
            aria-checked={pick === i}
            aria-label={`${i + 1}`}
            onClick={() => {
              setPick(i);
              foundSecret("pain-scale");
            }}
            className={`flex h-16 w-12 flex-col items-center justify-center rounded-[14px] border-2 text-2xl transition-transform hover:-translate-y-0.5 sm:w-14 ${pick === i ? "border-[var(--band)] bg-[var(--band)] text-white" : "border-[var(--line)] bg-[var(--surface)]"}`}
          >
            <span aria-hidden>{f}</span>
            <span className="font-mono text-[11px] font-bold">{i + 1}</span>
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" className="mx-auto mt-5 min-h-12 max-w-lg font-semibold">
        {pick === null ? "Tap a face." : REPLIES[pick]}
      </p>
    </div>
  );
}
