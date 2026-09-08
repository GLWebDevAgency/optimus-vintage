import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/** Déconnexion : révoque la session Better Auth puis redirige vers la connexion (GET ou POST). */
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

export const GET = logout;
export const POST = logout;
export const dynamic = "force-dynamic";
