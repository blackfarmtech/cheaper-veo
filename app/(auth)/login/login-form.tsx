"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth-client";

interface LoginFormProps {
  googleEnabled: boolean;
}

function GoogleLogo() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.806.54-1.8368.86-3.0477.86-2.344 0-4.3282-1.5832-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1731 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.964 10.71z"
      />
      <path
        fill="#EA4335"
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z"
      />
    </svg>
  );
}

export function LoginForm({ googleEnabled }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await authClient.signIn.email({
        email: trimmedEmail,
        password,
        callbackURL,
      });
      if (signInError) {
        setError(signInError.message ?? "Incorrect email or password.");
        return;
      }
      router.push(callbackURL);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
    } catch {
      setError("Could not start Google login.");
      setGoogleLoading(false);
    }
  }

  const signupHref = `/signup${searchParams.get("callbackURL") ? `?callbackURL=${encodeURIComponent(callbackURL)}` : ""}`;

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
          Sign in to your account
        </h1>
        <p className="mt-2 text-[14px] text-secondary">
          Use your email and password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-[13px] font-medium"
          >
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

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="password" className="block text-[13px] font-medium">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[12px] text-secondary underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            disabled={loading}
            className="input-apple"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {error ? (
        <p
          role="alert"
          className="fade-in mt-4 px-3.5 py-2.5 text-sm"
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

      {googleEnabled ? (
        <>
          <div className="my-7 flex items-center gap-3">
            <span
              className="h-px flex-1"
              style={{ background: "var(--color-border)" }}
            />
            <span
              className="text-[11px] uppercase text-muted"
              style={{ letterSpacing: "0.08em" }}
            >
              or
            </span>
            <span
              className="h-px flex-1"
              style={{ background: "var(--color-border)" }}
            />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-[#dadce0] bg-white px-3 py-[10px] text-[14px] font-medium text-[#3c4043] shadow-[0_1px_2px_rgba(60,64,67,0.15)] transition-shadow hover:bg-[#f8f9fa] hover:shadow-[0_1px_3px_rgba(60,64,67,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
            style={{ fontFamily: "'Roboto', system-ui, -apple-system, sans-serif" }}
          >
            <GoogleLogo />
            <span>{googleLoading ? "Redirecting…" : "Sign in with Google"}</span>
          </button>
        </>
      ) : null}

      <p className="mt-7 text-center text-[14px] text-secondary">
        Don&apos;t have an account yet?{" "}
        <Link
          href={signupHref}
          className="font-medium text-[var(--color-text)] underline decoration-[rgba(162,221,0,0.5)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--color-accent)]"
        >
          Create free account
        </Link>
      </p>

      <p className="mt-3 text-center text-xs text-muted">
        By continuing you agree to the Terms and Privacy Policy.
      </p>
    </div>
  );
}
