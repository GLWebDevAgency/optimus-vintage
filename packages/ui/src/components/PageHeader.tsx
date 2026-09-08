import type { ReactNode } from "react";
import { cn } from "../cn";

export interface PageHeaderProps {
  /** Ligne mono capitale au-dessus du titre (« Dim. 7 sept. », « Mode chine · hors ligne »). */
  readonly eyebrow?: ReactNode;
  readonly title: ReactNode;
  /** Partie du titre en sérif italique (« sur Vinted »). */
  readonly titleEm?: ReactNode;
  /** Bloc à droite (avatar, bouton +, pastille). */
  readonly trailing?: ReactNode;
  readonly className?: string;
  readonly as?: "h1" | "h2";
}

/** En-tête d'écran : date mono, titre serré, avatar à droite. */
export function PageHeader({
  eyebrow,
  title,
  titleEm,
  trailing,
  className,
  as: Tag = "h1",
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="grid gap-0.5">
        {eyebrow ? (
          <span className="font-mono text-[10.5px] uppercase tracking-[.12em] text-ink-3">
            {eyebrow}
          </span>
        ) : null}
        <Tag className="font-ui text-[22px] font-bold leading-[1.05] tracking-[-.02em] text-ink">
          {title}
          {titleEm ? (
            <em className="font-display font-normal italic tracking-normal"> {titleEm}</em>
          ) : null}
        </Tag>
      </div>
      {trailing}
    </div>
  );
}

/** Avatar rond indigo à initiale. */
export function Avatar({
  initial,
  src,
  size = 32,
  className,
}: {
  initial: string;
  src?: string;
  size?: number;
  className?: string;
}) {
  return src ? (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={cn("rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className={cn(
        "grid place-items-center rounded-full bg-indigo font-ui text-[12px] font-bold text-white",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {initial.slice(0, 1).toUpperCase()}
    </span>
  );
}
