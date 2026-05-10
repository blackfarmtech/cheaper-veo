"use client";

import { useState, useTransition } from "react";
import { Plus, Minus, Check, AlertCircle } from "lucide-react";

import { adminGrantCreditsAction } from "@/app/admin/users/[userId]/_actions";

interface Props {
  userId: string;
}

export function CreditGrantForm({ userId }: Props) {
  const [amount, setAmount] = useState<number>(100);
  const [direction, setDirection] = useState<"add" | "subtract">("add");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"bonus" | "adjustment">("bonus");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setFeedback(null);
    if (!description.trim()) {
      setFeedback({ kind: "error", msg: "Description is required." });
      return;
    }
    startTransition(async () => {
      const signed = direction === "add" ? amount : -amount;
      const res = await adminGrantCreditsAction({
        userId,
        amount: signed,
        description,
        type,
      });
      if (res.ok) {
        setFeedback({ kind: "ok", msg: res.message ?? "Applied." });
        setDescription("");
      } else {
        setFeedback({ kind: "error", msg: res.error });
      }
    });
  }

  return (
    <div className="card p-6">
      <h3 className="text-[15px] font-semibold tracking-tight">
        Add / debit credits
      </h3>
      <p className="mt-1 text-[13px] text-secondary">
        Manual operation, logged as bonus or adjustment with your email.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
        <div className="space-y-2">
          <label
            className="text-[11px] uppercase text-muted"
            style={{ letterSpacing: "0.08em" }}
          >
            Direction
          </label>
          <div
            className="flex gap-1 p-1"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-pill)",
            }}
          >
            <button
              type="button"
              onClick={() => setDirection("add")}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-all"
              style={
                direction === "add"
                  ? {
                      background: "rgba(162, 221, 0, 0.18)",
                      color: "var(--color-accent)",
                      boxShadow: "0 0 0 1px var(--color-border-accent) inset",
                    }
                  : { color: "var(--color-text-secondary)" }
              }
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
            <button
              type="button"
              onClick={() => setDirection("subtract")}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-all"
              style={
                direction === "subtract"
                  ? {
                      background: "rgba(248, 113, 113, 0.15)",
                      color: "var(--color-danger)",
                      boxShadow: "0 0 0 1px rgba(248, 113, 113, 0.4) inset",
                    }
                  : { color: "var(--color-text-secondary)" }
              }
            >
              <Minus className="h-3.5 w-3.5" /> Debit
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="text-[11px] uppercase text-muted"
            style={{ letterSpacing: "0.08em" }}
          >
            Amount (credits)
          </label>
          <div className="relative">
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) =>
                setAmount(Math.max(0, Number.parseInt(e.target.value, 10) || 0))
              }
              disabled={isPending}
              className="input-apple pr-14"
            />
            <span
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-muted"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              cr
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[160px_1fr]">
        <div className="space-y-2">
          <label
            className="text-[11px] uppercase text-muted"
            style={{ letterSpacing: "0.08em" }}
          >
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "bonus" | "adjustment")}
            disabled={isPending}
            className="input-apple"
          >
            <option value="bonus">Bonus</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>

        <div className="space-y-2">
          <label
            className="text-[11px] uppercase text-muted"
            style={{ letterSpacing: "0.08em" }}
          >
            Description (audit)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="E.g.: compensation for a generation that failed on 05/09"
            disabled={isPending}
            className="input-apple"
            maxLength={200}
          />
        </div>
      </div>

      {feedback && (
        <div
          className="mt-5 flex items-start gap-2 p-3.5 text-sm"
          style={{
            border:
              feedback.kind === "ok"
                ? "1px solid var(--color-border-accent)"
                : "1px solid rgba(248, 113, 113, 0.4)",
            background:
              feedback.kind === "ok"
                ? "rgba(162, 221, 0, 0.08)"
                : "rgba(248, 113, 113, 0.08)",
            color:
              feedback.kind === "ok"
                ? "var(--color-accent)"
                : "var(--color-danger)",
            borderRadius: "var(--radius-md)",
          }}
        >
          {feedback.kind === "ok" ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          )}
          {feedback.msg}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || amount <= 0}
        className="btn-primary mt-5 disabled:opacity-50"
      >
        {isPending ? "Applying…" : `Apply ${direction === "add" ? "+" : "−"}${amount} cr`}
      </button>
    </div>
  );
}
