"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authErrorMessage, signIn, signUp } from "@/lib/auth-client";

type Mode = "connexion" | "inscription";

interface Field {
  name: "name" | "email" | "password";
  label: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  placeholder: string;
}

const FIELDS: Record<Mode, Field[]> = {
  inscription: [
    {
      name: "name",
      label: "Prénom ou pseudo",
      type: "text",
      autoComplete: "nickname",
      placeholder: "Léa",
    },
    {
      name: "email",
      label: "E-mail",
      type: "email",
      autoComplete: "email",
      placeholder: "lea@exemple.fr",
    },
    {
      name: "password",
      label: "Mot de passe",
      type: "password",
      autoComplete: "new-password",
      placeholder: "8 caractères minimum",
    },
  ],
  connexion: [
    {
      name: "email",
      label: "E-mail",
      type: "email",
      autoComplete: "email",
      placeholder: "lea@exemple.fr",
    },
    {
      name: "password",
      label: "Mot de passe",
      type: "password",
      autoComplete: "current-password",
      placeholder: "••••••••",
    },
  ],
};

/** Destination après connexion : `?next=/app/...` uniquement si c'est un chemin interne de l'app. */
function safeNext(raw: string | null): string {
  if (raw && /^\/app(\/|$)/.test(raw)) return raw;
  return "/app";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field["name"], string>>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const name = String(fd.get("name") ?? "").trim();

    const fe: typeof fieldErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fe.email = "Adresse e-mail invalide.";
    if (password.length < 8) fe.password = "8 caractères minimum.";
    if (mode === "inscription" && name.length < 1) fe.name = "Comment on t'appelle ?";
    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) return;

    setPending(true);
    setError(null);
    const next = safeNext(params.get("next"));
    const result =
      mode === "inscription"
        ? await signUp.email({ name, email, password, callbackURL: next })
        : await signIn.email({ email, password, callbackURL: next });

    if (result.error) {
      setError(authErrorMessage(result.error.code, result.error.message));
      setPending(false);
      return;
    }
    router.replace(next as "/app");
    router.refresh();
  }

  const isSignup = mode === "inscription";

  return (
    <form
      className="auth-card"
      onSubmit={onSubmit}
      noValidate
      aria-describedby={error ? "auth-error" : undefined}
    >
      <div className="grid gap-1.5">
        <p className="eyebrow">{isSignup ? "Nouveau compte" : "Bon retour"}</p>
        <h1>
          {isSignup ? (
            <>
              Ouvre ton <em>portant</em>
            </>
          ) : (
            <>
              Reprends la <em>chine</em>
            </>
          )}
        </h1>
        <p className="text-ink-2 text-[14.5px]">
          {isSignup
            ? "Gratuit jusqu'à 50 pièces en stock. Pas de carte bancaire."
            : "Ton stock, tes sources et ta marge t'attendent."}
        </p>
      </div>

      {error ? (
        <div id="auth-error" className="form-error" role="alert">
          {error}
        </div>
      ) : null}

      {FIELDS[mode].map((f) => {
        const err = fieldErrors[f.name];
        const id = `${mode}-${f.name}`;
        return (
          <div className="field" key={f.name}>
            <label htmlFor={id}>{f.label}</label>
            <div className="in" aria-invalid={err ? "true" : undefined}>
              <input
                id={id}
                name={f.name}
                type={f.type}
                autoComplete={f.autoComplete}
                placeholder={f.placeholder}
                required
                minLength={f.name === "password" ? 8 : undefined}
                autoCapitalize={f.name === "email" ? "none" : undefined}
                inputMode={f.name === "email" ? "email" : undefined}
                aria-describedby={err ? `${id}-err` : undefined}
                disabled={pending}
              />
            </div>
            {err ? (
              <span className="error" id={`${id}-err`}>
                {err}
              </span>
            ) : null}
          </div>
        );
      })}

      {!isSignup ? (
        <p className="-mt-2 text-right text-[13px]">
          <Link href="/auth/mot-de-passe-oublie" className="font-semibold text-ink-2">
            Mot de passe oublié ?
          </Link>
        </p>
      ) : null}

      <button type="submit" className="big-btn" disabled={pending} aria-busy={pending}>
        {pending ? "Un instant…" : isSignup ? "Créer mon compte et continuer" : "Continuer"}
      </button>

      <p className="text-center text-[14px] text-ink-2">
        {isSignup ? (
          <>
            Déjà un compte ?{" "}
            <Link href="/auth/connexion" className="font-semibold text-ink">
              Se connecter
            </Link>
          </>
        ) : (
          <>
            Pas encore de compte ?{" "}
            <Link href="/auth/inscription" className="font-semibold text-ink">
              Créer un compte
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
