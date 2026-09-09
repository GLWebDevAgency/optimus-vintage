import pkg from "../../package.json" with { type: "json" };

/** Version de l'app web (package.json), exposée par /api/health. */
export const APP_VERSION: string = pkg.version;
export const APP_NAME: string = pkg.name;

/**
 * Commit déployé : `APP_COMMIT` est fixé au build de l'image (ARG Docker) et Railway injecte
 * `RAILWAY_GIT_COMMIT_SHA` à l'exécution ; vide en développement.
 */
export const APP_COMMIT: string =
  process.env.APP_COMMIT?.trim() || process.env.RAILWAY_GIT_COMMIT_SHA?.trim() || "";
