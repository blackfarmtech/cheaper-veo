import type { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <div
        className="prose prose-invert max-w-none"
        style={{
          // Tight typography for legal pages
          // Tailwind's prose plugin isn't installed; using inline overrides.
          color: "var(--color-text-secondary)",
        }}
      >
        {children}
      </div>
    </article>
  );
}
