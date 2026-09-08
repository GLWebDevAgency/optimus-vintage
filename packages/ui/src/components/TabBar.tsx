"use client";
import type { ReactNode } from "react";
import { cn } from "../cn.js";
import { AppIcon, type IconName } from "../icons.js";
import type { LinkComponent } from "../types.js";

export interface TabItem {
  readonly key: string;
  readonly label: ReactNode;
  readonly href: string;
  readonly icon: IconName | ReactNode;
  /** Pastille (nombre à synchroniser…). */
  readonly badge?: number | string;
}

export interface TabBarProps {
  /** Quatre onglets : deux à gauche, deux à droite du bouton central. */
  readonly items: readonly [TabItem, TabItem, TabItem, TabItem] | readonly TabItem[];
  readonly activeKey: string;
  /** Bouton central « Chiner ». */
  readonly cta: {
    readonly label: ReactNode;
    readonly href?: string;
    readonly onClick?: () => void;
    readonly icon?: IconName | ReactNode;
    readonly active?: boolean;
  };
  readonly Link?: LinkComponent;
  readonly className?: string;
  /** Position fixe en bas (par défaut). */
  readonly fixed?: boolean;
}

const renderIcon = (icon: IconName | ReactNode, size = 22, strokeWidth = 1.8) =>
  typeof icon === "string" ? (
    <AppIcon name={icon as IconName} size={size} strokeWidth={strokeWidth} />
  ) : (
    icon
  );

/** Barre d'onglets à cinq places : quatre liens et un appareil photo au centre, cerclé d'un fil qui tourne. */
export function TabBar({ items, activeKey, cta, Link, className, fixed = true }: TabBarProps) {
  const L = Link ?? "a";
  const left = items.slice(0, 2);
  const right = items.slice(2, 4);
  const tab = (it: TabItem) => {
    const on = it.key === activeKey;
    return (
      <L
        key={it.key}
        href={it.href}
        aria-current={on ? "page" : undefined}
        className={cn(
          "relative grid min-h-[48px] justify-items-center gap-[3px] rounded-lg pt-1.5 font-ui text-[9.5px] font-semibold uppercase tracking-[.06em] transition-colors duration-state focus-thread",
          on ? "text-ink" : "text-ink-3 hover:text-ink-2",
        )}
      >
        <span className="relative">
          {renderIcon(it.icon)}
          {it.badge !== undefined && it.badge !== 0 ? (
            <span className="absolute -right-2 -top-1 min-w-[16px] rounded-pill bg-thread px-1 text-center font-mono text-[9px] font-medium normal-case tracking-normal text-white">
              {it.badge}
            </span>
          ) : null}
        </span>
        {it.label}
      </L>
    );
  };
  const ctaInner = (
    <>
      <span
        className={cn(
          "relative grid h-[62px] w-[62px] -translate-y-4 place-items-center rounded-full bg-btn text-btn-ink shadow-[0_10px_24px_-10px_rgba(0,0,0,.6)] transition-transform duration-micro group-active:scale-95",
          "after:absolute after:-inset-[5px] after:rounded-full after:border-[1.5px] after:border-dashed after:border-thread after:content-[''] motion-safe:after:animate-spin-slow",
          cta.active && "ring-2 ring-thread ring-offset-2 ring-offset-bg",
        )}
      >
        {renderIcon(cta.icon ?? "camera", 26, 2)}
      </span>
      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap font-ui text-[9.5px] font-bold uppercase tracking-[.08em] text-ink">
        {cta.label}
      </span>
    </>
  );
  const ctaClass =
    "group relative grid min-h-[48px] justify-items-center focus-thread rounded-full";
  return (
    <nav
      aria-label="Navigation principale"
      className={cn(
        "z-40 grid grid-cols-[1fr_1fr_74px_1fr_1fr] items-end border-t border-line bg-bg/95 px-1.5 pt-2 backdrop-blur-md",
        "pb-[calc(12px+var(--safe-bottom))]",
        fixed && "fixed inset-x-0 bottom-0",
        className,
      )}
    >
      {left.map(tab)}
      {cta.href ? (
        <L href={cta.href} className={ctaClass} aria-current={cta.active ? "page" : undefined}>
          {ctaInner}
        </L>
      ) : (
        <button type="button" onClick={cta.onClick} className={ctaClass}>
          {ctaInner}
        </button>
      )}
      {right.map(tab)}
    </nav>
  );
}
