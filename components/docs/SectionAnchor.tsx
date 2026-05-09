import type { ReactNode } from "react";

interface SectionAnchorProps {
  id: string;
  children: ReactNode;
}

export function SectionAnchor({ id, children }: SectionAnchorProps) {
  return (
    <h2
      id={id}
      className="group mt-20 mb-5 scroll-mt-24 text-[1.875rem] font-semibold tracking-tight first:mt-0"
      style={{ letterSpacing: "-0.024em" }}
    >
      <a
        href={`#${id}`}
        className="inline-flex items-baseline gap-2 text-[var(--color-text)] no-underline"
      >
        <span>{children}</span>
        <span
          aria-hidden
          className="opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            color: "var(--color-accent)",
            fontFamily: "var(--font-mono)",
          }}
        >
          #
        </span>
      </a>
    </h2>
  );
}
