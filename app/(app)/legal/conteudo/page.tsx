import Link from "next/link";

export const metadata = {
  title: "Política de conteúdo · Cheaper Veo",
  description:
    "Regras sobre o tipo de conteúdo que pode ser gerado via Cheaper Veo.",
};

const UPDATED = "2026-05-09";

export default function ConteudoPage() {
  return (
    <>
      <p
        className="mb-3 text-[11px] uppercase text-muted"
        style={{
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.12em",
        }}
      >
        Legal
      </p>
      <h1
        className="text-[2.5rem] font-semibold tracking-tight"
        style={{ letterSpacing: "-0.028em", lineHeight: 1.1, color: "var(--color-text)" }}
      >
        Política de conteúdo
      </h1>
      <p className="mt-3 text-[13px] text-muted">
        Última atualização: {UPDATED}
      </p>

      <div
        className="mt-8 p-5"
        style={{
          border: "1px solid rgba(251, 191, 36, 0.4)",
          background: "rgba(251, 191, 36, 0.06)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <p className="text-[14px]" style={{ color: "var(--color-warn)" }}>
          <strong>TL;DR:</strong> nossa API é uma camada sobre o Google Veo 3.1.
          Tudo que viola as políticas do Google viola as nossas. Adicionalmente,
          aplicamos regras próprias contra deepfakes, fraude e abuso.
        </p>
      </div>

      <Section title="1. Conteúdo proibido (zero tolerância)">
        Geramos um log + bloqueamos a conta imediatamente em casos de:
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--color-text)" }}>
              CSAM (material sexual envolvendo menores)
            </strong>{" "}
            — denúncia automática às autoridades competentes (NCMEC nos EUA,
            Polícia Federal no Brasil).
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>
              Deepfakes não-consensuais
            </strong>{" "}
            de pessoas reais (políticos, celebridades, conhecidos pessoais).
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>
              Personificação maliciosa
            </strong>{" "}
            destinada a fraude, golpes financeiros, doxxing.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Apologia</strong> a
            violência terrorista, suicídio, automutilação ou exploração humana.
          </li>
          <li>
            Conteúdo sexual explícito não consensual ou material de violência
            extrema/gore.
          </li>
        </ul>
      </Section>

      <Section title="2. Restrito (precisa contexto/autorização)">
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--color-text)" }}>
              Marcas registradas e personagens com copyright
            </strong>
            : ok pra uso editorial/educacional, parody, fair use. Comercial
            exige autorização do dono dos direitos.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>
              Pessoas reais
            </strong>
            : retratá-las requer consentimento (ou contexto editorial óbvio
            como notícia, biografia).
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>
              Conteúdo político
            </strong>
            : ok pra criação de conteúdo opinativo claramente marcado, mas
            proibido pra desinformação eleitoral.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>NSFW</strong>: o Veo
            3.1 do Google bloqueia automaticamente. Não tente contornar.
          </li>
        </ul>
      </Section>

      <Section title="3. Como decidimos">
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--color-text)" }}>Filtro upstream:</strong>{" "}
            o Google Veo já bloqueia muita coisa. Quando bloqueia, retornamos
            erro <code className="docs-inline-code">CONTENT_POLICY</code> e{" "}
            <strong style={{ color: "var(--color-text)" }}>
              não reembolsamos créditos
            </strong>{" "}
            (responsabilidade do prompt é sua).
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Detecção própria:</strong>{" "}
            monitoramos prompts por padrões abusivos (alta frequência de
            termos sensíveis em pouco tempo, etc).
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Denúncias:</strong>{" "}
            qualquer pessoa pode denunciar via{" "}
            <a
              href="mailto:abuse@cheapervideo.com"
              className="legal-link"
            >
              abuse@cheapervideo.com
            </a>{" "}
            (resposta em até 24h).
          </li>
        </ul>
      </Section>

      <Section title="4. Consequências">
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--color-text)" }}>Aviso:</strong>{" "}
            primeira violação leve (ex: prompt com termo sensível ambíguo) →
            email de aviso.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Suspensão:</strong>{" "}
            violação grave repetida → conta congelada por 7 dias, créditos
            preservados.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Banimento:</strong>{" "}
            CSAM, deepfakes não-consensuais, fraude → conta encerrada
            imediatamente, denúncia às autoridades, créditos não reembolsados.
          </li>
        </ul>
      </Section>

      <Section title="5. Direito de recurso">
        Acha que sua conta foi suspensa por engano? Email pra{" "}
        <a href="mailto:contato@cheapervideo.com" className="legal-link">
          contato@cheapervideo.com
        </a>{" "}
        com a transação ID e contexto. Revisão humana em até 72h.
      </Section>

      <hr
        className="my-12"
        style={{ border: "none", borderTop: "1px solid var(--color-border)" }}
      />
      <p className="text-[12px] text-muted">
        Veja também{" "}
        <Link href="/legal/termos" className="legal-link">
          Termos de uso
        </Link>{" "}
        e{" "}
        <Link href="/legal/privacidade" className="legal-link">
          Política de Privacidade
        </Link>
        . Política upstream do Google:{" "}
        <a
          href="https://policies.google.com/terms/generative-ai/use-policy"
          target="_blank"
          rel="noreferrer noopener"
          className="legal-link"
        >
          Generative AI Use Policy
        </a>
        .
      </p>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2
        className="text-[1.25rem] font-semibold tracking-tight"
        style={{ color: "var(--color-text)", letterSpacing: "-0.018em" }}
      >
        {title}
      </h2>
      <div className="mt-3 text-[14.5px] leading-relaxed">{children}</div>
    </section>
  );
}
