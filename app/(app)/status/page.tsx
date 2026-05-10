import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Status · Cheaper Veo",
  description: "Real-time status of Cheaper Veo services.",
};

const HOUR_MS = 60 * 60 * 1000;

interface ServiceCheck {
  name: string;
  description: string;
  ok: boolean;
  latencyMs?: number;
  detail?: string;
}

async function checkDatabase(): Promise<ServiceCheck> {
  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      name: "Database (Postgres)",
      description: "Main database for users, credits and generations.",
      ok: true,
      latencyMs: Date.now() - t0,
    };
  } catch (err) {
    return {
      name: "Database (Postgres)",
      description: "Main database for users, credits and generations.",
      ok: false,
      detail: err instanceof Error ? err.message : "unknown error",
    };
  }
}

async function checkUpstream(): Promise<ServiceCheck> {
  const baseUrl =
    process.env.GERAEW_PROVIDER_URL ?? "http://localhost:8012/api";
  const t0 = Date.now();
  try {
    const res = await fetch(`${baseUrl.replace(/\/api\/?$/, "")}/health`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    return {
      name: "Veo upstream provider",
      description: "NestJS service that talks to Google Vertex AI.",
      ok: res.ok,
      latencyMs: Date.now() - t0,
      detail: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      name: "Veo upstream provider",
      description: "NestJS service that talks to Google Vertex AI.",
      ok: false,
      detail: err instanceof Error ? err.message : "timeout",
    };
  }
}

async function recentMetrics() {
  const since24h = new Date(Date.now() - 24 * HOUR_MS);

  const [total24h, failed24h, refunded24h, succeeded24h] = await Promise.all([
    prisma.generation.count({ where: { createdAt: { gte: since24h } } }),
    prisma.generation.count({
      where: { createdAt: { gte: since24h }, status: "failed" },
    }),
    prisma.generation.count({
      where: { createdAt: { gte: since24h }, status: "refunded" },
    }),
    prisma.generation.count({
      where: { createdAt: { gte: since24h }, status: "succeeded" },
    }),
  ]);

  const finalized = succeeded24h + failed24h + refunded24h;
  const successRate = finalized === 0 ? 100 : (succeeded24h / finalized) * 100;
  return { total24h, failed24h, refunded24h, succeeded24h, successRate };
}

export default async function StatusPage() {
  const [db, upstream, metrics] = await Promise.all([
    checkDatabase(),
    checkUpstream(),
    recentMetrics(),
  ]);

  const services: ServiceCheck[] = [
    {
      name: "API HTTP (Next.js)",
      description: "Public /api/v1/* endpoints and Stripe webhook.",
      ok: true,
      detail: "You're seeing this page, so it's responding.",
    },
    db,
    upstream,
  ];

  const allOk = services.every((s) => s.ok);

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <p
        className="mb-3 text-[11px] uppercase text-muted"
        style={{
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.12em",
        }}
      >
        Status
      </p>

      <div
        className="mt-2 flex items-center gap-3 p-5"
        style={{
          border: allOk
            ? "1px solid var(--color-border-accent)"
            : "1px solid rgba(251, 191, 36, 0.4)",
          background: allOk
            ? "linear-gradient(135deg, rgba(162, 221, 0, 0.08), rgba(162, 221, 0, 0.02))"
            : "rgba(251, 191, 36, 0.06)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        {allOk ? (
          <CheckCircle2
            className="h-6 w-6"
            style={{ color: "var(--color-accent)" }}
          />
        ) : (
          <AlertTriangle
            className="h-6 w-6"
            style={{ color: "var(--color-warn)" }}
          />
        )}
        <div>
          <h1
            className="text-[1.5rem] font-semibold tracking-tight"
            style={{ letterSpacing: "-0.022em" }}
          >
            {allOk
              ? "All systems operational"
              : "Some services experiencing issues"}
          </h1>
          <p className="mt-0.5 text-[13px] text-secondary">
            Updated at {new Date().toLocaleString("en-US")}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-[15px] font-semibold tracking-tight">Services</h2>
        <ul className="mt-3 space-y-2">
          {services.map((s) => (
            <li
              key={s.name}
              className="card flex items-start justify-between gap-4 p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {s.ok ? (
                    <CheckCircle2
                      className="h-4 w-4 shrink-0"
                      style={{ color: "var(--color-accent)" }}
                    />
                  ) : (
                    <AlertTriangle
                      className="h-4 w-4 shrink-0"
                      style={{ color: "var(--color-warn)" }}
                    />
                  )}
                  <span className="text-[14px] font-medium">{s.name}</span>
                </div>
                <p className="mt-1 text-[12.5px] text-muted">{s.description}</p>
                {s.detail && (
                  <p
                    className="mt-1 text-[11px]"
                    style={{
                      color: s.ok
                        ? "var(--color-text-secondary)"
                        : "var(--color-danger)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {s.detail}
                  </p>
                )}
              </div>
              {s.latencyMs !== undefined && (
                <span
                  className="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px]"
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--color-border-strong)",
                    color: "var(--color-text-secondary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <Clock className="h-3 w-3" />
                  {s.latencyMs}ms
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-[15px] font-semibold tracking-tight">
          Metrics (last 24h)
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <Stat label="Total generations" value={metrics.total24h} />
          <Stat
            label="Succeeded"
            value={metrics.succeeded24h}
            color="var(--color-accent)"
          />
          <Stat
            label="Failed"
            value={metrics.failed24h}
            color={metrics.failed24h > 0 ? "var(--color-danger)" : undefined}
          />
          <Stat
            label="Success rate"
            value={`${metrics.successRate.toFixed(1)}%`}
            color="var(--color-accent)"
          />
        </div>
      </section>

      <p className="mt-12 text-[12px] text-muted">
        Status calculated in real time (no cache). For incident history
        or to subscribe to notifications, email{" "}
        <a href="mailto:contato@cheaperveo.com" className="legal-link">
          contato@cheaperveo.com
        </a>
        .
      </p>
    </article>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="card p-4">
      <div
        className="text-[10.5px] uppercase text-muted"
        style={{ letterSpacing: "0.08em" }}
      >
        {label}
      </div>
      <div
        className="mt-2 text-[1.5rem] font-semibold"
        style={{
          fontFamily: "var(--font-mono)",
          letterSpacing: "-0.022em",
          color: color ?? "var(--color-text)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
