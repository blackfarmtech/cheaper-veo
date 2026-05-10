import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "./_layout";

export interface WelcomeEmailProps {
  name?: string | null;
  bonusCredits: number;
  dashboardUrl: string;
}

export function WelcomeEmail({
  name,
  bonusCredits,
  dashboardUrl,
}: WelcomeEmailProps) {
  const displayName = name?.trim() || "there";
  return (
    <EmailLayout preview={`Welcome to Cheaper Veo — ${bonusCredits} free credits inside`}>
      <Heading className="m-0 mb-4 text-[24px] font-semibold tracking-tight text-white">
        Welcome, {displayName}.
      </Heading>
      <Text className="m-0 mb-4 text-[15px] leading-[24px] text-[#bbb]">
        We dropped <strong className="text-white">{bonusCredits} free
        credits</strong> in your account so you can try Veo 3.1 right away —
        enough for a few Lite generations on us.
      </Text>
      <Text className="m-0 mb-6 text-[15px] leading-[24px] text-[#bbb]">
        Verify your email first to unlock generation, then head to the
        playground and ship your first clip.
      </Text>

      <Section className="mb-6">
        <Button
          href={dashboardUrl}
          className="rounded-md bg-[#a2dd00] px-5 py-3 text-[14px] font-semibold text-black"
        >
          Open the dashboard
        </Button>
      </Section>

      <Text className="m-0 text-[13px] leading-[20px] text-[#888]">
        Pricing is pay-as-you-go — no subscription, no monthly minimum. You
        only pay for what you generate.
      </Text>
    </EmailLayout>
  );
}

WelcomeEmail.PreviewProps = {
  name: "Alex",
  bonusCredits: 50,
  dashboardUrl: "https://cheaperveo.com/dashboard",
} satisfies WelcomeEmailProps;

export default WelcomeEmail;
