import type { NextRequest } from "next/server";
import { auth, type Session } from "@/lib/auth";
import { fail, unauthorized } from "@/lib/api/respond";

export interface AuthContext<P = Record<string, never>> {
  readonly userId: string;
  readonly session: Session;
  /** Paramètres dynamiques de la route (Next 16 : `params` est une promesse, déjà résolue ici). */
  readonly params: P;
}

type RouteContext<P> = { params: Promise<P> };
type AuthedHandler<P> = (req: NextRequest, ctx: AuthContext<P>) => Promise<Response> | Response;

/**
 * Enveloppe un route handler : lit la session Better Auth depuis les en-têtes,
 * refuse en 401 sinon, et convertit toute exception en réponse `{ error }`.
 *
 * @example
 * export const GET = withAuth(async (_req, { userId }) => ok({ userId }));
 */
export function withAuth<P = Record<string, never>>(handler: AuthedHandler<P>) {
  return async (req: NextRequest, ctx?: RouteContext<P>): Promise<Response> => {
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session) return fail(unauthorized());
      const params = ctx ? await ctx.params : ({} as P);
      return await handler(req, { userId: session.user.id, session, params });
    } catch (error) {
      return fail(error);
    }
  };
}
