import Link from "next/link";

export const metadata = {
  title: "Política de privacidade · Cheaper Veo",
  description: "Como coletamos, usamos e protegemos seus dados.",
};

const UPDATED = "2026-05-09";

export default function PrivacidadePage() {
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
        Política de privacidade
      </h1>
      <p className="mt-3 text-[13px] text-muted">
        Última atualização: {UPDATED}
      </p>

      <Section title="1. Dados que coletamos">
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--color-text)" }}>Conta:</strong> email,
            nome (opcional), senha (hash bcrypt — nunca em texto plano).
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Pagamento:</strong>{" "}
            processado pela Stripe. Armazenamos apenas o customer ID e
            payment method ID — número do cartão{" "}
            <strong style={{ color: "var(--color-text)" }}>nunca</strong> passa
            pelos nossos servidores.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Uso da API:</strong>{" "}
            prompts, parâmetros (resolução, duração), task IDs, logs de erro.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>
              Vídeos gerados:
            </strong>{" "}
            armazenados em CDN (Supabase Storage) por até 30 dias. Você pode
            baixar e remover via API.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Técnicos:</strong>{" "}
            IP de signup, user-agent, timestamps de eventos. Coletados para
            segurança e debug.
          </li>
        </ul>
      </Section>

      <Section title="2. Como usamos">
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>Operar o serviço (autenticar, debitar créditos, gerar vídeos).</li>
          <li>Detectar fraude e abuso.</li>
          <li>Melhorar o produto (logs anonimizados de erro).</li>
          <li>
            Enviar emails transacionais (verificação, recibo de pagamento, falha
            de auto-recarga). Não enviamos marketing sem opt-in.
          </li>
        </ul>
      </Section>

      <Section title="3. Compartilhamento com terceiros">
        Compartilhamos apenas o estritamente necessário:
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--color-text)" }}>Google Vertex AI:</strong>{" "}
            recebe seus prompts (e imagens, se você enviar) pra processar a
            geração. Sujeito à{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer noopener"
              className="legal-link"
            >
              política de privacidade do Google
            </a>
            .
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Stripe:</strong>{" "}
            processa pagamentos. Recebe seu email + valor. Sujeito à{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noreferrer noopener"
              className="legal-link"
            >
              política da Stripe
            </a>
            .
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Supabase:</strong>{" "}
            hospeda o banco de dados (criptografado at-rest) e armazenamento de
            vídeos.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Vercel:</strong>{" "}
            hospeda a aplicação. Logs de request retidos por até 1 hora.
          </li>
        </ul>
        <p className="mt-3">
          <strong style={{ color: "var(--color-text)" }}>
            Não vendemos seus dados.
          </strong>{" "}
          Nunca.
        </p>
      </Section>

      <Section title="4. Retenção">
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>Conta: enquanto ativa + 90 dias após exclusão (logs de billing).</li>
          <li>
            Prompts e logs de geração: 90 dias para debug, depois removidos
            automaticamente.
          </li>
          <li>Vídeos gerados: 30 dias no CDN. Você baixa e remove.</li>
          <li>
            Transações financeiras: 5 anos (obrigação fiscal brasileira).
          </li>
        </ul>
      </Section>

      <Section title="5. Seus direitos (LGPD)">
        Como titular, você tem direito a:
        <ul className="mt-3 list-disc space-y-1.5 pl-6">
          <li>Confirmar o tratamento dos seus dados.</li>
          <li>Acessar e corrigir.</li>
          <li>
            Solicitar exclusão da conta. Email pra{" "}
            <a
              href="mailto:contato@cheapervideo.com"
              className="legal-link"
            >
              contato@cheapervideo.com
            </a>{" "}
            — atendemos em até 15 dias.
          </li>
          <li>Portabilidade (exportar seus dados em JSON).</li>
          <li>
            Revogar consentimento (desativa funcionalidades opcionais como
            auto-recarga).
          </li>
        </ul>
      </Section>

      <Section title="6. Cookies">
        Usamos apenas cookies essenciais (sessão de autenticação). Não usamos
        cookies de tracking de terceiros, Google Analytics, Facebook Pixel ou
        similares.
      </Section>

      <Section title="7. Crianças">
        O serviço não é destinado a menores de 18 anos. Se identificarmos
        contas de menores, encerramos imediatamente.
      </Section>

      <Section title="8. Alterações">
        Atualizações relevantes desta política serão notificadas por email com
        30 dias de antecedência.
      </Section>

      <Section title="9. Contato (DPO)">
        <a href="mailto:contato@cheapervideo.com" className="legal-link">
          contato@cheapervideo.com
        </a>
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
        <Link href="/legal/conteudo" className="legal-link">
          Política de Conteúdo
        </Link>
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
