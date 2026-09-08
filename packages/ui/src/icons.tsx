/** Icônes Selvedge — 24 px, trait 1.8, `currentColor`. Tracées à la main, ni remplies ni arrondies à l'excès. */
import type { SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  /** Taille en px (24 par défaut). */
  readonly size?: number;
  /** Épaisseur du trait (1.8 par défaut). */
  readonly strokeWidth?: number;
  readonly title?: string;
}

const paths = {
  home: <path d="M3 11 12 4l9 7v9H3z" />,
  tag: (
    <>
      <path d="M3 12V4h8l10 10-8 8z" />
      <circle cx="7" cy="8" r="1.4" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  layers: <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />,
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  flash: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  gallery: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.6" />
      <path d="m21 16-5-5-8 8" />
    </>
  ),
  check: <path d="m4 12.5 5 5L20 6.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  chevronLeft: <path d="m15 5-7 7 7 7" />,
  chevronDown: <path d="m5 9 7 7 7-7" />,
  chevronUp: <path d="m5 15 7-7 7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8z" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7z" />
      <path d="M19 15c.3 1.8 1 2.5 2.8 2.8-1.8.3-2.5 1-2.8 2.8-.3-1.8-1-2.5-2.8-2.8 1.8-.3 2.5-1 2.8-2.8z" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 3v5h-5" />
    </>
  ),
  cloudOff: (
    <>
      <path d="M7 18h10a4 4 0 0 0 .8-7.9A6 6 0 0 0 7.2 9 4.5 4.5 0 0 0 7 18z" />
      <path d="m3 3 18 18" />
    </>
  ),
  cloud: <path d="M7 18h10a4 4 0 0 0 .8-7.9A6 6 0 0 0 7.2 9 4.5 4.5 0 0 0 7 18z" />,
  arrowRight: <path d="M4 12h16m-6-6 6 6-6 6" />,
  arrowLeft: <path d="M20 12H4m6-6-6 6 6 6" />,
  shirt: <path d="M7 3 9 5h6l2-2 4 4-3 3v11H6V10L3 7z" />,
  hanger: (
    <>
      <path d="M12 4a2 2 0 0 1 2 2c0 1.5-2 1.7-2 3.5" />
      <path d="M12 9.5 3 16v2h18v-2z" />
    </>
  ),
  euro: (
    <>
      <path d="M18 6.5A7 7 0 0 0 7.5 9.5m10.5 8A7 7 0 0 1 7.5 14.5" />
      <path d="M4 10.5h10M4 13.5h10" />
    </>
  ),
  scale: (
    <>
      <path d="M12 3v18M4 7h16" />
      <path d="M7 7 4 14a3 3 0 0 0 6 0zM17 7l-3 7a3 3 0 0 0 6 0z" />
    </>
  ),
  box: (
    <>
      <path d="M3 8 12 3l9 5v9l-9 5-9-5z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z" />
      <path d="M10 21h4" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" />
    </>
  ),
  edit: <path d="m4 20 4-1L19 8l-3-3L5 16zM14 6l3 3" />,
  share: (
    <>
      <path d="M12 3v13M8 7l4-4 4 4" />
      <path d="M5 12v8h14v-8" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 2 21h20z" />
      <path d="M12 10v5M12 18h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  qr: (
    <>
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z" />
      <path d="M14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 18v3" />
    </>
  ),
} as const;

export type IconName = keyof typeof paths;
export const ICON_NAMES = Object.keys(paths) as IconName[];

export function AppIcon({ name, size = 24, strokeWidth = 1.8, title, className, ...rest }: IconProps & { name: IconName }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={className}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {paths[name]}
    </svg>
  );
}

/** Icônes nommées, pratiques en JSX : `<Icons.camera />`. */
export const Icons = Object.fromEntries(
  ICON_NAMES.map((name) => [name, (props: IconProps) => <AppIcon name={name} {...props} />]),
) as Record<IconName, (props: IconProps) => React.JSX.Element>;
