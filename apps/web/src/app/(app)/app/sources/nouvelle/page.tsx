import type { Metadata } from "next";
import { SourceFormScreen } from "@/components/screens/sources/SourceFormScreen";

export const metadata: Metadata = { title: "Nouvelle source" };

export default function NewSourcePage() {
  return <SourceFormScreen />;
}
