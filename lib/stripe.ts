import "server-only";

import Stripe from "stripe";

import { prisma } from "@/lib/prisma";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  // Fail fast on cold start so the issue is obvious in logs instead of
  // silently producing a misconfigured client.
  // eslint-disable-next-line no-console
  console.warn("[stripe] STRIPE_SECRET_KEY is not set; Stripe calls will fail at runtime.");
}

/**
 * Server-only Stripe client. We intentionally omit `apiVersion` so the SDK
 * uses the version pinned by the installed package — the runtime types
 * reject newer literal strings unless they match the SDK's typed union.
 */
export const stripe = new Stripe(secretKey ?? "", {
  appInfo: {
    name: "GeraEW",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },
});

/**
 * Returns the Stripe Customer ID for a user, creating one if it doesn't
 * exist yet. Persists the customer ID back on the User row so we never
 * create duplicates.
 */
export async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (user?.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(user.stripeCustomerId);
      if (!existing.deleted) return existing.id;
    } catch (err: unknown) {
      // If the customer belongs to another mode (test↔live) or was deleted,
      // Stripe responds with a 404 / resource_missing — fall through and recreate.
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code?: string }).code
          : undefined;
      if (code !== "resource_missing") throw err;
    }
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
