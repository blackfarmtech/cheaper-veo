import {
  MODELS,
  TOPUPS,
  calculateCredits,
  type Resolution,
} from "@/lib/pricing";
import { brlCentsToUsd, getUsdBrlRate } from "@/lib/fx";
import { formatUsd, formatUsdPrecise, formatCredits } from "@/lib/utils";

interface Row {
  model: string;
  resolution: Resolution;
  withAudioCredits: number | null;
  withoutAudioCredits: number | null;
}

function buildRows(): Row[] {
  const rows: Row[] = [];
  for (const model of MODELS) {
    for (const res of model.resolutions) {
      let audio: number | null = null;
      let noAudio: number | null = null;
      try {
        audio = calculateCredits({
          modelId: model.id,
          resolution: res,
          audio: true,
          durationSeconds: 8,
        });
      } catch {
        audio = null;
      }
      try {
        noAudio = calculateCredits({
          modelId: model.id,
          resolution: res,
          audio: false,
          durationSeconds: 8,
        });
      } catch {
        noAudio = null;
      }
      rows.push({
        model: model.label,
        resolution: res,
        withAudioCredits: audio,
        withoutAudioCredits: noAudio,
      });
    }
  }
  return rows;
}

const FAST_1080P_AUDIO_CREDITS = 30;

function formatUsdAmount(value: number): string {
  return value >= 100
    ? `$${Math.round(value)}`
    : `$${value.toFixed(value < 10 ? 2 : 1)}`;
}

export async function Pricing() {
  const rows = buildRows();
  const fx = await getUsdBrlRate();

  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="headline-section text-balance">
            Fixed price per second. No surprises.
          </h2>
          <p className="body-large mt-5 text-secondary">
            1 credit = US$0.01. You&apos;re only charged when the generation starts.
            Platform failures are refunded automatically.
          </p>
        </div>

        <div
          className="card mt-16 overflow-hidden"
          style={{ borderRadius: "var(--radius-2xl)", padding: 0 }}
        >
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
                  <th className="px-6 py-4 font-medium">Model</th>
                  <th className="px-6 py-4 font-medium">Resolution</th>
                  <th className="px-6 py-4 text-right font-medium">
                    With audio
                  </th>
                  <th className="px-6 py-4 text-right font-medium">
                    Without audio
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={`${row.model}-${row.resolution}`}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={
                      i !== rows.length - 1
                        ? { borderBottom: "1px solid var(--color-border)" }
                        : undefined
                    }
                  >
                    <td className="px-6 py-5 font-medium">{row.model}</td>
                    <td
                      className="px-6 py-5 text-secondary"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {row.resolution}
                    </td>
                    <td className="px-6 py-5 text-right">
                      {row.withAudioCredits !== null ? (
                        <div className="flex flex-col items-end">
                          <span
                            className="font-semibold"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {formatUsdPrecise(row.withAudioCredits / 8)}
                            <span className="text-[11px] font-normal text-muted">
                              {" "}
                              /sec
                            </span>
                          </span>
                          <span
                            className="text-[11px] text-muted"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {row.withAudioCredits} cr / 8s
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      {row.withoutAudioCredits !== null ? (
                        <div className="flex flex-col items-end">
                          <span
                            className="font-semibold"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {formatUsdPrecise(row.withoutAudioCredits / 8)}
                            <span className="text-[11px] font-normal text-muted">
                              {" "}
                              /sec
                            </span>
                          </span>
                          <span
                            className="text-[11px] text-muted"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {row.withoutAudioCredits} cr / 8s
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-[2rem] font-semibold tracking-tight md:text-[2.25rem]" style={{ letterSpacing: "-0.024em" }}>
              Prepaid top-ups
            </h3>
            <p className="body-large mt-4 text-secondary">
              1:1 conversion — every US$1 becomes 100 credits. No expiration.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOPUPS.map((topup) => {
              const videos = Math.floor(topup.credits / FAST_1080P_AUDIO_CREDITS);
              const highlight = topup.highlight;
              const usdAmount = brlCentsToUsd(topup.amountCents, fx.rate);
              return (
                <div
                  key={topup.id}
                  className="card card-hoverable flex flex-col gap-3.5 p-6"
                  style={
                    highlight
                      ? {
                          borderColor: "var(--color-border-accent)",
                          boxShadow: "0 0 0 1px var(--color-border-accent), var(--shadow-glow)",
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span
                        className="text-3xl font-semibold tracking-tight"
                        style={{ letterSpacing: "-0.022em" }}
                      >
                        {formatUsdAmount(usdAmount)}
                      </span>
                      <span
                        className="mt-0.5 text-[11px] uppercase text-muted"
                        style={{
                          fontFamily: "var(--font-mono)",
                          letterSpacing: "0.08em",
                        }}
                      >
                        USD
                      </span>
                    </div>
                    {highlight && (
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase"
                        style={{
                          background: "var(--color-accent)",
                          color: "#0a0a0c",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-secondary">{topup.label}</div>
                  <div
                    className="pt-3 text-sm"
                    style={{
                      borderTop: "1px solid var(--color-border)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {formatCredits(topup.credits)} credits
                  </div>
                  <div
                    className="text-[11px] text-muted"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    ≈ {videos} Fast 1080p videos
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-center text-xs text-muted">
            Estimate based on Fast 1080p with audio (30 credits per video).
            USD prices use today&apos;s mid-market rate
            (1 USD ≈ R$ {fx.rate.toFixed(2)}). Final charge is shown in your
            local currency at checkout.
          </p>
        </div>
      </div>
    </section>
  );
}
