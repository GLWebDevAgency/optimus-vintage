"use client";

import { ToastProvider } from "@chine/ui";
import type { ReactNode } from "react";
import { I18nProvider } from "./I18nProvider";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <QueryProvider>
          <ToastProvider bottomOffset="calc(var(--tabbar-h) + max(12px, var(--safe-bottom)))">
            {children}
          </ToastProvider>
        </QueryProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
