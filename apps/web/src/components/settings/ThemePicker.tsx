"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import type { Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Calico" },
  { value: "dark", label: "Indigo" },
];

/** Choix de la matière : automatique, Calico (jour) ou Indigo (nuit). */
export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  return (
    <fieldset className="seg">
      <legend className="sr-only">Thème</legend>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={theme === o.value}
          onClick={() => setTheme(o.value)}
        >
          {o.label}
        </button>
      ))}
    </fieldset>
  );
}
