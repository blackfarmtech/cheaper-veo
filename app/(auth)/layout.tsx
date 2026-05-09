import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Ambient glow */}
      <div
        className="landing-glow-pulse pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: "rgba(162, 221, 0, 0.12)" }}
        aria-hidden
      />
      <div className="grid-bg radial-fade pointer-events-none absolute inset-0" aria-hidden />

      <div className="fade-up relative w-full max-w-md">{children}</div>
    </main>
  );
}
