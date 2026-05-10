"use client";

import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";

interface ResendVerifyFormProps {
  email: string;
}

export function ResendVerifyForm({ email }: ResendVerifyFormProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: apiError } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/verify-email?status=success",
      });
      if (apiError) {
        setError(apiError.message ?? "Could not send the verification email.");
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="submit"
        disabled={loading || sent}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sent
          ? "Email sent — check your inbox"
          : loading
            ? "Sending…"
            : "Resend verification email"}
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
    </form>
  );
}
