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
    <div className="seg" role="radiogroup" aria-label="Thème">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={theme === o.value}
          aria-pressed={theme === o.value}
          onClick={() => setTheme(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
