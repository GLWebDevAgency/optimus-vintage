"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Client Better Auth (React). Même origine : pas de baseURL nécessaire, sauf si
 * NEXT_PUBLIC_APP_URL pointe ailleurs (preview, tunnel).
 */
const baseURL = process.env.NEXT_PUBLIC_APP_URL;

export const authClient = createAuthClient({
  ...(baseURL ? { baseURL } : {}),
});

export const { signIn, signUp, signOut, useSession } = authClient;

/** Messages d'erreur en français pour les codes Better Auth les plus courants. */
export function authErrorMessage(code: string | undefined, fallback?: string): string {
  switch (code) {
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Un compte existe déjà avec cette adresse.";
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_PASSWORD":
      return "E-mail ou mot de passe incorrect.";
    case "INVALID_EMAIL":
      return "Adresse e-mail invalide.";
    case "PASSWORD_TOO_SHORT":
      return "Mot de passe trop court (8 caractères minimum).";
    case "PASSWORD_TOO_LONG":
      return "Mot de passe trop long.";
    case "EMAIL_NOT_VERIFIED":
      return "Adresse e-mail non vérifiée.";
    case "USER_NOT_FOUND":
      return "Aucun compte avec cette adresse.";
    default:
      return fallback ?? "Quelque chose a lâché. Réessaie dans un instant.";
  }
}
