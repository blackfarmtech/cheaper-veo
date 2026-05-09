import type { ReactNode } from "react";

import { requireUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUser();

  return (
    <main className="px-6 py-10 md:px-10">
      <div className="mx-auto w-full max-w-[1400px] fade-in">{children}</div>
    </main>
  );
}
