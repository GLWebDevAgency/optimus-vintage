import type { Metadata } from "next";
import { Landing } from "@/components/marketing/Landing";

export const metadata: Metadata = {
  title: "Chiné — l'app des chineurs qui revendent",
  description:
    "Stock, sources et marge réelle des revendeurs de vêtements de seconde main : hors ligne, expert IA, frais de plateforme à jour, prix plancher. Gratuit jusqu'à 50 pièces en stock, sans carte.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <Landing />;
}
