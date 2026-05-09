"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/session";
import { createApiKey, revokeApiKey } from "@/lib/api-key";

export interface CreateKeyResult {
  ok: boolean;
  plaintext?: string;
  prefix?: string;
  name?: string;
  error?: string;
}

export async function createKeyAction(formData: FormData): Promise<CreateKeyResult> {
  const user = await requireUser();
  const rawName = formData.get("name");
  const name = typeof rawName === "string" ? rawName.trim() : "";

  if (!name) {
    return { ok: false, error: "Informe um nome para identificar a chave." };
  }
  if (name.length > 80) {
    return { ok: false, error: "O nome deve ter no máximo 80 caracteres." };
  }

  try {
    const { plaintext, record } = await createApiKey({
      userId: user.id,
      name,
    });
    revalidatePath("/dashboard/keys");
    return {
      ok: true,
      plaintext,
      prefix: record.prefix,
      name: record.name,
    };
  } catch {
    return { ok: false, error: "Não foi possível criar a chave. Tente novamente." };
  }
}

export interface RevokeKeyResult {
  ok: boolean;
  error?: string;
}

export async function revokeKeyAction(id: string): Promise<RevokeKeyResult> {
  const user = await requireUser();
  if (!id || typeof id !== "string") {
    return { ok: false, error: "ID inválido." };
  }
  try {
    const result = await revokeApiKey({ userId: user.id, id });
    if (!result) {
      return { ok: false, error: "Chave não encontrada ou já revogada." };
    }
    revalidatePath("/dashboard/keys");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível revogar a chave." };
  }
}
