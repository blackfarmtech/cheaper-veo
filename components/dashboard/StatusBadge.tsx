import type { GenerationStatus } from "@prisma/client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: GenerationStatus;
  className?: string;
}

const STATUS_LABEL: Record<GenerationStatus, string> = {
  pending: "Em fila",
  processing: "Processando",
  succeeded: "Concluído",
  failed: "Falhou",
  refunded: "Reembolsado",
};

const STATUS_STYLES: Record<GenerationStatus, string> = {
  pending:
    "border-strong bg-white/[0.04] text-secondary [&>span]:bg-[rgba(243,240,237,0.5)]",
  processing:
    "border-strong bg-white/[0.04] text-secondary [&>span]:bg-[rgba(243,240,237,0.7)] [&>span]:animate-pulse",
  succeeded:
    "border-[rgba(162,221,0,0.4)] bg-[rgba(162,221,0,0.10)] text-[var(--color-accent)] [&>span]:bg-[var(--color-accent)] [&>span]:shadow-[0_0_8px_rgba(162,221,0,0.6)]",
  failed:
    "border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.10)] text-[var(--color-danger)] [&>span]:bg-[var(--color-danger)]",
  refunded:
    "border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.10)] text-[var(--color-warn)] [&>span]:bg-[var(--color-warn)]",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-tight",
        STATUS_STYLES[status],
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" />
      {STATUS_LABEL[status]}
    </span>
  );
}
