"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCamera, IconHome, IconSales, IconSources, IconStock } from "@/components/ui/Icons";

interface Tab {
  href: "/app" | "/app/stock" | "/app/ventes" | "/app/sources";
  label: string;
  Icon: typeof IconHome;
  exact?: boolean;
}

const LEFT: readonly Tab[] = [
  { href: "/app", label: "Aujourd'hui", Icon: IconHome, exact: true },
  { href: "/app/stock", label: "Stock", Icon: IconStock },
];
const RIGHT: readonly Tab[] = [
  { href: "/app/ventes", label: "Ventes", Icon: IconSales },
  { href: "/app/sources", label: "Sources", Icon: IconSources },
];

function isActive(pathname: string, tab: Tab): boolean {
  if (tab.exact) return pathname === tab.href;
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

function TabLink({ tab, active }: { tab: Tab; active: boolean }) {
  return (
    <Link
      href={tab.href}
      className={`tb${active ? " on" : ""}`}
      aria-current={active ? "page" : undefined}
      prefetch
    >
      <tab.Icon />
      <span>{tab.label}</span>
    </Link>
  );
}

/**
 * Barre d'onglets : quatre destinations et, au centre, le geste principal — Chiner —
 * un bouton encre cerclé d'un fil rouge pointillé qui tourne lentement.
 */
export function TabBar() {
  const pathname = usePathname();
  const chinerActive = pathname.startsWith("/app/chiner");
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      {LEFT.map((t) => (
        <TabLink key={t.href} tab={t} active={isActive(pathname, t)} />
      ))}
      <div className="cta-slot">
        <Link
          href="/app/chiner"
          className={`cta${chinerActive ? " on" : ""}`}
          aria-label="Chiner — ajouter une pièce"
          aria-current={chinerActive ? "page" : undefined}
        >
          <IconCamera />
        </Link>
        <span className="cta-l" aria-hidden="true">
          Chiner
        </span>
      </div>
      {RIGHT.map((t) => (
        <TabLink key={t.href} tab={t} active={isActive(pathname, t)} />
      ))}
    </nav>
  );
}
