import Link from "next/link";

export const metadata = {
  title: "Privacy policy · Cheaper Veo",
  description: "How we collect, use and protect your data.",
};

const UPDATED = "2026-05-09";

export default function PrivacyPage() {
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
        Privacy policy
      </h1>
      <p className="mt-3 text-[13px] text-muted">
        Last updated: {UPDATED}
      </p>

      <Section title="1. Data we collect">
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--color-text)" }}>Account:</strong> email,
            name (optional), password (bcrypt hash — never in plain text).
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Payment:</strong>{" "}
            processed by Stripe. We only store the customer ID and
            payment method ID — your card number{" "}
            <strong style={{ color: "var(--color-text)" }}>never</strong> touches
            our servers.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>API usage:</strong>{" "}
            prompts, parameters (resolution, duration), task IDs, error logs.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>
              Generated videos:
            </strong>{" "}
            stored on a CDN (Supabase Storage) for up to 30 days. You can
            download and remove them via the API.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Technical:</strong>{" "}
            signup IP, user-agent, event timestamps. Collected for
            security and debugging.
          </li>
        </ul>
      </Section>

      <Section title="2. How we use it">
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>Operate the service (authenticate, debit credits, generate videos).</li>
          <li>Detect fraud and abuse.</li>
          <li>Improve the product (anonymized error logs).</li>
          <li>
            Send transactional emails (verification, payment receipts, auto-recharge
            failures). We do not send marketing without opt-in.
          </li>
        </ul>
      </Section>

      <Section title="3. Sharing with third parties">
        We share only what is strictly necessary:
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--color-text)" }}>Google Vertex AI:</strong>{" "}
            receives your prompts (and images, if you submit them) to process
            the generation. Subject to{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer noopener"
              className="legal-link"
            >
              Google&apos;s privacy policy
            </a>
            .
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Stripe:</strong>{" "}
            processes payments. Receives your email + amount. Subject to{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noreferrer noopener"
              className="legal-link"
            >
              Stripe&apos;s policy
            </a>
            .
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Supabase:</strong>{" "}
            hosts the database (encrypted at rest) and video storage.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Vercel:</strong>{" "}
            hosts the application. Request logs retained for up to 1 hour.
          </li>
        </ul>
        <p className="mt-3">
          <strong style={{ color: "var(--color-text)" }}>
            We do not sell your data.
          </strong>{" "}
          Ever.
        </p>
      </Section>

      <Section title="4. Retention">
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>Account: while active + 90 days after deletion (billing logs).</li>
          <li>
            Prompts and generation logs: 90 days for debugging, then removed
            automatically.
          </li>
          <li>Generated videos: 30 days on the CDN. You download and remove.</li>
          <li>
            Financial transactions: 5 years (Brazilian tax requirement).
          </li>
        </ul>
      </Section>

      <Section title="5. Your rights (LGPD/GDPR)">
        As a data subject, you have the right to:
        <ul className="mt-3 list-disc space-y-1.5 pl-6">
          <li>Confirm processing of your data.</li>
          <li>Access and correct it.</li>
          <li>
            Request account deletion. Email{" "}
            <a
              href="mailto:contato@cheaperveo.com"
              className="legal-link"
            >
              contato@cheaperveo.com
            </a>{" "}
            — we respond within 15 days.
          </li>
          <li>Portability (export your data as JSON).</li>
          <li>
            Withdraw consent (disables optional features such as
            auto-recharge).
          </li>
        </ul>
      </Section>

      <Section title="6. Cookies">
        We only use essential cookies (authentication session). We do not use
        third-party tracking cookies, Google Analytics, Facebook Pixel or
        similar.
      </Section>

      <Section title="7. Children">
        The service is not intended for users under 18. If we identify
        accounts belonging to minors, we close them immediately.
      </Section>

      <Section title="8. Changes">
        Material updates to this policy will be notified by email with
        30 days&apos; notice.
      </Section>

      <Section title="9. Contact (DPO)">
        <a href="mailto:contato@cheaperveo.com" className="legal-link">
          contato@cheaperveo.com
        </a>
      </Section>

      <hr
        className="my-12"
        style={{ border: "none", borderTop: "1px solid var(--color-border)" }}
      />
      <p className="text-[12px] text-muted">
        See also{" "}
        <Link href="/legal/terms" className="legal-link">
          Terms of use
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
