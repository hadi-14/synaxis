"use client";
import { useState, useTransition } from "react";
import { sendTestEmail } from "./actions";

export function TestEmailButton() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className="btn btn-primary text-sm" disabled={pending} onClick={() => start(async () => setResult(await sendTestEmail()))}>
        {pending ? "Sending…" : "Send test email"}
      </button>
      {result && <p role="status" className={`text-sm font-semibold ${result.ok ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>{result.message}</p>}
    </div>
  );
}
