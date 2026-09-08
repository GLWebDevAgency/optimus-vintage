"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { type ReactNode, useState } from "react";
import { makePersistOptions, makeQueryClient } from "@/lib/query/client";

/** TanStack Query + persistance IndexedDB (lecture hors ligne). Sans IndexedDB : client simple. */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);
  const [persistOptions] = useState(makePersistOptions);

  if (!persistOptions) return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return (
    <PersistQueryClientProvider client={client} persistOptions={persistOptions}>
      {children}
    </PersistQueryClientProvider>
  );
}
