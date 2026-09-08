import { defineConfig } from "drizzle-kit";

// `drizzle-kit generate` n'a pas besoin de base : il diffe le schéma TS contre les snapshots.
// `DATABASE_URL` ne sert qu'à `drizzle-kit migrate` / `studio`.
export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
  out: "./drizzle",
  strict: true,
  verbose: true,
  dbCredentials: { url: process.env["DATABASE_URL"] ?? "postgres://localhost:5432/chine" },
});
