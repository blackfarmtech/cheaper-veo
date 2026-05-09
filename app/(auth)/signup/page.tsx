import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Criar conta — Cheaper Veo",
  description: "Crie sua conta Cheaper Veo e comece a gerar vídeos com Veo 3.1 em minutos.",
};

export default async function SignupPage() {
  const session = await getSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <Suspense fallback={null}>
      <SignupForm googleEnabled={googleEnabled} />
    </Suspense>
  );
}
