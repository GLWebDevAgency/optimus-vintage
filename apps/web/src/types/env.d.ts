// Variables d'environnement connues de l'app web (accès `process.env.X` typé).
// La validation au démarrage vit dans `src/lib/env.ts`.
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    DATABASE_URL?: string;
    CHINE_DATA_DIR?: string;
    CHINE_AUTO_MIGRATE?: string;
    BETTER_AUTH_SECRET?: string;
    BETTER_AUTH_URL?: string;
    NEXT_PUBLIC_APP_URL?: string;
    LOG_LEVEL?: string;
    RESEND_API_KEY?: string;
    MAIL_FROM?: string;
    STORAGE_DRIVER?: string;
    R2_ACCOUNT_ID?: string;
    R2_ACCESS_KEY_ID?: string;
    R2_SECRET_ACCESS_KEY?: string;
    R2_BUCKET?: string;
    R2_PUBLIC_BASE_URL?: string;
    APPRAISER_DRIVER?: string;
    GEMINI_API_KEY?: string;
    GEMINI_MODEL?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    STRIPE_PRICE_PREMIUM_MONTHLY?: string;
    STRIPE_PRICE_PREMIUM_YEARLY?: string;
    STRIPE_PRICE_PRO_MONTHLY?: string;
    STRIPE_PRICE_PRO_YEARLY?: string;
    STRIPE_PRICE_BUSINESS_MONTHLY?: string;
    STRIPE_PRICE_BUSINESS_YEARLY?: string;
    PORT?: string;
    CI?: string;
    E2E_DEV?: string;
    PW_CHROMIUM_PATH?: string;
  }
}
