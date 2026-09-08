import type { AppEnv } from "@/lib/env";
import { log, warnOnce } from "@/lib/log";

/** Port d'envoi d'e-mails transactionnels (vérification d'adresse, mot de passe oublié). */
export interface MailMessage {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}
export interface Mailer {
  readonly name: "resend" | "console";
  send(message: MailMessage): Promise<void>;
}

export class MailDeliveryError extends Error {
  override readonly name = "MailDeliveryError";
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const DEFAULT_FROM = "Chiné <bonjour@chine.app>";

/** Resend, via son API HTTP (aucun SDK) : https://resend.com/docs/api-reference/emails/send-email */
export class ResendMailer implements Mailer {
  readonly name = "resend" as const;
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(message: MailMessage): Promise<void> {
    const res = await this.fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new MailDeliveryError(res.status, body?.message ?? `Resend : HTTP ${res.status}`);
    }
  }
}

/** Hors production uniquement : affiche l'e-mail (et le lien) dans la console du serveur. */
export class ConsoleMailer implements Mailer {
  readonly name = "console" as const;
  async send(message: MailMessage): Promise<void> {
    log.info("e-mail (console)", { to: message.to, subject: message.subject });
    const link = /https?:\/\/\S+/.exec(message.text)?.[0];
    if (link) process.stdout.write(`\n[mail] ${message.subject}\n[mail] ${link}\n\n`);
  }
}

/**
 * Résout le mailer : Resend si `RESEND_API_KEY` est défini ; sinon la console hors production ;
 * sinon `undefined` (en production sans clé, la vérification d'e-mail est désactivée
 * explicitement — voir `auth.ts`).
 */
export function createMailer(env: AppEnv): Mailer | undefined {
  if (env.RESEND_API_KEY)
    return new ResendMailer(env.RESEND_API_KEY, env.MAIL_FROM ?? DEFAULT_FROM);
  if (!env.isProduction) return new ConsoleMailer();
  warnOnce(
    "mail:none",
    "Aucun mailer configuré (RESEND_API_KEY absent) : vérification d'e-mail et réinitialisation de mot de passe désactivées.",
  );
  return undefined;
}

/* ───────────── Gabarits (français) ───────────── */

const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout(title: string, intro: string, cta: string, url: string, outro: string) {
  const safeUrl = escapeHtml(url);
  return {
    text: `${title}\n\n${intro}\n\n${url}\n\n${outro}\n\n— Chiné`,
    html: `<!doctype html><html lang="fr"><body style="margin:0;padding:32px 16px;background:#f4efe6;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1c1917">
<div style="max-width:480px;margin:0 auto;background:#fffdf8;border:1px solid #e7dfd0;border-radius:12px;padding:28px">
<p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#a16207;margin:0 0 12px">Chiné</p>
<h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(title)}</h1>
<p style="font-size:15px;line-height:1.5;margin:0 0 20px">${escapeHtml(intro)}</p>
<p style="margin:0 0 20px"><a href="${safeUrl}" style="display:inline-block;background:#1c1917;color:#fffdf8;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600">${escapeHtml(cta)}</a></p>
<p style="font-size:13px;line-height:1.5;color:#57534e;margin:0 0 8px">${escapeHtml(outro)}</p>
<p style="font-size:12px;color:#78716c;word-break:break-all;margin:0">${safeUrl}</p>
</div></body></html>`,
  };
}

export function verificationEmail(to: string, url: string): MailMessage {
  const { text, html } = layout(
    "Confirme ton adresse e-mail",
    "Bienvenue dans Chiné. Confirme ton adresse pour sécuriser ton compte : ce lien est valable une heure.",
    "Confirmer mon adresse",
    url,
    "Si tu n'es pas à l'origine de cette inscription, ignore simplement ce message.",
  );
  return { to, subject: "Chiné — confirme ton adresse e-mail", text, html };
}

export function resetPasswordEmail(to: string, url: string): MailMessage {
  const { text, html } = layout(
    "Réinitialise ton mot de passe",
    "Tu as demandé un nouveau mot de passe. Ce lien est valable une heure et ne peut servir qu'une fois.",
    "Choisir un nouveau mot de passe",
    url,
    "Si tu n'as rien demandé, ton mot de passe actuel reste valide : ignore ce message.",
  );
  return { to, subject: "Chiné — réinitialisation du mot de passe", text, html };
}
