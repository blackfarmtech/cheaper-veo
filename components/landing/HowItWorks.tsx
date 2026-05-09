const steps = [
  {
    number: "01",
    title: "Crie sua API key",
    body: "Faça signup, abra o dashboard e gere uma chave veo_•••. As chaves são prefixadas e podem ser revogadas a qualquer momento.",
    code: `# Sua chave fica visível uma única vez
veo_live_8f3c2a9d4b6e1f0a7c5b9d2e8f4a3c6b`,
  },
  {
    number: "02",
    title: "Chame /api/v1/generate",
    body: "Envie o prompt, modelo, resolução e duração. A resposta vem com um taskId imediato — a geração roda assíncrona.",
    code: `POST /api/v1/generate
Authorization: Bearer veo_live_••••

{ "model": "veo3-fast",
  "prompt": "...",
  "resolution": "1080p",
  "audio": true,
  "duration": 8 }`,
  },
  {
    number: "03",
    title: "Polling em /api/v1/status/{taskId}",
    body: "Consulte o status até receber done com a URL do MP4. Ou registre um webhook para evitar polling.",
    code: `GET /api/v1/status/tsk_a8f2c1
{ "status": "done",
  "videoUrl": "https://cdn.geraew.com/...mp4",
  "creditsCharged": 30 }`,
  },
];

export function HowItWorks() {
  return (
    <section
      className="relative py-24 md:py-32"
      style={{
        background:
          "linear-gradient(180deg, transparent 0%, rgba(15, 16, 18, 0.6) 50%, transparent 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="headline-section text-balance">
            Da chave ao MP4 em três chamadas
          </h2>
          <p className="body-large mt-5 text-secondary">
            Sem SDK obrigatório. Funciona em qualquer linguagem que faça HTTP.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="card card-hoverable flex flex-col gap-5 p-7"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(162, 221, 0, 0.2), rgba(162, 221, 0, 0.05))",
                    border: "1px solid var(--color-border-accent)",
                    color: "var(--color-accent)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {step.number}
                </span>
                <span
                  className="h-px flex-1"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--color-border-strong), transparent)",
                  }}
                />
              </div>
              <h3 className="headline-card">{step.title}</h3>
              <p className="text-sm leading-relaxed text-secondary">
                {step.body}
              </p>
              <pre
                className="mt-auto overflow-x-auto p-4 text-[11.5px] leading-relaxed text-secondary"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <code>{step.code}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
