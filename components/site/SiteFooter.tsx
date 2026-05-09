import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/termos", label: "Termos" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/status", label: "Status" },
  { href: "/docs", label: "Docs" },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ borderTop: "1px solid var(--color-border)" }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-[13px] text-secondary md:flex-row">
        <p>&copy; {year} Cheaper Veo. Todos os direitos reservados.</p>
        <nav aria-label="Rodapé">
          <ul className="flex flex-wrap items-center justify-center gap-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-full px-3 py-1.5 transition-all hover:bg-white/[0.04] hover:text-[var(--color-text)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
