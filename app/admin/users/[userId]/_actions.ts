"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export type AdminActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export async function adminGrantCreditsAction(input: {
  userId: string;
  amount: number;
  description: string;
  type: "bonus" | "adjustment";
}): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();

    if (!Number.isInteger(input.amount) || input.amount === 0) {
      return { ok: false, error: "Amount must be an integer and non-zero." };
    }
    if (input.amount > 1_000_000 || input.amount < -1_000_000) {
      return { ok: false, error: "Amount out of safe range (±1,000,000)." };
    }
    if (!input.description.trim()) {
      return { ok: false, error: "Description is required (audit)." };
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: input.userId },
        select: { creditsBalance: true },
      });
      if (!user) throw new Error("User not found");

      const newBalance = user.creditsBalance + input.amount;
      if (newBalance < 0) {
        throw new Error(
          `Operation would result in negative balance (${newBalance}).`,
        );
      }

      await tx.user.update({
        where: { id: input.userId },
        data: { creditsBalance: newBalance },
      });

      await tx.creditTransaction.create({
        data: {
          userId: input.userId,
          amount: input.amount,
          type: input.type,
          description: `[admin:${admin.email}] ${input.description}`,
        },
      });
    });

    revalidatePath(`/admin/users/${input.userId}`);
    revalidatePath("/admin");
    return { ok: true, message: `${input.amount > 0 ? "+" : ""}${input.amount} credits applied.` };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown failure.",
    };
  }
}

export async function adminToggleAutoRechargeAction(input: {
  userId: string;
  enabled: boolean;
}): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    await prisma.user.update({
      where: { id: input.userId },
      data: {
        autoRechargeEnabled: input.enabled,
        // Clear any error so the user can try again.
        autoRechargeLastError: input.enabled ? null : undefined,
      },
    });
    revalidatePath(`/admin/users/${input.userId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown failure.",
    };
  }
}

export async function adminClearAutoRechargeLockAction(
  userId: string,
): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    await prisma.user.update({
      where: { id: userId },
      data: {
        autoRechargeInProgress: false,
        autoRechargeLastError: null,
        // Also reset the cooldown so admin can re-trigger immediately for
        // testing or after fixing a payment issue.
        autoRechargeLastTriggeredAt: null,
      },
    });
    revalidatePath(`/admin/users/${userId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown failure.",
    };
  }
}

export async function adminRevokeApiKeyAction(input: {
  keyId: string;
  userId: string;
}): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.apiKey.update({
      where: { id: input.keyId },
      data: { revokedAt: new Date() },
    });
    // eslint-disable-next-line no-console
    console.log(`[admin] ${admin.email} revoked apiKey=${input.keyId}`);
    revalidatePath(`/admin/users/${input.userId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown failure.",
    };
  }
}
