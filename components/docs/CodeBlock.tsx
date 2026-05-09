import type { ReactNode } from "react";

interface CodeBlockProps {
  children: ReactNode;
  language?: string;
}

export function CodeBlock({ children, language }: CodeBlockProps) {
  return (
    <div
      className="my-5 overflow-hidden"
      style={{
        background: "rgba(0, 0, 0, 0.4)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {language ? (
        <div
          className="flex items-center justify-between px-5 py-2.5 text-[11px] uppercase text-muted"
          style={{
            borderBottom: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.02)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.08em",
          }}
        >
          <span>{language}</span>
        </div>
      ) : null}
      <pre
        className="overflow-x-auto px-5 py-4 text-[13px] leading-relaxed text-secondary"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <code>{children}</code>
      </pre>
    </div>
  );
}
