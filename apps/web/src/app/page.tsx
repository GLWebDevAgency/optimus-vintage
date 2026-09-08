import type { Metadata } from "next";
import { Landing } from "@/components/marketing/Landing";

export const metadata: Metadata = {
  title: "Chiné — l'app des chineurs",
  description:
    "Chiné tient le stock, les sources et la marge des revendeurs de seconde main. Hors ligne, dans la poche, avec un expert IA. Gratuit jusqu'à 60 pièces.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <Landing />;
}
