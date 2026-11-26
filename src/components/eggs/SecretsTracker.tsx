"use client";
import { useEffect, useRef, useState } from "react";
import { SECRETS, SECRET_TOTAL, getFound, type SecretId } from "./secrets";
import { LOGO_LETTERS, LOGO_X } from "@/components/brand/logo-paths";

const UNLOCK_AT = 6;

/** Hidden until the first secret is found. Unlocks a shareable Instagram story card at 6+. */
export function SecretsTracker() {
  const [found, setFound] = useState<SecretId[]>([]);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads localStorage after hydration
    setFound(getFound());
    const on = () => setFound(getFound());
    addEventListener("synaxis:secret", on);
    return () => removeEventListener("synaxis:secret", on);
  }, []);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  if (!found.length) return null;

  const download = async () => {
    const W = 1080, H = 1920;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const x = c.getContext("2d")!;
    x.fillStyle = "#0B1220";
    x.fillRect(0, 0, W, H);
    const g = x.createRadialGradient(W / 2, 760, 40, W / 2, 760, 700);
    g.addColorStop(0, "rgba(242,75,89,.45)");
    g.addColorStop(1, "rgba(11,18,32,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * Math.PI * 2;
      x.fillStyle = i % 6 ? "#424CBC" : "#F24B59";
      x.fillRect(W / 2 + Math.cos(a) * 430 - 6, 760 + Math.sin(a) * 430 - 4, 12, 8);
    }
    x.save();
    const s = 900 / 890;
    x.translate(90, 640);
    x.scale(s, s);
    x.fillStyle = "#B4B4B9";
    x.fill(new Path2D(LOGO_LETTERS), "evenodd");
    x.fillStyle = "#DC2A35";
    x.fill(new Path2D(LOGO_X), "evenodd");
    x.restore();
    x.textAlign = "center";
    x.fillStyle = "#F7F5F0";
    x.font = "700 64px system-ui, sans-serif";
    x.fillText(`I found ${found.length}/${SECRET_TOTAL} secrets`, W / 2, 1320);
    x.font = "500 40px system-ui, sans-serif";
    x.fillStyle = "#FF6B77";
    x.fillText("hidden in the Synaxis portal", W / 2, 1390);
    x.fillStyle = "#9A9AA0";
    x.font = "500 34px ui-monospace, monospace";
    x.fillText("SEASON 1 · 15–17 JAN 2027 · KARACHI", W / 2, 1720);
    x.fillText("@heusersynaxis", W / 2, 1780);
    const url = c.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "synaxis-secrets-story.png";
    a.click();
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-current px-3 py-1.5 font-mono text-xs" aria-haspopup="dialog">
        <span aria-hidden className="h-2 w-2 rounded-[2px] bg-current" /> Secrets {found.length}/{SECRET_TOTAL}
      </button>
      <dialog ref={dialog} onClose={() => setOpen(false)} className="inflate-in m-auto w-[min(92vw,420px)] rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-0 text-[var(--ink)] backdrop:bg-[#0b1220]/60">
        <div className="p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)]">Hiro&apos;s secret log</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">{found.length} of {SECRET_TOTAL} found</h2>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {(Object.keys(SECRETS) as SecretId[]).map((id) => (
              <li key={id} className={`rounded-[var(--radius-sm)] border px-2 py-1.5 ${found.includes(id) ? "border-[var(--success)]" : "border-dashed border-[var(--line)] text-[var(--ink-muted)]"}`}>
                {found.includes(id) ? SECRETS[id] : "???"}
              </li>
            ))}
          </ul>
          {found.length >= UNLOCK_AT ? (
            <button type="button" onClick={download} className="btn btn-primary mt-5 w-full">Download Instagram story card</button>
          ) : (
            <p className="mt-5 text-sm text-[var(--ink-muted)]">Find {UNLOCK_AT - found.length} more to unlock a shareable story card.</p>
          )}
          <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost mt-2 w-full">Close</button>
        </div>
      </dialog>
    </>
  );
}
