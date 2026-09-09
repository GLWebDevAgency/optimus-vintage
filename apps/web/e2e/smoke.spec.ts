import { expect, test } from "@playwright/test";

test.describe("Chiné — fumée", () => {
  test("la page d'accueil affiche le nom et l'identité", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Chiné");
    await expect(page.getByRole("link", { name: "Créer un compte gratuit" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await page.waitForTimeout(1500); // laisser jouer les entrées (fil cousu, étiquettes)
    await page.screenshot({ path: "e2e/__screenshots__/landing.png" });
    await page.screenshot({ path: "e2e/__screenshots__/landing-full.png", fullPage: true });
  });

  test("le manifeste PWA est servi", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("manifest+json");
    const json = (await res.json()) as { name: string; start_url: string; display: string };
    expect(json.name).toBe("Chiné");
    expect(json.start_url).toBe("/app");
    expect(json.display).toBe("standalone");
    const icon = await request.get("/icons/icon-192.png");
    expect(icon.status()).toBe(200);
  });

  test("l'API de santé répond dans l'enveloppe { data }", async ({ request }) => {
    const res = await request.get("/api/v1/health");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ data: { status: "ok" } });
  });

  test("/app redirige vers la connexion sans session", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/auth\/connexion\?next=%2Fapp/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Reprends la");
  });

  test("le formulaire d'inscription est visible", async ({ page }) => {
    await page.goto("/auth/inscription");
    await expect(page.getByLabel("Prénom ou pseudo")).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Mot de passe")).toBeVisible();
    await expect(page.getByRole("button", { name: /Créer mon compte/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Se connecter" })).toBeVisible();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "e2e/__screenshots__/inscription.png" });
  });

  test("inscription → /app (adaptateur mémoire) puis déconnexion", async ({ page }) => {
    const email = `e2e-${Date.now()}@chine.test`;
    await page.goto("/auth/inscription");
    await page.getByLabel("Prénom ou pseudo").fill("Léa");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Mot de passe").fill("motdepasse-solide");
    await page.getByRole("button", { name: /Créer mon compte/ }).click();
    await expect(page).toHaveURL(/\/app$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Aujourd'hui");
    await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
    await page.screenshot({ path: "e2e/__screenshots__/app-today.png" });
    await page.goto("/app/reglages");
    await page.getByTestId("sign-out").click();
    await expect(page).toHaveURL(/\/auth\/connexion/, { timeout: 15_000 });
  });
});
