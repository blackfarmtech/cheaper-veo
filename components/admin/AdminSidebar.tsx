"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Film,
  ArrowLeft,
  Shield,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Generations", href: "/admin/generations", icon: Film },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminSidebar({ adminEmail }: { adminEmail: string }) {
  const pathname = usePathname();

  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col"
      style={{
        background: "rgba(15, 16, 18, 0.85)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderRight: "1px solid var(--color-border)",
      }}
    >
      <div className="px-6 pt-6 pb-5">
        <Link
          href="/admin"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <Shield
            className="h-4 w-4"
            style={{ color: "var(--color-accent)" }}
            aria-hidden
          />
          <span className="text-[15px] font-semibold tracking-tight">
            Admin
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold uppercase"
            style={{
              background: "rgba(162, 221, 0, 0.12)",
              color: "var(--color-accent)",
              letterSpacing: "0.06em",
            }}
          >
            internal
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 px-3.5 py-2.5 text-[14px] transition-all",
                    active
                      ? "text-[var(--color-text)]"
                      : "text-secondary hover:text-[var(--color-text)]",
                  )}
                  style={{
                    borderRadius: "var(--radius-md)",
                    background: active ? "rgba(162, 221, 0, 0.08)" : "transparent",
                  }}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-y-1.5 left-0 w-[3px] rounded-r-full transition-opacity",
                      active ? "opacity-100" : "opacity-0",
                    )}
                    style={{
                      background: "var(--color-accent)",
                      boxShadow: active ? "0 0 8px rgba(162, 221, 0, 0.6)" : "none",
                    }}
                  />
                  <Icon
                    className={cn(
                      "h-[17px] w-[17px] shrink-0 transition-colors",
                      active && "text-[var(--color-accent)]",
                    )}
                  />
                  <span className="font-medium tracking-tight">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        className="px-3 py-3"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <div
          className="px-3 py-2 text-[11px] text-muted truncate"
          title={adminEmail}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {adminEmail}
        </div>
        <Link
          href="/dashboard"
          className="flex w-full items-center gap-3 px-3.5 py-2.5 text-[13px] text-secondary transition-all hover:bg-white/[0.04] hover:text-[var(--color-text)]"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <ArrowLeft className="h-[15px] w-[15px]" />
          <span className="font-medium tracking-tight">Back to app</span>
        </Link>
      </div>
    </aside>
  );
}
