import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/** Toutes les routes Better Auth (/api/auth/*) — instance résolue paresseusement à la première requête. */
export const { GET, POST } = toNextJsHandler((request) => auth.handler(request));
export const dynamic = "force-dynamic";
