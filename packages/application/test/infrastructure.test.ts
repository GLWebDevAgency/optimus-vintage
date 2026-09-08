import { describe, expect, it } from "vitest";
import { previousPeriod } from "../src/shared/dates.js";
import { chine, setup } from "./helpers.js";

describe("InMemoryUnitOfWork", () => {
  it("restaure l'état des tables quand le bloc lève (rollback)", async () => {
    const s = await setup();
    const { item } = await chine(s, 20);
    await expect(
      s.deps.uow.run(async (repos) => {
        await repos.items.delete(s.scope.workspaceId, item.id);
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(await s.deps.items.byId(s.scope.workspaceId, item.id)).toBeDefined();
  });
});

describe("previousPeriod", () => {
  it("mois civil précédent ou fenêtre glissante de même longueur", () => {
    expect(previousPeriod("2026-03-01", "2026-03-31")).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
    expect(previousPeriod("2026-09-05", "2026-09-11")).toEqual({
      from: "2026-08-29",
      to: "2026-09-04",
    });
  });
});
