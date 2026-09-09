"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient, authErrorMessage } from "@/lib/auth-client";

/** Nouveau mot de passe depuis le lien reçu par e-mail (`?token=`) ; les autres sessions sont révoquées. */
export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || !token) return;
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    if (password.length < 8) {
      setError("8 caractères minimum.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await authClient.resetPassword({ newPassword: password, token });
    setPending(false);
    if (result.error) {
      setError(
        authErrorMessage(
          result.error.code,
          "Ce lien n'est plus valable : demande un nouveau lien depuis « Mot de passe oublié ».",
        ),
      );
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/auth/connexion"), 1500);
  }

  if (!token || params.get("error")) {
    return (
      <div className="auth-card">
        <p className="eyebrow">Lien invalide</p>
        <h1>
          Ce fil est <em>cassé</em>
        </h1>
        <p className="text-ink-2 text-[14.5px]">
          Le lien est incomplet ou a expiré (une heure). Demande-en un nouveau.
        </p>
        <Link href="/auth/mot-de-passe-oublie" className="big-btn">
          Nouveau lien
        </Link>
      </div>
    );
  }

  return (
    <form className="auth-card" onSubmit={onSubmit} noValidate>
      <div className="grid gap-1.5">
        <p className="eyebrow">Nouveau mot de passe</p>
        <h1>
          Un nouveau <em>fil</em>
        </h1>
        <p className="text-ink-2 text-[14.5px]">
          8 caractères minimum. Tes autres appareils seront déconnectés.
        </p>
      </div>
      {done ? (
        <div className="form-success" role="status">
          C'est fait. Tu peux te reconnecter.
        </div>
      ) : (
        <>
          {error ? (
            <div className="form-error" role="alert">
              {error}
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="reset-password">Nouveau mot de passe</label>
            <div className="in">
              <input
                id="reset-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={pending}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="reset-confirm">Confirme-le</label>
            <div className="in">
              <input
                id="reset-confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={pending}
              />
            </div>
          </div>
          <button type="submit" className="big-btn" disabled={pending} aria-busy={pending}>
            {pending ? "Un instant…" : "Enregistrer"}
          </button>
        </>
      )}
    </form>
  );
}
