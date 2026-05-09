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
  const amountUsdCents = topup.usd * 100;

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `GeraEW · ${topup.credits} créditos`,
              description: `Recarga pay-as-you-go — ${topup.label}`,
            },
            unit_amount: amountUsdCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/billing?success=1`,
      cancel_url: `${appUrl}/dashboard/billing?canceled=1`,
      metadata: {
        userId,
        topupId: topup.id,
        credits: topup.credits.toString(),
        amountUsdCents: amountUsdCents.toString(),
      },
      payment_intent_data: {
        metadata: {
          userId,
          topupId: topup.id,
          credits: topup.credits.toString(),
          amountUsdCents: amountUsdCents.toString(),
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
    return NextResponse.json({ error: "checkout_create_failed" }, { status: 500 });
  }
}
