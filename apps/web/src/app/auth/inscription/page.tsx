import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Inscription", robots: { index: false } };

export default function InscriptionPage() {
  return (
    <Suspense fallback={<div className="auth-card min-h-[460px]" aria-busy="true" />}>
      <AuthForm mode="inscription" />
    </Suspense>
  );
}
