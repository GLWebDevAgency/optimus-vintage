import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;
// Chromium préinstallé hors du cache Playwright (environnement distant) : on pointe l'exécutable
// directement s'il existe ; sinon (CI, poste local) Playwright utilise son propre navigateur.
const preinstalledChromium = "/opt/pw-browsers/chromium";
const executablePath =
  process.env.PW_CHROMIUM_PATH ||
  (existsSync(preinstalledChromium) ? preinstalledChromium : undefined);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
  },
  projects: [
    {
      name: "iphone-14",
      use: {
        ...devices["iPhone 14"],
        // Chromium (pas WebKit) : le viewport et l'UA mobile sont conservés.
        defaultBrowserType: "chromium",
        browserName: "chromium",
        launchOptions: executablePath ? { executablePath } : {},
      },
    },
  ],
  webServer: {
    command: process.env.E2E_DEV
      ? `pnpm dev --port ${PORT}`
      : `pnpm build && pnpm start --port ${PORT}`,
    url: `${baseURL}/api/v1/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "e2e-secret-e2e-secret-e2e-secret-32",
      BETTER_AUTH_URL: baseURL,
      NEXT_PUBLIC_APP_URL: baseURL,
      // Build de production sans service d'e-mail : dérogation explicite (jamais en vraie prod).
      CHINE_ALLOW_NO_MAILER: "true",
      CHINE_JOBS: "false",
    },
  },
});
