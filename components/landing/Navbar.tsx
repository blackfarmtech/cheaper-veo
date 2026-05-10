"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Wallet, LogOut } from "lucide-react";

import { cn, formatCredits } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";

interface NavLink {
  label: string;
  href: string;
  match?: (pathname: string) => boolean;
}

const BASE_LINKS: NavLink[] = [
  { label: "Home", href: "/", match: (p) => p === "/" },
  {
    label: "Generate",
    href: "/dashboard/playground",
    match: (p) => p.startsWith("/dashboard/playground"),
  },
  {
    label: "My Creations",
    href: "/dashboard/history",
    match: (p) => p.startsWith("/dashboard/history"),
  },
  {
    label: "API",
    href: "/dashboard/keys",
    match: (p) => p.startsWith("/dashboard/keys"),
  },
  { label: "Pricing", href: "/#pricing" },
  {
    label: "Docs",
    href: "/docs",
    match: (p) => p.startsWith("/docs"),
  },
];

const OVERVIEW_LINK: NavLink = {
  label: "Overview",
  href: "/dashboard",
  match: (p) => p === "/dashboard",
};

interface NavbarProps {
  isAuthenticated: boolean;
  email?: string | null;
  balance?: number | null;
}

export function Navbar({ isAuthenticated, email, balance }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const links = isAuthenticated
    ? [BASE_LINKS[0], OVERVIEW_LINK, ...BASE_LINKS.slice(1)]
    : BASE_LINKS;

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
      router.push("/");
      router.refresh();
    });
  }

  return (
    <header
      className="relative z-50 w-full"
      style={{
        background: "transparent",
        animation: "fade-in 0.6s var(--ease-spring) both",
      }}
    >
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between gap-6 px-6">
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="flex shrink-0 items-center transition-opacity hover:opacity-80"
          aria-label="Cheaper Veo"
        >
          <Image
            src="/logo-icon.png"
            alt="Cheaper Veo"
            width={442}
            height={442}
            priority
            className="h-10 w-10 md:hidden"
          />
          <Image
            src="/logo.png"
            alt="Cheaper Veo"
            width={1528}
            height={442}
            priority
            className="hidden h-14 w-auto md:block"
          />
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center md:flex"
          aria-label="Main"
        >
          {links.map((link) => {
            const active = link.match?.(pathname) ?? false;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 text-[13px] transition-all",
                  active
                    ? "text-[var(--color-text)]"
                    : "text-secondary hover:bg-white/[0.05] hover:text-[var(--color-text)]",
                )}
              >
                {link.label}
                {active ? (
                  <span
                    className="absolute -bottom-[15px] left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full"
                    style={{
                      background: "var(--color-accent)",
                      boxShadow: "0 0 8px rgba(162, 221, 0, 0.6)",
                    }}
                    aria-hidden
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {isAuthenticated ? (
            <>
              {typeof balance === "number" ? (
                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 transition-all hover:bg-white/[0.05]"
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--color-border-strong)",
                  }}
                  title={email ?? undefined}
                >
                  <Wallet
                    className="h-3.5 w-3.5"
                    style={{ color: "var(--color-accent)" }}
                    aria-hidden
                  />
                  <span
                    className="text-[12.5px] font-semibold"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {formatCredits(balance)}
                  </span>
                  <span
                    className="text-[11px] text-muted"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    cr
                  </span>
                </Link>
              ) : null}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isPending}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-all hover:bg-white/[0.06] hover:text-[var(--color-text)] disabled:opacity-60"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-3.5 py-1.5 text-[13px] text-secondary transition-all hover:bg-white/[0.05] hover:text-[var(--color-text)] sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="btn-primary"
                style={{ padding: "0.5rem 1.125rem", fontSize: "13px" }}
              >
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
