import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "./_layout";

export interface AutoRechargeFailedEmailProps {
  reason: string;
  billingUrl: string;
}

export function AutoRechargeFailedEmail({
  reason,
  billingUrl,
}: AutoRechargeFailedEmailProps) {
  return (
    <EmailLayout preview="Action required — auto-recharge failed">
      <Heading className="m-0 mb-4 text-[24px] font-semibold tracking-tight text-white">
        Auto-recharge couldn&apos;t go through
      </Heading>
      <Text className="m-0 mb-4 text-[15px] leading-[24px] text-[#bbb]">
        We tried to top up your credits automatically, but your card was
        declined. Auto-recharge has been turned off so we don&apos;t loop.
      </Text>

      <Section
        className="mb-6 rounded-lg p-4"
        style={{
          background: "rgba(248, 113, 113, 0.08)",
          border: "1px solid rgba(248, 113, 113, 0.4)",
        }}
      >
        <Text className="m-0 text-[13px] leading-[20px] text-[#fca5a5]">
          Stripe reported: <strong>{reason}</strong>
        </Text>
      </Section>

      <Text className="m-0 mb-6 text-[15px] leading-[24px] text-[#bbb]">
        Update your payment method or top up manually to keep generating.
      </Text>

      <Section className="mb-6">
        <Button
          href={billingUrl}
          className="rounded-md bg-[#a2dd00] px-5 py-3 text-[14px] font-semibold text-black"
        >
          Open billing
        </Button>
      </Section>
    </EmailLayout>
  );
}

AutoRechargeFailedEmail.PreviewProps = {
  reason: "card_declined",
  billingUrl: "https://cheaperveo.com/dashboard/billing",
} satisfies AutoRechargeFailedEmailProps;

export default AutoRechargeFailedEmail;
