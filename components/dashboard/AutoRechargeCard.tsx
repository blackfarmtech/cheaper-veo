"use client";

import { useState, useTransition } from "react";
import { CreditCard, Plus, Trash2, Zap, AlertCircle, Check } from "lucide-react";

import { cn, formatCredits } from "@/lib/utils";
import {
  removePaymentMethodAction,
  saveAutoRechargeAction,
  startSaveCardAction,
} from "@/app/(app)/dashboard/billing/_actions";

interface TopupChoice {
  id: string;
  label: string;
  amountCents: number;
  currency: "brl" | "usd";
  usdReference: number;
  credits: number;
}

interface SavedCard {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface AutoRechargeCardProps {
  initialEnabled: boolean;
  initialThreshold: number;
  initialTopupId: string | null;
  lastError: string | null;
  topups: TopupChoice[];
  savedCard: SavedCard | null;
}

export function AutoRechargeCard({
  initialEnabled,
  initialThreshold,
  initialTopupId,
  lastError,
  topups,
  savedCard,
}: AutoRechargeCardProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [threshold, setThreshold] = useState(initialThreshold);
  const [topupId, setTopupId] = useState(initialTopupId ?? topups[2]?.id ?? "topup-25");
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isCardLoading, setIsCardLoading] = useState(false);

  const hasCard = savedCard !== null;
  const selectedTopup = topups.find((t) => t.id === topupId);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await saveAutoRechargeAction({
        enabled,
        threshold,
        topupId,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    });
  }

  async function handleAddCard() {
    setError(null);
    setIsCardLoading(true);
    try {
      const res = await startSaveCardAction();
      if (!res.ok) {
        setError(res.error);
        setIsCardLoading(false);
        return;
      }
      window.location.href = res.data!.url;
    } catch {
      setError("Failed to start card setup.");
      setIsCardLoading(false);
    }
  }

  function handleRemoveCard() {
    if (!confirm("Remove the saved card? Auto-recharge will be disabled.")) return;
    setError(null);
    startTransition(async () => {
      const res = await removePaymentMethodAction();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEnabled(false);
    });
  }

  return (
    <div className="card p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(162, 221, 0, 0.18), rgba(162, 221, 0, 0.04))",
              border: "1px solid var(--color-border-accent)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-accent)",
            }}
          >
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight">
              Auto-recharge
            </h2>
            <p className="mt-1 text-[13px] text-secondary">
              When your balance drops below the threshold, we automatically
              charge the saved card.
            </p>
          </div>
        </div>

        {/* Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => {
            if (!hasCard && !enabled) {
              setError("Add a card before enabling auto-recharge.");
              return;
            }
            setEnabled((v) => !v);
          }}
          disabled={!hasCard && !enabled}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
            enabled ? "bg-[var(--color-accent)]" : "bg-white/[0.10]",
          )}
          style={{ opacity: !hasCard && !enabled ? 0.5 : 1 }}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
              enabled ? "translate-x-[22px]" : "translate-x-0.5",
            )}
            style={{ boxShadow: "var(--shadow-xs)" }}
          />
        </button>
      </div>

      {/* Saved card panel */}
      <div
        className="mt-6 p-5"
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <div
          className="mb-3 text-[11px] uppercase text-muted"
          style={{ letterSpacing: "0.08em" }}
        >
          Card for auto-recharge
        </div>
        {hasCard ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CreditCard
                className="h-5 w-5"
                style={{ color: "var(--color-accent)" }}
                aria-hidden
              />
              <div>
                <div
                  className="text-[14px] font-medium"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {savedCard!.brand.toUpperCase()} ···· {savedCard!.last4}
                </div>
                <div className="text-[12px] text-muted">
                  Expires{" "}
                  {savedCard!.expMonth.toString().padStart(2, "0")}/
                  {savedCard!.expYear.toString().slice(-2)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveCard}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-secondary transition-all hover:text-[var(--color-danger)] disabled:opacity-50"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--color-border-strong)",
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddCard}
            disabled={isCardLoading}
            className="btn-ghost w-full disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {isCardLoading ? "Opening Stripe…" : "Add card"}
          </button>
        )}
      </div>

      {/* Config */}
      <div
        className={cn(
          "mt-6 grid gap-5 sm:grid-cols-2 transition-opacity",
          !enabled && "opacity-50 pointer-events-none",
        )}
      >
        <div className="space-y-2.5">
          <label
            htmlFor="threshold"
            className="text-[11px] uppercase text-muted"
            style={{ letterSpacing: "0.08em" }}
          >
            Recharge when balance falls below
          </label>
          <div className="relative">
            <input
              id="threshold"
              type="number"
              min={10}
              max={100000}
              step={10}
              value={threshold}
              onChange={(e) => setThreshold(Number.parseInt(e.target.value, 10) || 0)}
              disabled={!enabled || isPending}
              className="input-apple pr-16"
            />
            <span
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-muted"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              cr
            </span>
          </div>
          <p className="text-[11px] text-muted">
            ≈ ${(threshold / 100).toFixed(2)} (1 cr = $0.01)
          </p>
        </div>

        <div className="space-y-2.5">
          <label
            htmlFor="topupId"
            className="text-[11px] uppercase text-muted"
            style={{ letterSpacing: "0.08em" }}
          >
            Buy pack of
          </label>
          <select
            id="topupId"
            value={topupId}
            onChange={(e) => setTopupId(e.target.value)}
            disabled={!enabled || isPending}
            className="input-apple"
          >
            {topups.map((t) => (
              <option key={t.id} value={t.id}>
                {t.currency === "brl" ? "R$" : "$"}{t.amountCents / 100} (≈ ${t.usdReference}) — {formatCredits(t.credits)} cr
              </option>
            ))}
          </select>
          {selectedTopup && (
            <p className="text-[11px] text-muted">
              {formatCredits(selectedTopup.credits)} credits will be added
              to your balance.
            </p>
          )}
        </div>
      </div>

      {lastError && (
        <div
          className="mt-5 flex items-start gap-2 p-3.5 text-sm text-[var(--color-warn)]"
          style={{
            border: "1px solid rgba(251, 191, 36, 0.35)",
            background: "rgba(251, 191, 36, 0.08)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <strong className="text-[var(--color-text)]">
              Last charge failed:
            </strong>{" "}
            {lastError}. Auto-recharge has been disabled — check the card and
            re-enable.
          </div>
        </div>
      )}

      {error && (
        <div
          className="mt-5 flex items-start gap-2 p-3.5 text-sm text-[var(--color-danger)]"
          style={{
            border: "1px solid rgba(248, 113, 113, 0.4)",
            background: "rgba(248, 113, 113, 0.08)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="btn-primary disabled:opacity-50"
        >
          {savedFlash ? (
            <>
              <Check className="h-4 w-4" /> Saved
            </>
          ) : (
            "Save configuration"
          )}
        </button>
        <span className="text-[11px] text-muted">
          You&apos;re only charged when the balance drops below the threshold.
          5 min cooldown between recharges.
        </span>
      </div>
    </div>
  );
}
