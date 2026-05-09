import type { CreditTransaction, TransactionType } from "@prisma/client";

import { AutoRechargeCard } from "@/components/dashboard/AutoRechargeCard";
import { TopupGrid } from "@/components/dashboard/TopupGrid";
import { getSavedCardDisplay } from "@/lib/auto-recharge";
import { TOPUPS } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { cn, formatCredits, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface BillingPageProps {
  searchParams: Promise<{
    success?: string;
    canceled?: string;
    card_added?: string;
    card_canceled?: string;
  }>;
}

const TYPE_LABEL: Record<TransactionType, string> = {
  topup: "Recarga",
  debit: "Débito",
  refund: "Reembolso",
  bonus: "Bônus",
  adjustment: "Ajuste",
};

export default async function BillingPage({ searchParams }: BillingPageProps): Promise<React.ReactElement> {
  const user = await requireUser();
  const params = await searchParams;
  const showSuccess = params.success === "1";
  const showCanceled = params.canceled === "1";
  const showCardAdded = params.card_added === "1";
  const showCardCanceled = params.card_canceled === "1";

  const [account, transactions, savedCard] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        creditsBalance: true,
        autoRechargeEnabled: true,
        autoRechargeThreshold: true,
        autoRechargeTopupId: true,
        autoRechargeLastError: true,
      },
    }),
    prisma.creditTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    getSavedCardDisplay(user.id),
  ]);

  const balance = account?.creditsBalance ?? 0;
  const topupChoices = TOPUPS.map((t) => ({
    id: t.id,
    label: t.label,
    amountCents: t.amountCents,
    currency: t.currency,
    usdReference: t.usdReference,
    credits: t.credits,
  }));

  return (
    <div className="space-y-10">
      <header>
        <h1
          className="text-3xl font-semibold tracking-tight md:text-[2.25rem]"
          style={{ letterSpacing: "-0.024em" }}
        >
          Saldo & Recargas
        </h1>
        <p className="mt-1.5 text-[15px] text-secondary">
          Recargas pay-as-you-go. 1 crédito equivale a US$0,01.
        </p>
      </header>

      {showSuccess ? (
        <div
          className="fade-up p-5 text-sm"
          style={{
            border: "1px solid var(--color-border-accent)",
            background:
              "linear-gradient(135deg, rgba(162, 221, 0, 0.08), rgba(162, 221, 0, 0.02))",
            color: "var(--color-accent)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          Pagamento confirmado. Os créditos aparecerão no seu saldo em instantes —
          podemos demorar alguns segundos para o webhook do Stripe ser processado.
        </div>
      ) : null}

      {showCanceled ? (
        <div
          className="p-5 text-sm text-secondary"
          style={{
            border: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          Pagamento cancelado. Nenhuma cobrança foi feita.
        </div>
      ) : null}

      {showCardAdded ? (
        <div
          className="fade-up p-5 text-sm"
          style={{
            border: "1px solid var(--color-border-accent)",
            background:
              "linear-gradient(135deg, rgba(162, 221, 0, 0.08), rgba(162, 221, 0, 0.02))",
            color: "var(--color-accent)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          Cartão salvo com sucesso. Configure a auto-recarga abaixo.
        </div>
      ) : null}

      {showCardCanceled ? (
        <div
          className="p-5 text-sm text-secondary"
          style={{
            border: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          Adição de cartão cancelada.
        </div>
      ) : null}

      <section
        className="card relative overflow-hidden p-8 md:p-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 0% 0%, rgba(162, 221, 0, 0.10), transparent 60%), var(--color-card)",
        }}
      >
        <div
          className="text-[11px] uppercase text-muted"
          style={{ letterSpacing: "0.08em" }}
        >
          Saldo atual
        </div>
        <div
          className="mt-3 text-5xl font-semibold tracking-tight md:text-6xl"
          style={{
            color: "var(--color-accent)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "-0.028em",
          }}
        >
          {formatCredits(balance)}
        </div>
        <div className="mt-2 text-[15px] text-secondary">
          créditos · ≈ {formatMoney(balance * 5, "brl")} ({formatMoney(balance, "usd")})
        </div>
      </section>

      <AutoRechargeCard
        initialEnabled={account?.autoRechargeEnabled ?? false}
        initialThreshold={account?.autoRechargeThreshold ?? 100}
        initialTopupId={account?.autoRechargeTopupId ?? null}
        lastError={account?.autoRechargeLastError ?? null}
        topups={topupChoices}
        savedCard={savedCard}
      />

      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight" style={{ letterSpacing: "-0.022em" }}>
            Recarregar
          </h2>
          <p className="mt-1 text-[14px] text-secondary">
            Pagamento único via Stripe. Os créditos não expiram.
          </p>
        </div>
        <TopupGrid topups={TOPUPS} />
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight" style={{ letterSpacing: "-0.022em" }}>
            Histórico
          </h2>
          <p className="mt-1 text-[14px] text-secondary">Últimas 10 movimentações.</p>
        </div>
        <HistoryTable transactions={transactions} />
      </section>
    </div>
  );
}

function HistoryTable({ transactions }: { transactions: CreditTransaction[] }): React.ReactElement {
  if (transactions.length === 0) {
    return (
      <div className="card p-7 text-sm text-muted">
        Você ainda não tem transações. Faça sua primeira recarga acima.
      </div>
    );
  }

  return (
    <div
      className="card overflow-hidden"
      style={{ padding: 0 }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr
              className="text-left text-[11px] uppercase text-muted"
              style={{
                background: "rgba(255, 255, 255, 0.025)",
                borderBottom: "1px solid var(--color-border)",
                letterSpacing: "0.08em",
              }}
            >
              <th className="px-5 py-3.5 font-medium">Data</th>
              <th className="px-5 py-3.5 font-medium">Tipo</th>
              <th className="px-5 py-3.5 font-medium">Descrição</th>
              <th className="px-5 py-3.5 text-right font-medium">
                Valor (créditos)
              </th>
              <th className="px-5 py-3.5 text-right font-medium">
                Pagamento (USD)
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, idx) => {
              const isCredit = tx.amount > 0;
              const isLast = idx === transactions.length - 1;
              return (
                <tr
                  key={tx.id}
                  className="text-secondary transition-colors hover:bg-white/[0.02]"
                  style={
                    !isLast
                      ? { borderBottom: "1px solid var(--color-border)" }
                      : undefined
                  }
                >
                  <td className="whitespace-nowrap px-5 py-4">
                    {formatDate(tx.createdAt)}
                  </td>
                  <td className="px-5 py-4">{TYPE_LABEL[tx.type]}</td>
                  <td className="px-5 py-4 text-muted">
                    {tx.description ?? "—"}
                  </td>
                  <td
                    className={cn(
                      "px-5 py-4 text-right font-medium tabular-nums",
                      isCredit
                        ? "text-[color:var(--color-accent)]"
                        : "text-secondary",
                    )}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {isCredit ? "+" : ""}
                    {formatCredits(tx.amount)}
                  </td>
                  <td
                    className="px-5 py-4 text-right tabular-nums text-muted"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {tx.amountCents != null
                      ? formatMoney(tx.amountCents, tx.currency)
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
