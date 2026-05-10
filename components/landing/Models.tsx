import { MODELS, calculateCredits, type Resolution } from "@/lib/pricing";
import { formatUsdPrecise } from "@/lib/utils";

function minPriceCents(modelId: string, resolutions: Resolution[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (const res of resolutions) {
    try {
      const credits = calculateCredits({
        modelId,
        resolution: res,
        audio: false,
        durationSeconds: 8,
      });
      if (credits < min) min = credits;
    } catch {
      // unsupported resolution — ignore
    }
  }
  return min;
}

export function Models() {
  return (
    <section id="models" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="headline-section text-balance">
            Three models, one endpoint
          </h2>
          <p className="body-large mt-5 text-secondary">
            Choose between speed, cost or premium quality. Same API,
            same response format.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {MODELS.map((model) => {
            const isFast = model.tier === "fast";
            const minCents = minPriceCents(model.id, model.resolutions);
            return (
              <div
                key={model.id}
                className="card card-hoverable relative flex flex-col gap-6 p-7"
                style={
                  isFast
                    ? {
                        borderColor: "var(--color-border-accent)",
                        boxShadow:
                          "0 0 0 1px var(--color-border-accent), var(--shadow-glow)",
                      }
                    : undefined
                }
              >
                {isFast && (
                  <span
                    className="absolute -top-3 left-7 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
                    style={{
                      background: "var(--color-accent)",
                      color: "#0a0a0c",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Most chosen
                  </span>
                )}

                <div>
                  <h3 className="headline-card">{model.label}</h3>
                  <p className="mt-2 text-sm text-secondary">
                    {model.description}
                  </p>
                </div>

                <div
                  className="flex items-center gap-2 text-xs text-muted"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <span>{model.speedHint}</span>
                  <span aria-hidden>·</span>
                  <span>price per second</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {model.resolutions.map((res) => (
                    <span
                      key={res}
                      className="rounded-md px-2 py-1 text-xs text-secondary"
                      style={{
                        fontFamily: "var(--font-mono)",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      {res}
                    </span>
                  ))}
                </div>

                <div
                  className="mt-auto pt-5"
                  style={{ borderTop: "1px solid var(--color-border)" }}
                >
                  <div
                    className="text-[11px] uppercase text-muted"
                    style={{ letterSpacing: "0.08em" }}
                  >
                    Starting at
                  </div>
                  <div
                    className="mt-2 text-3xl font-semibold tracking-tight"
                    style={{ letterSpacing: "-0.022em" }}
                  >
                    {formatUsdPrecise(minCents / 8)}
                    <span className="ml-1.5 text-xs font-normal text-muted">
                      / sec
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
