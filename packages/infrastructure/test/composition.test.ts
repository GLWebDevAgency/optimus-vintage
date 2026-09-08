import { describe, expect, it } from "vitest";
import { createIsolatedAppDependencies } from "../src/composition.js";
import { createDatabase } from "../src/db/client.js";
import { makeWorkspace } from "./helpers.js";

describe("createDatabase", () => {
  it("PGlite en mémoire, migrations idempotentes", async () => {
    const database = await createDatabase({ inMemory: true });
    expect(database.driver).toBe("pglite");
    await database.migrate();
    await database.migrate();
    await database.close();
  });
});

describe("createAppDependencies", () => {
  it("assemble toutes les dépendances sans configuration", async () => {
    const deps = await createIsolatedAppDependencies({}, { inMemory: true });
    try {
      expect(deps.database.driver).toBe("pglite");
      expect(deps.appraiser.name).toBe("fake");
      expect(deps.stripe).toBeUndefined();
      expect(deps.photos.publicUrl("a/b.jpg")).toBe("/api/v1/photos/a/b.jpg");
      const ws = makeWorkspace();
      await deps.uow.run(async (r) => r.workspaces.save(ws));
      expect((await deps.workspaces.byId(ws.id))?.name).toBe(ws.name);
      expect(await deps.billing.currentPlan(ws.id)).toBe("FREE");
      expect(deps.ids.next()).not.toBe(deps.ids.next());
      expect(deps.clock.now()).toBeInstanceOf(Date);
      expect((await deps.rateLimiter.hit("compo", 2, 60)).remaining).toBe(1);
      expect((await deps.lifecycle.exportWorkspace(ws.id)).workspace).toMatchObject({ id: ws.id });
      expect(await deps.outboxRelay.relayPending(async () => undefined)).toMatchObject({
        processed: 0,
      });
    } finally {
      await deps.database.close();
    }
  });
});
