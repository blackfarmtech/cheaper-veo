import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in — Cheaper Veo",
  description: "Access your Cheaper Veo account to manage credits, API keys and generations.",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <Suspense fallback={null}>
      <LoginForm googleEnabled={googleEnabled} />
    </Suspense>
  );
}
