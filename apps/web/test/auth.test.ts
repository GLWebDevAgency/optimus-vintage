import { asUserId } from "@chine/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type Auth, createAuth, workspaceNameFor } from "@/lib/auth";
import { parseEnv } from "@/lib/env";
import { ConsoleMailer } from "@/lib/mail";
import { createTestApp, type TestApp } from "./helpers/app";

describe("Better Auth (adaptateur Drizzle, hooks, limiteur)", () => {
  let app: TestApp;
  let auth: Auth;

  beforeAll(async () => {
    app = await createTestApp();
    auth = createAuth({
      deps: app.deps,
      env: parseEnv({ NODE_ENV: "test", BETTER_AUTH_URL: "http://localhost:3000" }),
      mailer: new ConsoleMailer(),
      nextCookies: false,
    });
  });
  afterAll(() => app.close());

  it("inscrit un utilisateur en base et crée son espace de travail immédiatement", async () => {
    const res = await auth.api.signUpEmail({
      body: { name: "Marine", email: "marine@chine.test", password: "motdepasse-solide" },
    });
    expect(res.user.email).toBe("marine@chine.test");
    const ws = await app.deps.workspaces.byOwner(asUserId(res.user.id));
    expect(ws?.name).toBe("Friperie de Marine");
    expect(ws?.plan).toBe("FREE");
    expect(ws?.currency).toBe("EUR");
  });

  it("propose un nom d'espace à partir du prénom", () => {
    expect(workspaceNameFor("  Léa ")).toBe("Friperie de Léa");
    expect(workspaceNameFor("")).toBeUndefined();
    expect(workspaceNameFor(null)).toBeUndefined();
  });

  it("ouvre une session par mot de passe et la retrouve par cookie", async () => {
    const signIn = await auth.api.signInEmail({
      body: { email: "marine@chine.test", password: "motdepasse-solide" },
      asResponse: true,
    });
    expect(signIn.status).toBe(200);
    const cookies = signIn.headers.getSetCookie();
    expect(cookies.some((c) => c.includes("SameSite=Lax"))).toBe(true);
    const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ");
    const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader }) });
    expect(session?.user.email).toBe("marine@chine.test");
  });

  it("refuse un mauvais mot de passe", async () => {
    const res = await auth.api.signInEmail({
      body: { email: "marine@chine.test", password: "mauvais-mot-de-passe" },
      asResponse: true,
    });
    expect(res.status).toBe(401);
  });

  it("limite les tentatives de connexion via le limiteur persistant (10 / 15 min par IP)", async () => {
    const attempt = () =>
      auth.handler(
        new Request("http://localhost:3000/api/auth/sign-in/email", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
            "x-forwarded-for": "203.0.113.7",
          },
          body: JSON.stringify({ email: "marine@chine.test", password: "faux" }),
        }),
      );
    let last = 0;
    for (let i = 0; i < 11; i++) last = (await attempt()).status;
    expect(last).toBe(429);
  });
});
