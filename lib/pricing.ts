/**
 * Pricing catalog — Pay as you go.
 * 1 credit = US$0.01 (1 cent)
 * Prices tabulated for 8-second videos.
 * For 4s and 6s we apply linear prorata rounded up (4s = 50%, 6s = 75%).
 */

export type Tier = "lite" | "fast" | "quality";
export type Resolution = "720p" | "1080p" | "4k";
export type AspectRatio = "16:9" | "9:16";
export type Duration = 4 | 6 | 8;

export interface ModelOption {
  id: string;                 // public id used in API: "veo3-lite", "veo3-fast", "veo3-quality"
  tier: Tier;
  upstreamModel: string;      // model param sent to NestJS provider
  label: string;
  description: string;
  speedHint: string;          // "1-2 min", etc
  resolutions: Resolution[];
}

export const MODELS: ModelOption[] = [
  {
    id: "veo3-lite",
    tier: "lite",
    upstreamModel: "veo-3.1-fast-generate-001",
    label: "Veo 3.1 Lite",
    description: "Quick tests and high volume.",
    speedHint: "1-2 min",
    resolutions: ["720p", "1080p"],
  },
  {
    id: "veo3-fast",
    tier: "fast",
    upstreamModel: "veo-3.1-fast-generate-001",
    label: "Veo 3.1 Fast",
    description: "Best value for creators and apps.",
    speedHint: "1-3 min",
    resolutions: ["720p", "1080p", "4k"],
  },
  {
    id: "veo3-quality",
    tier: "quality",
    upstreamModel: "veo-3.1-generate-001",
    label: "Veo 3.1 Quality",
    description: "Final videos and premium production.",
    speedHint: "2-5 min",
    resolutions: ["720p", "1080p", "4k"],
  },
];

/**
 * Credit table per 8s video (precificacao_pay_as_you_go_veo31.md).
 */
const PRICE_8S: Record<Tier, Record<Resolution, { audio: number; noAudio: number }>> = {
  lite: {
    "720p":  { audio: 14, noAudio: 9  },
    "1080p": { audio: 16, noAudio: 11 },
    "4k":    { audio: 0,  noAudio: 0  }, // not available
  },
  fast: {
    "720p":  { audio: 28, noAudio: 22 },
    "1080p": { audio: 30, noAudio: 25 },
    "4k":    { audio: 84, noAudio: 70 },
  },
  quality: {
    "720p":  { audio: 112, noAudio: 79  },
    "1080p": { audio: 112, noAudio: 79  },
    "4k":    { audio: 168, noAudio: 119 },
  },
};

export function getModelById(id: string): ModelOption | undefined {
  return MODELS.find((m) => m.id === id);
}

export class PricingError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export function calculateCredits(input: {
  modelId: string;
  resolution: Resolution;
  audio: boolean;
  durationSeconds: Duration;
}): number {
  const model = getModelById(input.modelId);
  if (!model) {
    throw new PricingError("INVALID_MODEL", `Unknown model "${input.modelId}".`);
  }
  if (!model.resolutions.includes(input.resolution)) {
    throw new PricingError(
      "RESOLUTION_NOT_SUPPORTED",
      `Resolution "${input.resolution}" is not available for model "${model.id}".`,
    );
  }
  const base = PRICE_8S[model.tier][input.resolution];
  const credits8s = input.audio ? base.audio : base.noAudio;
  if (credits8s === 0) {
    throw new PricingError(
      "RESOLUTION_NOT_SUPPORTED",
      `Resolution "${input.resolution}" is not available for "${model.id}".`,
    );
  }
  // prorata: 4s = 50%, 6s = 75%, 8s = 100%
  const factor = input.durationSeconds === 4 ? 0.5 : input.durationSeconds === 6 ? 0.75 : 1;
  return Math.ceil(credits8s * factor);
}

/**
 * Pay-as-you-go top-ups.
 *
 * Pricing is anchored in BRL (Brazilian Real) because the merchant Stripe
 * account is BR — settlement currency must match line-item currency, otherwise
 * cross-border restrictions block BR cards in USD. Adaptive Pricing on Stripe
 * Checkout localizes the display for international visitors automatically
 * (USD/EUR/etc), and we receive BRL.
 *
 * Rough USD reference (1 USD ≈ 5 BRL) is provided for UI display only.
 * Credits are currency-agnostic (1 cr = the unit a generation costs).
 *
 * Conversion at R$ 0.05 per credit:
 *   R$ 25 → 500 cr   ($5 reference)
 *   R$ 50 → 1.000 cr ($10 reference)
 */
export interface TopupOption {
  id: string;
  currency: "brl" | "usd";
  amountCents: number;     // line-item unit_amount in the topup's currency
  usdReference: number;    // approximate USD value, for bilingual UI display only
  credits: number;
  label: string;
  highlight?: boolean;
}

export const TOPUPS: TopupOption[] = [
  { id: "topup-25",   currency: "brl", amountCents: 25_00,   usdReference: 5,   credits: 500,    label: "Starter" },
  { id: "topup-50",   currency: "brl", amountCents: 50_00,   usdReference: 10,  credits: 1_000,  label: "Light use" },
  { id: "topup-125",  currency: "brl", amountCents: 125_00,  usdReference: 25,  credits: 2_500,  label: "Creators" },
  { id: "topup-250",  currency: "brl", amountCents: 250_00,  usdReference: 50,  credits: 5_000,  label: "Recurring", highlight: true },
  { id: "topup-500",  currency: "brl", amountCents: 500_00,  usdReference: 100, credits: 10_000, label: "Agencies" },
  { id: "topup-1250", currency: "brl", amountCents: 1250_00, usdReference: 250, credits: 25_000, label: "Scale" },
  { id: "topup-2500", currency: "brl", amountCents: 2500_00, usdReference: 500, credits: 50_000, label: "Enterprise" },
];

export function getTopupById(id: string): TopupOption | undefined {
  return TOPUPS.find((t) => t.id === id);
}

/**
 * Credits cost in BRL cents. At R$0,05/cr, 1 credit = 5 BRL cents.
 */
export function creditsToBrlCents(credits: number): number {
  return credits * 5;
}

/**
 * Approximate USD reference for credits (display only). Uses the BRL anchor
 * from TOPUPS (1 cr ≈ $0.01 by design).
 */
export function creditsToUsdReference(credits: number): number {
  return credits / 100;
}

/**
 * Legacy alias for credit→cents conversion. Kept for callers that still
 * reference "USD cents" semantics from the original USD-anchored model.
 * Returns BRL cents in the new model.
 */
export function creditsToUsdCents(credits: number): number {
  return creditsToBrlCents(credits);
}

export function creditsToUsd(credits: number): number {
  return creditsToUsdReference(credits);
}
