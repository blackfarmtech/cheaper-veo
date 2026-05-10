const steps = [
  {
    number: "01",
    title: "Create your API key",
    body: "Sign up, open the dashboard and generate a veo_••• key. Keys are prefixed and can be revoked at any time.",
    code: `# Your key is shown only once
veo_live_8f3c2a9d4b6e1f0a7c5b9d2e8f4a3c6b`,
  },
  {
    number: "02",
    title: "Call /api/v1/generate",
    body: "Send the prompt, model, resolution and duration. The response returns an immediate taskId — generation runs asynchronously.",
    code: `POST /api/v1/generate
Authorization: Bearer veo_live_••••

{ "kind": "text_to_video",
  "modelId": "veo3-fast",
  "prompt": "...",
  "resolution": "1080p",
  "aspectRatio": "16:9",
  "durationSeconds": 8,
  "audio": true }`,
  },
  {
    number: "03",
    title: "Poll /api/v1/status/{taskId}",
    body: "Check the status every 5s until you get succeeded with the MP4 URL.",
    code: `GET /api/v1/status/tsk_a8f2c1
{ "status": "succeeded",
  "videoUrl": "https://cheaperveo.com/videos/...mp4",
  "creditsCost": 30 }`,
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
            From key to MP4 in three calls
          </h2>
          <p className="body-large mt-5 text-secondary">
            No SDK required. Works in any language that can do HTTP.
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
