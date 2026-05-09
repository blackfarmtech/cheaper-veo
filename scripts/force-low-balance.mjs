// Lowers a user's balance to trigger auto-recharge.
// Usage:
//   node scripts/force-low-balance.mjs <userEmail> <newBalance>
// Example:
//   node scripts/force-low-balance.mjs coven688@gmail.com 50

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const [, , email, balanceArg] = process.argv;
if (!email || !balanceArg) {
  console.error("Usage: node scripts/force-low-balance.mjs <email> <newBalance>");
  process.exit(1);
}
const newBalance = Number.parseInt(balanceArg, 10);
if (!Number.isFinite(newBalance) || newBalance < 0) {
  console.error("Invalid balance.");
  process.exit(1);
}

const prisma = new PrismaClient();
const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  console.error(`No user with email ${email}`);
  process.exit(1);
}

console.log(`Before: ${user.email} = ${user.creditsBalance} cr`);

await prisma.user.update({
  where: { id: user.id },
  data: { creditsBalance: newBalance },
});

console.log(`After:  ${user.email} = ${newBalance} cr`);
console.log("");
console.log("Auto-recharge config:");
const fresh = await prisma.user.findUnique({
  where: { id: user.id },
  select: {
    autoRechargeEnabled: true,
    autoRechargeThreshold: true,
    autoRechargeTopupId: true,
    defaultPaymentMethodId: true,
    autoRechargeInProgress: true,
    autoRechargeLastTriggeredAt: true,
  },
});
console.log(fresh);

await prisma.$disconnect();
