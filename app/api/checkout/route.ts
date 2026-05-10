import { NextResponse } from "next/server";
import { z } from "zod";

import { getTopupById } from "@/lib/pricing";
import { getSession } from "@/lib/session";
import { getOrCreateCustomer, stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const bodySchema = z.object({
  topupId: z.string().min(1),
});

export async function POST(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const topup = getTopupById(parsed.data.topupId);
  if (!topup) {
    return NextResponse.json({ error: "invalid_topup" }, { status: 400 });
  }

  const userId = session.user.id;
  const email = session.user.email;

  let customerId: string;
  try {
    customerId = await getOrCreateCustomer(userId, email);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[checkout] getOrCreateCustomer failed", err);
    return NextResponse.json({ error: "customer_create_failed" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const amountCents = topup.amountCents;
  // Opt-in: Stripe Tax must be enabled and configured in the Dashboard
  // (Settings → Tax) before flipping this on, otherwise checkout creation
  // fails. Set STRIPE_AUTOMATIC_TAX=1 once tax registrations are in place.
  const automaticTaxEnabled = process.env.STRIPE_AUTOMATIC_TAX === "1";

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      // Omitting payment_method_types lets Stripe auto-select methods enabled
      // in the Dashboard that are compatible with the line-item currency.
      // BRL unlocks Pix automatically; cards always work; Adaptive Pricing
      // (must be enabled in Dashboard → Settings → Payments → Adaptive Pricing)
      // shows the localized currency to international visitors.
      line_items: [
        {
          price_data: {
            currency: topup.currency,
            product_data: {
              name: `Cheaper Veo · ${topup.credits} credits`,
              description: `Pay-as-you-go top-up — ${topup.label}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      // Collecting the billing address gives Stripe the buyer's country, which
      // it uses to (a) localize the displayed currency via Adaptive Pricing
      // and (b) compute taxes correctly when automatic_tax is enabled.
      billing_address_collection: "required",
      // Lets B2B buyers add VAT/CNPJ/EIN so invoices are tax-compliant in
      // their jurisdiction. Stripe validates the format per country.
      tax_id_collection: { enabled: true },
      // Stripe Tax computes and adds tax based on the buyer's location and
      // your registered tax thresholds. Requires Stripe Tax to be enabled in
      // the Dashboard before turning on STRIPE_AUTOMATIC_TAX=1.
      automatic_tax: { enabled: automaticTaxEnabled },
      // Locale auto-detects from the browser; Stripe Checkout already does
      // this, but pinning "auto" is explicit and survives custom callers.
      locale: "auto",
      success_url: `${appUrl}/dashboard/billing?success=1`,
      cancel_url: `${appUrl}/dashboard/billing?canceled=1`,
      metadata: {
        userId,
        topupId: topup.id,
        credits: topup.credits.toString(),
        amountCents: amountCents.toString(),
        currency: topup.currency,
      },
      payment_intent_data: {
        metadata: {
          userId,
          topupId: topup.id,
          credits: topup.credits.toString(),
          amountCents: amountCents.toString(),
          currency: topup.currency,
        },
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "no_checkout_url" }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[checkout] stripe.checkout.sessions.create failed", err);
    const stripeCode =
      err && typeof err === "object" && "code" in err
        ? (err as { code?: string }).code
        : undefined;
    const stripeType =
      err && typeof err === "object" && "type" in err
        ? (err as { type?: string }).type
        : undefined;
    return NextResponse.json(
      {
        error: "checkout_create_failed",
        stripeCode: stripeCode ?? null,
        stripeType: stripeType ?? null,
      },
      { status: 500 },
    );
  }
}
