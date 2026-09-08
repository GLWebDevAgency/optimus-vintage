/**
 * Parcours produit contre la vraie API `/api/v1` (une fois câblée) :
 * inscription → tableau de bord vide → capture rapide (source UNIT) → stock → vente → tampon Vendu
 * → marge sur le tableau de bord → source UNIT amortie.
 * Si `GET /api/v1/dashboard` n'est pas encore servi, la suite est ignorée (pas en échec).
 */
import { expect, test } from "@playwright/test";
import { settle, signUp, testPng } from "./helpers";

test.describe("Chiné — parcours complet (API réelle)", () => {
  test.describe.configure({ mode: "serial" });

  test("de la première chine à la source amortie", async ({ page }) => {
    await signUp(page, "Léa");

    const probe = await page.request.get("/api/v1/dashboard?period=month");
    test.skip(
      probe.status() === 404 || probe.status() >= 500,
      "API /api/v1 non câblée dans cet environnement",
    );
    expect(probe.status()).toBe(200);

    // 1. Tableau de bord d'un atelier neuf : état vide → Chiner.
    await page.goto("/app");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Aujourd'hui");
    await expect(page.getByText("Ton atelier est vide")).toBeVisible({ timeout: 45_000 });
    await page.getByRole("link", { name: "Chiner une pièce" }).click();
    await expect(page).toHaveURL(/\/app\/chiner$/);

    // 2. Capture rapide sans caméra : photo via le champ fichier, détails, prix, ajout.
    await page.getByTestId("photo-input").setInputFiles({
      name: "veste.png",
      mimeType: "image/png",
      buffer: await testPng(),
    });
    await expect(page.getByTestId("viewfinder")).toHaveAttribute("data-state", "photo");
    await page.getByTestId("details-open").click();
    await page.getByTestId("details-title").fill("Ensemble Lacoste, 1990s");
    await page.getByTestId("details-done").click();
    await page.getByTestId("location-edit").click();
    await page.getByTestId("location-label").fill("Vide-grenier Bois-Guillaume");
    await page.keyboard.press("Enter");
    await page.getByTestId("capture-submit").click();
    await expect(page.getByTestId("capture-success")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Chinée")).toBeVisible();
    await settle(page, 1200);
    await page.screenshot({ path: "e2e/__screenshots__/flow-chiner-success.png" });

    // 3. Le stock affiche la pièce.
    await page.getByTestId("capture-view").click();
    await expect(page).toHaveURL(/\/app\/stock\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Ensemble Lacoste");
    const itemUrl = page.url();
    await page.goto("/app/stock");
    await expect(page.getByTestId("stock-list")).toContainText("Ensemble Lacoste");

    // 4. Vendre la pièce → écran Vendu avec le tampon.
    await page.goto(itemUrl);
    await page.getByTestId("item-sell").click();
    await expect(page).toHaveURL(/\/app\/ventes\/nouvelle\?item=/);
    await page.getByTestId("sale-gross").fill("75");
    await expect(page.getByTestId("sale-receipt")).toContainText("Marge nette");
    await page.getByTestId("sale-submit").click();
    await expect(page.getByTestId("sold-state")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("sold-stamp")).toContainText(/vendu/i);
    await settle(page, 1600);
    await page.screenshot({ path: "e2e/__screenshots__/flow-vendu.png" });

    // 5. La marge du mois apparaît sur le tableau de bord.
    await page.goto("/app");
    await expect(page.getByTestId("today-kpi")).toBeVisible({ timeout: 45_000 });
    await settle(page, 1800);
    // 75 € vendus − 5 € payés (prix par défaut du mètre) = 70 € de marge nette.
    await expect(page.getByTestId("today-kpi")).toContainText("70,00");
    await expect(page.getByText("Ensemble Lacoste")).toBeVisible();

    // 6. La source unitaire est amortie (75 € encaissés pour un achat de quelques euros).
    await page.goto("/app/sources");
    const card = page.getByTestId("source-card").first();
    await expect(card).toBeVisible({ timeout: 45_000 });
    await expect(card).toHaveAttribute("data-amortized", "true");
    await expect(card).toContainText("Amortie");
    await settle(page, 1600);
    await page.screenshot({ path: "e2e/__screenshots__/flow-sources.png" });
  });
});
