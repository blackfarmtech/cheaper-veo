import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BookText,
  KeyRound,
  PlayCircle,
  Sparkles,
  Wallet,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getBalance } from "@/lib/credits";
import { formatCredits, formatUsd } from "@/lib/utils";
import { getModelById } from "@/lib/pricing";

import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const dynamic = "force-dynamic";

const MS_PER_MIN = 60_000;
const MS_PER_HOUR = MS_PER_MIN * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < MS_PER_MIN) return "just now";
  if (diff < MS_PER_HOUR) {
    const m = Math.floor(diff / MS_PER_MIN);
    return `${m} min ago`;
  }
  if (diff < MS_PER_DAY) {
    const h = Math.floor(diff / MS_PER_HOUR);
    return `${h} h ago`;
  }
  const d = Math.floor(diff / MS_PER_DAY);
  if (d < 30) return `${d} d ago`;
  return date.toLocaleDateString("en-US");
}

function modelLabel(modelId: string): string {
  const m = getModelById(modelId);
  if (m) return m.label;
  return modelId;
}

export default async function DashboardOverviewPage() {
  const user = await requireUser();

  const since = new Date(Date.now() - 30 * MS_PER_DAY);

  const [balance, recent, statsAgg] = await Promise.all([
    getBalance(user.id),
    prisma.generation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.generation.aggregate({
      where: { userId: user.id, createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { creditsCost: true },
    }),
  ]);

  const generations30d = statsAgg._count._all;
  const spent30dCredits = statsAgg._sum.creditsCost ?? 0;

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
          Track your balance, recent activity and shortcuts to get started.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          icon={Wallet}
          label="Current balance"
          primary={`${formatCredits(balance)} cr`}
          secondary={formatUsd(balance)}
          accent
        />
        <KpiCard
          icon={Activity}
          label="Generations in the last 30 days"
          primary={formatCredits(generations30d)}
          secondary={`${generations30d === 1 ? "video" : "videos"} created`}
        />
        <KpiCard
          icon={Sparkles}
          label="Spent in the last 30 days"
          primary={formatUsd(spent30dCredits)}
          secondary={`${formatCredits(spent30dCredits)} cr debited`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-7 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-semibold tracking-tight">
                Recent activity
              </h2>
              <p className="mt-0.5 text-[13px] text-secondary">
                Last 6 generations from your account.
              </p>
            </div>
            <Link
              href="/dashboard/history"
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-secondary transition-all hover:bg-white/[0.05] hover:text-[var(--color-text)]"
            >
              View all
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              icon={PlayCircle}
              title="No generations yet"
              description="Create your first video in the playground in seconds."
              cta={{ label: "Open playground", href: "/dashboard/playground" }}
            />
          ) : (
            <ul className="-mx-3">
              {recent.map((gen) => (
                <li
                  key={gen.id}
                  className="flex items-start justify-between gap-4 rounded-lg px-3 py-3.5 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={gen.status} />
                      <span
                        className="text-xs text-muted"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {modelLabel(gen.model)}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-1 text-[13.5px] text-secondary">
                      {gen.prompt}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                    <span
                      className="text-sm font-semibold"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {formatCredits(gen.creditsCost)} cr
                    </span>
                    <span className="text-xs text-muted">
                      {formatRelative(gen.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-7">
          <h2 className="text-[17px] font-semibold tracking-tight">
            Quick shortcuts
          </h2>
          <p className="mt-1 text-[13px] text-secondary">
            Start with the essentials.
          </p>
          <div className="mt-5 space-y-2">
            <ShortcutLink
              href="/dashboard/playground"
              icon={PlayCircle}
              label="Open playground"
              description="Generate a video directly from the UI."
            />
            <ShortcutLink
              href="/dashboard/keys"
              icon={KeyRound}
              label="Create API key"
              description="Integrate our Veo 3.1 endpoint."
            />
            <ShortcutLink
              href="/docs"
              icon={BookText}
              label="View documentation"
              description="Endpoints, examples and SDKs."
            />
          </div>
        </section>
      </div>
    </div>
  );
}

interface KpiCardProps {
  icon: typeof Wallet;
  label: string;
  primary: string;
  secondary?: string;
  accent?: boolean;
}

function KpiCard({
  icon: Icon,
  label,
  primary,
  secondary,
  accent,
}: KpiCardProps) {
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
        {primary}
      </div>
      {secondary ? (
        <div className="mt-1 text-xs text-muted">{secondary}</div>
      ) : null}
    </div>
  );
}

interface ShortcutLinkProps {
  href: string;
  icon: typeof Wallet;
  label: string;
  description: string;
}

function ShortcutLink({
  href,
  icon: Icon,
  label,
  description,
}: ShortcutLinkProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 px-4 py-3 transition-all hover:bg-white/[0.04]"
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center text-secondary transition-colors group-hover:text-[var(--color-accent)]"
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold tracking-tight">
          {label}
        </span>
        <span className="block text-xs text-muted">{description}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--color-text)]" />
    </Link>
  );
}
