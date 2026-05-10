import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Models", href: "#models" },
      { label: "Pricing", href: "#pricing" },
      { label: "Documentation", href: "/docs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Status", href: "/status" },
      { label: "Contact", href: "mailto:contato@cheaperveo.com" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of use", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Content policy", href: "/legal/content" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      style={{ borderTop: "1px solid var(--color-border)" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <span className="text-base font-semibold tracking-tight">
                Cheaper Veo
              </span>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--color-accent)" }}
                aria-hidden
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-secondary">
              Pay-as-you-go API for video generation with Veo 3.1.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4
                className="text-[11px] font-semibold uppercase text-muted"
                style={{ letterSpacing: "0.08em" }}
              >
                {col.title}
              </h4>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-secondary transition-colors hover:text-[var(--color-text)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-16 flex flex-col items-start justify-between gap-3 pt-8 text-xs text-muted md:flex-row md:items-center"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <span>© 2026 Cheaper Veo. All rights reserved.</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>
            Veo 3.1 · pay-as-you-go
          </span>
        </div>
      </div>
    </footer>
  );
}
