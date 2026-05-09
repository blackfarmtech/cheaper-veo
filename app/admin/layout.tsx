import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar adminEmail={admin.email} />
      <main className="flex-1 px-8 py-10 md:pl-[280px]">
        <div className="mx-auto w-full max-w-[1400px] fade-in">{children}</div>
      </main>
    </div>
  );
}
