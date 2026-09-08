import type { Metadata } from "next";
import { ItemScreen } from "@/components/screens/stock/ItemScreen";

export const metadata: Metadata = { title: "Pièce" };

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ItemScreen id={id} />;
}
