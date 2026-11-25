"use client";
import { Children, cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

/** Labelled field with the Baymax scan line on focus and accessible hint/error wiring. */
export function Field({
  label,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const kids = Children.toArray(children);
  const [control, ...rest] = kids;
  const describedBy = [hint ? hintId : null, error ? errId : null].filter(Boolean).join(" ") || undefined;
  const enhanced = isValidElement(control)
    ? cloneElement(control as ReactElement<Record<string, unknown>>, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })
    : control;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <div className="scan-wrap">{enhanced}</div>
      {rest}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-[var(--ink-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="hud-error mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-[var(--danger)]">
          <span aria-hidden className="mt-0.5 inline-block rounded bg-[var(--danger)] px-1 font-mono text-[9px] leading-4 text-white battle:text-[#0b1220]">
            SCAN
          </span>
          {error}
        </p>
      )}
    </div>
  );
}

export function Check({ reg, error, children }: { reg: UseFormRegisterReturn; error?: string; children: ReactNode }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={`card flex cursor-pointer items-start gap-3 p-4 ${error ? "!border-[var(--danger)]" : ""}`}>
        <input id={id} type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--primary)]" aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-e` : undefined} {...reg} />
        <span className="text-sm">{children}</span>
      </label>
      {error && (
        <p id={`${id}-e`} role="alert" className="hud-error mt-1 text-sm font-semibold text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
