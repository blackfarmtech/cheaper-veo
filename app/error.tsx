"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[unhandled]", error);
  }, [error]);

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-20">
      <div
        className="grid-bg radial-fade pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      />

      <div className="fade-up max-w-xl text-center">
        <div
          className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center"
          style={{
            background: "rgba(248, 113, 113, 0.12)",
            border: "1px solid rgba(248, 113, 113, 0.4)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <AlertTriangle
            className="h-6 w-6"
            style={{ color: "var(--color-danger)" }}
          />
        </div>
        <p
          className="text-[11px] uppercase text-muted"
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.12em",
          }}
        >
          Unexpected error
        </p>
        <h1
          className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl"
          style={{ letterSpacing: "-0.028em", lineHeight: 1.1 }}
        >
          Something broke on our end
        </h1>
        <p className="body-large mt-4 text-secondary">
          We&apos;ve been notified. Try again — if it persists, email us at{" "}
          <a
            href="mailto:contato@cheaperveo.com"
            className="legal-link"
          >
            contato@cheaperveo.com
          </a>{" "}
          with the ID below.
        </p>
        {error.digest && (
          <p
            className="mt-4 inline-block rounded-md px-3 py-1.5 text-[11px]"
            style={{
              fontFamily: "var(--font-mono)",
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            error_id: {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary">
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link href="/" className="btn-ghost">
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
