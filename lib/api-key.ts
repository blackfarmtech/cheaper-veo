import "server-only";

import { randomBytes, createHash } from "node:crypto";

import { prisma } from "./prisma";
import type { ApiKey } from "@prisma/client";

const KEY_PREFIX = "veo_live_";
const KEY_BYTES = 24;
const PREFIX_DISPLAY_LEN = 12; // "veo_live_xxx"

// RFC 4648 base32 alphabet, lowercased to match the documented "veo_live_<lowercase>" format.
const BASE32_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

function base32EncodeLower(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return output;
}

export function generateApiKey(): string {
  // 24 bytes -> ~39 base32 chars; we slice to 28 to keep a stable, dense key body.
  const body = base32EncodeLower(randomBytes(KEY_BYTES)).slice(0, 28);
  return `${KEY_PREFIX}${body}`;
}

export function hashApiKey(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

export function prefixOf(plain: string): string {
  return plain.slice(0, PREFIX_DISPLAY_LEN);
}

export type PublicApiKey = Omit<ApiKey, "hashedKey">;

function stripHash(record: ApiKey): PublicApiKey {
  // Avoid leaking the hash to callers / API consumers.
  const { hashedKey: _hashedKey, ...rest } = record;
  void _hashedKey;
  return rest;
}

export async function createApiKey(input: { userId: string; name: string }): Promise<{
  plaintext: string;
  record: PublicApiKey;
}> {
  const plaintext = generateApiKey();
  const record = await prisma.apiKey.create({
    data: {
      userId: input.userId,
      name: input.name,
      prefix: prefixOf(plaintext),
      hashedKey: hashApiKey(plaintext),
    },
  });
  return { plaintext, record: stripHash(record) };
}

export async function listApiKeys(userId: string): Promise<PublicApiKey[]> {
  const rows = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(stripHash);
}

export async function revokeApiKey(input: { userId: string; id: string }): Promise<PublicApiKey | null> {
  const result = await prisma.apiKey.updateMany({
    where: { id: input.id, userId: input.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count === 0) return null;
  const updated = await prisma.apiKey.findUnique({ where: { id: input.id } });
  return updated ? stripHash(updated) : null;
}

export interface ValidatedKey {
  user: { id: string; email: string; creditsBalance: number };
  apiKey: PublicApiKey;
}

export async function validateBearerKey(authHeader: string | null): Promise<ValidatedKey | null> {
  if (!authHeader) return null;
  const match = /^Bearer\s+(veo_[A-Za-z0-9_]+)$/.exec(authHeader.trim());
  if (!match) return null;
  const plaintext = match[1];
  const hashed = hashApiKey(plaintext);

  const apiKey = await prisma.apiKey.findUnique({
    where: { hashedKey: hashed },
    include: {
      user: { select: { id: true, email: true, creditsBalance: true } },
    },
  });
  if (!apiKey) return null;
  if (apiKey.revokedAt !== null) return null;

  // Fire-and-forget update of lastUsedAt; we don't want auth latency tied to it failing.
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {
      /* ignore */
    });

  const { user, ...rest } = apiKey;
  return { user, apiKey: stripHash(rest as ApiKey) };
}
