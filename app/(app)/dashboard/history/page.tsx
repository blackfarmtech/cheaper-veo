import Link from "next/link";
import { ChevronLeft, ChevronRight, History as HistoryIcon } from "lucide-react";
import {
  GenerationStatus,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { MODELS, getModelById } from "@/lib/pricing";
import { formatCredits, formatUsd } from "@/lib/utils";

import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { VideoPreviewButton } from "@/components/dashboard/VideoPreviewButton";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const STATUSES: GenerationStatus[] = [
  GenerationStatus.pending,
  GenerationStatus.processing,
  GenerationStatus.succeeded,
  GenerationStatus.failed,
  GenerationStatus.refunded,
];

const STATUS_LABELS: Record<GenerationStatus, string> = {
  pending: "Em fila",
  processing: "Processando",
  succeeded: "Concluído",
  failed: "Falhou",
  refunded: "Reembolsado",
};

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function parseStatus(value: string | undefined): GenerationStatus | null {
  if (!value) return null;
  return STATUSES.find((s) => s === value) ?? null;
}

function parseModel(value: string | undefined): string | null {
  if (!value) return null;
  const exists = MODELS.some(
    (m) => m.id === value || m.upstreamModel === value,
  );
  return exists ? value : null;
}

function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 1000);
}

function buildHref(params: {
  status?: string | null;
  model?: string | null;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.model) sp.set("model", params.model);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/dashboard/history?${qs}` : "/dashboard/history";
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const fieldLabel =
  "text-[11px] font-medium uppercase text-muted tracking-[0.08em]";

const selectStyle =
  "rounded-md px-3.5 py-2.5 text-sm text-[var(--color-text)] transition-all focus:border-[var(--color-accent)] focus:outline-none focus:shadow-[0_0_0_4px_rgba(162,221,0,0.12)]";

export default async function HistoryPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const sp = await searchParams;

  const status = parseStatus(
    typeof sp.status === "string" ? sp.status : undefined,
  );
  const modelFilter = parseModel(
    typeof sp.model === "string" ? sp.model : undefined,
  );
  const page = parsePage(typeof sp.page === "string" ? sp.page : undefined);

  const where: Prisma.GenerationWhereInput = {
    userId: user.id,
    ...(status ? { status } : {}),
    ...(modelFilter
      ? {
          model:
            getModelById(modelFilter)?.upstreamModel ?? modelFilter,
        }
      : {}),
  };

  const [total, generations] = await Promise.all([
    prisma.generation.count({ where }),
    prisma.generation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-10">
      <header className="space-y-1.5">
        <h1
          className="text-3xl font-semibold tracking-tight md:text-[2.25rem]"
          style={{ letterSpacing: "-0.024em" }}
        >
          Histórico
        </h1>
        <p className="text-[15px] text-secondary">
          Todas as gerações da sua conta. Filtre por status ou modelo.
        </p>
      </header>

      <form
        method="get"
        className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={fieldLabel}>Status</span>
            <select
              name="status"
              defaultValue={status ?? ""}
              className={selectStyle}
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--color-border-strong)",
              }}
            >
              <option value="">Todos</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={fieldLabel}>Modelo</span>
            <select
              name="model"
              defaultValue={modelFilter ?? ""}
              className={selectStyle}
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--color-border-strong)",
              }}
            >
              <option value="">Todos</option>
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">
            Aplicar
          </button>
          <Link href="/dashboard/history" className="btn-ghost">
            Limpar
          </Link>
        </div>
      </form>

      <section
        className="card overflow-hidden"
        style={{ padding: 0 }}
      >
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <h2 className="text-[17px] font-semibold tracking-tight">
            Gerações
          </h2>
          <span className="text-xs text-muted">
            {total === 0
              ? "Nenhum resultado"
              : `${showingFrom}–${showingTo} de ${formatCredits(total)}`}
          </span>
        </div>

        {generations.length === 0 ? (
          <div className="p-7">
            <EmptyState
              icon={HistoryIcon}
              title="Nenhuma geração encontrada"
              description={
                status || modelFilter
                  ? "Tente ajustar os filtros para ver mais resultados."
                  : "Suas gerações aparecerão aqui assim que você criar a primeira."
              }
              cta={
                status || modelFilter
                  ? undefined
                  : { label: "Abrir playground", href: "/dashboard/playground" }
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr
                  className="text-[11px] uppercase text-muted"
                  style={{
                    background: "rgba(255, 255, 255, 0.025)",
                    borderBottom: "1px solid var(--color-border)",
                    letterSpacing: "0.08em",
                  }}
                >
                  <th className="px-7 py-3.5 font-medium">Data</th>
                  <th className="px-7 py-3.5 font-medium">Modelo</th>
                  <th className="px-7 py-3.5 font-medium">Resolução / Áudio</th>
                  <th className="px-7 py-3.5 font-medium">Duração</th>
                  <th className="px-7 py-3.5 text-right font-medium">
                    Créditos
                  </th>
                  <th className="px-7 py-3.5 font-medium">Status</th>
                  <th className="px-7 py-3.5 text-right font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {generations.map((gen, i) => {
                  const model = MODELS.find(
                    (m) =>
                      m.id === gen.model || m.upstreamModel === gen.model,
                  );
                  return (
                    <tr
                      key={gen.id}
                      className="transition-colors hover:bg-white/[0.02]"
                      style={
                        i !== generations.length - 1
                          ? { borderBottom: "1px solid var(--color-border)" }
                          : undefined
                      }
                    >
                      <td className="px-7 py-4 text-xs text-secondary">
                        {dateTimeFmt.format(gen.createdAt)}
                      </td>
                      <td className="px-7 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {model?.label ?? gen.model}
                          </span>
                          <span className="line-clamp-1 max-w-xs text-xs text-muted">
                            {gen.prompt}
                          </span>
                        </div>
                      </td>
                      <td className="px-7 py-4">
                        <div
                          className="flex flex-col text-xs text-secondary"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          <span>{gen.resolution}</span>
                          <span className="text-muted">
                            {gen.audio ? "com áudio" : "sem áudio"}
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-7 py-4 text-xs text-secondary"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {gen.durationSeconds}s
                      </td>
                      <td className="px-7 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className="text-sm font-semibold"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {formatCredits(gen.creditsCost)} cr
                          </span>
                          <span
                            className="text-[10px] text-muted"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {formatUsd(gen.creditsCost)}
                          </span>
                        </div>
                      </td>
                      <td className="px-7 py-4">
                        <StatusBadge status={gen.status} />
                      </td>
                      <td className="px-7 py-4 text-right">
                        {gen.status === "succeeded" && gen.videoUrl ? (
                          <VideoPreviewButton
                            url={gen.videoUrl}
                            prompt={gen.prompt}
                          />
                        ) : gen.status === "failed" && gen.errorMessage ? (
                          <span
                            className="text-[10px] text-[var(--color-danger)]"
                            title={gen.errorMessage}
                          >
                            {gen.errorCode ?? "erro"}
                          </span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div
            className="flex items-center justify-between px-7 py-4"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <span className="text-xs text-muted">
              Página {page} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={buildHref({
                    status,
                    model: modelFilter,
                    page: page - 1,
                  })}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-secondary transition-all hover:bg-white/[0.05] hover:text-[var(--color-text)]"
                  style={{ border: "1px solid var(--color-border-strong)" }}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </Link>
              ) : (
                <span
                  className="inline-flex cursor-not-allowed items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted opacity-50"
                  style={{ border: "1px solid var(--color-border)" }}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </span>
              )}
              {page < totalPages ? (
                <Link
                  href={buildHref({
                    status,
                    model: modelFilter,
                    page: page + 1,
                  })}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-secondary transition-all hover:bg-white/[0.05] hover:text-[var(--color-text)]"
                  style={{ border: "1px solid var(--color-border-strong)" }}
                >
                  Próxima
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span
                  className="inline-flex cursor-not-allowed items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted opacity-50"
                  style={{ border: "1px solid var(--color-border)" }}
                >
                  Próxima
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
