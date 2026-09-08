import type { Metadata } from "next";
import { SourceScreen } from "@/components/screens/sources/SourceScreen";

export const metadata: Metadata = { title: "Source" };

export default async function SourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SourceScreen id={id} />;
}
