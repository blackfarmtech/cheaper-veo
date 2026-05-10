import type { Metadata } from "next";
import { Suspense } from "react";

import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Forgot password — Cheaper Veo",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
