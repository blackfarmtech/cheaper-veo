import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/prisma";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const socialProviders: NonNullable<BetterAuthOptions["socialProviders"]> = {};
if (googleClientId && googleClientSecret) {
  socialProviders.google = {
    clientId: googleClientId,
    clientSecret: googleClientSecret,
  };
}

// Free credits granted on signup. Tunable via env, default 50 cr ($0.50) —
// enough to test ~5-10 Lite generations before paying anything.
const SIGNUP_BONUS_CREDITS = Number.parseInt(
  process.env.SIGNUP_BONUS_CREDITS ?? "50",
  10,
);

const isDev = process.env.NODE_ENV !== "production";

const trustedOrigins = Array.from(
  new Set(
    [
      process.env.BETTER_AUTH_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
      process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`,
      process.env.VERCEL_PROJECT_PRODUCTION_URL &&
        `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
      isDev && "http://localhost:3000",
      isDev && "http://127.0.0.1:3000",
      "https://cheaperveo.com",
      "https://www.cheaperveo.com",
      ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",").map((s) =>
        s.trim(),
      ) ?? []),
    ].filter((v): v is string => Boolean(v)),
  ),
);

const resolvedBaseURL = isDev
  ? process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000"
  : process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  appName: "GeraEW",
  baseURL: resolvedBaseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,
  },
  socialProviders,
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (SIGNUP_BONUS_CREDITS <= 0) return;
          // Idempotent: only grant if no existing transactions for this user.
          // Better Auth might re-run the hook in edge cases (OAuth re-link).
          try {
            const existing = await prisma.creditTransaction.findFirst({
              where: { userId: user.id, type: "bonus" },
              select: { id: true },
            });
            if (existing) return;

            await prisma.$transaction([
              prisma.user.update({
                where: { id: user.id },
                data: { creditsBalance: { increment: SIGNUP_BONUS_CREDITS } },
              }),
              prisma.creditTransaction.create({
                data: {
                  userId: user.id,
                  amount: SIGNUP_BONUS_CREDITS,
                  type: "bonus",
                  description: `Welcome bonus — ${SIGNUP_BONUS_CREDITS} créditos grátis`,
                },
              }),
            ]);
          } catch (err) {
            // Don't block signup if bonus grant fails — it's a soft perk.
            // eslint-disable-next-line no-console
            console.error(
              `[auth] failed to grant signup bonus to ${user.id}:`,
              err,
            );
          }
        },
      },
    },
  },
  // nextCookies must be the LAST plugin so set-cookie headers are forwarded
  // through Next.js Server Actions / Route Handlers.
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;
