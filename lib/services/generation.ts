import "server-only";

import { z } from "zod";
import type { Generation } from "@prisma/client";

import { prisma } from "../prisma";
import {
  calculateCredits,
  getModelById,
  PricingError,
  type Resolution,
  type Duration,
} from "../pricing";
import {
  generateTextToVideo,
  generateImageToVideo,
  generateWithReferences,
  getStatus,
  ProviderError,
} from "../provider";
import {
  debitCredits,
  refundCredits,
  getBalance,
  InsufficientCreditsError,
} from "../credits";
import type { ValidatedKey } from "../api-key";
import {
  isStorageConfigured,
  uploadVideoFromBase64,
  uploadVideoFromGcs,
} from "../storage";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // ~10 MB

const base64ImageSchema = z.object({
  bytesBase64Encoded: z
    .string()
    .min(1, "Image bytesBase64Encoded is required.")
    .refine((s) => !s.startsWith("data:"), "Send raw base64 without data URI prefix.")
    .refine((s) => {
      // Approx decoded size: ceil(len * 3 / 4) - padding.
      const padding = s.endsWith("==") ? 2 : s.endsWith("=") ? 1 : 0;
      const bytes = Math.floor((s.length * 3) / 4) - padding;
      return bytes <= MAX_IMAGE_BYTES;
    }, "Image exceeds the 10MB limit."),
  mimeType: z.string().min(1).optional(),
});

const referenceImageSchema = base64ImageSchema.extend({
  referenceType: z.enum(["asset", "style"]).optional(),
});

const baseFieldsSchema = {
  modelId: z.string().min(1),
  prompt: z.string().min(1).max(8000),
  resolution: z.enum(["720p", "1080p", "4k"]),
  aspectRatio: z.enum(["16:9", "9:16"]),
  durationSeconds: z.union([z.literal(4), z.literal(6), z.literal(8)]),
  audio: z.boolean(),
  negativePrompt: z.string().max(2000).optional(),
} as const;

export const createGenerationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("text_to_video"),
    ...baseFieldsSchema,
  }),
  z.object({
    kind: z.literal("image_to_video"),
    ...baseFieldsSchema,
    firstFrame: base64ImageSchema,
    lastFrame: base64ImageSchema.optional(),
  }),
  z.object({
    kind: z.literal("references"),
    ...baseFieldsSchema,
    referenceImages: z.array(referenceImageSchema).min(1).max(3),
  }),
]);

export type CreateGenerationInput = z.infer<typeof createGenerationSchema>;

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class GenerationError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number = 500) {
    super(message);
    this.name = "GenerationError";
  }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createGeneration(args: {
  user: ValidatedKey["user"];
  apiKey: ValidatedKey["apiKey"] | null;
  input: CreateGenerationInput;
}): Promise<Generation> {
  const { user, apiKey, input } = args;

  if (!user.emailVerified) {
    throw new GenerationError(
      "EMAIL_NOT_VERIFIED",
      "Verify your email before generating videos. Check your inbox or request a new link from /verify-email.",
      403,
    );
  }

  const model = getModelById(input.modelId);
  if (!model) {
    throw new GenerationError("INVALID_MODEL", `Unknown model "${input.modelId}".`, 400);
  }

  let creditsCost: number;
  try {
    creditsCost = calculateCredits({
      modelId: input.modelId,
      resolution: input.resolution as Resolution,
      audio: input.audio,
      durationSeconds: input.durationSeconds as Duration,
    });
  } catch (err) {
    if (err instanceof PricingError) {
      throw new GenerationError(err.code, err.message, 400);
    }
    throw err;
  }

  const balance = await getBalance(user.id);
  if (balance < creditsCost) {
    throw new GenerationError(
      "INSUFFICIENT_CREDITS",
      `Insufficient credits: balance ${balance}, required ${creditsCost}.`,
      402,
    );
  }

  const generation = await prisma.generation.create({
    data: {
      userId: user.id,
      apiKeyId: apiKey?.id ?? null,
      kind: input.kind,
      model: model.upstreamModel,
      tier: model.tier,
      resolution: input.resolution,
      aspectRatio: input.aspectRatio,
      durationSeconds: input.durationSeconds,
      audio: input.audio,
      prompt: input.prompt,
      negativePrompt: input.negativePrompt,
      creditsCost,
      status: "pending",
    },
  });

  try {
    await debitCredits({
      userId: user.id,
      amount: creditsCost,
      generationId: generation.id,
      description: `Generation ${generation.id} (${model.id} ${input.resolution} ${input.durationSeconds}s)`,
    });
  } catch (err) {
    // Couldn't debit — most likely a race that drained the balance between check and debit.
    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "failed",
        errorCode: "INSUFFICIENT_CREDITS",
        errorMessage: "Could not debit credits.",
        completedAt: new Date(),
      },
    });
    if (err instanceof InsufficientCreditsError) {
      throw new GenerationError("INSUFFICIENT_CREDITS", err.message, 402);
    }
    throw err;
  }

  // Call upstream provider.
  try {
    const baseOpts = {
      model: model.upstreamModel,
      prompt: input.prompt,
      aspectRatio: input.aspectRatio,
      resolution: input.resolution as Resolution,
      durationSeconds: input.durationSeconds as Duration,
      generateAudio: input.audio,
      negativePrompt: input.negativePrompt,
    };

    let providerResp;
    if (input.kind === "text_to_video") {
      providerResp = await generateTextToVideo(baseOpts);
    } else if (input.kind === "image_to_video") {
      providerResp = await generateImageToVideo({
        ...baseOpts,
        firstFrame: input.firstFrame,
        lastFrame: input.lastFrame,
      });
    } else {
      providerResp = await generateWithReferences({
        ...baseOpts,
        referenceImages: input.referenceImages,
      });
    }

    const updated = await prisma.generation.update({
      where: { id: generation.id },
      data: {
        operationName: providerResp.operationName,
        status: "processing",
      },
    });
    return updated;
  } catch (err) {
    // Refund and mark failed.
    await refundCredits({
      userId: user.id,
      amount: creditsCost,
      generationId: generation.id,
      description: `Refund: provider failure for generation ${generation.id}`,
    });
    const errorCode = err instanceof ProviderError ? err.code : "UPSTREAM_ERROR";
    const errorMessage = err instanceof Error ? err.message : "Unknown upstream error.";
    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "refunded",
        errorCode,
        errorMessage,
        completedAt: new Date(),
      },
    });
    if (err instanceof ProviderError) {
      throw new GenerationError(errorCode, errorMessage, 502);
    }
    throw new GenerationError("UPSTREAM_ERROR", errorMessage, 502);
  }
}

// ---------------------------------------------------------------------------
// Poll
// ---------------------------------------------------------------------------

export async function pollAndUpdateGeneration(generation: Generation): Promise<Generation> {
  if (
    generation.status === "succeeded" ||
    generation.status === "failed" ||
    generation.status === "refunded"
  ) {
    return generation;
  }
  if (!generation.operationName) {
    return generation;
  }

  const tag = `[generation:${generation.id}]`;

  let status;
  try {
    status = await getStatus(generation.operationName);
  } catch (err) {
    // Don't refund on a transient 5xx status-check failure; surface unchanged.
    if (err instanceof ProviderError && err.status >= 500) {
      console.warn(`${tag} transient status check failure (${err.status}): ${err.message}`);
      return generation;
    }
    console.error(`${tag} status check failed:`, err);
    throw err;
  }

  if (!status.done) {
    return generation;
  }

  console.log(
    `${tag} upstream done=true videos=${status.videos?.length ?? 0} error=${
      status.error ? JSON.stringify(status.error) : "none"
    }`,
  );

  // Upstream reported an explicit error → refund + mark refunded.
  if (status.error) {
    await safeRefund(generation, "Refund: upstream reported error");
    return prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "refunded",
        errorCode: status.error.code ? String(status.error.code) : "UPSTREAM_ERROR",
        errorMessage: status.error.message ?? "Upstream returned an error.",
        completedAt: new Date(),
      },
    });
  }

  const firstVideo = status.videos?.[0];

  // Upstream said done but didn't deliver a video → treat as failure + refund.
  if (!firstVideo || (!firstVideo.gcsUri && !firstVideo.base64)) {
    await safeRefund(generation, "Refund: upstream finished without video payload");
    console.error(`${tag} upstream done but no video payload returned`);
    return prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "refunded",
        errorCode: "NO_VIDEO_RETURNED",
        errorMessage:
          "Upstream marked the operation as complete but did not return a video.",
        completedAt: new Date(),
      },
    });
  }

  const videoGcsUri = firstVideo.gcsUri ?? null;

  // Try to re-host on Supabase Storage. If we can't get a usable URL, fail the
  // generation explicitly instead of leaving an orphan "succeeded" row with no
  // playable URL.
  let videoUrl: string | null = null;
  let uploadError: string | null = null;

  if (isStorageConfigured()) {
    try {
      console.log(`${tag} uploading to Supabase Storage…`);
      const upload = firstVideo.gcsUri
        ? await uploadVideoFromGcs(firstVideo.gcsUri, {
            userId: generation.userId,
            generationId: generation.id,
            mimeType: firstVideo.mimeType,
          })
        : await uploadVideoFromBase64(firstVideo.base64!, {
            userId: generation.userId,
            generationId: generation.id,
            mimeType: firstVideo.mimeType,
          });
      videoUrl = upload.publicUrl;
      console.log(`${tag} uploaded ${upload.bytes} bytes → ${upload.publicUrl}`);
    } catch (err) {
      uploadError = err instanceof Error ? err.message : String(err);
      console.error(`${tag} Supabase upload failed: ${uploadError}`);
    }
  } else {
    console.warn(`${tag} Supabase storage not configured — using fallback URL.`);
  }

  // Fallback chain when Supabase isn't available or failed.
  if (!videoUrl) {
    if (firstVideo.base64) {
      // base64 is small enough only for short videos but still works as fallback.
      videoUrl = `data:${firstVideo.mimeType ?? "video/mp4"};base64,${firstVideo.base64}`;
    } else if (firstVideo.gcsUri) {
      // Best-effort public URL on GCS. Will only render if the bucket is public.
      const m = /^gs:\/\/([^/]+)\/(.+)$/.exec(firstVideo.gcsUri);
      if (m) videoUrl = `https://storage.googleapis.com/${m[1]}/${m[2]}`;
    }
  }

  // Still no usable URL → fail the generation explicitly (with refund).
  if (!videoUrl) {
    await safeRefund(generation, "Refund: could not obtain a playable URL");
    return prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "refunded",
        errorCode: "STORAGE_UPLOAD_FAILED",
        errorMessage:
          uploadError ??
          "The video was generated but could not be re-hosted or fetched.",
        videoGcsUri,
        completedAt: new Date(),
      },
    });
  }

  return prisma.generation.update({
    where: { id: generation.id },
    data: {
      status: "succeeded",
      videoUrl,
      videoGcsUri,
      // Preserve the upload error in errorMessage if we fell back to GCS direct
      // so the dashboard can surface "rendered from upstream (storage failed)".
      errorCode: uploadError ? "STORAGE_FALLBACK" : null,
      errorMessage: uploadError,
      completedAt: new Date(),
    },
  });
}

async function safeRefund(generation: Generation, description: string): Promise<void> {
  try {
    await refundCredits({
      userId: generation.userId,
      amount: generation.creditsCost,
      generationId: generation.id,
      description: `${description} for generation ${generation.id}`,
    });
  } catch (err) {
    console.error(
      `[generation:${generation.id}] refund failed:`,
      err instanceof Error ? err.message : err,
    );
  }
}
