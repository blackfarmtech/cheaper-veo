import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { formatCredits, formatUsd } from "@/lib/utils";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    filter?: string;
  }>;
}

function buildHref(params: { q?: string; page?: number; filter?: string }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.filter) sp.set("filter", params.filter);
  const qs = sp.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const filter = sp.filter ?? "";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const where: Prisma.UserWhereInput = {
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { id: { equals: q } },
            { stripeCustomerId: { equals: q } },
          ],
        }
      : {}),
    ...(filter === "auto_recharge_failed"
      ? { autoRechargeLastError: { not: null } }
      : {}),
    ...(filter === "auto_recharge_enabled"
      ? { autoRechargeEnabled: true }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        createdAt: true,
        creditsBalance: true,
        autoRechargeEnabled: true,
        autoRechargeLastError: true,
        defaultPaymentMethodId: true,
        _count: { select: { generations: true } },
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
          Usuários
        </h1>
        <p className="text-[15px] text-secondary">
          Busque por email, ID ou Stripe customer ID. Aplique filtros rápidos
          se precisar.
        </p>
      </header>

      {/* Search + filters */}
      <form
        method="get"
        className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="email, user id ou cus_xxx..."
            className="input-apple pl-10"
          />
        </div>
        <select
          name="filter"
          defaultValue={filter}
          className="input-apple sm:max-w-[240px]"
          style={{ appearance: "auto" }}
        >
          <option value="">Todos</option>
          <option value="auto_recharge_enabled">Auto-recarga ativa</option>
          <option value="auto_recharge_failed">Auto-recarga em erro</option>
        </select>
        <button type="submit" className="btn-primary">
          Buscar
        </button>
        {(q || filter) && (
          <Link href="/admin/users" className="btn-ghost">
            Limpar
          </Link>
        )}
      </form>

      <section className="card overflow-hidden" style={{ padding: 0 }}>
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <h2 className="text-[15px] font-semibold tracking-tight">
            {total === 0
              ? "Nenhum resultado"
              : `${showingFrom}–${showingTo} de ${formatCredits(total)} usuários`}
          </h2>
        </div>

        {users.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-muted">
            Nenhum usuário encontrado.
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
                  <th className="px-7 py-3.5 font-medium">Email</th>
                  <th className="px-7 py-3.5 text-right font-medium">Saldo</th>
                  <th className="px-7 py-3.5 text-right font-medium">Gerações</th>
                  <th className="px-7 py-3.5 font-medium">Auto-recarga</th>
                  <th className="px-7 py-3.5 font-medium">Cadastrado em</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr
                    key={u.id}
                    className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                    style={
                      i !== users.length - 1
                        ? { borderBottom: "1px solid var(--color-border)" }
                        : undefined
                    }
                  >
                    <td className="px-7 py-4">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="block hover:text-[var(--color-accent)]"
                      >
                        <div className="font-medium">{u.email}</div>
                        <div
                          className="mt-0.5 text-[10.5px] text-muted"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {u.id}
                        </div>
                      </Link>
                    </td>
                    <td className="px-7 py-4 text-right">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="block"
                      >
                        <div
                          className="text-sm font-semibold"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {formatCredits(u.creditsBalance)} cr
                        </div>
                        <div
                          className="text-[10.5px] text-muted"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {formatUsd(u.creditsBalance)}
                        </div>
                      </Link>
                    </td>
                    <td
                      className="px-7 py-4 text-right text-secondary"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="block"
                      >
                        {formatCredits(u._count.generations)}
                      </Link>
                    </td>
                    <td className="px-7 py-4">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="block"
                      >
                        {u.autoRechargeLastError ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                            style={{
                              border: "1px solid rgba(248, 113, 113, 0.4)",
                              background: "rgba(248, 113, 113, 0.10)",
                              color: "var(--color-danger)",
                            }}
                          >
                            erro
                          </span>
                        ) : u.autoRechargeEnabled ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                            style={{
                              border: "1px solid var(--color-border-accent)",
                              background: "rgba(162, 221, 0, 0.10)",
                              color: "var(--color-accent)",
                            }}
                          >
                            <Zap className="h-3 w-3" />
                            ativa
                          </span>
                        ) : u.defaultPaymentMethodId ? (
                          <span className="text-xs text-muted">cartão salvo</span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-7 py-4 text-xs text-secondary">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="block"
                      >
                        {u.createdAt.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </Link>
                    </td>
                  </tr>
                ))}
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
                  href={buildHref({ q, filter, page: page - 1 })}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-secondary transition-all hover:bg-white/[0.05]"
                  style={{ border: "1px solid var(--color-border-strong)" }}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted opacity-50" style={{ border: "1px solid var(--color-border)" }}>
                  <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                </span>
              )}
              {page < totalPages ? (
                <Link
                  href={buildHref({ q, filter, page: page + 1 })}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-secondary transition-all hover:bg-white/[0.05]"
                  style={{ border: "1px solid var(--color-border-strong)" }}
                >
                  Próxima
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted opacity-50" style={{ border: "1px solid var(--color-border)" }}>
                  Próxima <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
