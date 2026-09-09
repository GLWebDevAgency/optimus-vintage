import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-card min-h-[380px]" aria-busy="true" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
