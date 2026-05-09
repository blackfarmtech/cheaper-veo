import {
  Coins,
  Infinity as InfinityIcon,
  Wand2,
  Monitor,
  Volume2,
  Webhook,
} from "lucide-react";

const features = [
  {
    icon: Coins,
    title: "Pay as you go",
    body: "Sem assinatura, sem cartão preso. Recarregue de US$5 a US$500 e debite por geração.",
  },
  {
    icon: InfinityIcon,
    title: "Sem mínimo de uso",
    body: "Gere um vídeo por mês ou dez mil. O preço por geração é o mesmo.",
  },
  {
    icon: Wand2,
    title: "Text, image e frame-to-frame",
    body: "Suporte a prompt textual, imagem de referência e interpolação entre primeiro e último frame.",
  },
  {
    icon: Monitor,
    title: "720p, 1080p e 4K",
    body: "Escolha resolução por requisição. 4K disponível em Fast e Quality.",
  },
  {
    icon: Volume2,
    title: "Geração com áudio",
    body: "Trilha e foley sincronizados ativados via flag única. Disponível em todos os tiers.",
  },
  {
    icon: Webhook,
    title: "Webhook + polling",
    body: "Receba o resultado por webhook ou consulte o status do task quando preferir.",
  },
];

export function Features() {
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
            Feito para integrar e esquecer
          </h2>
          <p className="body-large mt-5 text-secondary">
            Endpoints estáveis, semântica clara, sem mágica escondida.
          </p>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card card-hoverable p-7">
              <div
                className="mb-5 inline-flex h-11 w-11 items-center justify-center"
                style={{
                  borderRadius: "var(--radius-md)",
                  background:
                    "linear-gradient(135deg, rgba(162, 221, 0, 0.18), rgba(162, 221, 0, 0.04))",
                  border: "1px solid var(--color-border-accent)",
                  boxShadow: "0 0 16px rgba(162, 221, 0, 0.1)",
                }}
              >
                <f.icon
                  className="h-5 w-5"
                  style={{ color: "var(--color-accent)" }}
                />
              </div>
              <h3 className="headline-card text-[1.0625rem]">{f.title}</h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-secondary">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
