import Link from "next/link";

export const metadata = {
  title: "Terms of use · Cheaper Veo",
  description: "Terms of use for the Cheaper Veo service.",
};

const UPDATED = "2026-05-09";

export default function TermsPage() {
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
        Terms of use
      </h1>
      <p className="mt-3 text-[13px] text-muted">
        Last updated: {UPDATED}
      </p>

      <Section title="1. Acceptance of terms">
        By creating an account or using the Cheaper Veo API, you agree
        in full to these Terms. If you do not agree, do not use the service.
      </Section>

      <Section title="2. Service description">
        Cheaper Veo is an HTTP API provider for video generation via Google
        Veo 3.1. The service is pay-as-you-go: 1 credit = US$0.01. Each generation
        debits prepaid credits.
      </Section>

      <Section title="3. Account and security">
        <p>
          You are responsible for the security of your API keys. Cheaper Veo
          does not store cards in plain text — all cards are managed by
          Stripe (PCI DSS Level 1).
        </p>
        <p className="mt-3">
          You agree not to share keys, not to attempt to bypass rate limits,
          and not to use the platform to generate prohibited content —
          see{" "}
          <Link href="/legal/content" className="legal-link">
            Content Policy
          </Link>
          .
        </p>
      </Section>

      <Section title="4. Payments and credits">
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            Top-ups are one-time payments via Stripe. Credits do not expire.
          </li>
          <li>
            Auto-recharge (optional): we charge your card when the balance falls
            below the threshold you configure. You can disable it at any
            time.
          </li>
          <li>
            Failures attributable to the platform (timeout, Veo upstream error)
            refund credits automatically.
          </li>
          <li>
            Failures from blocked prompts, invalid content or content policy{" "}
            <strong style={{ color: "var(--color-text)" }}>are not</strong>
            {" "}refunded automatically.
          </li>
          <li>
            Refunds for unused credits are available within 30 days
            upon request via email to{" "}
            <a
              href="mailto:contato@cheaperveo.com"
              className="legal-link"
            >
              contato@cheaperveo.com
            </a>
            .
          </li>
        </ul>
      </Section>

      <Section title="5. Ownership of generated videos">
        Generated videos are the full property of the user, subject to the
        Google Vertex AI Veo Terms. Cheaper Veo retains no rights to
        generated content but may retain anonymized logs for
        operational purposes (debugging, billing, abuse detection).
      </Section>

      <Section title="6. Prohibited use">
        It is prohibited to use the service to:
        <ul className="mt-3 list-disc space-y-1.5 pl-6">
          <li>Generate deepfakes of real people without consent.</li>
          <li>
            Sexual content involving minors (CSAM) — automatically reported to
            the competent authorities.
          </li>
          <li>
            Malicious impersonation, fraud, scams, political disinformation.
          </li>
          <li>Material that violates copyrights or trademarks.</li>
          <li>
            Spam, mass mining via the API without explicit authorization, or
            any activity that violates{" "}
            <a
              href="https://policies.google.com/terms/generative-ai/use-policy"
              target="_blank"
              rel="noreferrer noopener"
              className="legal-link"
            >
              Google&apos;s Generative AI policies
            </a>
            .
          </li>
        </ul>
      </Section>

      <Section title="7. Suspension and termination">
        We may suspend or terminate accounts that violate these Terms, without
        prior notice in cases of abusive use, fraud or court order. In case of
        termination on our part (without your violation), unused credits
        are refunded within 14 days.
      </Section>

      <Section title="8. Limitation of liability">
        Cheaper Veo is provided &quot;as-is&quot;. We are not liable
        for indirect damages, loss of revenue, or consequences of using the
        service. Our total liability is limited to the amount paid in the
        last 12 months.
      </Section>

      <Section title="9. Changes to the terms">
        We may update these Terms. Material changes will be communicated
        by email with 30 days&apos; notice. Continued use after the effective
        date implies acceptance.
      </Section>

      <Section title="10. Governing law">
        These Terms are governed by Brazilian law. Venue: São Paulo/SP,
        with waiver of any other.
      </Section>

      <Section title="11. Contact">
        Questions?{" "}
        <a href="mailto:contato@cheaperveo.com" className="legal-link">
          contato@cheaperveo.com
        </a>
        .
      </Section>

      <hr
        className="my-12"
        style={{ border: "none", borderTop: "1px solid var(--color-border)" }}
      />
      <p className="text-[12px] text-muted">
        This is a standard template. We recommend a legal review before
        public production go-live. See also{" "}
        <Link href="/legal/privacy" className="legal-link">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/legal/content" className="legal-link">
          Content Policy
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
