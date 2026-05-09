"use client";

import { useTransition } from "react";
import { Power, Unlock } from "lucide-react";

import {
  adminClearAutoRechargeLockAction,
  adminToggleAutoRechargeAction,
} from "@/app/admin/users/[userId]/_actions";

interface Props {
  userId: string;
  enabled: boolean;
  inProgress: boolean;
  hasError: boolean;
}

export function AutoRechargeAdminControls({
  userId,
  enabled,
  inProgress,
  hasError,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await adminToggleAutoRechargeAction({ userId, enabled: !enabled });
    });
  }

  function handleClearLock() {
    startTransition(async () => {
      await adminClearAutoRechargeLockAction(userId);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all hover:bg-white/[0.05] disabled:opacity-50"
        style={{
          border: "1px solid var(--color-border-strong)",
          color: enabled
            ? "var(--color-danger)"
            : "var(--color-text-secondary)",
        }}
      >
        <Power className="h-3.5 w-3.5" />
        {enabled ? "Desativar" : "Ativar"}
      </button>
      {(inProgress || hasError) && (
        <button
          type="button"
          onClick={handleClearLock}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all hover:bg-white/[0.05] disabled:opacity-50"
          style={{
            border: "1px solid var(--color-border-strong)",
            color: "var(--color-text-secondary)",
          }}
        >
          <Unlock className="h-3.5 w-3.5" />
          Limpar lock/erro
        </button>
      )}
    </div>
  );
}
