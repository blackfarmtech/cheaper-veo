export const runtime = "nodejs";

import { ZodError } from "zod";

import { requireBearerAuth } from "@/lib/auth-bearer";
import { getModelById } from "@/lib/pricing";
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitedResponse,
} from "@/lib/rate-limit";
import {
  createGeneration,
  createGenerationSchema,
  GenerationError,
} from "@/lib/services/generation";

interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown,
  extraHeaders?: HeadersInit,
): Response {
  const body: ApiError = { error: { code, message, ...(details ? { details } : {}) } };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(extraHeaders ?? {}),
    },
  });
}

export async function POST(req: Request): Promise<Response> {
  let auth;
  try {
    auth = await requireBearerAuth(req);
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  // Rate limit: 100 generations per API key per hour
  const rate = await checkRateLimit(auth.apiKey.id, "generate");
  if (!rate.ok) return rateLimitedResponse(rate);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return errorResponse(
      400,
      "INVALID_JSON",
      "Request body must be valid JSON.",
      undefined,
      rateLimitHeaders(rate),
    );
  }

  const parsed = createGenerationSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Invalid request body.",
      flattenZod(parsed.error),
      rateLimitHeaders(rate),
    );
  }

  try {
    const generation = await createGeneration({
      user: auth.user,
      apiKey: auth.apiKey,
      input: parsed.data,
    });
    const model = getModelById(parsed.data.modelId);
    return Response.json(
      {
        taskId: generation.id,
        status: generation.status,
        creditsCost: generation.creditsCost,
        model: model?.id ?? parsed.data.modelId,
        durationSeconds: generation.durationSeconds,
      },
      { status: 202, headers: rateLimitHeaders(rate) },
    );
  } catch (err) {
    if (err instanceof GenerationError) {
      return errorResponse(
        err.status,
        err.code,
        err.message,
        undefined,
        rateLimitHeaders(rate),
      );
    }
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "An unexpected error occurred.",
      undefined,
      rateLimitHeaders(rate),
    );
  }
}

function flattenZod(err: ZodError): unknown {
  return err.issues.map((i) => ({ path: i.path.join("."), message: i.message, code: i.code }));
}
