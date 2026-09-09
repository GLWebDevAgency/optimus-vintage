import type { Metadata } from "next";
import { LabelsScreen } from "@/components/screens/labels/LabelsScreen";

export const metadata: Metadata = { title: "Étiquettes QR" };

export default function LabelsPage() {
  return <LabelsScreen />;
}
