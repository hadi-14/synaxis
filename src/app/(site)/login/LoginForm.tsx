"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { safeNext } from "@/lib/safe-next";

/** Lazy-load the Supabase browser client so it never ships with public pages. */
const supabase = () => import("@/lib/supabase/browser").then((m) => m.createClient());

export function LoginForm() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const linkError = params.get("error") === "link";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(linkError ? "That sign-in link has expired or was already used. Try again." : null);

  const redirectTo = () => `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const google = async () => {
    setMsg(null);
    const { error } = await (await supabase()).auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo(), queryParams: { prompt: "select_account" } },
    });
    if (error) setMsg("Google sign-in isn't available right now. Use the email link below.");
  };

  const magic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMsg("Enter a valid email address.");
      return;
    }
    setState("sending");
    setMsg(null);
    const { error } = await (await supabase()).auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo(), shouldCreateUser: true },
    });
    if (error) {
      setState("error");
      setMsg(error.status === 429 ? "Too many requests. Wait a minute and try again." : "We couldn't send the link. Check the address and try again.");
    } else setState("sent");
  };

  return (
    <div className="mt-6 space-y-5">
      <button type="button" onClick={google} className="btn btn-secondary w-full">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8z" />
          <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
        </svg>
        Continue with Google
      </button>
      <div className="flex items-center gap-3 text-xs text-[var(--ink-muted)]">
        <span className="h-px flex-1 bg-[var(--line)]" /> or get a one-time link <span className="h-px flex-1 bg-[var(--line)]" />
      </div>
      {state === "sent" ? (
        <div className="rounded-[var(--radius-sm)] border-2 border-[var(--success)] p-4 text-sm" role="status">
          <p className="font-bold">Link sent to {email}.</p>
          <p className="mt-1 text-[var(--ink-muted)]">Open it on this device to continue. Check your spam folder if it doesn&apos;t arrive within a minute.</p>
        </div>
      ) : (
        <form onSubmit={magic} className="space-y-3" noValidate>
          <label htmlFor="email" className="block text-sm font-semibold">Email</label>
          <div className="scan-wrap">
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className="field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!msg}
              aria-describedby={msg ? "login-msg" : undefined}
            />
          </div>
          <button className="btn btn-primary w-full" disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : "Email me a sign-in link"}
          </button>
        </form>
      )}
      {msg && (
        <p id="login-msg" role="alert" className="hud-error text-sm font-semibold text-[var(--danger)]">
          {msg}
        </p>
      )}
    </div>
  );
}
