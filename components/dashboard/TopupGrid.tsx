"use client";

import { useState } from "react";

import type { TopupOption } from "@/lib/pricing";
import { cn, formatCredits } from "@/lib/utils";

interface TopupGridProps {
  topups: TopupOption[];
}

export function TopupGrid({ topups }: TopupGridProps): React.ReactElement {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(topupId: string): Promise<void> {
    setError(null);
    setLoadingId(topupId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topupId }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Falha (${res.status})`);
      }
      const data: { url?: string } = await res.json();
      if (!data.url) {
        throw new Error("Resposta inválida do servidor.");
      }
      window.location.href = data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido.";
      setError(message);
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div
          className="p-4 text-sm"
          style={{
            border: "1px solid rgba(248, 113, 113, 0.4)",
            background: "rgba(248, 113, 113, 0.08)",
            color: "var(--color-danger)",
            borderRadius: "var(--radius-md)",
          }}
        >
          Não foi possível iniciar o checkout: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topups.map((topup) => {
          const isLoading = loadingId === topup.id;
          const isHighlighted = topup.highlight === true;
          return (
            <div
              key={topup.id}
              className={cn(
                "card card-hoverable flex flex-col gap-4 p-6",
              )}
              style={
                isHighlighted
                  ? {
                      borderColor: "var(--color-border-accent)",
                      boxShadow:
                        "0 0 0 1px var(--color-border-accent), var(--shadow-glow)",
                    }
                  : undefined
              }
            >
              <div className="flex items-start justify-between">
                <div>
                  <div
                    className="text-3xl font-semibold tracking-tight"
                    style={{ letterSpacing: "-0.022em" }}
                  >
                    US${topup.usd}
                  </div>
                  <div className="mt-1.5 text-sm text-secondary">
                    {formatCredits(topup.credits)} créditos
                  </div>
                </div>
                {isHighlighted ? (
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase"
                    style={{
                      background: "rgba(162, 221, 0, 0.15)",
                      color: "var(--color-accent)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Popular
                  </span>
                ) : null}
              </div>

              <div className="text-sm text-muted">{topup.label}</div>

              <button
                type="button"
                onClick={() => handleCheckout(topup.id)}
                disabled={isLoading || loadingId !== null}
                className="btn-primary mt-auto w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Redirecionando…" : "Recarregar"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
