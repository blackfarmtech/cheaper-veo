import Link from "next/link";

import { getSession } from "@/lib/session";

const NAV_LINKS = [
  { href: "/#models", label: "Models" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
] as const;

export async function SiteHeader() {
  const session = await getSession();
  const isAuthenticated = Boolean(session?.user);

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "rgba(10, 10, 12, 0.72)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-[17px] font-semibold tracking-tight transition-opacity hover:opacity-80"
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: "var(--color-accent)",
              boxShadow: "0 0 8px rgba(162, 221, 0, 0.6)",
            }}
            aria-hidden="true"
          />
          Cheaper Veo
        </Link>

        <nav
          className="hidden items-center md:flex"
          aria-label="Main"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-[13px] text-secondary transition-all hover:bg-white/[0.05] hover:text-[var(--color-text)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="btn-primary"
              style={{ padding: "0.5rem 1.125rem", fontSize: "13px" }}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="btn-primary"
              style={{ padding: "0.5rem 1.125rem", fontSize: "13px" }}
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
