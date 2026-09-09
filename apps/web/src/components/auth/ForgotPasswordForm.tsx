"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * Demande de réinitialisation : même message quelle que soit l'adresse (pas d'énumération de comptes).
 * Le lien envoyé mène à `/auth/reinitialiser?token=…`.
 */
export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Adresse e-mail invalide.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: "/auth/reinitialiser",
    });
    setPending(false);
    if (result.error && result.error.status >= 500) {
      setError("L'e-mail n'a pas pu partir. Réessaie dans un instant.");
      return;
    }
    setSent(true);
  }

  return (
    <form className="auth-card" onSubmit={onSubmit} noValidate>
      <div className="grid gap-1.5">
        <p className="eyebrow">Mot de passe oublié</p>
        <h1>
          On recoud le <em>fil</em>
        </h1>
        <p className="text-ink-2 text-[14.5px]">
          Indique ton adresse : si un compte existe, tu reçois un lien valable une heure.
        </p>
      </div>
      {sent ? (
        <div className="form-success" role="status" data-testid="reset-sent">
          Si un compte existe pour cette adresse, l'e-mail est parti. Regarde aussi les
          indésirables.
        </div>
      ) : (
        <>
          {error ? (
            <div className="form-error" role="alert">
              {error}
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="forgot-email">E-mail</label>
            <div className="in">
              <input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="lea@exemple.fr"
                inputMode="email"
                autoCapitalize="none"
                required
                disabled={pending}
              />
            </div>
          </div>
          <button type="submit" className="big-btn" disabled={pending} aria-busy={pending}>
            {pending ? "Un instant…" : "Envoyer le lien"}
          </button>
        </>
      )}
      <p className="text-center text-[14px] text-ink-2">
        <Link href="/auth/connexion" className="font-semibold text-ink">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
