import Link from "next/link";

export const metadata = {
  title: "Termos de uso · Cheaper Veo",
  description: "Termos de uso do serviço Cheaper Veo.",
};

const UPDATED = "2026-05-09";

export default function TermosPage() {
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
        Termos de uso
      </h1>
      <p className="mt-3 text-[13px] text-muted">
        Última atualização: {UPDATED}
      </p>

      <Section title="1. Aceitação dos termos">
        Ao criar uma conta ou usar a API do Cheaper Veo, você concorda
        integralmente com estes Termos. Se não concordar, não use o serviço.
      </Section>

      <Section title="2. Descrição do serviço">
        O Cheaper Veo é um provedor de API HTTP para geração de vídeos via Google
        Veo 3.1. O serviço é pay-as-you-go: 1 crédito = US$0,01. Cada geração
        debita créditos pré-pagos.
      </Section>

      <Section title="3. Conta e segurança">
        <p>
          Você é responsável pela segurança das suas API keys. O Cheaper Veo não
          armazena cartões em texto plano — todo cartão é gerenciado pela
          Stripe (PCI DSS Level 1).
        </p>
        <p className="mt-3">
          Você concorda em não compartilhar chaves, não tentar contornar
          rate limits, e não usar a plataforma para gerar conteúdo proibido —
          ver{" "}
          <Link href="/legal/conteudo" className="legal-link">
            Política de Conteúdo
          </Link>
          .
        </p>
      </Section>

      <Section title="4. Pagamentos e créditos">
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            Recargas são pagamento único via Stripe. Créditos não expiram.
          </li>
          <li>
            Auto-recarga (opcional): cobramos seu cartão quando saldo cai abaixo
            do limite que você configurar. Você pode desativar a qualquer
            momento.
          </li>
          <li>
            Falhas atribuíveis à plataforma (timeout, erro upstream do Veo)
            reembolsam os créditos automaticamente.
          </li>
          <li>
            Falhas por prompt bloqueado, conteúdo inválido ou content policy{" "}
            <strong style={{ color: "var(--color-text)" }}>não</strong> são
            reembolsadas automaticamente.
          </li>
          <li>
            Reembolso de créditos não utilizados está disponível em até 30 dias
            mediante solicitação por email para{" "}
            <a
              href="mailto:contato@cheapervideo.com"
              className="legal-link"
            >
              contato@cheapervideo.com
            </a>
            .
          </li>
        </ul>
      </Section>

      <Section title="5. Propriedade dos vídeos gerados">
        Os vídeos gerados são de propriedade integral do usuário, sujeitos aos
        Termos do Google Vertex AI Veo. O Cheaper Veo não retém direitos sobre o
        conteúdo gerado, mas pode reter logs anonimizados para fins
        operacionais (debug, billing, abuse detection).
      </Section>

      <Section title="6. Uso proibido">
        É proibido usar o serviço para:
        <ul className="mt-3 list-disc space-y-1.5 pl-6">
          <li>Gerar deepfakes de pessoas reais sem consentimento.</li>
          <li>
            Conteúdo sexual envolvendo menores (CSAM) — denúncia automática às
            autoridades competentes.
          </li>
          <li>
            Personificação maliciosa, fraude, golpes, desinformação política.
          </li>
          <li>Material que viole direitos autorais ou marcas registradas.</li>
          <li>
            Spam, mineração massiva via API sem autorização explícita, ou
            qualquer atividade que viole as{" "}
            <a
              href="https://policies.google.com/terms/generative-ai/use-policy"
              target="_blank"
              rel="noreferrer noopener"
              className="legal-link"
            >
              políticas de IA Generativa do Google
            </a>
            .
          </li>
        </ul>
      </Section>

      <Section title="7. Suspensão e encerramento">
        Podemos suspender ou encerrar contas que violem estes Termos, sem aviso
        prévio em casos de uso abusivo, fraude ou ordem judicial. Em caso de
        encerramento por nossa parte (sem violação por sua parte), créditos
        não utilizados são reembolsados em até 14 dias.
      </Section>

      <Section title="8. Limitação de responsabilidade">
        O Cheaper Veo é fornecido &quot;as-is&quot;. Não nos responsabilizamos
        por danos indiretos, perda de receita, ou consequências do uso do
        serviço. Nossa responsabilidade total fica limitada ao valor pago nos
        últimos 12 meses.
      </Section>

      <Section title="9. Alterações nos termos">
        Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas
        por email com 30 dias de antecedência. O uso continuado após a entrada
        em vigor implica aceitação.
      </Section>

      <Section title="10. Lei aplicável">
        Estes Termos são regidos pelas leis brasileiras. Foro: comarca de São
        Paulo/SP, com renúncia a qualquer outro.
      </Section>

      <Section title="11. Contato">
        Dúvidas?{" "}
        <a href="mailto:contato@cheapervideo.com" className="legal-link">
          contato@cheapervideo.com
        </a>
        .
      </Section>

      <hr
        className="my-12"
        style={{ border: "none", borderTop: "1px solid var(--color-border)" }}
      />
      <p className="text-[12px] text-muted">
        Este é um modelo padrão. Recomendamos revisão jurídica antes do go-live
        público em produção. Veja também{" "}
        <Link href="/legal/privacidade" className="legal-link">
          Política de Privacidade
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
