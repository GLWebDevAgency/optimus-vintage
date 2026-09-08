import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    // Chaque suite de routes démarre un Postgres embarqué (PGlite) et applique les migrations :
    // quelques secondes par fichier quand tout tourne en parallèle.
    hookTimeout: 120_000,
    testTimeout: 60_000,
  },
});
