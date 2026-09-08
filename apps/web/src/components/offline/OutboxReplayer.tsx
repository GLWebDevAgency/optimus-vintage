"use client";

import { useEffect } from "react";
import { startOutboxAutoReplay } from "@/lib/offline/outbox";

/** Rejoue l'outbox à la reconnexion / au retour au premier plan. Monté une fois dans le shell /app. */
export function OutboxReplayer() {
  useEffect(() => startOutboxAutoReplay(), []);
  return null;
}
