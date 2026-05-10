import type { ReactNode } from "react";

interface DocsSection {
  id: string;
  label: string;
}

const SECTIONS: DocsSection[] = [
  { id: "introduction", label: "Introduction" },
  { id: "quickstart", label: "Quickstart" },
  { id: "authentication", label: "Authentication" },
  { id: "video-generation", label: "Video generation" },
  { id: "image-to-video", label: "Image-to-video" },
  { id: "video-with-references", label: "Video with references" },
  { id: "status-polling", label: "Status polling" },
  { id: "account", label: "Account & balance" },
  { id: "models-and-pricing", label: "Models and pricing" },
  { id: "errors", label: "Errors" },
  { id: "best-practices", label: "Best practices" },
  { id: "limits", label: "Limits" },
];

export const metadata = {
  title: "Documentation — Cheaper Veo",
  description:
    "Cheaper Veo public API reference for generating videos with Veo 3.1 over HTTP.",
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-12 lg:flex-row lg:gap-16 lg:py-16">
      <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:w-64 lg:flex-shrink-0">
        {/* Mobile accordion */}
        <details className="card overflow-hidden lg:hidden" style={{ padding: 0 }}>
          <summary className="flex cursor-pointer items-center justify-between px-5 py-3.5 text-sm font-medium">
            <span>Contents</span>
            <span
              aria-hidden
              className="text-muted"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {"<>"}
            </span>
          </summary>
          <nav
            className="px-2 py-2"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <ul className="flex flex-col">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block rounded-md px-3.5 py-2 text-sm text-secondary transition-colors hover:bg-white/[0.04] hover:text-[var(--color-text)]"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </details>

        {/* Desktop sidebar */}
        <nav className="hidden lg:block">
          <p
            className="mb-4 text-[11px] uppercase text-muted"
            style={{
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.08em",
            }}
          >
            Contents
          </p>
          <ul
            className="flex flex-col gap-0.5"
            style={{ borderLeft: "1px solid var(--color-border)" }}
          >
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="-ml-px block px-4 py-2 text-[13.5px] text-secondary transition-all hover:text-[var(--color-text)]"
                  style={{
                    borderLeft: "1px solid transparent",
                  }}
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
