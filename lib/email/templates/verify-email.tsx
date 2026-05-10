import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "./_layout";

export interface VerifyEmailProps {
  verifyUrl: string;
}

export function VerifyEmail({ verifyUrl }: VerifyEmailProps) {
  return (
    <EmailLayout preview="Confirm your Cheaper Veo email">
      <Heading className="m-0 mb-4 text-[24px] font-semibold tracking-tight text-white">
        Confirm your email
      </Heading>
      <Text className="m-0 mb-6 text-[15px] leading-[24px] text-[#bbb]">
        Click the button below to verify your email and unlock video
        generation. This link expires in 1 hour.
      </Text>

      <Section className="mb-6">
        <Button
          href={verifyUrl}
          className="rounded-md bg-[#a2dd00] px-5 py-3 text-[14px] font-semibold text-black"
        >
          Verify my email
        </Button>
      </Section>

      <Text className="m-0 text-[13px] leading-[20px] text-[#888]">
        If the button doesn&apos;t work, paste this link into your browser:
        <br />
        <span className="text-[#bbb]">{verifyUrl}</span>
      </Text>

      <Text className="mt-6 text-[13px] leading-[20px] text-[#888]">
        Didn&apos;t create a Cheaper Veo account? You can ignore this email.
      </Text>
    </EmailLayout>
  );
}

VerifyEmail.PreviewProps = {
  verifyUrl: "https://cheaperveo.com/api/auth/verify-email?token=preview",
} satisfies VerifyEmailProps;

export default VerifyEmail;
