"use server";

import { revalidatePath } from "next/cache";

import {
  createSetupCardCheckout,
  removePaymentMethod,
  saveAutoRechargeConfig,
} from "@/lib/auto-recharge";
import { requireUser } from "@/lib/session";
import { getOrCreateCustomer } from "@/lib/stripe";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function saveAutoRechargeAction(input: {
  enabled: boolean;
  threshold: number;
  topupId: string;
}): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await saveAutoRechargeConfig(user.id, {
      enabled: input.enabled,
      threshold: input.threshold,
      topupId: input.topupId,
    });
    revalidatePath("/dashboard/billing");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save settings.";
    return { ok: false, error: message };
  }
}

export async function startSaveCardAction(): Promise<ActionResult<{ url: string }>> {
  try {
    const user = await requireUser();
    const customerId = await getOrCreateCustomer(user.id, user.email);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const url = await createSetupCardCheckout(user.id, customerId, appUrl);
    return { ok: true, data: { url } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start card setup.";
    return { ok: false, error: message };
  }
}

export async function removePaymentMethodAction(): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await removePaymentMethod(user.id);
    revalidatePath("/dashboard/billing");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove card.";
    return { ok: false, error: message };
  }
}
