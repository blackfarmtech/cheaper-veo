// One-off script: creates Stripe Products + Prices for every Cheaper Veo top-up.
// Run with:
//   STRIPE_SECRET_KEY=sk_test_xxx node scripts/create-stripe-products.mjs
//
// Idempotent: looks up products by metadata.topup_id and reuses them.

import Stripe from "stripe";

const TOPUPS = [
  { id: "topup-5",   usd: 5,   credits: 500,    label: "Entrada mínima" },
  { id: "topup-10",  usd: 10,  credits: 1_000,  label: "Uso leve" },
  { id: "topup-25",  usd: 25,  credits: 2_500,  label: "Criadores" },
  { id: "topup-50",  usd: 50,  credits: 5_000,  label: "Recorrente" },
  { id: "topup-100", usd: 100, credits: 10_000, label: "Agências" },
  { id: "topup-250", usd: 250, credits: 25_000, label: "Escala" },
  { id: "topup-500", usd: 500, credits: 50_000, label: "Enterprise" },
];

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  appInfo: { name: "Cheaper Veo · setup script" },
});

async function findExistingProduct(topupId) {
  // Stripe doesn't have a direct query-by-metadata API, so we scan recent products.
  // Fine for a one-off setup with <50 products on the account.
  for await (const p of stripe.products.list({ limit: 100, active: true })) {
    if (p.metadata?.topup_id === topupId) return p;
  }
  return null;
}

async function ensureProduct(topup) {
  const existing = await findExistingProduct(topup.id);
  if (existing) {
    console.log(`  [reuse]  product ${existing.id} (${topup.id})`);
    return existing;
  }
  const product = await stripe.products.create({
    name: `Cheaper Veo · ${topup.credits.toLocaleString("en-US")} credits`,
    description: `Pay-as-you-go top-up — ${topup.label}. ${topup.credits} credits never expire.`,
    metadata: {
      topup_id: topup.id,
      credits: String(topup.credits),
      usd: String(topup.usd),
      product_kind: "credit_topup",
    },
  });
  console.log(`  [created] product ${product.id} (${topup.id})`);
  return product;
}

async function ensurePrice(product, topup) {
  // Find an existing one-time USD price that matches the dollar amount.
  for await (const p of stripe.prices.list({ product: product.id, active: true, limit: 100 })) {
    if (
      p.currency === "usd" &&
      p.unit_amount === topup.usd * 100 &&
      p.type === "one_time"
    ) {
      console.log(`  [reuse]  price   ${p.id}`);
      return p;
    }
  }
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: topup.usd * 100,
    metadata: {
      topup_id: topup.id,
      credits: String(topup.credits),
    },
  });
  console.log(`  [created] price   ${price.id}`);
  return price;
}

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY env var is required.");
    process.exit(1);
  }
  const account = await stripe.accounts.retrieve();
  console.log(
    `Stripe account: ${account.id}  (${account.business_profile?.name ?? "no name"})`,
  );
  console.log(`Mode: ${process.env.STRIPE_SECRET_KEY.startsWith("sk_test_") ? "TEST" : "LIVE"}`);
  console.log("");

  const summary = [];
  for (const topup of TOPUPS) {
    console.log(`▸ ${topup.id}  ($${topup.usd} → ${topup.credits} cr)`);
    const product = await ensureProduct(topup);
    const price = await ensurePrice(product, topup);
    summary.push({ topupId: topup.id, productId: product.id, priceId: price.id });
    console.log("");
  }

  console.log("─".repeat(60));
  console.log("Summary:");
  for (const row of summary) {
    console.log(`  ${row.topupId.padEnd(12)} → ${row.productId}  /  ${row.priceId}`);
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
