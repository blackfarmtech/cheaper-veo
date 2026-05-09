import "server-only";

import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import { triggerAutoRechargeIfNeeded } from "./auto-recharge";

export class InsufficientCreditsError extends Error {
  constructor(public readonly balance: number, public readonly required: number) {
    super(`Insufficient credits: balance ${balance} < required ${required}.`);
    this.name = "InsufficientCreditsError";
  }
}

export async function getBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditsBalance: true },
  });
  return user?.creditsBalance ?? 0;
}

export async function debitCredits(input: {
  userId: string;
  amount: number;
  generationId?: string;
  description?: string;
}): Promise<{ newBalance: number }> {
  if (input.amount <= 0) {
    throw new Error("debitCredits: amount must be positive.");
  }
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: { creditsBalance: true },
    });
    if (!user) throw new Error("User not found.");
    if (user.creditsBalance < input.amount) {
      throw new InsufficientCreditsError(user.creditsBalance, input.amount);
    }
    const updated = await tx.user.update({
      where: { id: input.userId },
      data: { creditsBalance: { decrement: input.amount } },
      select: { creditsBalance: true },
    });
    await tx.creditTransaction.create({
      data: {
        userId: input.userId,
        amount: -input.amount,
        type: "debit",
        description: input.description,
        generationId: input.generationId,
      },
    });
    return { newBalance: updated.creditsBalance };
  });

  // Fire-and-forget the auto-recharge check. Runs outside the DB transaction
  // because it touches Stripe, and we don't want to block the caller —
  // generations should return immediately. Errors are logged in the helper.
  void triggerAutoRechargeIfNeeded(input.userId).catch((err) => {
    // eslint-disable-next-line no-console
    console.error(`[auto-recharge] post-debit trigger failed for user=${input.userId}:`, err);
  });

  return result;
}

export async function refundCredits(input: {
  userId: string;
  amount: number;
  generationId?: string;
  description?: string;
}): Promise<{ newBalance: number }> {
  if (input.amount <= 0) {
    throw new Error("refundCredits: amount must be positive.");
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: input.userId },
      data: { creditsBalance: { increment: input.amount } },
      select: { creditsBalance: true },
    });
    await tx.creditTransaction.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        type: "refund",
        description: input.description,
        generationId: input.generationId,
      },
    });
    return { newBalance: updated.creditsBalance };
  });
}

export async function addTopupCredits(input: {
  userId: string;
  amount: number;
  stripePaymentId: string;
  amountCents: number;
  currency: string;
}): Promise<{ newBalance: number; alreadyApplied: boolean }> {
  if (input.amount <= 0) {
    throw new Error("addTopupCredits: amount must be positive.");
  }
  try {
    return await prisma.$transaction(async (tx) => {
      // The unique constraint on stripePaymentId enforces idempotency:
      // a duplicate webhook attempt fails fast with P2002 and we treat it as a no-op.
      await tx.creditTransaction.create({
        data: {
          userId: input.userId,
          amount: input.amount,
          type: "topup",
          stripePaymentId: input.stripePaymentId,
          amountCents: input.amountCents,
          currency: input.currency,
          description: `Top-up ${input.amount} credits`,
        },
      });
      const updated = await tx.user.update({
        where: { id: input.userId },
        data: { creditsBalance: { increment: input.amount } },
        select: { creditsBalance: true },
      });
      return { newBalance: updated.creditsBalance, alreadyApplied: false };
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const balance = await getBalance(input.userId);
      return { newBalance: balance, alreadyApplied: true };
    }
    throw err;
  }
}
