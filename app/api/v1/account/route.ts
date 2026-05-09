export const runtime = "nodejs";

import { requireBearerAuth } from "@/lib/auth-bearer";
import { prisma } from "@/lib/prisma";
import { MODELS } from "@/lib/pricing";

function publicModelId(upstream: string): string {
  return MODELS.find((m) => m.upstreamModel === upstream)?.id ?? upstream;
}

export async function GET(req: Request): Promise<Response> {
  let auth;
  try {
    auth = await requireBearerAuth(req);
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  const [user, generations] = await Promise.all([
    prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { email: true, creditsBalance: true },
    }),
    prisma.generation.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        kind: true,
        model: true,
        status: true,
        creditsCost: true,
        durationSeconds: true,
        resolution: true,
        videoUrl: true,
        createdAt: true,
        completedAt: true,
      },
    }),
  ]);

  if (!user) {
    return new Response(
      JSON.stringify({ error: { code: "NOT_FOUND", message: "User not found." } }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  return Response.json({
    email: user.email,
    balance: user.creditsBalance,
    recentGenerations: generations.map((g) => ({
      taskId: g.id,
      kind: g.kind,
      model: publicModelId(g.model),
      status: g.status,
      creditsCost: g.creditsCost,
      durationSeconds: g.durationSeconds,
      resolution: g.resolution,
      videoUrl: g.videoUrl ?? undefined,
      createdAt: g.createdAt.toISOString(),
      completedAt: g.completedAt ? g.completedAt.toISOString() : undefined,
    })),
  });
}
