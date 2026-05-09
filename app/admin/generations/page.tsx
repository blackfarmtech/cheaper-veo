import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  GenerationStatus,
  type Prisma,
} from "@prisma/client";

import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { prisma } from "@/lib/prisma";
import { MODELS, getModelById } from "@/lib/pricing";
import { formatCredits, formatUsd } from "@/lib/utils";

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

const dt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

interface PageProps {
  searchParams: Promise<{
    status?: string;
    model?: string;
    page?: string;
    q?: string;
  }>;
}

function buildHref(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== 1) sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `/admin/generations?${qs}` : "/admin/generations";
}

export default async function AdminGenerationsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status) ?? null;
  const modelId = sp.model
    ? MODELS.find((m) => m.id === sp.model || m.upstreamModel === sp.model)?.upstreamModel
    : null;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const q = sp.q?.trim() ?? "";

  const where: Prisma.GenerationWhereInput = {
    ...(status ? { status } : {}),
    ...(modelId ? { model: modelId } : {}),
    ...(q
      ? {
          OR: [
            { prompt: { contains: q, mode: "insensitive" } },
            { id: { equals: q } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ],
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
      include: {
        user: { select: { id: true, email: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1
          className="text-3xl font-semibold tracking-tight md:text-[2.25rem]"
          style={{ letterSpacing: "-0.024em" }}
        >
          Gerações
        </h1>
        <p className="text-[15px] text-secondary">
          Log global de todas as gerações da plataforma.
        </p>
      </header>

      {/* Filters */}
      <form
        method="get"
        className="card grid gap-3 p-5 md:grid-cols-[1fr_180px_180px_auto] md:items-end"
      >
        <div className="space-y-1.5">
          <label
            className="text-[10.5px] uppercase text-muted"
            style={{ letterSpacing: "0.08em" }}
          >
            Buscar
          </label>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="prompt, taskId, ou email"
            className="input-apple"
          />
        </div>
        <div className="space-y-1.5">
          <label
            className="text-[10.5px] uppercase text-muted"
            style={{ letterSpacing: "0.08em" }}
          >
            Status
          </label>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="input-apple"
          >
            <option value="">Todos</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label
            className="text-[10.5px] uppercase text-muted"
            style={{ letterSpacing: "0.08em" }}
          >
            Modelo
          </label>
          <select
            name="model"
            defaultValue={sp.model ?? ""}
            className="input-apple"
          >
            <option value="">Todos</option>
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">
            Filtrar
          </button>
          {(status || sp.model || q) && (
            <Link href="/admin/generations" className="btn-ghost">
              Limpar
            </Link>
          )}
        </div>
      </form>

      <section className="card overflow-hidden" style={{ padding: 0 }}>
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <h2 className="text-[15px] font-semibold tracking-tight">
            {total === 0
              ? "Nenhum resultado"
              : `${showingFrom}–${showingTo} de ${formatCredits(total)} gerações`}
          </h2>
        </div>

        {generations.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-muted">
            Nenhuma geração encontrada.
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
                  <th className="px-6 py-3.5 font-medium">Quando</th>
                  <th className="px-6 py-3.5 font-medium">Usuário</th>
                  <th className="px-6 py-3.5 font-medium">Modelo</th>
                  <th className="px-6 py-3.5 font-medium">Prompt</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 text-right font-medium">Custo</th>
                </tr>
              </thead>
              <tbody>
                {generations.map((gen, i) => {
                  const model = getModelById(gen.model) ?? MODELS.find(m => m.upstreamModel === gen.model);
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
                      <td className="px-6 py-3.5 text-xs text-secondary">
                        <div>{dt.format(gen.createdAt)}</div>
                        <div
                          className="mt-0.5 text-[10px] text-muted"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {gen.id}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <Link
                          href={`/admin/users/${gen.user.id}`}
                          className="text-sm text-secondary transition-colors hover:text-[var(--color-accent)]"
                        >
                          {gen.user.email}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5 text-xs">
                        <div className="font-medium text-[var(--color-text)]">
                          {model?.label ?? gen.model}
                        </div>
                        <div
                          className="mt-0.5 text-[10.5px] text-muted"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {gen.resolution} · {gen.durationSeconds}s
                          {gen.audio ? " · audio" : ""}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 max-w-md">
                        <p className="line-clamp-2 text-xs text-secondary">
                          {gen.prompt}
                        </p>
                        {gen.errorMessage && (
                          <p className="mt-1 text-[10.5px] text-[var(--color-danger)]">
                            {gen.errorCode}: {gen.errorMessage}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={gen.status} />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div
                          className="text-sm font-semibold"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {formatCredits(gen.creditsCost)} cr
                        </div>
                        <div
                          className="text-[10px] text-muted"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {formatUsd(gen.creditsCost)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-7 py-4"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <span className="text-xs text-muted">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link
                  href={buildHref({ q, status: status ?? undefined, model: sp.model, page: page - 1 })}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-secondary transition-all hover:bg-white/[0.05]"
                  style={{ border: "1px solid var(--color-border-strong)" }}
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link
                  href={buildHref({ q, status: status ?? undefined, model: sp.model, page: page + 1 })}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-secondary transition-all hover:bg-white/[0.05]"
                  style={{ border: "1px solid var(--color-border-strong)" }}
                >
                  Próxima <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
