// Diagnose: shows recent checkout sessions + webhook delivery attempts.
// Run: STRIPE_SECRET_KEY=sk_test_xxx node scripts/diagnose-payment.mjs

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

console.log("\n=== RECENT CHECKOUT SESSIONS ===\n");
const sessions = await stripe.checkout.sessions.list({ limit: 5 });
for (const s of sessions.data) {
  console.log(`id:           ${s.id}`);
  console.log(`status:       ${s.status}  (payment: ${s.payment_status})`);
  console.log(`amount:       ${s.amount_total / 100} ${s.currency}`);
  console.log(`created:      ${new Date(s.created * 1000).toISOString()}`);
  console.log(`metadata:     ${JSON.stringify(s.metadata)}`);
  console.log(`payment_int:  ${typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? "—"}`);
  console.log("");
}

console.log("\n=== LAST 5 WEBHOOK EVENTS (checkout.session.*) ===\n");
const events = await stripe.events.list({
  limit: 10,
  types: ["checkout.session.completed", "checkout.session.async_payment_succeeded"],
});
for (const e of events.data) {
  console.log(`id:       ${e.id}  (${e.type})`);
  console.log(`created:  ${new Date(e.created * 1000).toISOString()}`);
  console.log(`pending:  ${e.pending_webhooks} webhook delivery attempts pending`);
  console.log("");
}

console.log("\n=== CONFIGURED WEBHOOK ENDPOINTS ===\n");
const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });
if (endpoints.data.length === 0) {
  console.log("(no endpoints configured — only stripe-cli forwarding works locally)");
}
for (const ep of endpoints.data) {
  console.log(`url:      ${ep.url}`);
  console.log(`status:   ${ep.status}`);
  console.log(`events:   ${ep.enabled_events.length} subscribed`);
  console.log("");
}
