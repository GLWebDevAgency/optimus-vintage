/**
 * Captures des écrans produit (390×844, Calico et Indigo) sur un faux `/api/v1` en mémoire
 * (`fake-api.ts`) : données de démonstration proches des maquettes, puis états vides.
 * Sert aussi de test d'intégration de l'interface : chaque parcours est joué pour de vrai.
 */
import { expect, type Page, test } from "@playwright/test";
import { demoState, emptyState, installFakeApi } from "./fake-api";
import { settle, signUp, testPng, useTheme } from "./helpers";

const DIR = "e2e/__screenshots__";
const shot = (page: Page, name: string) => page.screenshot({ path: `${DIR}/${name}.png` });

for (const theme of ["light", "dark"] as const) {
  const skin = theme === "light" ? "calico" : "indigo";

  test.describe(`écrans · ${skin}`, () => {
    test.beforeEach(async ({ page }) => {
      await useTheme(page, theme);
    });

    test("Aujourd'hui, Stock, Pièce, Ventes, Vendu, Sources, Source, Réglages, Chiner", async ({
      page,
      baseURL,
    }) => {
      test.setTimeout(180_000);
      const user = await signUp(page, "Léa");
      const state = await installFakeApi(page, demoState(baseURL ?? "", user));

      // Aujourd'hui
      await page.goto("/app");
      await expect(page.getByTestId("today-kpi")).toBeVisible({ timeout: 15_000 });
      await settle(page, 2000);
      await shot(page, `today-${skin}`);

      // Stock
      await page.goto("/app/stock");
      await expect(page.getByTestId("stock-list")).toBeVisible({ timeout: 15_000 });
      await settle(page, 1000);
      await shot(page, `stock-${skin}`);

      // Pièce
      await page.goto("/app/stock/it_142");
      await expect(page.getByTestId("flip-tag")).toBeVisible({ timeout: 15_000 });
      await settle(page, 2400);
      await shot(page, `item-${skin}`);

      // Ventes
      await page.goto("/app/ventes");
      await expect(page.getByTestId("sales-list")).toBeVisible({ timeout: 15_000 });
      await settle(page, 1000);
      await shot(page, `sales-${skin}`);

      // Nouvelle vente → Vendu
      await page.goto("/app/ventes/nouvelle?item=it_142");
      await expect(page.getByTestId("sale-gross")).toBeVisible({ timeout: 15_000 });
      await page.getByTestId("sale-gross").fill("75");
      await settle(page, 500);
      await shot(page, `sale-new-${skin}`);
      await page.getByTestId("sale-submit").click();
      await expect(page.getByTestId("sold-state")).toBeVisible({ timeout: 15_000 });
      await settle(page, 2200);
      await shot(page, `sold-${skin}`);
      expect(state.sales.at(-1)?.itemId).toBe("it_142");

      // Détail de vente
      await page.goto("/app/ventes/sale_101");
      await expect(page.getByText("Marge nette")).toBeVisible({ timeout: 15_000 });
      await settle(page, 1200);
      await shot(page, `sale-${skin}`);

      // Sources + détail
      await page.goto("/app/sources");
      await expect(page.getByTestId("sources-list")).toBeVisible({ timeout: 15_000 });
      await settle(page, 2200);
      await shot(page, `sources-${skin}`);
      await page.goto("/app/sources/src_fleek");
      await expect(page.getByTestId("source-performance")).toBeVisible({ timeout: 15_000 });
      await settle(page, 1600);
      await shot(page, `source-${skin}`);

      // Réglages
      await page.goto("/app/reglages");
      await expect(page.getByTestId("plan-card")).toBeVisible({ timeout: 15_000 });
      await settle(page, 1200);
      await shot(page, `settings-${skin}`);

      // Chiner : photo depuis la galerie, expertise (faux), mètre.
      await page.goto("/app/chiner");
      await expect(page.getByTestId("viewfinder")).toBeVisible({ timeout: 15_000 });
      await page
        .getByTestId("photo-input")
        .setInputFiles({ name: "veste.png", mimeType: "image/png", buffer: await testPng() });
      await expect(page.getByTestId("appraisal-recognized")).toBeVisible({ timeout: 15_000 });
      await settle(page, 1600);
      await shot(page, `chiner-${skin}`);
      await page.getByTestId("capture-submit").click();
      await expect(page.getByTestId("capture-success")).toBeVisible({ timeout: 15_000 });
      await settle(page, 1400);
      await shot(page, `chiner-success-${skin}`);
    });
  });
}

test.describe("états vides · calico", () => {
  test("atelier neuf : Aujourd'hui, Stock, Ventes, Sources, IA verrouillée", async ({
    page,
    baseURL,
  }) => {
    test.setTimeout(120_000);
    await useTheme(page, "light");
    const user = await signUp(page, "Léa");
    await installFakeApi(page, emptyState(baseURL ?? "", user));

    await page.goto("/app");
    await expect(page.getByText("Ton atelier est vide")).toBeVisible({ timeout: 15_000 });
    await settle(page, 1000);
    await shot(page, "empty-today");

    await page.goto("/app/stock");
    await expect(page.getByText("Aucune pièce")).toBeVisible({ timeout: 15_000 });
    await settle(page, 800);
    await shot(page, "empty-stock");

    await page.goto("/app/ventes");
    await expect(page.getByText("Aucune vente")).toBeVisible({ timeout: 15_000 });
    await settle(page, 800);
    await shot(page, "empty-sales");

    await page.goto("/app/sources");
    await expect(page.getByText("Aucune source")).toBeVisible({ timeout: 15_000 });
    await settle(page, 800);
    await shot(page, "empty-sources");

    // Plan FREE : l'IA est verrouillée, la capture reste possible.
    await page.goto("/app/chiner");
    await page
      .getByTestId("photo-input")
      .setInputFiles({ name: "veste.png", mimeType: "image/png", buffer: await testPng() });
    await expect(page.getByTestId("ai-upsell")).toBeVisible({ timeout: 15_000 });
    await settle(page, 800);
    await shot(page, "chiner-ai-locked");
    await page.getByTestId("capture-submit").click();
    await expect(page.getByTestId("capture-success")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("capture-view").click();
    await expect(page).toHaveURL(/\/app\/stock\/it_/);
  });

  test("hors ligne : la capture attend, le bandeau s'affiche, la synchro rejoue", async ({
    page,
    baseURL,
    context,
  }) => {
    test.setTimeout(120_000);
    await useTheme(page, "light");
    const user = await signUp(page, "Léa");
    const state = await installFakeApi(page, emptyState(baseURL ?? "", user));

    await page.goto("/app/chiner");
    await expect(page.getByTestId("viewfinder")).toBeVisible({ timeout: 15_000 });
    await context.setOffline(true);
    await page
      .getByTestId("photo-input")
      .setInputFiles({ name: "veste.png", mimeType: "image/png", buffer: await testPng() });
    await page.getByTestId("capture-submit").click();
    await expect(page.getByTestId("capture-success")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Sync plus tard").first()).toBeVisible();
    await settle(page, 800);
    await shot(page, "chiner-offline");

    await page.getByTestId("capture-view").click();
    await expect(page).toHaveURL(/\/app\/stock$/);
    await expect(page.getByTestId("offline-banner")).toBeVisible();
    await expect(page.getByTestId("stock-list")).toContainText("Sync plus tard");
    await shot(page, "stock-offline");

    await context.setOffline(false);
    await expect.poll(() => state.items.length, { timeout: 20_000 }).toBe(1);
    await expect(page.getByTestId("offline-banner")).toBeHidden({ timeout: 10_000 });
    await expect(page.getByTestId("stock-list")).not.toContainText("Sync plus tard", {
      timeout: 15_000,
    });
  });
});
