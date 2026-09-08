import type { Metadata } from "next";
import { ItemEditScreen } from "@/components/screens/stock/ItemEditScreen";

export const metadata: Metadata = { title: "Modifier la pièce" };

export default async function ItemEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ItemEditScreen id={id} />;
}
