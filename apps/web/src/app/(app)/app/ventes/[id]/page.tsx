import type { Metadata } from "next";
import { SaleScreen } from "@/components/screens/sales/SaleScreen";

export const metadata: Metadata = { title: "Vente" };

export default async function SalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SaleScreen id={id} />;
}
