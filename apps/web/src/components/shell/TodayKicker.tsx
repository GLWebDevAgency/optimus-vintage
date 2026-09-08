"use client";

import { useEffect, useState } from "react";
import { formatDayKicker } from "@/lib/format";

/** Date du jour en mono capitale (« Dim. 7 sept. ») — rendue côté client pour ne jamais être figée au build. */
export function TodayKicker({ prefix }: { prefix?: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    setText(formatDayKicker(new Date()));
  }, []);
  if (!text) return <span className="sk text inline-block w-24 align-middle" aria-hidden="true" />;
  return (
    <span>
      {prefix ? `${prefix} · ` : ""}
      {text}
    </span>
  );
}
