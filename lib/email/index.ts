import "server-only";

import { appUrl } from "./client";
import { sendEmail } from "./send";
import { AutoRechargeFailedEmail } from "./templates/auto-recharge-failed";
import { ResetPasswordEmail } from "./templates/reset-password";
import { TopupSuccessEmail } from "./templates/topup-success";
import { VerifyEmail } from "./templates/verify-email";
import { WelcomeEmail } from "./templates/welcome";

export async function sendVerifyEmail(args: { to: string; verifyUrl: string }) {
  return sendEmail({
    to: args.to,
    subject: "Confirm your Cheaper Veo email",
    react: VerifyEmail({ verifyUrl: args.verifyUrl }),
    tag: "verify-email",
  });
}

export async function sendWelcomeEmail(args: {
  to: string;
  name?: string | null;
  bonusCredits: number;
}) {
  return sendEmail({
    to: args.to,
    subject: "Welcome to Cheaper Veo",
    react: WelcomeEmail({
      name: args.name ?? null,
      bonusCredits: args.bonusCredits,
      dashboardUrl: `${appUrl()}/dashboard`,
    }),
    tag: "welcome",
  });
}

export async function sendTopupSuccessEmail(args: {
  to: string;
  credits: number;
  amountCents: number;
  currency: string;
  newBalance: number;
  isAutoRecharge?: boolean;
  receiptUrl?: string | null;
}) {
  const subject = args.isAutoRecharge
    ? `Auto-recharge complete — +${args.credits.toLocaleString()} credits`
    : `Payment received — +${args.credits.toLocaleString()} credits`;
  return sendEmail({
    to: args.to,
    subject,
    react: TopupSuccessEmail({
      credits: args.credits,
      amountCents: args.amountCents,
      currency: args.currency,
      newBalance: args.newBalance,
      isAutoRecharge: args.isAutoRecharge,
      dashboardUrl: `${appUrl()}/dashboard/playground`,
      receiptUrl: args.receiptUrl ?? null,
    }),
    tag: args.isAutoRecharge ? "auto-recharge-success" : "topup-success",
  });
}

export async function sendAutoRechargeFailedEmail(args: {
  to: string;
  reason: string;
}) {
  return sendEmail({
    to: args.to,
    subject: "Action required — auto-recharge failed",
    react: AutoRechargeFailedEmail({
      reason: args.reason,
      billingUrl: `${appUrl()}/dashboard/billing`,
    }),
    tag: "auto-recharge-failed",
  });
}

export async function sendResetPasswordEmail(args: {
  to: string;
  resetUrl: string;
}) {
  return sendEmail({
    to: args.to,
    subject: "Reset your Cheaper Veo password",
    react: ResetPasswordEmail({ resetUrl: args.resetUrl }),
    tag: "reset-password",
  });
}
