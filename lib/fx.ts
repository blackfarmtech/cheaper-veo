/**
 * USD → BRL exchange rate fetcher.
 *
 * The merchant Stripe account is BR, so all line items are anchored in BRL.
 * The landing displays USD prices computed from those BRL amounts using the
 * current mid-market rate. The rate is cached via Next.js fetch cache so the
 * page stays static between revalidations.
 *
 * Source: frankfurter.app (ECB-based, no auth, mid-market rate).
 */

const FX_FALLBACK_USD_BRL = 5.0;
const FX_REVALIDATE_SECONDS = 6 * 60 * 60; // 6h

export interface UsdBrlRate {
  rate: number;       // BRL per 1 USD
  fetchedAt: string | null; // ISO date the rate was published; null if fallback
  isFallback: boolean;
}

export async function getUsdBrlRate(): Promise<UsdBrlRate> {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=BRL", {
      next: { revalidate: FX_REVALIDATE_SECONDS, tags: ["fx-usd-brl"] },
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as { date?: string; rates?: { BRL?: number } };
    const rate = data.rates?.BRL;
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      throw new Error("invalid rate payload");
    }
    return { rate, fetchedAt: data.date ?? null, isFallback: false };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[fx] USD→BRL fetch failed, using fallback", err);
    return { rate: FX_FALLBACK_USD_BRL, fetchedAt: null, isFallback: true };
  }
}

/** Convert BRL cents to a USD number using the given rate. */
export function brlCentsToUsd(brlCents: number, usdBrlRate: number): number {
  return brlCents / 100 / usdBrlRate;
}
