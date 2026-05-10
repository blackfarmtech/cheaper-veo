import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "./_layout";

export interface TopupSuccessEmailProps {
  credits: number;
  amountCents: number;
  currency: string;
  newBalance: number;
  isAutoRecharge?: boolean;
  dashboardUrl: string;
  receiptUrl?: string | null;
}

function formatAmount(amountCents: number, currency: string): string {
  const value = amountCents / 100;
  const code = currency.toUpperCase();
  const locale = code === "BRL" ? "pt-BR" : "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
}

export function TopupSuccessEmail({
  credits,
  amountCents,
  currency,
  newBalance,
  isAutoRecharge = false,
  dashboardUrl,
  receiptUrl,
}: TopupSuccessEmailProps) {
  const subject = isAutoRecharge ? "Auto-recharge complete" : "Payment received";
  const amount = formatAmount(amountCents, currency);
  return (
    <EmailLayout preview={`${subject} — ${credits.toLocaleString()} credits added`}>
      <Heading className="m-0 mb-4 text-[24px] font-semibold tracking-tight text-white">
        {subject}
      </Heading>
      <Text className="m-0 mb-6 text-[15px] leading-[24px] text-[#bbb]">
        We just added <strong className="text-white">{credits.toLocaleString()} credits</strong> to your account.
        {isAutoRecharge
          ? " Your balance dropped below the threshold you set, so we topped it up automatically."
          : " Thanks for the top-up."}
      </Text>

      <Section
        className="mb-6 rounded-lg p-5"
        style={{ background: "#0a0a0a", border: "1px solid #222" }}
      >
        <Text className="m-0 mb-2 text-[13px] uppercase tracking-wide text-[#888]">
          Receipt
        </Text>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 0", color: "#888", fontSize: 14 }}>Credits</td>
              <td style={{ padding: "4px 0", color: "#fff", fontSize: 14, textAlign: "right" }}>
                +{credits.toLocaleString()}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0", color: "#888", fontSize: 14 }}>Amount</td>
              <td style={{ padding: "4px 0", color: "#fff", fontSize: 14, textAlign: "right" }}>
                {amount}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0", color: "#888", fontSize: 14 }}>New balance</td>
              <td style={{ padding: "4px 0", color: "#a2dd00", fontSize: 14, textAlign: "right", fontWeight: 600 }}>
                {newBalance.toLocaleString()} cr
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section className="mb-6">
        <Button
          href={dashboardUrl}
          className="rounded-md bg-[#a2dd00] px-5 py-3 text-[14px] font-semibold text-black"
        >
          Go to playground
        </Button>
      </Section>

      {receiptUrl ? (
        <Text className="m-0 text-[13px] leading-[20px] text-[#888]">
          Need a Stripe receipt? <a href={receiptUrl} style={{ color: "#bbb" }}>View it here</a>.
        </Text>
      ) : null}
    </EmailLayout>
  );
}

TopupSuccessEmail.PreviewProps = {
  credits: 1000,
  amountCents: 50_00,
  currency: "brl",
  newBalance: 1050,
  isAutoRecharge: false,
  dashboardUrl: "https://cheaperveo.com/dashboard",
  receiptUrl: null,
} satisfies TopupSuccessEmailProps;

export default TopupSuccessEmail;
