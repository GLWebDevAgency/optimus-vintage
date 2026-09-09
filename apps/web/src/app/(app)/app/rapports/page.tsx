import type { Metadata } from "next";
import { ReportScreen } from "@/components/screens/reports/ReportScreen";

export const metadata: Metadata = { title: "Rapport mensuel" };

export default function ReportPage() {
  return <ReportScreen />;
}
