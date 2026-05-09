export const runtime = "nodejs";

import { requireBearerAuth } from "@/lib/auth-bearer";
import { prisma } from "@/lib/prisma";
import { MODELS } from "@/lib/pricing";
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitedResponse,
} from "@/lib/rate-limit";
import { pollAndUpdateGeneration } from "@/lib/services/generation";

interface ApiError {
  error: { code: string; message: string };
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  extraHeaders?: HeadersInit,
): Response {
  const body: ApiError = { error: { code, message } };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(extraHeaders ?? {}),
    },
  });
}

function publicModelId(upstream: string): string {
  return MODELS.find((m) => m.upstreamModel === upstream)?.id ?? upstream;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ taskId: string }> },
): Promise<Response> {
  let auth;
  try {
    auth = await requireBearerAuth(req);
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  // Rate limit: 1000 status checks per API key per hour
  const rate = await checkRateLimit(auth.apiKey.id, "status");
  if (!rate.ok) return rateLimitedResponse(rate);

  const { taskId } = await context.params;
  if (!taskId) {
    return errorResponse(400, "VALIDATION_ERROR", "Missing taskId.", rateLimitHeaders(rate));
  }

  const generation = await prisma.generation.findUnique({ where: { id: taskId } });
  if (!generation) {
    return errorResponse(404, "NOT_FOUND", "Task not found.", rateLimitHeaders(rate));
  }
  if (generation.userId !== auth.user.id) {
    // Don't disclose existence of other users' tasks.
    return errorResponse(404, "NOT_FOUND", "Task not found.", rateLimitHeaders(rate));
  }

  let current = generation;
  if (current.status === "pending" || current.status === "processing") {
    try {
      current = await pollAndUpdateGeneration(current);
    } catch {
      // Polling errors shouldn't fail the status read; return last known state.
    }
  }

  return Response.json(
    {
      taskId: current.id,
      status: current.status,
      model: publicModelId(current.model),
      creditsCost: current.creditsCost,
      durationSeconds: current.durationSeconds,
      resolution: current.resolution,
      aspectRatio: current.aspectRatio,
      audio: current.audio,
      videoUrl: current.videoUrl ?? undefined,
      error: current.errorCode
        ? { code: current.errorCode, message: current.errorMessage ?? "" }
        : undefined,
      createdAt: current.createdAt.toISOString(),
      completedAt: current.completedAt ? current.completedAt.toISOString() : undefined,
    },
    { headers: rateLimitHeaders(rate) },
  );
}
