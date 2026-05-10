import "server-only";

import { render } from "@react-email/render";
import type { ReactElement } from "react";

import { getResend, emailFrom, emailReplyTo } from "./client";

export interface SendEmailInput {
  to: string;
  subject: string;
  react: ReactElement;
  /** Plain-text fallback. Strongly recommended for deliverability. */
  text?: string;
  /** Idempotency tag for logs and (eventually) webhook deduping. */
  tag?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
}

/**
 * Sends a transactional email via Resend. Soft-fails when RESEND_API_KEY is
 * absent (dev) so signup/checkout never breaks just because email is offline.
 * Errors are logged and returned — callers decide whether they're fatal.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resend = getResend();
  if (!resend) {
    // eslint-disable-next-line no-console
    console.warn(
      `[email] RESEND_API_KEY missing — skipping ${input.tag ?? input.subject} to ${input.to}`,
    );
    return { ok: true, skipped: true };
  }

  try {
    const html = await render(input.react);
    const text = input.text ?? (await render(input.react, { plainText: true }));

    const replyTo = emailReplyTo();
    const { data, error } = await resend.emails.send({
      from: emailFrom(),
      to: input.to,
      subject: input.subject,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
      ...(input.tag ? { tags: [{ name: "kind", value: input.tag }] } : {}),
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error(`[email] resend error for ${input.tag ?? input.subject}:`, error);
      return { ok: false, error: error.message ?? "unknown" };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    // eslint-disable-next-line no-console
    console.error(`[email] send threw for ${input.tag ?? input.subject}:`, err);
    return { ok: false, error: message };
  }
}
