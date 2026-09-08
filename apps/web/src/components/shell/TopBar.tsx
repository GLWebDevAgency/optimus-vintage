import Link from "next/link";
import type { ReactNode } from "react";
import { SyncBadge } from "@/components/offline/SyncBadge";
import { IconChevronLeft } from "@/components/ui/Icons";
import { AvatarLink } from "./AvatarLink";

interface TopBarProps {
  title: ReactNode;
  /** Ligne mono au-dessus du titre (date, SKU, contexte). */
  kicker?: ReactNode;
  /** Lien de retour : affiche un chevron à gauche. */
  back?: "/app" | "/app/stock" | "/app/ventes" | "/app/sources";
  actions?: ReactNode;
  /** Avatar → réglages (masqué sur les écrans de détail). */
  avatar?: boolean;
  className?: string;
}

/** Barre supérieure collante : contexte en mono, titre en grotesque serrée, pastille de sync, avatar. */
export function TopBar({ title, kicker, back, actions, avatar = true, className }: TopBarProps) {
  return (
    <header className={["topbar", className].filter(Boolean).join(" ")}>
      <div className="topbar-in">
        <div className="topbar-l">
          {back ? (
            <Link href={back} className="topbar-back touch" aria-label="Retour">
              <IconChevronLeft />
            </Link>
          ) : null}
          <div className="min-w-0">
            {kicker ? <div className="label truncate">{kicker}</div> : null}
            <h1 className="topbar-title">{title}</h1>
          </div>
        </div>
        <div className="topbar-r">
          <SyncBadge />
          {actions}
          {avatar ? <AvatarLink /> : null}
        </div>
      </div>
    </header>
  );
}
