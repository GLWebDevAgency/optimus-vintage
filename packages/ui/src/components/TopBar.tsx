"use client";
import type { ReactNode } from "react";
import { cn } from "../cn";
import { AppIcon } from "../icons";
import type { LinkComponent } from "../types";

export interface TopBarProps {
  readonly title?: ReactNode;
  /** Lien ou action de retour. */
  readonly backHref?: string;
  readonly onBack?: () => void;
  readonly backLabel?: string;
  readonly Link?: LinkComponent;
  readonly actions?: ReactNode;
  readonly className?: string;
  /** Barre collée en haut avec fond translucide. */
  readonly sticky?: boolean;
  /** Titre centré (écrans de détail). */
  readonly centered?: boolean;
}

/** Barre supérieure des écrans de détail : retour, titre, actions. Respecte la zone sûre. */
export function TopBar({
  title,
  backHref,
  onBack,
  backLabel = "Retour",
  Link,
  actions,
  className,
  sticky = true,
  centered = true,
}: TopBarProps) {
  const L = Link ?? "a";
  const backClass =
    "grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-surface-2 active:scale-95 transition-[background-color,transform] duration-micro focus-thread -ml-2";
  return (
    <header
      className={cn(
        "z-30 grid min-h-[52px] grid-cols-[44px_1fr_44px] items-center gap-2 px-5 pt-safe",
        sticky && "sticky top-0 bg-bg/90 backdrop-blur-md",
        className,
      )}
    >
      <div>
        {backHref ? (
          <L href={backHref} className={backClass} aria-label={backLabel}>
            <AppIcon name="chevronLeft" />
          </L>
        ) : onBack ? (
          <button type="button" onClick={onBack} className={backClass} aria-label={backLabel}>
            <AppIcon name="chevronLeft" />
          </button>
        ) : null}
      </div>
      <div
        className={cn(
          "min-w-0 truncate font-ui text-[15px] font-bold tracking-[-.01em] text-ink",
          centered && "text-center",
        )}
      >
        {title}
      </div>
      <div className="flex justify-end">{actions}</div>
    </header>
  );
}
