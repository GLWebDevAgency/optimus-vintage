import pkg from "../../package.json" with { type: "json" };

/** Version de l'app web (package.json), exposée par /api/health. */
export const APP_VERSION: string = pkg.version;
export const APP_NAME: string = pkg.name;
