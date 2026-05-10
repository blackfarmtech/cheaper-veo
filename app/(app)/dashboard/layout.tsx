import type { ReactNode } from "react";

import { VerifyEmailBanner } from "@/components/dashboard/VerifyEmailBanner";
import { requireUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const showVerifyBanner = user.id !== "guest" && !user.emailVerified;

  return (
    <main className="px-6 py-10 md:px-10">
      <div className="mx-auto w-full max-w-[1400px] fade-in">
        {showVerifyBanner ? <VerifyEmailBanner email={user.email} /> : null}
        {children}
      </div>
    </main>
  );
}
