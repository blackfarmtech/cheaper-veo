import Link from "next/link";

const columns = [
  {
    title: "Produto",
    links: [
      { label: "Modelos", href: "#modelos" },
      { label: "Preços", href: "#precos" },
      { label: "Documentação", href: "/docs" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Status", href: "/status" },
      { label: "Contato", href: "mailto:contato@cheapervideo.com" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Termos de uso", href: "/legal/termos" },
      { label: "Privacidade", href: "/legal/privacidade" },
      { label: "Política de conteúdo", href: "/legal/conteudo" },
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
              API pay-as-you-go para geração de vídeo com Veo 3.1.
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
          <span>© 2026 Cheaper Veo. Todos os direitos reservados.</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>
            Veo 3.1 · pay-as-you-go
          </span>
        </div>
      </div>
    </footer>
  );
}
