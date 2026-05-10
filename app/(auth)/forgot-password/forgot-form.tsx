"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      const { error: apiError } = await authClient.requestPasswordReset({
        email: trimmedEmail,
        redirectTo: "/reset-password",
      });
      if (apiError) {
        setError(apiError.message ?? "Could not send the reset email.");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-9" style={{ borderRadius: "var(--radius-2xl)" }}>
      <div className="mb-8 text-center">
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
          {sent ? "Check your email" : "Forgot your password?"}
        </h1>
        <p className="mt-2 text-[14px] text-secondary">
          {sent
            ? `If an account exists for ${email}, we just sent a reset link. The link expires in 1 hour.`
            : "Enter your email and we'll send you a reset link."}
        </p>
      </div>

      {sent ? (
        <Link href="/login" className="btn-primary block w-full text-center">
          Back to sign in
        </Link>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-[13px] font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              disabled={loading}
              className="input-apple"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>

          {error ? (
            <p
              role="alert"
              className="px-3.5 py-2.5 text-sm"
              style={{
                border: "1px solid rgba(248, 113, 113, 0.4)",
                background: "rgba(248, 113, 113, 0.08)",
                color: "var(--color-danger)",
                borderRadius: "var(--radius-md)",
              }}
            >
              {error}
            </p>
          ) : null}

          <p className="mt-4 text-center text-[14px] text-secondary">
            Remembered it?{" "}
            <Link
              href="/login"
              className="font-medium text-[var(--color-text)] underline decoration-[rgba(162,221,0,0.5)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--color-accent)]"
            >
              Sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
