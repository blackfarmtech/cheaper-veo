import { headers } from "next/headers";
import type Stripe from "stripe";

import { addTopupCredits } from "@/lib/credits";
import {
  isAutoRechargeIntent,
  persistDefaultPaymentMethod,
  releaseAutoRechargeLock,
} from "@/lib/auto-recharge";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
// Stripe sends webhooks with raw bodies; never let Next.js cache or transform them.
export const dynamic = "force-dynamic";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function badRequest(message: string): Response {
  return new Response(message, { status: 400 });
}

export async function POST(req: Request): Promise<Response> {
  if (!WEBHOOK_SECRET) {
    // eslint-disable-next-line no-console
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured");
    return new Response("webhook secret not configured", { status: 500 });
  }

  const sig = (await headers()).get("stripe-signature");
  if (!sig) {
    return badRequest("missing stripe-signature header");
  }

  // Raw body required for signature verification.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    // eslint-disable-next-line no-console
    console.error("[stripe-webhook] signature verification failed:", message);
    return badRequest(`webhook signature verification failed: ${message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "setup") {
          await handleSetupCompleted(session);
        } else {
          await handleCheckoutCompleted(session);
        }
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        if (isAutoRechargeIntent(pi)) {
          await handleAutoRechargeSucceeded(pi);
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        if (isAutoRechargeIntent(pi)) {
          await handleAutoRechargeFailed(pi);
        }
        break;
      }
      default:
        // No-op for unhandled events; Stripe expects 2xx so it stops retrying.
        break;
    }

    return Response.json({ received: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[stripe-webhook] handler error for ${event.type}:`, err);

    // Retry only on transient infrastructure failures. Permanent errors
    // (bad metadata shape, programmer bugs) get logged and 200'd so Stripe
    // doesn't retry forever — the truth lives in our idempotent helper.
    if (isTransientError(err)) {
      return new Response("transient error, please retry", { status: 500 });
    }
    return Response.json({ received: true, handled: false });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.payment_status !== "paid") {
    // eslint-disable-next-line no-console
    console.warn(`[stripe-webhook] checkout.session.completed but payment_status=${session.payment_status}; skipping`);
    return;
  }

  const metadata = session.metadata ?? {};
  const userId = metadata.userId;
  const creditsRaw = metadata.credits;
  const amountUsdCentsRaw = metadata.amountUsdCents;

  if (!userId || !creditsRaw || !amountUsdCentsRaw) {
    throw new PermanentWebhookError(
      `missing metadata on session ${session.id}: userId=${userId} credits=${creditsRaw} amountUsdCents=${amountUsdCentsRaw}`,
    );
  }

  const credits = Number.parseInt(creditsRaw, 10);
  const amountUsdCents = Number.parseInt(amountUsdCentsRaw, 10);
  if (!Number.isFinite(credits) || credits <= 0) {
    throw new PermanentWebhookError(`invalid credits in metadata: ${creditsRaw}`);
  }
  if (!Number.isFinite(amountUsdCents) || amountUsdCents <= 0) {
    throw new PermanentWebhookError(`invalid amountUsdCents in metadata: ${amountUsdCentsRaw}`);
  }

  const paymentIntent = session.payment_intent;
  const stripePaymentId =
    typeof paymentIntent === "string"
      ? paymentIntent
      : paymentIntent?.id ?? session.id; // fallback to session id (still unique)

  if (!stripePaymentId) {
    throw new PermanentWebhookError(`no payment_intent on session ${session.id}`);
  }

  const result = await addTopupCredits({
    userId,
    amount: credits,
    stripePaymentId,
    amountUsdCents,
  });

  // eslint-disable-next-line no-console
  console.log(
    `[stripe-webhook] topup applied user=${userId} credits=${credits} payment=${stripePaymentId} alreadyApplied=${result.alreadyApplied}`,
  );
}

async function handleSetupCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;
  const setupIntentId =
    typeof session.setup_intent === "string"
      ? session.setup_intent
      : session.setup_intent?.id;

  if (!userId || !customerId || !setupIntentId) {
    throw new PermanentWebhookError(
      `setup session ${session.id} missing data: userId=${userId} customer=${customerId} setupIntent=${setupIntentId}`,
    );
  }

  // Fetch the SetupIntent to get the saved PaymentMethod id.
  const si = await stripe.setupIntents.retrieve(setupIntentId);
  const pmId = typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id;
  if (!pmId) {
    throw new PermanentWebhookError(`setup intent ${setupIntentId} has no payment_method`);
  }

  await persistDefaultPaymentMethod({ userId, paymentMethodId: pmId, customerId });

  // eslint-disable-next-line no-console
  console.log(`[stripe-webhook] card saved user=${userId} pm=${pmId}`);
}

async function handleAutoRechargeSucceeded(pi: Stripe.PaymentIntent): Promise<void> {
  const userId = pi.metadata?.userId;
  const creditsRaw = pi.metadata?.credits;
  const amountUsdCentsRaw = pi.metadata?.amountUsdCents;

  if (!userId || !creditsRaw || !amountUsdCentsRaw) {
    throw new PermanentWebhookError(
      `auto-recharge PI ${pi.id} missing metadata`,
    );
  }
  const credits = Number.parseInt(creditsRaw, 10);
  const amountUsdCents = Number.parseInt(amountUsdCentsRaw, 10);
  if (!Number.isFinite(credits) || credits <= 0) {
    throw new PermanentWebhookError(`auto-recharge PI ${pi.id} invalid credits`);
  }

  const result = await addTopupCredits({
    userId,
    amount: credits,
    stripePaymentId: pi.id,
    amountUsdCents,
  });

  await releaseAutoRechargeLock(userId);

  // eslint-disable-next-line no-console
  console.log(
    `[stripe-webhook] auto-recharge applied user=${userId} credits=${credits} pi=${pi.id} alreadyApplied=${result.alreadyApplied}`,
  );
}

async function handleAutoRechargeFailed(pi: Stripe.PaymentIntent): Promise<void> {
  const userId = pi.metadata?.userId;
  if (!userId) {
    throw new PermanentWebhookError(`auto-recharge PI ${pi.id} missing userId`);
  }
  // Disable auto-recharge so we don't loop, and surface the error to UI.
  const { prisma } = await import("@/lib/prisma");
  await prisma.user.update({
    where: { id: userId },
    data: {
      autoRechargeInProgress: false,
      autoRechargeEnabled: false,
      autoRechargeLastError:
        pi.last_payment_error?.code ??
        pi.last_payment_error?.message ??
        "payment_failed",
    },
  });
  // eslint-disable-next-line no-console
  console.warn(
    `[stripe-webhook] auto-recharge FAILED user=${userId} pi=${pi.id} reason=${pi.last_payment_error?.code ?? "unknown"}`,
  );
}

/**
 * Marker for malformed/permanent failures. Throwing this signals the caller
 * to ack the webhook (200) instead of asking Stripe to retry.
 */
class PermanentWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermanentWebhookError";
  }
}

function isTransientError(err: unknown): boolean {
  if (err instanceof PermanentWebhookError) return false;
  // Anything else (DB connection drop, network glitch) we treat as transient
  // and let Stripe retry per its standard backoff schedule.
  return true;
}
