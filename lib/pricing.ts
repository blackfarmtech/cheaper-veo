/**
 * Catálogo de preços — Pay as you go.
 * 1 crédito = US$0.01 (1 cent)
 * Preços tabelados para vídeos de 8 segundos.
 * Para 4s e 6s aplicamos prorata linear arredondado pra cima (4s = 50%, 6s = 75%).
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
    description: "Testes rápidos e alto volume.",
    speedHint: "1-2 min",
    resolutions: ["720p", "1080p"],
  },
  {
    id: "veo3-fast",
    tier: "fast",
    upstreamModel: "veo-3.1-fast-generate-001",
    label: "Veo 3.1 Fast",
    description: "Melhor custo-benefício para criadores e apps.",
    speedHint: "1-3 min",
    resolutions: ["720p", "1080p", "4k"],
  },
  {
    id: "veo3-quality",
    tier: "quality",
    upstreamModel: "veo-3.1-generate-001",
    label: "Veo 3.1 Quality",
    description: "Vídeos finais e produção premium.",
    speedHint: "2-5 min",
    resolutions: ["720p", "1080p", "4k"],
  },
];

/**
 * Tabela de créditos por vídeo de 8s (precificacao_pay_as_you_go_veo31.md).
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
 * Recargas pay-as-you-go sugeridas. Sem bônus, conversão 1:1 (US$0.01 = 1 cr).
 */
export interface TopupOption {
  id: string;
  usd: number;       // dollars
  credits: number;
  label: string;
  highlight?: boolean;
}

export const TOPUPS: TopupOption[] = [
  { id: "topup-5",   usd: 5,   credits: 500,    label: "Entrada mínima" },
  { id: "topup-10",  usd: 10,  credits: 1_000,  label: "Uso leve" },
  { id: "topup-25",  usd: 25,  credits: 2_500,  label: "Criadores" },
  { id: "topup-50",  usd: 50,  credits: 5_000,  label: "Recorrente", highlight: true },
  { id: "topup-100", usd: 100, credits: 10_000, label: "Agências" },
  { id: "topup-250", usd: 250, credits: 25_000, label: "Escala" },
  { id: "topup-500", usd: 500, credits: 50_000, label: "Enterprise" },
];

export function getTopupById(id: string): TopupOption | undefined {
  return TOPUPS.find((t) => t.id === id);
}

/**
 * Conversão crédito → centavos USD (estritamente 1:1).
 */
export function creditsToUsdCents(credits: number): number {
  return credits;
}

export function creditsToUsd(credits: number): number {
  return credits / 100;
}
