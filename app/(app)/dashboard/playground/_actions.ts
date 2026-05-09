"use server";

import { revalidatePath } from "next/cache";
import type { GenerationStatus } from "@prisma/client";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getBalance } from "@/lib/credits";
import {
  createGeneration,
  pollAndUpdateGeneration,
  GenerationError,
  type CreateGenerationInput,
} from "@/lib/services/generation";

export type PlaygroundInput = CreateGenerationInput;

export type SubmitGenerationResult =
  | {
      ok: true;
      taskId: string;
      status: GenerationStatus;
      creditsCost: number;
    }
  | {
      ok: false;
      error: "INSUFFICIENT_CREDITS";
      balance: number;
      required: number;
    }
  | {
      ok: false;
      error: "FAILED";
      message: string;
    };

export async function submitGenerationAction(
  input: PlaygroundInput,
): Promise<SubmitGenerationResult> {
  const user = await requireUser();

  try {
    const generation = await createGeneration({
      user: { id: user.id, email: user.email, creditsBalance: 0 },
      apiKey: null,
      input,
    });

    revalidatePath("/dashboard/playground");

    return {
      ok: true,
      taskId: generation.id,
      status: generation.status,
      creditsCost: generation.creditsCost,
    };
  } catch (err) {
    if (err instanceof GenerationError && err.code === "INSUFFICIENT_CREDITS") {
      const balance = await getBalance(user.id);
      // Try to recover the required amount from the message; fall back to balance + 1.
      const requiredMatch = /required\s+(\d+)/i.exec(err.message);
      const required = requiredMatch ? Number(requiredMatch[1]) : balance + 1;
      return {
        ok: false,
        error: "INSUFFICIENT_CREDITS",
        balance,
        required,
      };
    }
    const message =
      err instanceof Error ? err.message : "Erro inesperado ao gerar vídeo.";
    return { ok: false, error: "FAILED", message };
  }
}

export type PollGenerationResult =
  | {
      ok: true;
      status: GenerationStatus;
      videoUrl: string | null;
      error: { code: string | null; message: string | null } | null;
      creditsCost: number;
    }
  | {
      ok: false;
      error: "NOT_FOUND" | "FORBIDDEN" | "FAILED";
      message: string;
    };

export async function pollGenerationAction(
  taskId: string,
): Promise<PollGenerationResult> {
  const user = await requireUser();

  const generation = await prisma.generation.findUnique({
    where: { id: taskId },
  });

  if (!generation) {
    return { ok: false, error: "NOT_FOUND", message: "Geração não encontrada." };
  }
  if (generation.userId !== user.id) {
    return { ok: false, error: "FORBIDDEN", message: "Acesso negado." };
  }

  let current = generation;
  if (current.status === "pending" || current.status === "processing") {
    try {
      current = await pollAndUpdateGeneration(current);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao consultar status.";
      return { ok: false, error: "FAILED", message };
    }
  }

  return {
    ok: true,
    status: current.status,
    videoUrl: current.videoUrl,
    error:
      current.errorCode || current.errorMessage
        ? { code: current.errorCode, message: current.errorMessage }
        : null,
    creditsCost: current.creditsCost,
  };
}
