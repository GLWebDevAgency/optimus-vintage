import type { ReactNode } from "react";
import { cn } from "../cn";

export interface EmptyStateProps {
  readonly title: ReactNode;
  readonly body?: ReactNode;
  /** Illustration (SVG, emoji, icône). Par défaut : une étiquette vide. */
  readonly illustration?: ReactNode;
  /** Bouton d'action. */
  readonly action?: ReactNode;
  readonly className?: string;
  readonly compact?: boolean;
}

function EmptyTag() {
  return (
    <svg width="72" height="72" viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M14 6 h36 a6 6 0 0 1 6 6 v40 l-6 6 H14 l-6 -6 V12 a6 6 0 0 1 6 -6z"
        fill="var(--surface)"
        stroke="var(--line-2)"
        strokeWidth="2"
        strokeDasharray="5 4"
      />
      <circle cx="32" cy="15" r="3.5" fill="var(--bg)" stroke="var(--line-2)" strokeWidth="2" />
      <path
        d="M32 11 C 32 2, 44 2, 44 8"
        stroke="var(--thread)"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M16 52 h32" stroke="var(--thread)" strokeWidth="2" strokeDasharray="4 3" />
    </svg>
  );
}

export function EmptyState({
  title,
  body,
  illustration,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "grid justify-items-center gap-3 text-center",
        compact ? "px-4 py-6" : "px-6 py-10",
        className,
      )}
    >
      <div className="text-ink-3">{illustration ?? <EmptyTag />}</div>
      <div className="grid gap-1">
        <h3 className="font-ui text-[17px] font-bold tracking-[-.01em] text-ink">{title}</h3>
        {body ? <p className="max-w-[34ch] text-[13.5px] text-ink-2">{body}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
