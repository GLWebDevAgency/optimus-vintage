# ADR 0008 — Authentification et adresse IP de confiance

**Statut** : accepté · **Date** : 2026-09-09

Better Auth (e-mail + mot de passe, sessions en base, cookies `HttpOnly`/`SameSite=Lax`/`Secure` dès que l'origine est HTTPS) avec adaptateur Drizzle. Mot de passe oublié et vérification d'adresse reposent sur un service d'e-mail (Resend) obligatoire en production, sauf dérogation explicite (`CHINE_ALLOW_NO_MAILER`).

Derrière Railway (et éventuellement Cloudflare), `X-Forwarded-For` contient plusieurs sauts dont les premiers sont fournis par le client. Le proxy Next résout **une fois** l'adresse du client — `cf-connecting-ip` si présent, sinon le dernier saut — et la transmet par un en-tête interne (`x-chine-client-ip`) que Better Auth et les limites de débit publiques lisent. Aucune route ne lit `X-Forwarded-For` directement. La déconnexion est un POST qui efface les données locales de l'appareil.
