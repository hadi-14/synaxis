"use client";
import { useEffect, useState } from "react";
import { dismiss, subscribe, type ToastItem } from "./toast-store";
import { CloseIcon } from "@/components/ui/Icon";

/** Baymax's chest display: a rounded screen that slides out of the red case. */
export function Toaster() {
  const [list, setList] = useState<ToastItem[]>([]);
  useEffect(() => subscribe(setList), []);
  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[90] flex flex-col items-center gap-2 px-4"
    >
      {list.map((t) => (
        <div
          key={t.id}
          className="chest-toast pointer-events-auto w-full max-w-sm rounded-[22px] border-4 border-[var(--primary-press)] bg-[var(--primary-press)] shadow-xl"
        >
          <div className="flex items-start gap-3 rounded-[16px] bg-[#0f1a2c] px-4 py-3 text-[#e8f3ff]">
            <span
              aria-hidden
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${t.kind === "error" ? "bg-[#ff6b77]" : t.kind === "success" ? "bg-[#4ade9a]" : "bg-[#8b93f0]"} shadow-[0_0_10px_currentColor]`}
            />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#8fa3c0]">
                {t.kind === "error" ? "Scan complete · attention" : t.kind === "success" ? "Scan complete" : "Baymax"}
              </p>
              <p className="font-semibold leading-snug">{t.title}</p>
              {t.body && <p className="mt-0.5 text-sm text-[#b9c7dc]">{t.body}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="-mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#8fa3c0] hover:text-white"
              aria-label="Dismiss notification"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
