import Link from "next/link";

export const metadata = {
  title: "Content policy · Cheaper Veo",
  description:
    "Rules about the type of content that may be generated via Cheaper Veo.",
};

const UPDATED = "2026-05-09";

export default function ContentPage() {
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
        Content policy
      </h1>
      <p className="mt-3 text-[13px] text-muted">
        Last updated: {UPDATED}
      </p>

      <div
        className="mt-8 p-5"
        style={{
          border: "1px solid rgba(251, 191, 36, 0.4)",
          background: "rgba(251, 191, 36, 0.06)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <p className="text-[14px]" style={{ color: "var(--color-warn)" }}>
          <strong>TL;DR:</strong> our API is a layer over Google Veo 3.1.
          Anything that violates Google&apos;s policies violates ours. Additionally,
          we apply our own rules against deepfakes, fraud and abuse.
        </p>
      </div>

      <Section title="1. Prohibited content (zero tolerance)">
        We log + block the account immediately in cases of:
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--color-text)" }}>
              CSAM (sexual material involving minors)
            </strong>{" "}
            — automatically reported to the competent authorities (NCMEC in the US,
            Federal Police in Brazil).
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>
              Non-consensual deepfakes
            </strong>{" "}
            of real people (politicians, celebrities, personal acquaintances).
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>
              Malicious impersonation
            </strong>{" "}
            intended for fraud, financial scams, doxxing.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Glorification</strong> of
            terrorist violence, suicide, self-harm or human exploitation.
          </li>
          <li>
            Non-consensual sexually explicit content or material of extreme
            violence/gore.
          </li>
        </ul>
      </Section>

      <Section title="2. Restricted (requires context/authorization)">
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--color-text)" }}>
              Trademarks and copyrighted characters
            </strong>
            : ok for editorial/educational use, parody, fair use. Commercial
            use requires authorization from the rights holder.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>
              Real people
            </strong>
            : depicting them requires consent (or obvious editorial context
            such as news, biography).
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>
              Political content
            </strong>
            : ok for clearly labeled opinion content, but
            prohibited for electoral disinformation.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>NSFW</strong>: Google&apos;s
            Veo 3.1 blocks this automatically. Do not try to bypass.
          </li>
        </ul>
      </Section>

      <Section title="3. How we decide">
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--color-text)" }}>Upstream filter:</strong>{" "}
            Google Veo already blocks a lot. When it blocks, we return
            a <code className="docs-inline-code">CONTENT_POLICY</code> error and{" "}
            <strong style={{ color: "var(--color-text)" }}>
              do not refund credits
            </strong>{" "}
            (responsibility for the prompt is yours).
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Our own detection:</strong>{" "}
            we monitor prompts for abusive patterns (high frequency of
            sensitive terms over a short period, etc).
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Reports:</strong>{" "}
            anyone can report via{" "}
            <a
              href="mailto:abuse@cheaperveo.com"
              className="legal-link"
            >
              abuse@cheaperveo.com
            </a>{" "}
            (response within 24h).
          </li>
        </ul>
      </Section>

      <Section title="4. Consequences">
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--color-text)" }}>Warning:</strong>{" "}
            first minor violation (e.g. prompt with an ambiguous sensitive term) →
            warning email.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Suspension:</strong>{" "}
            repeated serious violation → account frozen for 7 days, credits
            preserved.
          </li>
          <li>
            <strong style={{ color: "var(--color-text)" }}>Ban:</strong>{" "}
            CSAM, non-consensual deepfakes, fraud → account closed
            immediately, reported to authorities, credits not refunded.
          </li>
        </ul>
      </Section>

      <Section title="5. Right to appeal">
        Think your account was suspended by mistake? Email{" "}
        <a href="mailto:contato@cheaperveo.com" className="legal-link">
          contato@cheaperveo.com
        </a>{" "}
        with the transaction ID and context. Human review within 72h.
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
        <Link href="/legal/privacy" className="legal-link">
          Privacy Policy
        </Link>
        . Google&apos;s upstream policy:{" "}
        <a
          href="https://policies.google.com/terms/generative-ai/use-policy"
          target="_blank"
          rel="noreferrer noopener"
          className="legal-link"
        >
          Generative AI Use Policy
        </a>
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
