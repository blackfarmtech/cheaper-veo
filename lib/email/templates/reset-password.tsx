import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "./_layout";

export interface ResetPasswordEmailProps {
  resetUrl: string;
}

export function ResetPasswordEmail({ resetUrl }: ResetPasswordEmailProps) {
  return (
    <EmailLayout preview="Reset your Cheaper Veo password">
      <Heading className="m-0 mb-4 text-[24px] font-semibold tracking-tight text-white">
        Reset your password
      </Heading>
      <Text className="m-0 mb-6 text-[15px] leading-[24px] text-[#bbb]">
        Click the button below to choose a new password. The link expires in
        1 hour. If you didn&apos;t ask for this, you can safely ignore the
        email — your password won&apos;t change.
      </Text>

      <Section className="mb-6">
        <Button
          href={resetUrl}
          className="rounded-md bg-[#a2dd00] px-5 py-3 text-[14px] font-semibold text-black"
        >
          Reset password
        </Button>
      </Section>

      <Text className="m-0 text-[13px] leading-[20px] text-[#888]">
        If the button doesn&apos;t work, paste this link into your browser:
        <br />
        <span className="text-[#bbb]">{resetUrl}</span>
      </Text>
    </EmailLayout>
  );
}

ResetPasswordEmail.PreviewProps = {
  resetUrl: "https://cheaperveo.com/reset-password?token=preview",
} satisfies ResetPasswordEmailProps;

export default ResetPasswordEmail;
