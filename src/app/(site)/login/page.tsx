import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { Baymax } from "@/components/brand/Baymax";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="mx-auto grid max-w-4xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_1.1fr] md:py-20">
      <div className="hidden md:block">
        <Baymax pose="wave" className="mx-auto w-48" />
        <p className="mt-6 text-center font-display text-lg font-bold">Hello. I am Baymax, your personal registration companion.</p>
      </div>
      <div className="card p-6 sm:p-8">
        <h1 className="font-display text-2xl font-extrabold">Sign in to continue</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Head Delegates sign in to register and track their team. Cubinet members use the same sign-in for the admin panel.
        </p>
        <Suspense fallback={<div className="skeleton mt-6 h-40" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
