import { GLYPH_O } from "./glyph";

interface TagMarkProps {
  size?: number;
  className?: string;
  /** Libellé accessible ; `null` pour un usage purement décoratif. */
  title?: string | null;
  /** Couleurs fixes (icônes hors thème) ; par défaut, suit les jetons CSS. */
  palette?: { surface: string; bg: string; ink: string; thread: string };
  swing?: boolean;
}

/** L'étiquette, l'œillet et le fil : la marque tissée. */
export function TagMark({ size = 56, className, title = "Chiné", palette, swing = false }: TagMarkProps) {
  const c = palette ?? {
    surface: "var(--surface)",
    bg: "var(--bg)",
    ink: "var(--ink)",
    thread: "var(--thread)",
  };
  const classes = [className, swing ? "tagmark-swing" : ""].filter(Boolean).join(" ");
  return (
    <svg
      className={classes || undefined}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={title ? "img" : undefined}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
    >
      <path
        d="M14 6 h36 a6 6 0 0 1 6 6 v40 l-6 6 H14 l-6 -6 V12 a6 6 0 0 1 6 -6z"
        fill={c.surface}
        stroke={c.ink}
        strokeWidth="2.5"
      />
      <circle cx="32" cy="15" r="3.5" fill={c.bg} stroke={c.ink} strokeWidth="2" />
      <path d="M32 11 C 32 2, 44 2, 44 8" stroke={c.thread} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d={GLYPH_O} fill={c.ink} />
      <path d="M16 52 h32" stroke={c.thread} strokeWidth="2" strokeDasharray="4 3" />
    </svg>
  );
}
