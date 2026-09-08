import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DevShowcase } from "./showcase";

export const metadata: Metadata = { title: "Showcase UI", robots: { index: false } };

/** Vitrine de `@chine/ui` (hors production uniquement). */
export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DevShowcase />;
}
