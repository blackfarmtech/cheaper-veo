const faqs = [
  {
    q: "How does pay-as-you-go work?",
    a: "You add credits to your account whenever you want (from US$5 to US$500). Each generation deducts the fixed price for the chosen model. No subscription, no recurring charges, no monthly minimum.",
  },
  {
    q: "Do credits expire?",
    a: "No. Purchased credits stay available in your account indefinitely, until used or you request a refund per our policy.",
  },
  {
    q: "Is there a refund if the generation fails?",
    a: "Yes, automatic. Failures attributable to the platform (timeout, upstream error, unavailability) refund the credits charged. Failures from blocked prompts or invalid content follow our specific policy.",
  },
  {
    q: "Can I try it for free?",
    a: "Yes — new accounts get 50 bonus credits at signup ($0.50). Enough for ~10 Lite 720p test generations before any top-up.",
  },
  {
    q: "What formats does the API support?",
    a: "Text-to-video, image-to-video and frame-to-frame (first + last frame). Output is always MP4 H.264, with or without synchronized audio, in 720p, 1080p or 4K depending on the model.",
  },
  {
    q: "Is there a rate limit?",
    a: "Yes. Each API key has 100 generations/hour and 1,000 polls/hour. Limits align to UTC hour. High-volume accounts can request increases via support.",
  },
  {
    q: "How do I know when the video is ready?",
    a: "Polling at GET /api/v1/status/{taskId}. We recommend a 5–10s interval. Notification (push) webhooks are on the v2 roadmap — for now, polling is the way.",
  },
  {
    q: "How does auto-recharge work?",
    a: "Optional. You add a card (saved via Stripe) and configure: 'recharge when balance < X cr, buy pack of $Y'. When the balance drops, we charge automatically. You can disable it any time.",
  },
];

export function Faq() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="headline-section text-balance">
            Frequently asked questions
          </h2>
          <p className="body-large mt-5 text-secondary">
            Something not answered here? Get in touch via support.
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
