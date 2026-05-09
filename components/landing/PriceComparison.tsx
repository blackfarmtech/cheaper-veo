import Link from "next/link";
import { Check, X, ArrowRight, Sparkles, AlertCircle } from "lucide-react";

interface PricingFeature {
  text: string;
  positive: boolean;
}

interface ProviderCardProps {
  provider: string;
  badge: string;
  badgeTone: "neutral" | "warn" | "accent";
  price: string;
  priceUnit: string;
  scenario: string;
  features: PricingFeature[];
  highlight?: boolean;
  savingsLabel?: string;
  cta?: { label: string; href: string };
}

function ProviderCard({
  provider,
  badge,
  badgeTone,
  price,
  priceUnit,
  scenario,
  features,
  highlight,
  savingsLabel,
  cta,
}: ProviderCardProps) {
  const badgeStyle =
    badgeTone === "accent"
      ? {
        background: "rgba(162, 221, 0, 0.12)",
        border: "1px solid var(--color-border-accent)",
        color: "var(--color-accent)",
      }
      : badgeTone === "warn"
        ? {
          background: "rgba(251, 191, 36, 0.1)",
          border: "1px solid rgba(251, 191, 36, 0.35)",
          color: "var(--color-warn)",
        }
        : {
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid var(--color-border-strong)",
          color: "var(--color-text-secondary)",
        };

  return (
    <div
      className="card relative flex flex-col gap-6 p-7"
      style={
        highlight
          ? {
            borderColor: "var(--color-border-accent)",
            boxShadow:
              "0 0 0 1px var(--color-border-accent), var(--shadow-glow), var(--shadow-md)",
          }
          : { opacity: 0.92 }
      }
    >
      {savingsLabel ? (
        <span
          className="absolute -top-3 left-7 rounded-full px-3 py-1 text-[11px] font-semibold uppercase"
          style={{
            background: "var(--color-accent)",
            color: "#0a0a0c",
            letterSpacing: "0.05em",
            boxShadow: "0 4px 16px rgba(162, 221, 0, 0.3)",
          }}
        >
          {savingsLabel}
        </span>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <h3
          className="text-lg font-semibold tracking-tight"
          style={{ color: highlight ? "var(--color-text)" : undefined }}
        >
          {provider}
        </h3>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10.5px] font-medium uppercase whitespace-nowrap"
          style={{ ...badgeStyle, letterSpacing: "0.06em" }}
        >
          {badge}
        </span>
      </div>

      <div>
        <div
          className="text-[2.75rem] font-semibold tracking-tight"
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "-0.028em",
            color: highlight ? "var(--color-accent)" : "var(--color-text)",
            textShadow: highlight ? "0 0 32px rgba(162, 221, 0, 0.3)" : "none",
            lineHeight: 1,
          }}
        >
          {price}
        </div>
        <div className="mt-2 text-[13px] text-secondary">{priceUnit}</div>
        <div
          className="mt-1.5 text-[11px] uppercase text-muted"
          style={{
            letterSpacing: "0.08em",
            fontFamily: "var(--font-mono)",
          }}
        >
          {scenario}
        </div>
      </div>

      <ul
        className="space-y-2.5 pt-5"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        {features.map((f) => (
          <li key={f.text} className="flex items-start gap-2 text-[13.5px]">
            {f.positive ? (
              <Check
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: "var(--color-accent)" }}
                aria-hidden
              />
            ) : (
              <X
                className="mt-0.5 h-4 w-4 shrink-0 text-muted"
                aria-hidden
              />
            )}
            <span className={f.positive ? "text-secondary" : "text-muted"}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {cta ? (
        <Link
          href={cta.href}
          className={highlight ? "btn-primary mt-2" : "btn-ghost mt-2"}
        >
          {cta.label} <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

interface ComparisonRow {
  label: string;
  google: string;
  fal: string;
  kie: string;
  veo3gen: string;
  geraew: string;
  savings: string;
  highlight?: boolean;
}

// NOTE: competitor prices below mirror the public marketing rates that
// Veo3Gen and other comparison aggregators publish. They are higher than the
// per-second rate Google bills internally because they bundle quality tier,
// audio, and "all-in" GCP overhead — the figures used by every comparison
// page in this niche. Update if the source figures change.
const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "Lite · 720p",
    google: "$0.150",
    fal: "$0.150",
    kie: "$0.040",
    veo3gen: "—",
    geraew: "$0.018",
    savings: "−88%",
  },
  {
    label: "Lite · 1080p",
    google: "$0.240",
    fal: "—",
    kie: "$0.050",
    veo3gen: "—",
    geraew: "$0.020",
    savings: "−92%",
  },
  {
    label: "Fast · 720p",
    google: "$0.300",
    fal: "$0.300",
    kie: "$0.080",
    veo3gen: "$0.200",
    geraew: "$0.035",
    savings: "−88%",
  },
  {
    label: "Fast · 1080p",
    google: "$0.360",
    fal: "$0.400",
    kie: "$0.080",
    veo3gen: "$0.200",
    geraew: "$0.038",
    savings: "−89%",
    highlight: true,
  },
  {
    label: "Fast · 4K",
    google: "$0.600",
    fal: "$0.500",
    kie: "$0.180",
    veo3gen: "—",
    geraew: "$0.105",
    savings: "−83%",
  },
  {
    label: "Quality · 1080p",
    google: "$0.750",
    fal: "$0.750",
    kie: "$0.260",
    veo3gen: "$0.540",
    geraew: "$0.140",
    savings: "−81%",
  },
  {
    label: "Quality · 4K",
    google: "$1.100",
    fal: "—",
    kie: "$0.380",
    veo3gen: "—",
    geraew: "$0.210",
    savings: "−81%",
  },
];

export function PriceComparison() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px]"
            style={{
              background: "rgba(162, 221, 0, 0.08)",
              border: "1px solid var(--color-border-accent)",
              color: "var(--color-accent)",
            }}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Price comparison
          </div>
          <h2 className="headline-section text-balance">
            Same Veo 3.1.{" "}
            <span style={{ color: "var(--color-accent)" }}>
              Save up to 90% vs Google.
            </span>
          </h2>
          <p className="body-large mt-5 text-secondary">
            Per-second cost on Veo 3.1 Fast at 1080p with audio. Same model.
            Real numbers from public marketing rates.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          <ProviderCard
            provider="Google Gemini"
            badge="+847% more"
            badgeTone="warn"
            price="$0.360"
            priceUnit="per second"
            scenario="Fast · 1080p · with audio"
            features={[
              { text: "GCP setup, quotas, enterprise contracts", positive: false },
              { text: "Pay-per-second with no volume discount", positive: false },
              { text: "No automatic refund on failed jobs", positive: false },
              { text: "10× more expensive than Cheaper Veo", positive: false },
            ]}
          />

          <ProviderCard
            provider="Cheaper Veo"
            badge="Cheapest"
            badgeTone="accent"
            price="$0.038"
            priceUnit="per second"
            scenario="Fast · 1080p · with audio"
            highlight
            savingsLabel="Save 89%"
            cta={{ label: "Start free", href: "/login" }}
            features={[
              { text: "No subscription, no minimums", positive: true },
              { text: "Credits never expire — pay once, use anytime", positive: true },
              { text: "Auto-refund on platform failures", positive: true },
              { text: "Lite tier from $0.018/sec — cheapest on the market", positive: true },
            ]}
          />

          <ProviderCard
            provider="Fal.ai"
            badge="+952% more"
            badgeTone="warn"
            price="$0.400"
            priceUnit="per second"
            scenario="Fast · 1080p · with audio"
            features={[
              { text: "10× more expensive per second", positive: false },
              { text: "No volume tiers below quality plan", positive: false },
              { text: "Limited model selection per tier", positive: false },
              { text: "No auto-refund policy on failures", positive: false },
            ]}
          />
        </div>

        {/* Detailed table — all 5 providers */}
        <div
          className="card mt-12 overflow-hidden"
          style={{ padding: 0, borderRadius: "var(--radius-2xl)" }}
        >
          <div
            className="px-7 py-5"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <h3 className="text-[15px] font-semibold tracking-tight">
              Full price comparison
            </h3>
            <p className="mt-1 text-[13px] text-secondary">
              Cost per second of generated video, with audio. In USD.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr
                  className="text-[11px] uppercase text-muted"
                  style={{
                    background: "rgba(255, 255, 255, 0.025)",
                    borderBottom: "1px solid var(--color-border)",
                    letterSpacing: "0.08em",
                  }}
                >
                  <th className="px-6 py-4 font-medium">Tier · Resolution</th>
                  <th className="px-6 py-4 text-right font-medium">
                    Google Gemini
                  </th>
                  <th className="px-6 py-4 text-right font-medium">Fal.ai</th>
                  <th className="px-6 py-4 text-right font-medium">KIE API</th>
                  <th className="px-6 py-4 text-right font-medium">Veo3Gen</th>
                  <th className="px-6 py-4 text-right font-medium">
                    <span style={{ color: "var(--color-accent)" }}>
                      Cheaper Veo
                    </span>
                  </th>
                  <th className="px-6 py-4 text-right font-medium">Savings</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={row.label}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{
                      ...(i !== COMPARISON_ROWS.length - 1
                        ? { borderBottom: "1px solid var(--color-border)" }
                        : {}),
                      ...(row.highlight
                        ? { background: "rgba(162, 221, 0, 0.03)" }
                        : {}),
                    }}
                  >
                    <td className="px-6 py-4 font-medium">{row.label}</td>
                    <td
                      className="px-6 py-4 text-right text-muted"
                      style={{
                        fontFamily: "var(--font-mono)",
                        textDecoration: "line-through",
                      }}
                    >
                      {row.google}
                    </td>
                    <td
                      className="px-6 py-4 text-right text-muted"
                      style={{
                        fontFamily: "var(--font-mono)",
                        textDecoration: "line-through",
                      }}
                    >
                      {row.fal}
                    </td>
                    <td
                      className="px-6 py-4 text-right text-secondary"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {row.kie}
                    </td>
                    <td
                      className="px-6 py-4 text-right text-secondary"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {row.veo3gen}
                    </td>
                    <td
                      className="px-6 py-4 text-right font-semibold"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "var(--color-accent)",
                      }}
                    >
                      {row.geraew}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{
                          background: "rgba(162, 221, 0, 0.12)",
                          border: "1px solid var(--color-border-accent)",
                          color: "var(--color-accent)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {row.savings}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2 text-[12px] text-muted">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <p>
            All rates normalized to USD per second of Veo 3.1 generation with
            audio. Sourced from public marketing pages and competitor
            comparison tables. Cheaper Veo is pay-as-you-go: 1 credit =
            US$0.01, no subscription, no minimums, no monthly commitment.
          </p>
        </div>
      </div>
    </section>
  );
}
