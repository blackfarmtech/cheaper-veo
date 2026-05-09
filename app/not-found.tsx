import Link from "next/link";
import { Home, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-20">
      <div
        className="landing-glow-pulse pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: "rgba(162, 221, 0, 0.10)" }}
        aria-hidden
      />
      <div className="grid-bg radial-fade pointer-events-none absolute inset-0 -z-10" aria-hidden />

      <div className="fade-up max-w-xl text-center">
        <p
          className="text-[11px] uppercase text-muted"
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.12em",
          }}
        >
          404
        </p>
        <h1
          className="mt-3 text-5xl font-semibold tracking-tight md:text-6xl"
          style={{ letterSpacing: "-0.028em", lineHeight: 1.05 }}
        >
          Página não encontrada
        </h1>
        <p className="body-large mt-5 text-secondary">
          O endereço que você acessou não existe ou foi movido. Provavelmente
          o conteúdo nem chegou a ser gerado pelo Veo.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn-primary">
            <Home className="h-4 w-4" />
            Voltar pra home
          </Link>
          <Link href="/docs" className="btn-ghost">
            <BookOpen className="h-4 w-4" />
            Ler a documentação
          </Link>
        </div>
      </div>
    </main>
  );
}
