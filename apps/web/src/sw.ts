/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  type PrecacheEntry,
  type RuntimeCaching,
  Serwist,
  type SerwistGlobalConfig,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const DAY = 24 * 60 * 60;

/** Stratégies maison, évaluées avant celles de `defaultCache` (l'ordre compte). */
const runtimeCaching: RuntimeCaching[] = [
  {
    // API v1 en lecture : réseau d'abord, 10 s de patience, puis le cache (lecture hors ligne).
    matcher: ({ url, request, sameOrigin }) =>
      sameOrigin && request.method === "GET" && url.pathname.startsWith("/api/v1/"),
    handler: new NetworkFirst({
      cacheName: "chine-api-v1",
      networkTimeoutSeconds: 10,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 7 * DAY, maxAgeFrom: "last-used" }),
      ],
    }),
  },
  {
    // Images (photos de pièces, icônes) : cache d'abord.
    matcher: ({ request }) => request.destination === "image",
    handler: new CacheFirst({
      cacheName: "chine-images",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 400, maxAgeSeconds: 30 * DAY, maxAgeFrom: "last-used" }),
      ],
    }),
  },
  {
    // Polices (auto-hébergées par next/font, ou Google Fonts) : périmé-pendant-revalidation.
    matcher: ({ request, url }) =>
      request.destination === "font" ||
      url.hostname === "fonts.gstatic.com" ||
      url.hostname === "fonts.googleapis.com",
    handler: new StaleWhileRevalidate({
      cacheName: "chine-fonts",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 365 * DAY }),
      ],
    }),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
