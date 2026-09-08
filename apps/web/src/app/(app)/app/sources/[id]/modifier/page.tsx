import type { Metadata } from "next";
import { SourceFormScreen } from "@/components/screens/sources/SourceFormScreen";

export const metadata: Metadata = { title: "Modifier la source" };

export default async function EditSourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SourceFormScreen id={id} />;
}
