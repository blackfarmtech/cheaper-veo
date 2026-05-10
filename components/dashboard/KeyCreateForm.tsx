"use client";

import { useState, useTransition } from "react";
import { Check, Copy, KeyRound, Loader2, X } from "lucide-react";

import { createKeyAction, type CreateKeyResult } from "@/app/(app)/dashboard/keys/_actions";

interface ResultBanner {
  plaintext: string;
  prefix: string;
  name: string;
}

export function KeyCreateForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<ResultBanner | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result: CreateKeyResult = await createKeyAction(formData);
      if (!result.ok || !result.plaintext || !result.prefix || !result.name) {
        setError(result.error ?? "Failed to create key.");
        return;
      }
      setIssued({
        plaintext: result.plaintext,
        prefix: result.prefix,
        name: result.name,
      });
      setName("");
    });
  }

  async function handleCopy() {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.plaintext);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard.");
    }
  }

  function handleCloseIssued() {
    setIssued(null);
    setCopied(false);
  }

  return (
    <div className="card p-7">
      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(162, 221, 0, 0.18), rgba(162, 221, 0, 0.04))",
            border: "1px solid var(--color-border-accent)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-accent)",
          }}
        >
          <KeyRound className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-[17px] font-semibold tracking-tight">
            Generate new key
          </h2>
          <p className="mt-1 text-[13px] text-secondary">
            Use a name that helps identify where the key will be used
            (e.g. production, mobile-app).
          </p>
        </div>
      </div>

      <form
        action={handleSubmit}
        className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch"
      >
        <input
          type="text"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Key name"
          required
          maxLength={80}
          disabled={isPending}
          className="input-apple flex-1 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isPending || name.trim().length === 0}
          className="btn-primary disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            "Generate new key"
          )}
        </button>
      </form>

      {error ? (
        <p className="mt-3 text-xs text-[var(--color-danger)]">{error}</p>
      ) : null}

      {issued ? (
        <div
          role="alertdialog"
          aria-labelledby="issued-title"
          className="fade-up mt-6 p-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(162, 221, 0, 0.08), rgba(162, 221, 0, 0.02))",
            border: "1px solid var(--color-border-accent)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3
                id="issued-title"
                className="text-[15px] font-semibold tracking-tight"
              >
                Key &ldquo;{issued.name}&rdquo; created
              </h3>
              <p className="mt-1 text-[13px] text-secondary">
                This key will not be shown again. Copy it now and store
                it somewhere safe.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseIssued}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-white/[0.06] hover:text-[var(--color-text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code
              className="flex-1 overflow-x-auto px-3.5 py-2.5 text-xs"
              style={{
                fontFamily: "var(--font-mono)",
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
              }}
            >
              {issued.plaintext}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="btn-ghost"
              style={{ padding: "0.5rem 1rem", fontSize: "12px" }}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
