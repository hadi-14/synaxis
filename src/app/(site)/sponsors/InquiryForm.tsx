"use client";
import { useActionState } from "react";
import { submitInquiry, type InquiryState } from "./actions";
import { FistBump } from "@/components/effects/FistBump";

export function InquiryForm() {
  const [state, run, pending] = useActionState<InquiryState, FormData>(submitInquiry, null);
  if (state?.ok) {
    return (
      <div className="card flex flex-col items-center p-8 text-center" role="status">
        <FistBump label="Partnership incoming" />
        <p className="mt-4 font-display text-lg font-bold">{state.message}</p>
      </div>
    );
  }
  const err = (k: string) => state?.errors?.[k];
  const v = (k: string) => state?.values?.[k] ?? "";
  // `key` forces fresh defaultValues after each failed submit (React resets uncontrolled fields).
  const k = JSON.stringify(state?.values ?? {});
  return (
    <form action={run} className="card grid gap-4 p-6 sm:grid-cols-2" noValidate>
      <Field key={`n${k}`} name="name" label="Your name" error={err("name")} value={v("name")} />
      <Field key={`o${k}`} name="organisation" label="Organisation" error={err("organisation")} value={v("organisation")} />
      <Field key={`e${k}`} name="email" label="Email" type="email" error={err("email")} value={v("email")} />
      <Field key={`p${k}`} name="phone" label="Phone" type="tel" required={false} error={err("phone")} value={v("phone")} />
      <label className="block text-sm sm:col-span-2">
        <span className="mb-1 block font-semibold">Interested in</span>
        <select key={`i${k}`} name="interest" className="field" defaultValue={v("interest") || undefined}>
          <option>Title sponsorship</option>
          <option>Platinum / Gold</option>
          <option>Module award</option>
          <option>Food / stall vendor</option>
          <option>In-kind / other</option>
        </select>
      </label>
      <div className="sm:col-span-2"><Field key={`m${k}`} name="message" label="Message" area error={err("message")} value={v("message")} /></div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state && !state.ok && <p role="alert" className="text-sm font-semibold text-[var(--danger)] sm:col-span-2">{state.message}</p>}
      <button className="btn btn-primary sm:col-span-2" disabled={pending}>{pending ? "Sending…" : "Send inquiry"}</button>
    </form>
  );
}

function Field({ name, label, type = "text", area = false, required = true, error, value }: { name: string; label: string; type?: string; area?: boolean; required?: boolean; error?: string; value: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold">{label}{!required && <span className="font-normal text-[var(--ink-muted)]"> (optional)</span>}</span>
      <span className="scan-wrap block">
        {area ? (
          <textarea name={name} className="field min-h-32" aria-invalid={!!error} required={required} defaultValue={value} />
        ) : (
          <input name={name} type={type} className="field" aria-invalid={!!error} required={required} defaultValue={value} />
        )}
      </span>
      {error && <span role="alert" className="mt-1 block text-sm font-semibold text-[var(--danger)]">{error}</span>}
    </label>
  );
}
