// Diagnoses why auto-recharge did or did not fire for a user.
// Read-only: doesn't change anything.
//
// Usage:
//   node scripts/diagnose-auto-recharge.mjs <email>

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/diagnose-auto-recharge.mjs <email>");
  process.exit(1);
}

const prisma = new PrismaClient();

const user = await prisma.user.findUnique({
  where: { email },
  select: {
    id: true,
    email: true,
    creditsBalance: true,
    autoRechargeEnabled: true,
    autoRechargeThreshold: true,
    autoRechargeTopupId: true,
    autoRechargeInProgress: true,
    autoRechargeLastTriggeredAt: true,
    autoRechargeLastError: true,
    defaultPaymentMethodId: true,
    stripeCustomerId: true,
  },
});

if (!user) {
  console.error(`No user with email ${email}`);
  process.exit(1);
}

console.log("=== User state ===");
console.log(JSON.stringify(user, null, 2));

console.log("\n=== Last 5 generations ===");
const gens = await prisma.generation.findMany({
  where: { userId: user.id },
  orderBy: { createdAt: "desc" },
  take: 5,
  select: {
    id: true,
    status: true,
    creditsCost: true,
    createdAt: true,
    errorCode: true,
    errorMessage: true,
  },
});
console.log(JSON.stringify(gens, null, 2));

console.log("\n=== Last 5 transactions ===");
const txs = await prisma.creditTransaction.findMany({
  where: { userId: user.id },
  orderBy: { createdAt: "desc" },
  take: 5,
  select: {
    type: true,
    amount: true,
    description: true,
    createdAt: true,
  },
});
console.log(JSON.stringify(txs, null, 2));

console.log("\n=== Auto-recharge trigger check ===");
const cooldownMs = 60 * 60 * 1000;
const checks = {
  enabled: user.autoRechargeEnabled,
  has_topup_configured: !!user.autoRechargeTopupId,
  has_payment_method: !!user.defaultPaymentMethodId,
  has_customer_id: !!user.stripeCustomerId,
  balance_below_threshold: user.creditsBalance < user.autoRechargeThreshold,
  not_in_progress: !user.autoRechargeInProgress,
  cooldown_elapsed: !user.autoRechargeLastTriggeredAt ||
    Date.now() - user.autoRechargeLastTriggeredAt.getTime() >= cooldownMs,
  no_recent_error: !user.autoRechargeLastError,
};
for (const [k, v] of Object.entries(checks)) {
  console.log(`  ${v ? "✅" : "❌"}  ${k}`);
}
console.log(
  `\n→ Trigger should ${Object.values(checks).every(Boolean) ? "FIRE on next debit" : "NOT FIRE"}`,
);

if (user.autoRechargeLastTriggeredAt) {
  const sinceMin = Math.floor(
    (Date.now() - user.autoRechargeLastTriggeredAt.getTime()) / 60000,
  );
  console.log(`  Last triggered ${sinceMin} min ago (cooldown: 60 min)`);
}

await prisma.$disconnect();
