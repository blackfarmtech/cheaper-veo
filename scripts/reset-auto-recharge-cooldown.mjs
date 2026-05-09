// Resets the auto-recharge cooldown for a user (clears lastTriggeredAt and lock).
// Useful for testing without waiting 1h between attempts.
//
// Usage:
//   node scripts/reset-auto-recharge-cooldown.mjs <email>

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/reset-auto-recharge-cooldown.mjs <email>");
  process.exit(1);
}

const prisma = new PrismaClient();

const before = await prisma.user.findUnique({
  where: { email },
  select: {
    autoRechargeLastTriggeredAt: true,
    autoRechargeInProgress: true,
    autoRechargeLastError: true,
  },
});

if (!before) {
  console.error(`No user with email ${email}`);
  process.exit(1);
}

console.log("Before:", before);

await prisma.user.update({
  where: { email },
  data: {
    autoRechargeLastTriggeredAt: null,
    autoRechargeInProgress: false,
    autoRechargeLastError: null,
  },
});

console.log("✅ Cooldown reset. Próximo debit que cair abaixo do threshold vai disparar.");

await prisma.$disconnect();
