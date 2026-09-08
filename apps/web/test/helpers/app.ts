import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { EnsureWorkspaceForUser } from "@chine/application";
import { asUserId } from "@chine/domain";
import {
  authSchema,
  createIsolatedAppDependencies,
  type InfrastructureDependencies,
  UuidV7Generator,
} from "@chine/infrastructure";
import { setSessionResolverForTests } from "@/lib/api/with-auth";
import { forgetWorkspace } from "@/lib/api/workspace";
import { type Session, setAuthForTests } from "@/lib/auth";
import { setContainerForTests } from "@/lib/container";

/**
 * Application de test : dépendances isolées (PGlite en mémoire, photos dans un dossier
 * temporaire, IA factice, sans Stripe), injectées dans le conteneur de l'app web, et une
 * session simulée pour l'utilisateur de test.
 */
export interface TestUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
}

export interface TestApp {
  readonly deps: InfrastructureDependencies;
  readonly user: TestUser;
  readonly workspaceId: string;
  readonly dataDir: string;
  /** Crée un second utilisateur (isolation entre espaces). */
  createUser(name: string): Promise<TestUser & { workspaceId: string }>;
  /** La session courante devient celle de `user` (ou aucune avec `null`). */
  actAs(user: TestUser | null): void;
  close(): Promise<void>;
}

const ids = new UuidV7Generator();

export interface TestAppOptions {
  readonly env?: Readonly<Record<string, string | undefined>>;
}

export async function createTestApp(options: TestAppOptions = {}): Promise<TestApp> {
  const dataDir = mkdtempSync(path.join(tmpdir(), "chine-web-test-"));
  const deps = await createIsolatedAppDependencies(
    { CHINE_DATA_DIR: dataDir, STORAGE_DRIVER: "local", APPRAISER_DRIVER: "fake", ...options.env },
    { inMemory: true },
  );
  setContainerForTests(deps);
  setAuthForTests(undefined);
  forgetWorkspace();

  async function createUser(name: string): Promise<TestUser & { workspaceId: string }> {
    const id = ids.next();
    const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}-${id.slice(-6)}@chine.test`;
    await deps.database.db
      .insert(authSchema.user)
      .values({ id, name, email, emailVerified: true, image: null });
    const ws = await new EnsureWorkspaceForUser(deps).execute({ userId: asUserId(id) });
    if (!ws.ok) throw ws.error;
    return { id, email, name, workspaceId: ws.value.workspace.id };
  }

  const owner = await createUser("Léa");
  let current: TestUser | null = owner;

  setSessionResolverForTests(async () => {
    if (!current) return null;
    const now = new Date();
    return {
      user: {
        id: current.id,
        email: current.email,
        name: current.name,
        emailVerified: true,
        image: null,
        createdAt: now,
        updatedAt: now,
      },
      session: {
        id: `session_${current.id}`,
        userId: current.id,
        token: `token_${current.id}`,
        expiresAt: new Date(now.getTime() + 3_600_000),
        createdAt: now,
        updatedAt: now,
        ipAddress: null,
        userAgent: null,
      },
    } as unknown as Session;
  });

  return {
    deps,
    user: owner,
    workspaceId: owner.workspaceId,
    dataDir,
    createUser,
    actAs: (user) => {
      current = user;
    },
    close: async () => {
      setSessionResolverForTests(undefined);
      setContainerForTests(undefined);
      setAuthForTests(undefined);
      forgetWorkspace();
      await deps.database.close();
      rmSync(dataDir, { recursive: true, force: true });
    },
  };
}
