/**
 * `pnpm --filter @chine/infrastructure db:migrate`
 * Applique les migrations SQL de `drizzle/` sur `DATABASE_URL` (ou sur la base PGlite locale).
 */
import { createDatabase, databaseConfigFromEnv } from "../db/client.js";

const database = await createDatabase(databaseConfigFromEnv(process.env));
try {
  console.info(`[db] migration (${database.driver})…`);
  await database.migrate();
  console.info("[db] migrations appliquées");
} finally {
  await database.close();
}
