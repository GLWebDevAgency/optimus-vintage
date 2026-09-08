import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="auth-card min-h-[380px]" aria-busy="true" />}>
      <AuthForm mode="connexion" />
    </Suspense>
  );
}
