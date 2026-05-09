"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth-client";

interface SignupFormProps {
  googleEnabled: boolean;
}

export function SignupForm({ googleEnabled }: SignupFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL") ?? "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Informe um email válido.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        email: trimmedEmail,
        password,
        name: trimmedName || trimmedEmail.split("@")[0],
        callbackURL,
      });
      if (signUpError) {
        const code = signUpError.code ?? "";
        if (code.includes("USER_ALREADY_EXISTS") || /exist/i.test(signUpError.message ?? "")) {
          setError("Este email já tem conta. Tente entrar.");
        } else {
          setError(signUpError.message ?? "Não foi possível criar a conta.");
        }
        return;
      }
      router.push(callbackURL);
      router.refresh();
    } catch {
      setError("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
    } catch {
      setError("Não foi possível iniciar login com Google.");
      setGoogleLoading(false);
    }
  }

  const loginHref = `/login${searchParams.get("callbackURL") ? `?callbackURL=${encodeURIComponent(callbackURL)}` : ""}`;

  return (
    <div className="card p-9" style={{ borderRadius: "var(--radius-2xl)" }}>
      <div className="mb-8 text-center">
        <div className="mb-5 inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: "var(--color-accent)",
              boxShadow: "0 0 8px rgba(162, 221, 0, 0.6)",
            }}
            aria-hidden="true"
          />
          Cheaper Veo
        </div>
        <h1
          className="text-[1.75rem] font-semibold tracking-tight"
          style={{ letterSpacing: "-0.024em" }}
        >
          Criar conta
        </h1>
        <p className="mt-2 text-[14px] text-secondary">
          Comece em menos de 2 minutos. Sem cartão de crédito.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-[13px] font-medium"
          >
            Nome <span className="text-muted">(opcional)</span>
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Seu nome"
            disabled={loading}
            className="input-apple"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-[13px] font-medium"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@empresa.com"
            disabled={loading}
            className="input-apple"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-[13px] font-medium"
          >
            Senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 8 caracteres"
            disabled={loading}
            className="input-apple"
          />
          <p className="mt-1.5 text-xs text-muted">
            Use no mínimo 8 caracteres.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Criando conta…" : "Criar conta grátis"}
        </button>
      </form>

      {error ? (
        <p
          role="alert"
          className="fade-in mt-4 px-3.5 py-2.5 text-sm"
          style={{
            border: "1px solid rgba(248, 113, 113, 0.4)",
            background: "rgba(248, 113, 113, 0.08)",
            color: "var(--color-danger)",
            borderRadius: "var(--radius-md)",
          }}
        >
          {error}
        </p>
      ) : null}

      {googleEnabled ? (
        <>
          <div className="my-7 flex items-center gap-3">
            <span
              className="h-px flex-1"
              style={{ background: "var(--color-border)" }}
            />
            <span
              className="text-[11px] uppercase text-muted"
              style={{ letterSpacing: "0.08em" }}
            >
              ou
            </span>
            <span
              className="h-px flex-1"
              style={{ background: "var(--color-border)" }}
            />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="btn-ghost w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {googleLoading ? "Redirecionando…" : "Continuar com Google"}
          </button>
        </>
      ) : null}

      <p className="mt-7 text-center text-[14px] text-secondary">
        Já tem conta?{" "}
        <Link
          href={loginHref}
          className="font-medium text-[var(--color-text)] underline decoration-[rgba(162,221,0,0.5)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--color-accent)]"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
