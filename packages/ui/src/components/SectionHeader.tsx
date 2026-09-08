import type { ReactNode } from "react";
import { cn } from "../cn.js";
import type { LinkComponent } from "../types.js";

export interface SectionHeaderProps {
  readonly title: ReactNode;
  /** Texte de l'action (« Tout voir », « 23 ventes »). */
  readonly action?: ReactNode;
  readonly href?: string;
  readonly Link?: LinkComponent;
  readonly onAction?: () => void;
  readonly className?: string;
  readonly as?: "h2" | "h3";
}

export function SectionHeader({ title, action, href, Link, onAction, className, as: Tag = "h2" }: SectionHeaderProps) {
  const actionClass = "font-ui text-[12.5px] font-semibold text-ink-2 hover:text-ink min-h-[32px] inline-flex items-center focus-thread rounded-md";
  const L = Link ?? "a";
  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <Tag className="font-ui text-[15px] font-bold tracking-[-.01em] text-ink">{title}</Tag>
      {action !== undefined ? (
        href ? (
          <L href={href} className={actionClass}>
            {action}
          </L>
        ) : onAction ? (
          <button type="button" onClick={onAction} className={actionClass}>
            {action}
          </button>
        ) : (
          <span className="font-ui text-[12.5px] font-semibold text-ink-2">{action}</span>
        )
      ) : null}
    </div>
  );
}
