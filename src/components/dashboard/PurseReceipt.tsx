"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUpload } from "./useUpload";
import { markWhatsAppShared } from "@/app/(site)/dashboard/actions";
import { toast } from "@/components/ui/toast-store";
import { say } from "@/components/guide/guide-store";
import { BH6Image } from "@/components/brand/BH6Image";

/**
 * Honey Lemon's purse. It opens and a receipt card floats out (chem-ball colours, soft spring).
 * The card IS the drop zone and the WhatsApp option. On success the card folds back into the purse.
 * Reduced motion / no JS animation: renders the same card statically (plain fallback).
 */
export function PurseReceipt({ waHref, hasReceipt }: { waHref: string; hasReceipt: boolean }) {
  const router = useRouter();
  const { state, error, upload } = useUpload("receipt");
  const [open, setOpen] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads a media query after hydration
    setReduced(matchMedia("(prefers-reduced-motion: reduce)").matches);
    const t = setTimeout(() => setOpen(true), 250);
    return () => clearTimeout(t);
  }, []);

  const handle = async (f?: File | null) => {
    if (!f) return;
    const ok = await upload(f);
    if (ok) {
      toast.success("Receipt received", "Finance will review it shortly.");
      say("I am satisfied with my care. Your receipt is in.", "fist", "success");
      setTimeout(() => router.refresh(), reduced ? 300 : 1500);
    } else say("Scan complete. That upload did not work. Look at the message on the card.", "point", "warn");
  };

  const folded = state === "done";
  const cardOut = open && !folded;

  return (
    <div className="relative mx-auto max-w-md pt-4">
      {/* card */}
      <div
        className="relative z-10 mx-4 origin-bottom rounded-[22px] border-2 bg-[var(--surface)] p-5 shadow-xl transition-[transform,opacity] duration-700"
        style={{
          borderColor: drag ? "#FF5FA2" : "var(--line)",
          transform: reduced ? "none" : cardOut ? "translateY(0) rotate(-1.5deg)" : "translateY(120px) scaleY(.2)",
          opacity: reduced ? 1 : cardOut ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)",
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files?.[0]);
        }}
      >
        <div aria-hidden className="absolute -top-3 left-6 flex gap-1.5">
          {["#FF5FA2", "#F5C400", "#3BB2F6"].map((c) => (
            <span key={c} className="h-5 w-5 rounded-full shadow" style={{ background: c }} />
          ))}
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Payment receipt</p>
        <p className="mt-1 font-display text-lg font-bold">{hasReceipt ? "Upload another receipt" : "Drop your receipt here"}</p>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Photo or PDF of the bank transfer, up to 5 MB.</p>
        <input
          ref={input}
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          id="receipt-file"
          onChange={(e) => handle(e.target.files?.[0])}
        />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="receipt-file" className="btn btn-primary flex-1 cursor-pointer" aria-disabled={state === "uploading"}>
            {state === "uploading" ? "Uploading…" : "Choose file"}
          </label>
          <a
            href={waHref}
            target="_blank"
            rel="noopener"
            className="btn btn-secondary flex-1"
            onClick={() => {
              markWhatsAppShared();
              say("Send the receipt photo in that chat. Finance will match it to your ID.", "point");
            }}
          >
            Send on WhatsApp
          </a>
        </div>
        {error && <p role="alert" className="hud-error mt-3 text-sm font-semibold text-[var(--danger)]">{error}</p>}
      </div>

      {/* Honey Lemon's purse (real art): opens with a squish while the card is out, snaps shut on success */}
      <div
        aria-hidden
        className="relative z-20 mx-auto -mt-8 w-44 origin-bottom transition-transform duration-500"
        style={{ transform: reduced ? "none" : folded ? "scale(1.06,.94)" : open ? "scale(1,1.04) rotate(-2deg)" : "scale(.96)", transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)" }}
      >
        <BH6Image id="honey-lemon-purse" decorative sizes="176px" className="h-auto w-full drop-shadow-xl" fallback="icon" iconClassName="mx-auto h-24 w-24" />
      </div>
      {folded && (
        <p role="status" className="mt-2 text-center font-display font-bold text-[var(--success)]">
          ✓ Receipt tucked away. I am satisfied with my care.
        </p>
      )}
    </div>
  );
}
