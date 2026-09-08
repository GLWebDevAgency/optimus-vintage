import type { Metadata } from "next";
import { TodayScreen } from "@/components/screens/today/TodayScreen";

export const metadata: Metadata = { title: "Aujourd'hui" };

export default function TodayPage() {
  return <TodayScreen />;
}
