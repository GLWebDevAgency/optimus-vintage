import type { Metadata } from "next";
import { SalesScreen } from "@/components/screens/sales/SalesScreen";

export const metadata: Metadata = { title: "Ventes" };

export default function SalesPage() {
  return <SalesScreen />;
}
