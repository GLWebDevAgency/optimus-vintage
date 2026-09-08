import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Proxy Next 16 (ex-« middleware »).
 * - Garde d'authentification légère sur `/app` (présence du cookie de session Better Auth) ;
 *   la vérification réelle de la session se fait dans le layout `/app` et dans les routes API.
 * - `X-Robots-Tag: noindex` sur `/app` et `/api` : rien de privé ne doit être indexé.
 */
const NOINDEX = "noindex, nofollow";

function withNoIndex(res: NextResponse): NextResponse {
  res.headers.set("X-Robots-Tag", NOINDEX);
  return res;
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return withNoIndex(NextResponse.next());
  }

  const hasSession = getSessionCookie(request) !== null;

  if (pathname === "/app" || pathname.startsWith("/app/")) {
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/connexion";
      url.search = "";
      url.searchParams.set("next", `${pathname}${search}`);
      return withNoIndex(NextResponse.redirect(url));
    }
    return withNoIndex(NextResponse.next());
  }

  // Déjà connecté : les écrans de connexion/inscription renvoient vers l'app.
  if ((pathname === "/auth/connexion" || pathname === "/auth/inscription") && hasSession) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*", "/auth/connexion", "/auth/inscription"],
};
