/**
 * Tokens Selvedge en objet typé : pour Expo / React Native, les graphiques (SVG, canvas)
 * et tout ce qui ne lit pas les variables CSS. Source de vérité partagée avec `tokens.css`.
 */

export interface Palette {
  readonly bg: string;
  readonly bg2: string;
  readonly surface: string;
  readonly surface2: string;
  readonly ink: string;
  readonly ink2: string;
  readonly ink3: string;
  readonly line: string;
  readonly line2: string;
  readonly thread: string;
  readonly threadSoft: string;
  readonly brass: string;
  readonly brassSoft: string;
  readonly chalk: string;
  readonly indigo: string;
  readonly indigoSoft: string;
  readonly btn: string;
  readonly btnInk: string;
  readonly noiseOpacity: number;
}

/** Calico — jour. Coton écru, encre, fil rouge, laiton. */
export const calico: Palette = {
  bg: "#F2EDE2",
  bg2: "#E8E1D0",
  surface: "#FBF8F1",
  surface2: "#F5F0E4",
  ink: "#171B27",
  ink2: "#565B69",
  ink3: "#8B8F99",
  line: "#D8D0BE",
  line2: "#C7BEA8",
  thread: "#C4283C",
  threadSoft: "rgba(196,40,60,0.12)",
  brass: "#946F22",
  brassSoft: "rgba(148,111,34,0.14)",
  chalk: "#E6EEF4",
  indigo: "#22306A",
  indigoSoft: "rgba(34,48,106,0.10)",
  btn: "#171B27",
  btnInk: "#F7F3EA",
  noiseOpacity: 0.32,
};

/** Indigo — nuit. Denim brut, craie, fil éclairci, laiton chaud. */
export const indigo: Palette = {
  bg: "#0E1326",
  bg2: "#0A0E1D",
  surface: "#171E36",
  surface2: "#1D2540",
  ink: "#EEF1F7",
  ink2: "#A8AFC2",
  ink3: "#6E778D",
  line: "#283155",
  line2: "#344070",
  thread: "#E44553",
  threadSoft: "rgba(228,69,83,0.16)",
  brass: "#D9B66E",
  brassSoft: "rgba(217,182,110,0.16)",
  chalk: "#DCE6F0",
  indigo: "#8FA0E0",
  indigoSoft: "rgba(143,160,224,0.14)",
  btn: "#EEF1F7",
  btnInk: "#0E1326",
  noiseOpacity: 0.18,
};

export const palettes = { light: calico, dark: indigo } as const;
export type ThemeName = keyof typeof palettes;

/** Rôles sémantiques : à utiliser plutôt que les couleurs brutes. */
export const roles = {
  primaryAction: "btn",
  progress: "thread",
  focus: "thread",
  stamp: "thread",
  profit: "brass",
  sold: "brass",
  online: "indigo",
  link: "indigo",
  dormant: "thread",
} as const satisfies Record<string, keyof Palette>;

export const fonts = {
  display: {
    family: "Instrument Serif",
    fallback: 'Georgia, "Times New Roman", serif',
    style: "italic",
    weight: 400,
    use: "Prix, titres de pièces, mots qu'on veut faire sonner. Toujours italique, jamais gras.",
  },
  ui: {
    family: "Bricolage Grotesque",
    fallback: '"Helvetica Neue", Arial, sans-serif',
    style: "normal",
    weights: [400, 500, 600, 700, 800] as const,
    use: "Interface. Titres serrés, boutons en 600.",
  },
  mono: {
    family: "IBM Plex Mono",
    fallback: "ui-monospace, Menlo, monospace",
    style: "normal",
    weight: 500,
    use: "Reçus, SKU, dates, libellés. Chiffres tabulaires.",
  },
} as const;

/** Échelle typographique (px). */
export const type = {
  label: { size: 10.5, lineHeight: 1.2, letterSpacing: 0.14, transform: "uppercase", font: "mono" },
  eyebrow: { size: 11, lineHeight: 1.2, letterSpacing: 0.16, transform: "uppercase", font: "mono" },
  caption: { size: 12.5, lineHeight: 1.4, letterSpacing: 0, font: "ui" },
  body: { size: 15, lineHeight: 1.5, letterSpacing: 0, font: "ui" },
  h3: { size: 15, lineHeight: 1.2, letterSpacing: -0.01, weight: 700, font: "ui" },
  h2: { size: 17, lineHeight: 1.2, letterSpacing: -0.01, weight: 700, font: "ui" },
  h1: { size: 26, lineHeight: 1.05, letterSpacing: -0.02, weight: 700, font: "ui" },
  tag: { size: 30, lineHeight: 1, letterSpacing: 0, font: "display" },
  hero: { size: 54, lineHeight: 1, letterSpacing: -0.02, font: "display" },
} as const;

/** Espacements (px) — base 4. */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  /** Marge horizontale d'un écran mobile. */
  screen: 20,
  /** Cible tactile minimale. */
  touch: 44,
} as const;

/** Rayons (px). */
export const radii = {
  xs: 7,
  sm: 9,
  field: 12,
  md: 14,
  card: 18,
  lg: 20,
  sheet: 22,
  pill: 999,
} as const;

/** Motion : deux courbes, une rebondissante, quatre durées (ms). */
export const motion = {
  ease: {
    out: [0.16, 1, 0.3, 1],
    fold: [0.7, 0, 0.2, 1],
    snap: [0.34, 1.56, 0.64, 1],
  },
  easeCss: {
    out: "cubic-bezier(.16,1,.3,1)",
    fold: "cubic-bezier(.7,0,.2,1)",
    snap: "cubic-bezier(.34,1.56,.64,1)",
  },
  duration: { micro: 120, state: 240, enter: 520, hero: 1100 },
  /** Décalages en cascade des entrées (ms). */
  stagger: [50, 140, 230, 320, 410, 500, 620],
} as const;

export const shadows = {
  light: {
    card: "0 18px 40px -20px rgba(23,27,39,.35), 0 2px 6px -2px rgba(23,27,39,.12)",
    tag: "0 10px 24px -14px rgba(23,27,39,.45)",
  },
  dark: {
    card: "0 24px 50px -22px rgba(0,0,0,.75), 0 2px 8px -2px rgba(0,0,0,.5)",
    tag: "0 14px 28px -14px rgba(0,0,0,.8)",
  },
} as const;

/** Couleurs de séries pour les graphiques (par plateforme, puis neutres). */
export const chartSeries = (theme: ThemeName): readonly string[] => {
  const p = palettes[theme];
  return [p.indigo, p.brass, p.thread, p.ink2, p.ink3, p.line2];
};

export const tokens = {
  palettes,
  roles,
  fonts,
  type,
  spacing,
  radii,
  motion,
  shadows,
} as const;
export type Tokens = typeof tokens;
export default tokens;
