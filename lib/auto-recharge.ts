import "server-only";

import type Stripe from "stripe";

import { prisma } from "./prisma";
import { stripe } from "./stripe";
import { getTopupById } from "./pricing";

// 5 minutes between auto-recharges. Long enough to absorb typical webhook
// delays (seconds), short enough to not hurt high-volume users.
const COOLDOWN_MS = 5 * 60 * 1000;

export interface AutoRechargeConfig {
  enabled: boolean;
  threshold: number;
  topupId: string;
}

export interface SaveAutoRechargeResult {
  ok: true;
}

/**
 * Updates the user's auto-recharge preferences. Validates threshold and topup.
 */
export async function saveAutoRechargeConfig(
  userId: string,
  config: AutoRechargeConfig,
): Promise<SaveAutoRechargeResult> {
  if (config.enabled) {
    if (!Number.isInteger(config.threshold) || config.threshold < 10) {
      throw new Error("Threshold must be at least 10 credits.");
    }
    if (config.threshold > 100_000) {
      throw new Error("Threshold cannot exceed 100,000 credits.");
    }
    if (!getTopupById(config.topupId)) {
      throw new Error(`Unknown topup id: ${config.topupId}`);
    }

    // Don't allow enabling without a saved card.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { defaultPaymentMethodId: true },
    });
    if (!user?.defaultPaymentMethodId) {
      throw new Error("Add a payment method before enabling auto-recharge.");
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      autoRechargeEnabled: config.enabled,
      autoRechargeThreshold: config.threshold,
      autoRechargeTopupId: config.enabled ? config.topupId : null,
      // Clear any stale error so re-enabling starts fresh
      autoRechargeLastError: config.enabled ? null : undefined,
    },
  });

  return { ok: true };
}

/**
 * Removes the saved card and disables auto-recharge.
 */
export async function removePaymentMethod(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { defaultPaymentMethodId: true, stripeCustomerId: true },
  });

  // Detach from Stripe so the customer record stays clean.
  if (user?.defaultPaymentMethodId) {
    try {
      await stripe.paymentMethods.detach(user.defaultPaymentMethodId);
    } catch {
      // Already detached or invalid id — proceed with local cleanup.
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      defaultPaymentMethodId: null,
      autoRechargeEnabled: false,
      autoRechargeTopupId: null,
    },
  });
}

/**
 * Creates a Stripe Checkout in setup mode so the user adds a card without
 * being charged. The card gets saved to their Customer for future off-session
 * use. The setup_intent.succeeded webhook handler persists the
 * `defaultPaymentMethodId`.
 */
export async function createSetupCardCheckout(
  userId: string,
  customerId: string,
  appUrl: string,
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    payment_method_types: ["card"],
    success_url: `${appUrl}/dashboard/billing?card_added=1`,
    cancel_url: `${appUrl}/dashboard/billing?card_canceled=1`,
    metadata: { userId, intent: "save_default_card" },
  });
  if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
  return session.url;
}

/**
 * Persists the PaymentMethod returned by a setup_intent.succeeded webhook.
 * Marks the saved card as the customer's invoice/default for future charges.
 */
export async function persistDefaultPaymentMethod(args: {
  userId: string;
  paymentMethodId: string;
  customerId: string;
}): Promise<void> {
  // Make this PM the customer default so future PaymentIntents auto-pick it.
  try {
    await stripe.customers.update(args.customerId, {
      invoice_settings: { default_payment_method: args.paymentMethodId },
    });
  } catch {
    // Non-fatal: we still store the PM id locally and pass it explicitly
    // when creating the off-session PaymentIntent.
  }

  await prisma.user.update({
    where: { id: args.userId },
    data: {
      defaultPaymentMethodId: args.paymentMethodId,
      autoRechargeLastError: null,
    },
  });
}

/**
 * Triggers an off-session charge if (and only if) the user has auto-recharge
 * enabled, balance is below threshold, no charge is currently in flight, and
 * cooldown has elapsed. Safe to call after every debit — it short-circuits
 * almost all of the time.
 *
 * Race-safety: uses an atomic UPDATE with a WHERE filter to claim the
 * `autoRechargeInProgress` flag. Only the caller that flips false→true
 * proceeds; concurrent callers see false and exit.
 */
export async function triggerAutoRechargeIfNeeded(
  userId: string,
): Promise<{ triggered: boolean; reason?: string }> {
  // Cheap pre-check before the atomic claim.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      creditsBalance: true,
      autoRechargeEnabled: true,
      autoRechargeThreshold: true,
      autoRechargeTopupId: true,
      autoRechargeInProgress: true,
      autoRechargeLastTriggeredAt: true,
      defaultPaymentMethodId: true,
      stripeCustomerId: true,
    },
  });
  if (!user) return { triggered: false, reason: "user_not_found" };
  if (!user.autoRechargeEnabled) return { triggered: false, reason: "disabled" };
  if (!user.autoRechargeTopupId) return { triggered: false, reason: "no_topup_configured" };
  if (!user.defaultPaymentMethodId) return { triggered: false, reason: "no_payment_method" };
  if (!user.stripeCustomerId) return { triggered: false, reason: "no_customer_id" };
  if (user.creditsBalance >= user.autoRechargeThreshold) {
    return { triggered: false, reason: "above_threshold" };
  }
  if (user.autoRechargeInProgress) {
    return { triggered: false, reason: "already_in_progress" };
  }
  if (
    user.autoRechargeLastTriggeredAt &&
    Date.now() - user.autoRechargeLastTriggeredAt.getTime() < COOLDOWN_MS
  ) {
    return { triggered: false, reason: "cooldown" };
  }

  const topup = getTopupById(user.autoRechargeTopupId);
  if (!topup) return { triggered: false, reason: "invalid_topup" };

  // Atomic claim: only succeeds if still false.
  const claim = await prisma.user.updateMany({
    where: {
      id: userId,
      autoRechargeInProgress: false,
      autoRechargeEnabled: true,
    },
    data: { autoRechargeInProgress: true },
  });
  if (claim.count === 0) {
    // Lost the race; another caller is handling it.
    return { triggered: false, reason: "race_lost" };
  }

  try {
    await stripe.paymentIntents.create({
      amount: topup.usd * 100,
      currency: "usd",
      customer: user.stripeCustomerId,
      payment_method: user.defaultPaymentMethodId,
      off_session: true,
      confirm: true,
      description: `Cheaper Veo auto-recharge — ${topup.credits} credits`,
      metadata: {
        userId,
        topupId: topup.id,
        credits: String(topup.credits),
        amountUsdCents: String(topup.usd * 100),
        kind: "auto_recharge",
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        autoRechargeLastTriggeredAt: new Date(),
        autoRechargeLastError: null,
        // Stays in_progress until the webhook confirms; webhook flips it back.
      },
    });
    return { triggered: true };
  } catch (err) {
    // Most common failure: card requires SCA / authentication, declined, etc.
    // Disable auto-recharge so we don't loop. User must re-add card or retry
    // manually.
    const msg = err instanceof Error ? err.message : "Unknown error";
    let stripeCode: string | undefined;
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      typeof (err as { code?: unknown }).code === "string"
    ) {
      stripeCode = (err as { code: string }).code;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        autoRechargeInProgress: false,
        autoRechargeEnabled: false,
        autoRechargeLastError: stripeCode ?? msg,
      },
    });
    return { triggered: false, reason: stripeCode ?? "stripe_error" };
  }
}

/**
 * Called from the webhook after the auto-recharge PaymentIntent succeeds.
 * Releases the in-progress lock so future debits can re-trigger if needed.
 */
export async function releaseAutoRechargeLock(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { autoRechargeInProgress: false },
  });
}

/**
 * Identifies an auto-recharge PaymentIntent by its metadata. Used by the
 * webhook to route to the correct handler.
 */
export function isAutoRechargeIntent(
  pi: Pick<Stripe.PaymentIntent, "metadata">,
): boolean {
  return pi.metadata?.kind === "auto_recharge";
}

export interface SavedCardDisplay {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

/**
 * Fetches the saved PaymentMethod from Stripe and returns display info
 * (brand, last4, exp). Returns null if no card is saved or fetch fails.
 */
export async function getSavedCardDisplay(
  userId: string,
): Promise<SavedCardDisplay | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { defaultPaymentMethodId: true },
  });
  if (!user?.defaultPaymentMethodId) return null;

  try {
    const pm = await stripe.paymentMethods.retrieve(user.defaultPaymentMethodId);
    if (!pm.card) return null;
    return {
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
    };
  } catch {
    return null;
  }
}
