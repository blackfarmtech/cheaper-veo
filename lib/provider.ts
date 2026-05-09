/**
 * Cliente HTTP para o backend NestJS gemini-videos.
 * Base URL: env GERAEW_PROVIDER_URL  (ex: http://localhost:8012/api)
 * Auth:     header x-api-key = env GERAEW_PROVIDER_KEY
 */

import type { Resolution, AspectRatio, Duration } from "./pricing";

/**
 * Normaliza GERAEW_PROVIDER_URL para sempre terminar em "/api" (sem trailing slash).
 * Aceita: "https://host", "https://host/", "https://host/api", "https://host/api/".
 */
function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

const BASE_URL = normalizeBaseUrl(
  process.env.GERAEW_PROVIDER_URL ?? "http://localhost:8012/api",
);
const PROVIDER_KEY = process.env.GERAEW_PROVIDER_KEY ?? "";

export class ProviderError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const startedAt = Date.now();
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": PROVIDER_KEY,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[provider] network error POST ${url}: ${msg}`);
    throw new ProviderError(0, "NETWORK_ERROR", `Provider unreachable: ${msg}`);
  }
  const text = await res.text();
  const ms = Date.now() - startedAt;
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    console.error(`[provider] non-JSON response ${res.status} from ${url}: ${text.slice(0, 200)}`);
    throw new ProviderError(res.status, "BAD_JSON", text || "Invalid JSON from provider");
  }
  if (!res.ok) {
    const message =
      (json as { message?: string } | null)?.message ??
      `Provider ${res.status} at ${url}`;
    const code = res.status === 404 ? "PROVIDER_ROUTE_NOT_FOUND" : "UPSTREAM_ERROR";
    console.error(`[provider] ${res.status} ${path} (${ms}ms): ${message}`);
    throw new ProviderError(res.status, code, message);
  }
  console.log(`[provider] ${res.status} ${path} (${ms}ms) ok`);
  return json as T;
}

export interface BaseGenerateOpts {
  model: string;            // upstream model id
  prompt: string;
  aspectRatio?: AspectRatio;
  resolution?: Resolution;
  durationSeconds?: Duration;
  generateAudio?: boolean;
  negativePrompt?: string;
  sampleCount?: number;
}

export interface GenerateResponse {
  operationName: string;
}

export async function generateTextToVideo(opts: BaseGenerateOpts): Promise<GenerateResponse> {
  return call<GenerateResponse>("/video/generate-text-to-video", toUpstream(opts));
}

export async function generateImageToVideo(opts: BaseGenerateOpts & {
  firstFrame: { bytesBase64Encoded: string; mimeType?: string };
  lastFrame?:  { bytesBase64Encoded: string; mimeType?: string };
}): Promise<GenerateResponse> {
  const body: Record<string, unknown> = {
    ...toUpstream(opts),
    first_frame: opts.firstFrame.bytesBase64Encoded,
  };
  if (opts.firstFrame.mimeType) body.first_frame_mime_type = opts.firstFrame.mimeType;
  if (opts.lastFrame) {
    body.last_frame = opts.lastFrame.bytesBase64Encoded;
    if (opts.lastFrame.mimeType) body.last_frame_mime_type = opts.lastFrame.mimeType;
  }
  return call<GenerateResponse>("/video/generate-image-to-video", body);
}

export async function generateWithReferences(opts: BaseGenerateOpts & {
  referenceImages: Array<{ bytesBase64Encoded: string; mimeType?: string; referenceType?: "asset" | "style" }>;
}): Promise<GenerateResponse> {
  return call<GenerateResponse>("/video/generate-references", {
    ...toUpstream(opts),
    reference_images: opts.referenceImages.map((img) => ({
      base64: img.bytesBase64Encoded,
      mime_type: img.mimeType ?? "image/jpeg",
      reference_type: img.referenceType ?? "asset",
    })),
  });
}

export interface ProviderStatus {
  done: boolean;
  operationName: string;
  videos?: Array<{ base64?: string; gcsUri?: string; mimeType: string }>;
  error?: { code?: number; message?: string };
}

export async function getStatus(operationName: string): Promise<ProviderStatus> {
  return call<ProviderStatus>("/video/status", { operationName });
}

function toUpstream(opts: BaseGenerateOpts): Record<string, unknown> {
  const out: Record<string, unknown> = {
    model: opts.model,
    prompt: opts.prompt,
  };
  if (opts.aspectRatio)     out.aspect_ratio = opts.aspectRatio;
  if (opts.resolution)      out.resolution = opts.resolution === "4k" ? "4K" : opts.resolution;
  if (opts.durationSeconds) out.duration_seconds = opts.durationSeconds;
  if (opts.generateAudio !== undefined) out.generate_audio = opts.generateAudio;
  if (opts.negativePrompt)  out.negative_prompt = opts.negativePrompt;
  if (opts.sampleCount)     out.sample_count = opts.sampleCount;
  return out;
}
