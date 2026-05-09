import Link from "next/link";
import { Clock, RefreshCw } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatCredits } from "@/lib/utils";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

interface RecentRunsAsideProps {
  userId: string;
  limit?: number;
  refreshHref?: string;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `há ${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `há ${min} min`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return `há ${days} d`;
}

export async function RecentRunsAside({
  userId,
  limit = 5,
  refreshHref,
}: RecentRunsAsideProps) {
  const runs = await prisma.generation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      prompt: true,
      status: true,
      creditsCost: true,
      createdAt: true,
      tier: true,
      resolution: true,
      durationSeconds: true,
    },
  });

  return (
    <aside className="card flex flex-col self-start p-6">
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock
            className="h-4 w-4"
            style={{ color: "var(--color-accent)" }}
            aria-hidden
          />
          <h3 className="text-[15px] font-semibold tracking-tight">
            Últimas gerações
          </h3>
        </div>
        {refreshHref ? (
          <Link
            href={refreshHref}
            prefetch={false}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-secondary transition-all hover:bg-white/[0.06] hover:text-[var(--color-text)]"
            aria-label="Atualizar"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>

      {runs.length === 0 ? (
        <p className="text-[13px] text-muted">
          Nenhuma geração ainda. Envie seu primeiro prompt ao lado.
        </p>
      ) : (
        <ul className="space-y-3">
          {runs.map((run) => (
            <li
              key={run.id}
              className="p-3.5 transition-colors hover:bg-white/[0.03]"
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <StatusBadge status={run.status} />
                <span
                  className="text-[10.5px] text-muted"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {formatRelative(run.createdAt)}
                </span>
              </div>
              <p className="mb-2.5 text-[12.5px] leading-relaxed text-secondary">
                {truncate(run.prompt, 90)}
              </p>
              <div
                className="flex items-center justify-between text-[10.5px] text-muted"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <span>
                  {run.tier} · {run.resolution} · {run.durationSeconds}s
                </span>
                <span>{formatCredits(run.creditsCost)} cr</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
