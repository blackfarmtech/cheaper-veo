"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  LayoutDashboard,
  PlayCircle,
  KeyRound,
  History,
  Wallet,
  BookText,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Playground", href: "/dashboard/playground", icon: PlayCircle },
  { label: "API Keys", href: "/dashboard/keys", icon: KeyRound },
  { label: "History", href: "/dashboard/history", icon: History },
  { label: "Billing", href: "/dashboard/billing", icon: Wallet },
  { label: "Documentation", href: "/docs", icon: BookText },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center text-secondary transition-colors hover:bg-white/[0.06] hover:text-[var(--color-text)] md:hidden"
        style={{
          background: "rgba(15, 16, 18, 0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid var(--color-border-strong)",
          borderRadius: "var(--radius-md)",
        }}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(8px)" }}
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col transition-transform md:w-[240px] md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
        style={{
          background: "rgba(15, 16, 18, 0.72)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderRight: "1px solid var(--color-border)",
          transitionTimingFunction: "var(--ease-spring)",
          transitionDuration: "0.3s",
        }}
      >
        <div className="flex items-center justify-between px-6 pb-5 pt-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
            onClick={() => setOpen(false)}
          >
            <span className="text-[17px] font-semibold tracking-tight">
              Cheaper Veo
            </span>
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--color-accent)" }}
              aria-hidden
            />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-white/[0.06] md:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group relative flex items-center gap-3 px-3.5 py-2.5 text-[14px] transition-all",
                      active
                        ? "text-[var(--color-text)]"
                        : "text-secondary hover:text-[var(--color-text)]",
                    )}
                    style={{
                      borderRadius: "var(--radius-md)",
                      background: active
                        ? "rgba(162, 221, 0, 0.08)"
                        : "transparent",
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
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isPending}
            className="flex w-full items-center gap-3 px-3.5 py-2.5 text-[14px] text-secondary transition-all hover:bg-white/[0.04] hover:text-[var(--color-text)] disabled:opacity-60"
            style={{ borderRadius: "var(--radius-md)" }}
          >
            <LogOut className="h-[17px] w-[17px]" />
            <span className="font-medium tracking-tight">
              {isPending ? "Signing out…" : "Sign out"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
