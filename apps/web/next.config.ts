import { randomUUID } from "node:crypto";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/** Origine d'une URL d'environnement, ou `undefined` si absente ou invalide. */
const originOf = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
};

// Photos : lecture depuis le domaine public R2, upload direct vers l'endpoint S3 du compte.
const r2PublicOrigin = originOf(process.env.R2_PUBLIC_BASE_URL);
const r2UploadOrigin = process.env.R2_ACCOUNT_ID
  ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  : undefined;
const connectExtra = [r2PublicOrigin, r2UploadOrigin].filter((o): o is string => Boolean(o));

/**
 * Politique de sécurité de contenu.
 * - `'unsafe-inline'` sur script-src est requis par les scripts inline de Next (hydratation, thème sans flash)
 *   tant qu'un nonce par requête n'est pas mis en place (les pages marketing sont statiques).
 * - Google Fonts est autorisé pour les feuilles de style éventuelles (next/font auto-héberge les polices).
 * - `blob:` et `data:` pour les aperçus caméra et les vignettes générées côté client.
 * - `connect-src` : même origine, polices, plus le domaine public R2 et l'endpoint d'upload R2
 *   (PUT pré-signé depuis le navigateur) quand ils sont configurés.
 * - `'unsafe-eval'` uniquement en développement (React Refresh).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob:",
  `connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com${connectExtra.map((o) => ` ${o}`).join("")}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), geolocation=(self), microphone=(), payment=(), usb=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

// Hôte public des photos (R2) s'il est configuré, sinon rien à autoriser.
const remotePatterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [];
const r2 = process.env.R2_PUBLIC_BASE_URL;
if (r2) {
  try {
    const u = new URL(r2);
    remotePatterns.push({
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
    });
  } catch {
    // URL invalide : on ignore, l'erreur remontera à l'usage.
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  typedRoutes: true,
  poweredByHeader: false,
  transpilePackages: [
    "@chine/ui",
    "@chine/contract",
    "@chine/i18n",
    "@chine/domain",
    "@chine/application",
    "@chine/infrastructure",
  ],
  serverExternalPackages: ["@electric-sql/pglite", "pg", "sharp"],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 430, 640, 750, 828, 1080, 1200],
    imageSizes: [40, 64, 96, 128, 256],
    remotePatterns,
  },
  // Turbopack est le bundler par défaut de Next 16 en dev ; Serwist (webpack) n'y est actif qu'au build
  // (`next build --webpack`). Cette clé vide évite l'erreur « webpack config sans turbopack config ».
  turbopack: {},
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Content-Type", value: "application/manifest+json" }],
      },
      {
        source: "/icons/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Rien de privé ne doit être indexé (doublon volontaire du proxy pour les réponses statiques).
      { source: "/app/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

// Révision des pages précachées « à la main » : le plugin webpack ne voit pas les pages prérendues
// (elles sont générées après la compilation), on les ajoute donc explicitement, renouvelées à chaque build.
const precacheRevision = randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: isDev,
  cacheOnNavigation: true,
  reloadOnOnline: false,
  additionalPrecacheEntries: [
    { url: "/offline", revision: precacheRevision },
    { url: "/", revision: precacheRevision },
    { url: "/auth/connexion", revision: precacheRevision },
  ],
});

export default withSerwist(nextConfig);
