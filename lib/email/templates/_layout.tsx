import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

interface EmailLayoutProps {
  preview: string;
  children: ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-[#0a0a0a] py-10 font-sans">
          <Container className="mx-auto max-w-[560px] rounded-2xl bg-[#111] p-10">
            <Section className="mb-8">
              <Text className="m-0 text-[15px] font-semibold tracking-tight text-white">
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: 9999,
                    background: "#a2dd00",
                    marginRight: 8,
                    verticalAlign: "middle",
                  }}
                />
                Cheaper Veo
              </Text>
            </Section>

            {children}

            <Hr className="my-8 border-[#222]" />
            <Text className="m-0 text-[12px] leading-[18px] text-[#888]">
              You&apos;re receiving this because you have a Cheaper Veo
              account. Questions? Reply to this email — a human reads every
              one.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
