import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create account — Cheaper Veo",
  description: "Create your Cheaper Veo account and start generating videos with Veo 3.1 in minutes.",
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
