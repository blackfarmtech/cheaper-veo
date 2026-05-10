import Link from "next/link";
import {
  Users as UsersIcon,
  Activity,
  DollarSign,
  Coins,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatCredits, formatMoney } from "@/lib/utils";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`;
  if (diff < MS_PER_DAY) return `${Math.floor(diff / 3_600_000)} h`;
  return `${Math.floor(diff / MS_PER_DAY)} d`;
}

export default async function AdminOverviewPage() {
  const since30d = new Date(Date.now() - 30 * MS_PER_DAY);
  const since24h = new Date(Date.now() - MS_PER_DAY);

  const [
    totalUsers,
    newUsers30d,
    activeUsers30d,
    creditsInCirculation,
    revenue30dAgg,
    revenueAllAgg,
    gens30d,
    gensFailed24h,
    autoRechargeFailed,
    recentSignups,
    recentTopups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since30d } } }),
    prisma.user.count({
      where: { generations: { some: { createdAt: { gte: since30d } } } },
    }),
    prisma.user.aggregate({ _sum: { creditsBalance: true } }),
    // Group by currency so BRL and legacy USD top-ups don't get mixed in one number.
    prisma.creditTransaction.groupBy({
      by: ["currency"],
      where: { type: "topup", createdAt: { gte: since30d } },
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
    prisma.creditTransaction.groupBy({
      by: ["currency"],
      where: { type: "topup" },
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
    prisma.generation.count({ where: { createdAt: { gte: since30d } } }),
    prisma.generation.count({
      where: { status: "failed", createdAt: { gte: since24h } },
    }),
    prisma.user.count({ where: { autoRechargeLastError: { not: null } } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, email: true, createdAt: true, creditsBalance: true },
    }),
    prisma.creditTransaction.findMany({
      where: { type: "topup" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { email: true } } },
    }),
  ]);

  const creditsTotal = creditsInCirculation._sum.creditsBalance ?? 0;
  // Mixed-currency aggregation — present each currency separately so totals
  // remain meaningful. BRL is the primary going forward; USD is legacy.
  const revenue30dByCurrency = revenue30dAgg.map((r) => ({
    currency: r.currency ?? "usd",
    amountCents: r._sum.amountCents ?? 0,
    count: r._count._all,
  }));
  const revenueAllByCurrency = revenueAllAgg.map((r) => ({
    currency: r.currency ?? "usd",
    amountCents: r._sum.amountCents ?? 0,
    count: r._count._all,
  }));
  // Primary currency (highest volume) for the headline number.
  const primary30d =
    revenue30dByCurrency.sort((a, b) => b.amountCents - a.amountCents)[0] ??
    { currency: "brl" as const, amountCents: 0, count: 0 };
  const primaryAll =
    revenueAllByCurrency.sort((a, b) => b.amountCents - a.amountCents)[0] ??
    { currency: "brl" as const, amountCents: 0, count: 0 };
  const revenue30d = primary30d.amountCents;
  const revenueAll = primaryAll.amountCents;
  const revenue30dCurrency = primary30d.currency;
  const revenueAllCurrency = primaryAll.currency;

  return (
    <div className="space-y-10">
      <header className="space-y-1.5">
        <h1
          className="text-3xl font-semibold tracking-tight md:text-[2.25rem]"
          style={{ letterSpacing: "-0.024em" }}
        >
          Overview
        </h1>
        <p className="text-[15px] text-secondary">
          Real-time platform metrics. Updates on each refresh.
        </p>
      </header>

      {/* Top KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={UsersIcon}
          label="Total users"
          value={formatCredits(totalUsers)}
          sub={`+${newUsers30d} in the last 30d`}
          accent
        />
        <Kpi
          icon={DollarSign}
          label="Revenue (30d)"
          value={formatMoney(revenue30d, revenue30dCurrency)}
          sub={`All-time total: ${formatMoney(revenueAll, revenueAllCurrency)}`}
        />
        <Kpi
          icon={Activity}
          label="Generations (30d)"
          value={formatCredits(gens30d)}
          sub={`${activeUsers30d} active users`}
        />
        <Kpi
          icon={Coins}
          label="Credits in circulation"
          value={formatCredits(creditsTotal)}
          sub={`= ${formatMoney(creditsTotal * 5, "brl")} to be used`}
        />
      </div>

      {/* Alerts */}
      {(gensFailed24h > 0 || autoRechargeFailed > 0) && (
        <div
          className="card flex items-start gap-3 p-5"
          style={{
            borderColor: "rgba(251, 191, 36, 0.4)",
            background: "rgba(251, 191, 36, 0.04)",
          }}
        >
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0"
            style={{ color: "var(--color-warn)" }}
            aria-hidden
          />
          <div className="space-y-1">
            <h2 className="text-[15px] font-semibold tracking-tight">
              Attention
            </h2>
            {gensFailed24h > 0 && (
              <p className="text-[13.5px] text-secondary">
                <strong className="text-[var(--color-text)]">
                  {gensFailed24h}
                </strong>{" "}
                generations failed in the last 24h.{" "}
                <Link
                  href="/admin/generations?status=failed"
                  className="text-[var(--color-accent)] underline-offset-4 hover:underline"
                >
                  View
                </Link>
              </p>
            )}
            {autoRechargeFailed > 0 && (
              <p className="text-[13.5px] text-secondary">
                <strong className="text-[var(--color-text)]">
                  {autoRechargeFailed}
                </strong>{" "}
                accounts with auto-recharge in error state.{" "}
                <Link
                  href="/admin/users?filter=auto_recharge_failed"
                  className="text-[var(--color-accent)] underline-offset-4 hover:underline"
                >
                  View
                </Link>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Two-column lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent signups */}
        <section className="card p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-semibold tracking-tight">
                New users
              </h2>
              <p className="mt-0.5 text-[13px] text-secondary">
                Last 5 signups.
              </p>
            </div>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-secondary transition-all hover:bg-white/[0.05] hover:text-[var(--color-text)]"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentSignups.length === 0 ? (
            <p className="text-[13px] text-muted">No signups yet.</p>
          ) : (
            <ul className="-mx-3">
              {recentSignups.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-white/[0.02]"
                >
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="min-w-0 flex-1"
                  >
                    <div className="truncate text-[13.5px] font-medium">
                      {u.email}
                    </div>
                    <div className="text-[11px] text-muted">
                      Balance: {formatCredits(u.creditsBalance)} cr
                    </div>
                  </Link>
                  <span className="shrink-0 text-[11px] text-muted">
                    {formatRelative(u.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent topups */}
        <section className="card p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-semibold tracking-tight">
                Recent top-ups
              </h2>
              <p className="mt-0.5 text-[13px] text-secondary">
                Last 5 confirmed payments.
              </p>
            </div>
          </div>
          {recentTopups.length === 0 ? (
            <p className="text-[13px] text-muted">No top-ups yet.</p>
          ) : (
            <ul className="-mx-3">
              {recentTopups.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium">
                      {tx.user.email}
                    </div>
                    <div
                      className="text-[11px] text-muted"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      +{formatCredits(tx.amount)} cr ·{" "}
                      {tx.amountCents != null
                        ? formatMoney(tx.amountCents, tx.currency)
                        : "—"}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted">
                    {formatRelative(tx.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

interface KpiProps {
  icon: typeof UsersIcon;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

function Kpi({ icon: Icon, label, value, sub, accent }: KpiProps) {
  return (
    <div
      className="card p-6"
      style={
        accent
          ? {
              background:
                "linear-gradient(135deg, rgba(162, 221, 0, 0.06), rgba(255, 255, 255, 0.02))",
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] uppercase text-muted"
          style={{ letterSpacing: "0.08em" }}
        >
          {label}
        </span>
        <Icon
          className="h-4 w-4"
          style={accent ? { color: "var(--color-accent)" } : undefined}
        />
      </div>
      <div
        className="mt-4 text-[1.75rem] font-semibold tracking-tight"
        style={{
          fontFamily: "var(--font-mono)",
          letterSpacing: "-0.022em",
          color: accent ? "var(--color-accent)" : undefined,
        }}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}
