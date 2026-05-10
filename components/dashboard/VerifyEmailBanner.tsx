"use client";

import Link from "next/link";
import { useState } from "react";
import { MailWarning } from "lucide-react";

import { authClient } from "@/lib/auth-client";

interface VerifyEmailBannerProps {
  email: string;
}

export function VerifyEmailBanner({ email }: VerifyEmailBannerProps) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function handleResend() {
    setState("sending");
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/verify-email?status=success",
      });
      setState(error ? "error" : "sent");
    } catch {
      setState("error");
    }
  }

  return (
    <div
      className="mb-6 flex flex-col gap-3 rounded-lg px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      style={{
        border: "1px solid rgba(245, 158, 11, 0.4)",
        background: "rgba(245, 158, 11, 0.08)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div className="flex items-start gap-3">
        <MailWarning
          className="mt-0.5 shrink-0"
          size={18}
          style={{ color: "#f59e0b" }}
          aria-hidden="true"
        />
        <div className="text-[13px] leading-[20px]">
          <strong className="text-[var(--color-text)]">
            Verify your email to unlock generation.
          </strong>{" "}
          <span className="text-secondary">
            We sent a link to <span className="font-medium">{email}</span>.
            Generation is locked until you click it.
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={state === "sending" || state === "sent"}
          className="rounded-md border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-[12px] font-medium hover:bg-[rgba(255,255,255,0.04)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "sent"
            ? "Sent"
            : state === "sending"
              ? "Sending…"
              : state === "error"
                ? "Try again"
                : "Resend"}
        </button>
        <Link
          href="/verify-email"
          className="text-[12px] font-medium text-[var(--color-text)] underline"
        >
          More options
        </Link>
      </div>
    </div>
  );
}
