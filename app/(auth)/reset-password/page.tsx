import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Reset password — Cheaper Veo",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
