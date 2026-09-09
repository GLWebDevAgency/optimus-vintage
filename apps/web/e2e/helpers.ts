import type { Page } from "@playwright/test";
import sharp from "sharp";

/**
 * Attend que React ait hydraté l'élément (propriété interne `__reactFiber…` posée sur le nœud) :
 * en développement, la première compilation peut arriver après l'affichage du HTML.
 */
export async function waitForHydration(page: Page, selector = "form"): Promise<void> {
  await page.waitForSelector(selector, { state: "attached" });
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return Boolean(el && Object.keys(el).some((k) => k.startsWith("__react")));
    },
    selector,
    { timeout: 60_000 },
  );
}

/** Crée un compte et arrive sur /app. */
export async function signUp(page: Page, name = "Léa"): Promise<{ email: string; name: string }> {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@chine.test`;
  await page.goto("/auth/inscription");
  await waitForHydration(page, "form");
  await page.getByLabel("Prénom ou pseudo").fill(name);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("motdepasse-solide");
  await page.getByRole("button", { name: /Créer mon compte/ }).click();
  await page.waitForURL(/\/app$/, { timeout: 60_000 });
  return { email, name };
}

/** PNG de test (une « veste » stylisée) pour les champs fichier. */
export async function testPng(): Promise<Buffer> {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='720' height='900'><rect width='720' height='900' fill='#E8E1D0'/><path d='M228 132 156 180 84 336l96 36-12 228h384l-12-228 96-36-72-156-72-48c-24 48-60 72-132 72S252 180 228 132z' fill='#22306A' opacity='.9'/><circle cx='360' cy='420' r='14' fill='#C4283C'/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Force la matière (Calico / Indigo) avant le premier rendu. */
export async function useTheme(page: Page, theme: "light" | "dark"): Promise<void> {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("chine.theme", t);
      // L'invitation à installer la PWA (après la première vente) ne doit pas couvrir les captures.
      localStorage.setItem("chine.prefs", JSON.stringify({ installDismissedAt: Date.now() }));
    } catch {
      // ignore
    }
  }, theme);
}

export const settle = (page: Page, ms = 1500) => page.waitForTimeout(ms);
