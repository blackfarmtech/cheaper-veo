import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  cta?: {
    label: string;
    href: string;
    variant?: "primary" | "ghost";
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-6 py-16 text-center",
        className,
      )}
      style={{
        border: "1px dashed var(--color-border-strong)",
        borderRadius: "var(--radius-xl)",
        background: "rgba(255, 255, 255, 0.015)",
      }}
    >
      {Icon ? (
        <div
          className="flex h-14 w-14 items-center justify-center text-secondary"
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <h3 className="text-[17px] font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-sm text-[14px] text-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {cta ? (
        <Link
          href={cta.href}
          className={cn(
            "mt-3",
            cta.variant === "ghost" ? "btn-ghost" : "btn-primary",
          )}
          style={{ fontSize: "13px", padding: "0.5rem 1.125rem" }}
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
