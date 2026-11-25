"use client";
import { useEffect, useRef, useState } from "react";
import { BH6Image } from "@/components/brand/BH6Image";
import { onSay, type BaymaxPose, type GuideMessage } from "./guide-store";

const POSE_ART: Record<BaymaxPose, string> = { idle: "baymax-healthcare", point: "baymax-healthcare", wave: "baymax-wave", fist: "baymax-fistbump" };
import { foundSecret } from "@/components/eggs/secrets";

const OPENING = "Hello. I am Baymax, your personal registration companion.";

/**
 * Floating helper. Squishy inflated body (squash-and-stretch on appear/click), wave/point/fist poses,
 * a speech bubble, low-battery droop after inactivity, and it can be minimised (remembered).
 */
export function BaymaxGuide() {
  const [msg, setMsg] = useState<GuideMessage>({ text: OPENING, pose: "wave", tone: "info", at: 0 });
  const [min, setMin] = useState(false);
  const [bubble, setBubble] = useState(true);
  const [squish, setSquish] = useState(0);
  const [droop, setDroop] = useState(false);
  const idle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads localStorage after hydration
    setMin(localStorage.getItem("synaxis-guide-min") === "1");
    const off = onSay((m) => {
      setMsg(m);
      setBubble(true);
      setSquish((s) => s + 1);
      setDroop(false);
    });
    const wake = () => {
      setDroop(false);
      clearTimeout(idle.current);
      idle.current = setTimeout(() => {
        setDroop(true);
        foundSecret("low-battery");
      }, 60000);
    };
    wake();
    const evs = ["pointerdown", "keydown", "scroll"] as const;
    evs.forEach((e) => addEventListener(e, wake, { passive: true }));
    return () => {
      off();
      clearTimeout(idle.current);
      evs.forEach((e) => removeEventListener(e, wake));
    };
  }, []);

  useEffect(() => {
    if (!bubble || msg.tone === "warn") return;
    const t = setTimeout(() => setBubble(false), 6500);
    return () => clearTimeout(t);
  }, [bubble, msg]);

  const toggleMin = (v: boolean) => {
    setMin(v);
    localStorage.setItem("synaxis-guide-min", v ? "1" : "0");
  };

  const pose: BaymaxPose = droop ? "idle" : msg.pose;

  if (min) {
    return (
      <button
        type="button"
        onClick={() => toggleMin(false)}
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-[70] grid h-12 w-12 place-items-center rounded-full border-2 border-[var(--line)] bg-white shadow-lg"
        aria-label="Open Baymax guide"
      >
        <span className="h-9 w-9 overflow-hidden rounded-full"><BH6Image id="baymax-healthcare" decorative sizes="36px" className="h-full w-full object-cover object-top" fallbackClassName="h-full w-full" /></span>
      </button>
    );
  }

  return (
    <aside
      aria-label="Baymax registration guide"
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-2 z-[70] flex max-w-[calc(100vw-1rem)] items-end gap-1 sm:right-4"
    >
      {bubble && (
        <div
          role="status"
          aria-live="polite"
          className={`chest-toast relative mb-10 max-w-[240px] rounded-[22px] border-2 bg-[var(--surface)] px-4 py-3 text-sm font-semibold shadow-lg sm:max-w-[280px] ${
            msg.tone === "warn" ? "border-[var(--danger)]" : msg.tone === "success" ? "border-[var(--success)]" : "border-[var(--line)]"
          }`}
        >
          {droop ? "Low battery… still here if you need me." : msg.text}
          <span aria-hidden className="absolute -right-2 bottom-4 h-4 w-4 rotate-45 border-r-2 border-t-2 border-inherit bg-[var(--surface)]" />
          <button onClick={() => setBubble(false)} className="ml-2 text-[var(--ink-muted)] underline-offset-2 hover:underline" aria-label="Hide message">
            Hide
          </button>
        </div>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setBubble((b) => !b);
            setSquish((s) => s + 1);
          }}
          aria-label={bubble ? "Hide Baymax's message" : "Show Baymax's message"}
          className="block w-[72px] sm:w-[84px]"
        >
          <span key={squish} className="block origin-bottom motion-safe:animate-[squish_520ms_cubic-bezier(.34,1.56,.64,1)]">
            {/* real art per pose; droop + gesture wiggle are done in code */}
            <span
              className={`block transition-transform duration-500 ${droop ? "translate-y-1 rotate-[10deg] saturate-50" : ""} ${pose === "wave" ? "motion-safe:animate-[wiggle_700ms_ease-in-out_2]" : pose === "point" ? "motion-safe:animate-[nudge_500ms_ease-out_1]" : ""}`}
              style={{ transformOrigin: "50% 90%" }}
            >
              <BH6Image id={POSE_ART[pose]} decorative sizes="84px" className="h-auto w-full drop-shadow-[0_8px_12px_rgba(24,36,58,.25)]" fallbackClassName="w-full" />
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => toggleMin(true)}
          className="absolute -top-1 right-0 grid h-6 w-6 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-xs"
          aria-label="Minimise Baymax guide"
        >
          –
        </button>
      </div>
      <style>{`@keyframes squish{0%{transform:scale(.6,.4)}40%{transform:scale(1.12,.9)}70%{transform:scale(.95,1.06)}100%{transform:scale(1)}}@keyframes wiggle{0%,100%{transform:rotate(0)}30%{transform:rotate(-6deg)}70%{transform:rotate(6deg)}}@keyframes nudge{0%{transform:translateX(0)}50%{transform:translateX(-5px)}100%{transform:translateX(0)}}`}</style>
    </aside>
  );
}
