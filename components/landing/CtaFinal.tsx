import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaFinal() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div
          className="card landing-shimmer relative overflow-hidden p-12 text-center md:p-20"
          style={{
            background:
              "radial-gradient(ellipse 90% 100% at 50% 0%, rgba(162, 221, 0, 0.14), transparent 70%), var(--color-card)",
            borderColor: "var(--color-border-accent)",
            borderRadius: "var(--radius-3xl)",
            boxShadow: "var(--shadow-lg), 0 0 60px rgba(162, 221, 0, 0.08)",
          }}
        >
          <div
            className="landing-glow-pulse pointer-events-none absolute -top-24 left-1/2 -z-0 h-56 w-56 -translate-x-1/2 rounded-full blur-[80px]"
            style={{ background: "rgba(162, 221, 0, 0.4)" }}
            aria-hidden
          />

          <h2 className="headline-section relative text-balance">
            Comece em menos de 2 minutos.
          </h2>
          <p className="body-large relative mt-5 text-secondary">
            Crie sua conta, gere uma API key e dispare a primeira chamada.
          </p>

          <div className="relative mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className="btn-primary">
              Criar conta grátis <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/docs" className="btn-ghost">
              Ler a documentação
            </Link>
          </div>

          <p className="relative mt-7 text-xs text-muted">
            Sem cartão de crédito até a primeira recarga.
          </p>
        </div>
      </div>
    </section>
  );
}
