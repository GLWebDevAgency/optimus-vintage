"use client";

import { SegmentError } from "@/components/screens/common/SegmentError";

export default function ErrorPage(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SegmentError {...props} title="Vente" back="/app/ventes" />;
}
