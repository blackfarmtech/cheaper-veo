// Manually apply credits for a Stripe checkout session whose webhook was missed.
// Use when stripe listen wasn't running or the webhook secret was stale.
//
// Usage:
//   STRIPE_SECRET_KEY=sk_test_xxx \
//   DATABASE_URL=postgres://... \
//   node scripts/replay-checkout.mjs cs_test_xxx
//
// Idempotent — addTopupCredits keys on stripePaymentId.

import "dotenv/config";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const sessionId = process.argv[2];
if (!sessionId || !sessionId.startsWith("cs_")) {
  console.error("Usage: node scripts/replay-checkout.mjs <cs_test_xxx>");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

const session = await stripe.checkout.sessions.retrieve(sessionId);
console.log(`Session: ${session.id}`);
console.log(`Status:  ${session.status}  Payment: ${session.payment_status}`);
console.log(`Metadata:`, session.metadata);

if (session.payment_status !== "paid") {
  console.error("Session is not paid; refusing to credit.");
  process.exit(1);
}

const md = session.metadata ?? {};
const userId = md.userId;
const credits = Number.parseInt(md.credits ?? "", 10);
const amountUsdCents = Number.parseInt(md.amountUsdCents ?? "", 10);
const stripePaymentId =
  typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? session.id;

if (!userId || !Number.isFinite(credits) || !Number.isFinite(amountUsdCents)) {
  console.error("Invalid metadata on session.");
  process.exit(1);
}

// Replicates lib/credits.ts addTopupCredits behavior with idempotency on
// stripePaymentId. We use a transaction so balance + transaction row stay
// consistent.
const result = await prisma.$transaction(async (tx) => {
  const existing = await tx.creditTransaction.findUnique({
    where: { stripePaymentId },
  });
  if (existing) {
    return { alreadyApplied: true, txId: existing.id };
  }

  const created = await tx.creditTransaction.create({
    data: {
      userId,
      amount: credits,
      type: "topup",
      description: `Top-up via Stripe (replayed) — ${credits} credits`,
      stripePaymentId,
      amountUsdCents,
    },
  });

  await tx.user.update({
    where: { id: userId },
    data: { creditsBalance: { increment: credits } },
  });

  return { alreadyApplied: false, txId: created.id };
});

console.log("");
console.log(`✅ result: ${result.alreadyApplied ? "already applied (no-op)" : "applied"}`);
console.log(`   transaction id: ${result.txId}`);

const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { email: true, creditsBalance: true },
});
console.log(`   user: ${user?.email}  balance now: ${user?.creditsBalance} cr`);

await prisma.$disconnect();
