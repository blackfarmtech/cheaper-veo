import { PrismaClient } from "@prisma/client";

// Reuse the client across hot reloads in dev AND across warm Fluid Compute
// invocations in prod — every new PrismaClient opens its own pool, and
// pgbouncer / Postgres connection limits are easy to blow through on
// serverless when each invocation creates a fresh client.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
