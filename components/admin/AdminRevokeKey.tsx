"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";

import { adminRevokeApiKeyAction } from "@/app/admin/users/[userId]/_actions";

interface Props {
  keyId: string;
  userId: string;
  keyName: string;
}

export function AdminRevokeKey({ keyId, userId, keyName }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleRevoke() {
    if (!confirm(`Revoke API key "${keyName}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await adminRevokeApiKeyAction({ keyId, userId });
    });
  }

  return (
    <button
      type="button"
      onClick={handleRevoke}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] text-secondary transition-all hover:text-[var(--color-danger)] disabled:opacity-50"
      style={{ border: "1px solid var(--color-border-strong)" }}
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Trash2 className="h-3 w-3" />
      )}
      Revoke
    </button>
  );
}
