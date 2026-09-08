// Variables d'environnement connues de l'app web (accès `process.env.X` typé).
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    DATABASE_URL?: string;
    CHINE_DATA_DIR?: string;
    BETTER_AUTH_SECRET?: string;
    BETTER_AUTH_URL?: string;
    NEXT_PUBLIC_APP_URL?: string;
    R2_PUBLIC_BASE_URL?: string;
    PORT?: string;
    CI?: string;
    E2E_DEV?: string;
    PW_CHROMIUM_PATH?: string;
  }
}
