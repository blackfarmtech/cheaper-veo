import Link from "next/link";
import { Wallet, Plus } from "lucide-react";

import { formatCredits, formatUsd } from "@/lib/utils";

interface TopbarProps {
  email: string;
  balance: number;
}

export function DashboardTopbar({ email, balance }: TopbarProps) {
  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: "rgba(10, 10, 12, 0.72)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div className="flex h-16 items-center justify-between gap-4 px-6 pl-16 md:pl-6">
        <div
          className="inline-flex items-center gap-3 px-4 py-2"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--color-border-strong)",
            borderRadius: "var(--radius-pill)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Wallet
            className="h-4 w-4"
            style={{ color: "var(--color-accent)" }}
            aria-hidden
          />
          <div className="flex items-baseline gap-2">
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {formatCredits(balance)}
            </span>
            <span
              className="text-xs text-muted"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              cr
            </span>
            <span
              className="hidden text-xs text-muted sm:inline"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              · {formatUsd(balance)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden truncate text-sm text-secondary md:inline-block max-w-[220px]">
            {email}
          </span>
          <Link
            href="/dashboard/billing"
            className="btn-primary"
            style={{ padding: "0.5rem 1.125rem", fontSize: "13px" }}
          >
            <Plus className="h-4 w-4" />
            Recarregar
          </Link>
        </div>
      </div>
    </header>
  );
}
