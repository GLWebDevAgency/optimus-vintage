import type { Metadata } from "next";
import { SourcesScreen } from "@/components/screens/sources/SourcesScreen";

export const metadata: Metadata = { title: "Sources" };

export default function SourcesPage() {
  return <SourcesScreen />;
}
