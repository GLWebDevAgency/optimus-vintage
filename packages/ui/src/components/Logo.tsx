import { cn } from "../cn.js";

export interface LogoProps {
  /** Hauteur de la marque en px (mark) ; le mot suit. */
  readonly size?: number;
  readonly variant?: "mark" | "wordmark" | "full";
  /** Couleurs : hérite (`currentColor` + tokens) ou forcées pour les icônes d'app. */
  readonly scheme?: "auto" | "calico" | "indigo" | "thread";
  readonly className?: string;
  readonly title?: string;
}

const schemes = {
  auto: { face: "var(--surface)", eyelet: "var(--bg)", ink: "var(--ink)", thread: "var(--thread)" },
  calico: { face: "#FBF8F1", eyelet: "#F2EDE2", ink: "#171B27", thread: "#C4283C" },
  indigo: { face: "#171E36", eyelet: "#0E1326", ink: "#EEF1F7", thread: "#E44553" },
  thread: { face: "#F2EDE2", eyelet: "#C4283C", ink: "#171B27", thread: "#171B27" },
} as const;

/** La marque tissée : étiquette à coins coupés, œillet, fil rouge, lettre à l'encre. */
export function LogoMark({ size = 32, scheme = "auto", className, title }: Omit<LogoProps, "variant">) {
  const c = schemes[scheme];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <path d="M14 6 h36 a6 6 0 0 1 6 6 v40 l-6 6 H14 l-6 -6 V12 a6 6 0 0 1 6 -6z" fill={c.face} stroke={c.ink} strokeWidth="2.5" />
      <circle cx="32" cy="15" r="3.5" fill={c.eyelet} stroke={c.ink} strokeWidth="2" />
      <path d="M32 11 C 32 2, 44 2, 44 8" stroke={c.thread} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <text x="32" y="46" textAnchor="middle" fontFamily="Instrument Serif, Georgia, serif" fontStyle="italic" fontSize="27" fill={c.ink}>
        C
      </text>
      <path d="M16 52 h32" stroke={c.thread} strokeWidth="2" strokeDasharray="4 3" />
    </svg>
  );
}

/** Le mot « Chiné », l'accent aigu cousu en fil rouge. */
export function Wordmark({ size = 28, className, scheme = "auto" }: { size?: number; className?: string; scheme?: LogoProps["scheme"] }) {
  const thread = schemes[scheme ?? "auto"].thread;
  const ink = scheme && scheme !== "auto" ? schemes[scheme].ink : undefined;
  return (
    <span className={cn("inline-flex items-baseline font-ui font-extrabold leading-none tracking-[-.04em]", className)} style={{ fontSize: size, color: ink }} aria-label="Chiné">
      <span aria-hidden="true">Chin</span>
      <span aria-hidden="true" className="relative inline-block">
        e
        <svg
          viewBox="0 0 24 14"
          aria-hidden="true"
          className="absolute"
          style={{ width: "0.5em", height: "0.3em", right: "0.02em", top: "-0.2em" }}
        >
          <path d="M4 12 C 8 10, 14 6, 20 2" stroke={thread} strokeWidth="3.2" strokeLinecap="round" strokeDasharray="5 3" fill="none" />
        </svg>
      </span>
    </span>
  );
}

export function Logo({ size = 32, variant = "full", scheme = "auto", className, title = "Chiné" }: LogoProps) {
  if (variant === "mark") return <LogoMark size={size} scheme={scheme} className={className} title={title} />;
  if (variant === "wordmark") return <Wordmark size={size} scheme={scheme} className={className} />;
  return (
    <span className={cn("inline-flex items-center", className)} style={{ gap: size * 0.3 }} role="img" aria-label={title}>
      <LogoMark size={size} scheme={scheme} />
      <Wordmark size={size * 0.85} scheme={scheme} />
    </span>
  );
}
