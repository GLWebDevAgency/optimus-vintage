/**
 * Garde-fou du couplage contrat ↔ domaine sur les plans commercialisés.
 *
 * `@chine/contract` ne dépend pas de `@chine/domain` : il est consommé par le web ET par l'app
 * Expo, sans build du domaine, et ses énumérations en sont des copies volontaires (cf. `enums.ts`).
 * `PURCHASABLE_PLANS` suit la même règle. Ce test relit donc la **source** du domaine — en texte,
 * sans import : ni dépendance de paquet, ni fichier hors `rootDir` dans le programme TypeScript —
 * et échoue si les deux listes divergent. Ouvrir la vente d'Atelier ne demande alors qu'un
 * changement dans `packages/domain/src/billing/plans.ts`, le test rouge rappelant de le refléter
 * dans le contrat.
 */
import { describe, expect, it } from "vitest";
import { PLANS, PURCHASABLE_PLANS, StartCheckoutCommand } from "../src/index";

/** Le contrat n'embarque pas les types Node : `node:fs` est chargé au vol, typé au strict minimum. */
const FS_MODULE = "node:fs";
type NodeFs = { readFileSync: (path: string, encoding: "utf8") => string };

const DOMAIN_PLANS_PATH = decodeURIComponent(
  new URL("../../domain/src/billing/plans.ts", import.meta.url).pathname,
);

/** Table `PLAN_AVAILABILITY` du domaine, telle qu'écrite dans sa source. */
async function readDomainAvailability(): Promise<[plan: string, availability: string][]> {
  const { readFileSync } = (await import(FS_MODULE)) as NodeFs;
  const source = readFileSync(DOMAIN_PLANS_PATH, "utf8");
  const table = /export const PLAN_AVAILABILITY[^=]*=\s*\{([^}]*)\}/.exec(source)?.[1];
  if (!table) {
    throw new Error(
      `PLAN_AVAILABILITY introuvable dans ${DOMAIN_PLANS_PATH} : le domaine a bougé, ce garde-fou est à remettre en face.`,
    );
  }
  const entries: [string, string][] = [];
  for (const match of table.matchAll(/([A-Z_]+)\s*:\s*"([a-z]+)"/g)) {
    const [, plan, availability] = match;
    if (plan && availability) entries.push([plan, availability]);
  }
  if (entries.length === 0)
    throw new Error("PLAN_AVAILABILITY lue mais vide : garde-fou à revoir.");
  return entries;
}

describe("Plans achetables (contrat ↔ domaine)", () => {
  it("liste exactement les plans marqués « sale » dans le domaine", async () => {
    const onSale = (await readDomainAvailability())
      .filter(([, availability]) => availability === "sale")
      .map(([plan]) => plan);
    expect([...PURCHASABLE_PLANS]).toEqual(onSale);
  });

  it("ne connaît que des plans existants, des deux côtés", async () => {
    const known: readonly string[] = PLANS;
    const domainPlans = (await readDomainAvailability()).map(([plan]) => plan);
    expect(domainPlans).toEqual([...known]);
    for (const plan of PURCHASABLE_PLANS) expect(known).toContain(plan);
  });

  it("refuse un paiement vers un plan qui n'est pas en vente", async () => {
    const base = { interval: "monthly", returnUrl: "https://chine.app/app/reglages" } as const;
    for (const plan of PURCHASABLE_PLANS) {
      expect(StartCheckoutCommand.safeParse({ ...base, plan }).success).toBe(true);
    }
    // Gratuit et Atelier (liste d'attente) : le contrat ne les promet pas à l'achat.
    const notOnSale = (await readDomainAvailability())
      .filter(([, availability]) => availability !== "sale")
      .map(([plan]) => plan);
    expect(notOnSale).not.toHaveLength(0);
    for (const plan of notOnSale) {
      expect(StartCheckoutCommand.safeParse({ ...base, plan }).success).toBe(false);
    }
  });
});
