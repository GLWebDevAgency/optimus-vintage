import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Proxy Next 16 (ex-« middleware ») : garde d'authentification légère basée sur la présence
 * du cookie de session Better Auth. La vérification réelle de la session se fait dans le layout /app.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const hasSession = getSessionCookie(request) !== null;

  if (pathname === "/app" || pathname.startsWith("/app/")) {
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/connexion";
      url.search = "";
      url.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Déjà connecté : les écrans de connexion/inscription renvoient vers l'app.
  if ((pathname === "/auth/connexion" || pathname === "/auth/inscription") && hasSession) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/auth/connexion", "/auth/inscription"],
};
