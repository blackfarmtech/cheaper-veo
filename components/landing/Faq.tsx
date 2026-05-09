const faqs = [
  {
    q: "Como funciona o pay-as-you-go?",
    a: "Você adiciona créditos à conta quando quiser (de US$5 a US$500). Cada geração desconta o valor fixo do modelo escolhido. Sem assinatura, sem cobrança recorrente, sem mínimo mensal.",
  },
  {
    q: "Os créditos expiram?",
    a: "Não. Créditos comprados ficam disponíveis na sua conta indefinidamente, até serem usados ou você solicitar reembolso conforme nossa política.",
  },
  {
    q: "Tem refund se a geração falhar?",
    a: "Sim, automático. Falhas atribuíveis à plataforma (timeout, erro do upstream, indisponibilidade) reembolsam os créditos cobrados. Falhas por prompt bloqueado ou conteúdo inválido seguem nossa política específica.",
  },
  {
    q: "Posso testar grátis?",
    a: "Sim — novas contas ganham 50 créditos de bônus no signup ($0.50). Suficiente pra ~10 gerações Lite 720p de teste antes de qualquer recarga.",
  },
  {
    q: "Quais formatos a API suporta?",
    a: "Text-to-video, image-to-video e frame-to-frame (primeiro + último frame). Saída sempre MP4 H.264, com ou sem áudio sincronizado, em 720p, 1080p ou 4K conforme o modelo.",
  },
  {
    q: "Tem rate limit?",
    a: "Sim. Cada API key tem 100 gerações/hora e 1.000 polls/hora. Limites alinhados à hora UTC. Contas em alto volume podem solicitar aumento via suporte.",
  },
  {
    q: "Como sei quando o vídeo ficou pronto?",
    a: "Polling em GET /api/v1/status/{taskId}. Recomendamos intervalo de 5–10s. Webhooks de notificação (push) estão no roadmap pra v2 — por enquanto, polling é o caminho.",
  },
  {
    q: "E auto-recarga, como funciona?",
    a: "Opcional. Você adiciona um cartão (saved via Stripe) e configura: 'recarregar quando saldo < X cr, comprar pack de $Y'. Quando o saldo cai, cobramos automático. Pode desativar quando quiser.",
  },
];

export function Faq() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="headline-section text-balance">
            Perguntas frequentes
          </h2>
          <p className="body-large mt-5 text-secondary">
            Algo não respondido aqui? Fale com a gente pelo suporte.
          </p>
        </div>

        <div className="mt-14 space-y-3">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="card group overflow-hidden p-0 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary
                className="flex cursor-pointer items-center justify-between gap-6 px-6 py-5 text-[15px] font-medium transition-colors hover:bg-white/[0.02]"
              >
                <span>{item.q}</span>
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm text-secondary transition-transform group-open:rotate-45"
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid var(--color-border-strong)",
                    fontFamily: "var(--font-mono)",
                  }}
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <div
                className="px-6 py-5 text-sm leading-relaxed text-secondary"
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
