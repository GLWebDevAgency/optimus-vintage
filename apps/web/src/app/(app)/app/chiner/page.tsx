import type { Metadata } from "next";
import { ChinerScreen } from "@/components/screens/chiner/ChinerScreen";

export const metadata: Metadata = { title: "Chiner" };

export default function ChinerPage() {
  return <ChinerScreen />;
}
