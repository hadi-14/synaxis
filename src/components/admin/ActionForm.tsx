"use client";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast-store";
import type { FormResult } from "@/app/admin/content/actions";

/** Server-action form with toast feedback (Baymax chest display) and pending state. */
export function ActionForm({
  action,
  children,
  className = "",
  submitLabel = "Save",
  resetOnSuccess = false,
}: {
  action: (prev: FormResult | null, f: FormData) => Promise<FormResult>;
  children: React.ReactNode;
  className?: string;
  submitLabel?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, run, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message);
      if (resetOnSuccess) ref.current?.reset();
      router.refresh();
    } else toast.error(state.message);
  }, [state, resetOnSuccess, router]);
  return (
    <form ref={ref} action={run} className={className}>
      {children}
      <div className="mt-4 flex items-center gap-3">
        <button className="btn btn-primary !min-h-10 text-sm" disabled={pending}>{pending ? "Saving…" : submitLabel}</button>
        {state && !state.ok && <p role="alert" className="text-sm font-semibold text-[var(--danger)]">{state.message}</p>}
      </div>
    </form>
  );
}

export function F({ label, children, hint, className = "" }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[var(--ink-muted)]">{hint}</span>}
    </label>
  );
}

export function Toggle({ name, defaultChecked, label }: { name: string; defaultChecked: boolean; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-5 w-5 accent-[var(--primary)]" />
      {label}
    </label>
  );
}
