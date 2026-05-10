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
    body: "No subscription, no card on file. Top up from US$5 to US$500 and debit per generation.",
  },
  {
    icon: InfinityIcon,
    title: "No usage minimum",
    body: "Generate one video a month or ten thousand. The per-generation price is the same.",
  },
  {
    icon: Wand2,
    title: "Text, image and frame-to-frame",
    body: "Support for text prompts, reference images and interpolation between first and last frame.",
  },
  {
    icon: Monitor,
    title: "720p, 1080p and 4K",
    body: "Pick resolution per request. 4K available on Fast and Quality.",
  },
  {
    icon: Volume2,
    title: "Generation with audio",
    body: "Synchronized score and foley enabled via a single flag. Available across all tiers.",
  },
  {
    icon: Webhook,
    title: "Webhook + polling",
    body: "Get the result via webhook or check task status whenever you prefer.",
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
            Built to integrate and forget
          </h2>
          <p className="body-large mt-5 text-secondary">
            Stable endpoints, clear semantics, no hidden magic.
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
