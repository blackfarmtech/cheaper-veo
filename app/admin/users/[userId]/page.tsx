import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Zap, AlertTriangle, KeyRound, Wallet } from "lucide-react";
import type { TransactionType } from "@prisma/client";

import { AdminRevokeKey } from "@/components/admin/AdminRevokeKey";
import { AutoRechargeAdminControls } from "@/components/admin/AutoRechargeAdminControls";
import { CreditGrantForm } from "@/components/admin/CreditGrantForm";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { getSavedCardDisplay } from "@/lib/auto-recharge";
import { prisma } from "@/lib/prisma";
import { getModelById, getTopupById } from "@/lib/pricing";
import { cn, formatCredits, formatMoney } from "@/lib/utils";

interface PageProps {
  params: Promise<{ userId: string }>;
}

const TX_LABEL: Record<TransactionType, string> = {
  topup: "Recarga",
  debit: "Débito",
  refund: "Reembolso",
  bonus: "Bônus",
  adjustment: "Ajuste",
};

const dt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { userId } = await params;

  const [user, transactions, generations, apiKeys, savedCard] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: { generations: true, apiKeys: true, transactions: true },
          },
        },
      }),
      prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      prisma.generation.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      prisma.apiKey.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      getSavedCardDisplay(userId),
    ]);

  if (!user) notFound();

  const topupConfigured = user.autoRechargeTopupId
    ? getTopupById(user.autoRechargeTopupId)
    : null;

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-[var(--color-text)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </Link>
        <h1
          className="mt-2 text-3xl font-semibold tracking-tight md:text-[2rem]"
          style={{ letterSpacing: "-0.024em" }}
        >
          {user.email}
        </h1>
        <p
          className="mt-1 text-[12px] text-muted"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {user.id} · cadastrado {dt.format(user.createdAt)} · stripe:{" "}
          {user.stripeCustomerId ?? "—"}
        </p>
      </header>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] uppercase text-muted"
              style={{ letterSpacing: "0.08em" }}
            >
              Saldo atual
            </span>
            <Wallet
              className="h-4 w-4"
              style={{ color: "var(--color-accent)" }}
            />
          </div>
          <div
            className="mt-3 text-2xl font-semibold"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--color-accent)",
            }}
          >
            {formatCredits(user.creditsBalance)} cr
          </div>
          <div className="mt-1 text-xs text-muted">
            ≈ {formatMoney(user.creditsBalance * 5, "brl")}
          </div>
        </div>

        <div className="card p-5">
          <span
            className="text-[11px] uppercase text-muted"
            style={{ letterSpacing: "0.08em" }}
          >
            Gerações
          </span>
          <div
            className="mt-3 text-2xl font-semibold"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {formatCredits(user._count.generations)}
          </div>
        </div>

        <div className="card p-5">
          <span
            className="text-[11px] uppercase text-muted"
            style={{ letterSpacing: "0.08em" }}
          >
            API keys
          </span>
          <div
            className="mt-3 text-2xl font-semibold"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {formatCredits(user._count.apiKeys)}
          </div>
        </div>

        <div className="card p-5">
          <span
            className="text-[11px] uppercase text-muted"
            style={{ letterSpacing: "0.08em" }}
          >
            Transações
          </span>
          <div
            className="mt-3 text-2xl font-semibold"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {formatCredits(user._count.transactions)}
          </div>
        </div>
      </div>

      {/* Auto-recharge state */}
      <section className="card p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap
                className="h-4 w-4"
                style={{ color: "var(--color-accent)" }}
              />
              <h2 className="text-[15px] font-semibold tracking-tight">
                Auto-recarga
              </h2>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                )}
                style={{
                  letterSpacing: "0.06em",
                  ...(user.autoRechargeEnabled
                    ? {
                        background: "rgba(162, 221, 0, 0.12)",
                        color: "var(--color-accent)",
                      }
                    : {
                        background: "rgba(255, 255, 255, 0.04)",
                        color: "var(--color-text-secondary)",
                        border: "1px solid var(--color-border-strong)",
                      }),
                }}
              >
                {user.autoRechargeEnabled ? "ativa" : "inativa"}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-secondary">
              {user.autoRechargeEnabled && topupConfigured
                ? `Cobra ${topupConfigured.label.toLowerCase()} (${formatMoney(topupConfigured.amountCents, topupConfigured.currency)}) quando saldo < ${formatCredits(user.autoRechargeThreshold)} cr`
                : "Sem configuração ativa."}
            </p>
          </div>

          <AutoRechargeAdminControls
            userId={user.id}
            enabled={user.autoRechargeEnabled}
            inProgress={user.autoRechargeInProgress}
            hasError={Boolean(user.autoRechargeLastError)}
          />
        </div>

        {user.autoRechargeLastError && (
          <div
            className="mt-5 flex items-start gap-2 p-3.5 text-sm text-[var(--color-danger)]"
            style={{
              border: "1px solid rgba(248, 113, 113, 0.4)",
              background: "rgba(248, 113, 113, 0.08)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden
            />
            <div>
              <strong className="text-[var(--color-text)]">
                Último erro:
              </strong>{" "}
              {user.autoRechargeLastError}
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <div
              className="text-[10.5px] uppercase text-muted"
              style={{ letterSpacing: "0.08em" }}
            >
              Cartão salvo
            </div>
            <div
              className="mt-1 text-[13px]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {savedCard
                ? `${savedCard.brand.toUpperCase()} ···· ${savedCard.last4}`
                : "—"}
            </div>
          </div>
          <div>
            <div
              className="text-[10.5px] uppercase text-muted"
              style={{ letterSpacing: "0.08em" }}
            >
              In progress
            </div>
            <div className="mt-1 text-[13px]">
              {user.autoRechargeInProgress ? "Sim (lock ativo)" : "Não"}
            </div>
          </div>
          <div>
            <div
              className="text-[10.5px] uppercase text-muted"
              style={{ letterSpacing: "0.08em" }}
            >
              Última cobrança
            </div>
            <div className="mt-1 text-[13px]">
              {user.autoRechargeLastTriggeredAt
                ? dt.format(user.autoRechargeLastTriggeredAt)
                : "Nunca"}
            </div>
          </div>
        </div>
      </section>

      {/* Credit grant */}
      <CreditGrantForm userId={user.id} />

      {/* Two-column: transactions + generations */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card overflow-hidden" style={{ padding: 0 }}>
          <div
            className="px-7 py-5"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <h2 className="text-[15px] font-semibold tracking-tight">
              Últimas transações
            </h2>
            <p className="mt-0.5 text-[12px] text-secondary">
              25 mais recentes (de {user._count.transactions}).
            </p>
          </div>
          {transactions.length === 0 ? (
            <p className="p-6 text-[13px] text-muted">Sem transações.</p>
          ) : (
            <ul>
              {transactions.map((tx, i) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-3 px-7 py-3 hover:bg-white/[0.02]"
                  style={
                    i !== transactions.length - 1
                      ? { borderBottom: "1px solid var(--color-border)" }
                      : undefined
                  }
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] uppercase text-muted"
                        style={{ letterSpacing: "0.06em" }}
                      >
                        {TX_LABEL[tx.type]}
                      </span>
                      <span
                        className="text-[10.5px] text-muted"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {dt.format(tx.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[12px] text-secondary">
                      {tx.description ?? "—"}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-sm font-semibold"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color:
                        tx.amount > 0
                          ? "var(--color-accent)"
                          : "var(--color-text-secondary)",
                    }}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {formatCredits(tx.amount)} cr
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card overflow-hidden" style={{ padding: 0 }}>
          <div
            className="px-7 py-5"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <h2 className="text-[15px] font-semibold tracking-tight">
              Últimas gerações
            </h2>
            <p className="mt-0.5 text-[12px] text-secondary">
              15 mais recentes (de {user._count.generations}).
            </p>
          </div>
          {generations.length === 0 ? (
            <p className="p-6 text-[13px] text-muted">Sem gerações.</p>
          ) : (
            <ul>
              {generations.map((gen, i) => {
                const model = getModelById(gen.model);
                return (
                  <li
                    key={gen.id}
                    className="flex items-start justify-between gap-3 px-7 py-3 hover:bg-white/[0.02]"
                    style={
                      i !== generations.length - 1
                        ? { borderBottom: "1px solid var(--color-border)" }
                        : undefined
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={gen.status} />
                        <span
                          className="text-[11px] text-muted"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {model?.label ?? gen.model} · {gen.resolution} ·{" "}
                          {gen.durationSeconds}s
                          {gen.audio ? " · audio" : ""}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[12px] text-secondary">
                        {gen.prompt}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[11px] text-muted"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {formatCredits(gen.creditsCost)} cr
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* API keys */}
      <section className="card overflow-hidden" style={{ padding: 0 }}>
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">
              API keys
            </h2>
            <p className="mt-0.5 text-[12px] text-secondary">
              Todas as chaves desse usuário (ativas e revogadas).
            </p>
          </div>
        </div>
        {apiKeys.length === 0 ? (
          <div className="flex items-center gap-2 p-7 text-[13px] text-muted">
            <KeyRound className="h-4 w-4" /> Nenhuma chave criada.
          </div>
        ) : (
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
                <th className="px-7 py-3.5 font-medium">Nome</th>
                <th className="px-7 py-3.5 font-medium">Prefix</th>
                <th className="px-7 py-3.5 font-medium">Status</th>
                <th className="px-7 py-3.5 font-medium">Criada</th>
                <th className="px-7 py-3.5 font-medium">Última uso</th>
                <th className="px-7 py-3.5 text-right font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((k, i) => {
                const revoked = k.revokedAt !== null;
                return (
                  <tr
                    key={k.id}
                    style={
                      i !== apiKeys.length - 1
                        ? { borderBottom: "1px solid var(--color-border)" }
                        : undefined
                    }
                  >
                    <td className="px-7 py-3.5 font-medium">{k.name}</td>
                    <td
                      className="px-7 py-3.5 text-secondary"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {k.prefix}…
                    </td>
                    <td className="px-7 py-3.5">
                      {revoked ? (
                        <span className="text-[11px] text-[var(--color-danger)]">
                          revogada
                        </span>
                      ) : (
                        <span
                          className="text-[11px]"
                          style={{ color: "var(--color-accent)" }}
                        >
                          ativa
                        </span>
                      )}
                    </td>
                    <td className="px-7 py-3.5 text-xs text-secondary">
                      {dt.format(k.createdAt)}
                    </td>
                    <td className="px-7 py-3.5 text-xs text-muted">
                      {k.lastUsedAt ? dt.format(k.lastUsedAt) : "Nunca"}
                    </td>
                    <td className="px-7 py-3.5 text-right">
                      {!revoked && (
                        <AdminRevokeKey
                          keyId={k.id}
                          userId={user.id}
                          keyName={k.name}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
