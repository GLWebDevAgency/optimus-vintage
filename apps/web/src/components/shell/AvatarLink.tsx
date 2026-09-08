"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";

/** Avatar (initiale) → réglages. Sans session chargée : initiale neutre. */
export function AvatarLink() {
  const { data } = useSession();
  const name = data?.user.name?.trim() || data?.user.email || "";
  const initial = name ? name.charAt(0).toUpperCase() : "·";
  return (
    <Link
      href="/app/reglages"
      className="avatar touch"
      aria-label="Réglages et compte"
      title={name || "Réglages"}
    >
      {initial}
    </Link>
  );
}
