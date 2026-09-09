import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Déconnexion : révoque la session Better Auth puis redirige vers la connexion.
 * POST uniquement : un lien tiers ou un préchargement ne doivent pas déconnecter l'utilisateur.
 */
async function logout(req: NextRequest): Promise<Response> {
  const redirect = NextResponse.redirect(new URL("/auth/connexion", req.url), 303);
  try {
    const res = await auth.api.signOut({ headers: req.headers, asResponse: true });
    for (const cookie of res.headers.getSetCookie()) redirect.headers.append("set-cookie", cookie);
  } catch {
    // Pas de session valide : on redirige quand même.
  }
  return redirect;
}

export const POST = logout;
export function GET(): Response {
  return new Response(null, { status: 405, headers: { allow: "POST" } });
}
export const dynamic = "force-dynamic";
