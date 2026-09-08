import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers/Providers";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

/* Trois voix, un seul ton : sérif italique (prix), grotesque (interface), mono (données). */
const display = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  adjustFontFallback: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
});
const ui = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui",
  axes: ["opsz"],
  adjustFontFallback: true,
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});
const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  adjustFontFallback: true,
  fallback: ["ui-monospace", "Menlo", "monospace"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: "Chiné",
  title: { default: "Chiné — l'app des chineurs", template: "%s · Chiné" },
  description:
    "Chiné : l'app des revendeurs de vêtements de seconde main. Chine hors ligne, sources remboursées au fil rouge, marge et prix plancher, expert IA.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Chiné",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Chiné",
    title: "Chiné — l'app des chineurs",
    description:
      "La chine avant le tableur : stock, sources, marge, expert IA. Hors ligne, dans la poche.",
    images: [{ url: "/icons/og.png", width: 1200, height: 630, alt: "Chiné" }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2EDE2" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1326" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${display.variable} ${ui.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Pose `data-theme` avant le premier rendu : pas de flash de thème. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: script statique, sans entrée utilisateur */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
