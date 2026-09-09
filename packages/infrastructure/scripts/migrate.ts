/**
 * Applique les migrations SQL sur la base désignée par `DATABASE_URL` (ou PGlite locale).
 * Usage : `pnpm --filter @chine/infrastructure db:migrate` — idempotent, utilisé par la CI et les runbooks.
 */
import { createDatabase, databaseConfigFromEnv } from "../src/db/client.js";

const database = await createDatabase(databaseConfigFromEnv());
try {
  await database.migrate();
  console.log(`Migrations appliquées (${database.driver}).`);
} finally {
  await database.close();
}
