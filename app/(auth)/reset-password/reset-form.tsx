"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is invalid. Request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const { error: apiError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (apiError) {
        setError(apiError.message ?? "Could not reset your password.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="card p-9" style={{ borderRadius: "var(--radius-2xl)" }}>
        <h1 className="mb-3 text-[1.5rem] font-semibold tracking-tight">
          Invalid reset link
        </h1>
        <p className="mb-6 text-[14px] text-secondary">
          This link is missing or expired. Request a new one and try again.
        </p>
        <Link href="/forgot-password" className="btn-primary block w-full text-center">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-9" style={{ borderRadius: "var(--radius-2xl)" }}>
      <div className="mb-8 text-center">
        <h1
          className="text-[1.75rem] font-semibold tracking-tight"
          style={{ letterSpacing: "-0.024em" }}
        >
          {done ? "Password updated" : "Choose a new password"}
        </h1>
        <p className="mt-2 text-[14px] text-secondary">
          {done
            ? "Redirecting to sign in…"
            : "At least 8 characters. Make it count."}
        </p>
      </div>

      {!done ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-2 block text-[13px] font-medium">
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              className="input-apple"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-2 block text-[13px] font-medium">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              disabled={loading}
              className="input-apple"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Updating…" : "Update password"}
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
      ) : null}
    </div>
  );
}
