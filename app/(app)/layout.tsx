import type { ReactNode } from "react";

import { getSession } from "@/lib/session";
import { getBalance } from "@/lib/credits";
import { Navbar } from "@/components/landing/Navbar";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  const user = session?.user;
  const isAuthenticated = Boolean(user);
  const balance = user ? await getBalance(user.id) : null;

  return (
    <>
      <Navbar
        isAuthenticated={isAuthenticated}
        email={user?.email ?? null}
        balance={balance}
      />
      {children}
    </>
  );
}
