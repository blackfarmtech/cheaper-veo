import "server-only";

import { Resend } from "resend";

let cached: Resend | null = null;

/**
 * Returns the Resend client, or null when RESEND_API_KEY is not set.
 * Callers should treat null as a soft-disable: log and continue, never crash.
 * This matches dev/preview environments where transactional email is optional.
 */
export function getResend(): Resend | null {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cached = new Resend(key);
  return cached;
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM ?? "Cheaper Veo <onboarding@resend.dev>";
}

export function emailReplyTo(): string | undefined {
  return process.env.EMAIL_REPLY_TO || undefined;
}

export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
