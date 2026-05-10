import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getSession } from "@/lib/session";

import { ResendVerifyForm } from "./resend-form";

export const metadata: Metadata = {
  title: "Verify your email — Cheaper Veo",
};

interface VerifyEmailPageProps {
  searchParams: Promise<{ status?: string; error?: string }>;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;
  const session = await getSession();
  const user = session?.user ?? null;
  const isVerified = Boolean(user?.emailVerified);
  const justSucceeded = params.status === "success" || isVerified;

  return (
    <div className="card p-9" style={{ borderRadius: "var(--radius-2xl)" }}>
      <div className="mb-6 text-center">
        <div className="mb-5 inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: "var(--color-accent)",
              boxShadow: "0 0 8px rgba(162, 221, 0, 0.6)",
            }}
            aria-hidden="true"
          />
          Cheaper Veo
        </div>
        <h1
          className="text-[1.75rem] font-semibold tracking-tight"
          style={{ letterSpacing: "-0.024em" }}
        >
          {justSucceeded ? "Email verified" : "Verify your email"}
        </h1>
        <p className="mt-2 text-[14px] text-secondary">
          {justSucceeded
            ? "You're all set — generation is unlocked."
            : user
              ? `We sent a verification link to ${user.email}. Click it to unlock video generation.`
              : "Sign in first, then we can resend the verification link."}
        </p>
      </div>

      {justSucceeded ? (
        <Link href="/dashboard/playground" className="btn-primary block w-full text-center">
          Go to playground
        </Link>
      ) : user ? (
        <Suspense fallback={null}>
          <ResendVerifyForm email={user.email} />
        </Suspense>
      ) : (
        <Link href="/login?callbackURL=/verify-email" className="btn-primary block w-full text-center">
          Sign in
        </Link>
      )}

      {params.error ? (
        <p
          role="alert"
          className="mt-4 px-3.5 py-2.5 text-sm"
          style={{
            border: "1px solid rgba(248, 113, 113, 0.4)",
            background: "rgba(248, 113, 113, 0.08)",
            color: "var(--color-danger)",
            borderRadius: "var(--radius-md)",
          }}
        >
          The verification link is invalid or expired. Request a new one above.
        </p>
      ) : null}

      <p className="mt-6 text-center text-xs text-muted">
        Wrong account? <Link href="/login" className="underline">Sign in with another email</Link>.
      </p>
    </div>
  );
}
