"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { revokeKeyAction } from "@/app/(app)/dashboard/keys/_actions";

interface RevokeKeyButtonProps {
  id: string;
  name: string;
}

export function RevokeKeyButton({ id, name }: RevokeKeyButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    const confirmed = window.confirm(
      `Are you sure you want to revoke the key "${name}"? This action cannot be undone.`,
    );
    if (!confirmed) return;
    startTransition(async () => {
      const result = await revokeKeyAction(id);
      if (!result.ok) {
        setError(result.error ?? "Failed to revoke key.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-secondary transition-all hover:text-[var(--color-danger)] disabled:opacity-60"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid var(--color-border-strong)",
        }}
      >
        {isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Revoking…
          </>
        ) : (
          <>
            <Trash2 className="h-3.5 w-3.5" />
            Revoke
          </>
        )}
      </button>
      {error ? (
        <span className="text-[10px] text-[var(--color-danger)]">{error}</span>
      ) : null}
    </div>
  );
}
