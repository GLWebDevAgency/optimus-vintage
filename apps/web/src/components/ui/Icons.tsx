import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number, rest: SVGProps<SVGSVGElement>) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...rest,
});

export const IconHome = ({ size = 22, ...r }: IconProps) => (
  <svg {...base(size, r)}>
    <path d="M3 11 12 4l9 7v9H3z" />
  </svg>
);
export const IconStock = ({ size = 22, ...r }: IconProps) => (
  <svg {...base(size, r)}>
    <path d="M3 12V4h8l10 10-8 8z" />
    <circle cx="7" cy="8" r="1.4" />
  </svg>
);
export const IconCamera = ({ size = 26, ...r }: IconProps) => (
  <svg {...base(size, { strokeWidth: 2, ...r })}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);
export const IconSales = ({ size = 22, ...r }: IconProps) => (
  <svg {...base(size, r)}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);
export const IconSources = ({ size = 22, ...r }: IconProps) => (
  <svg {...base(size, r)}>
    <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
  </svg>
);
export const IconShirt = ({ size = 18, ...r }: IconProps) => (
  <svg {...base(size, r)}>
    <path d="M7 3 9 5h6l2-2 4 4-3 3v11H6V10L3 7z" />
  </svg>
);
export const IconPin = ({ size = 14, ...r }: IconProps) => (
  <svg {...base(size, { strokeWidth: 2, ...r })}>
    <path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
export const IconChevronLeft = ({ size = 22, ...r }: IconProps) => (
  <svg {...base(size, { strokeWidth: 2, ...r })}>
    <path d="m15 5-7 7 7 7" />
  </svg>
);
export const IconChevronRight = ({ size = 18, ...r }: IconProps) => (
  <svg {...base(size, { strokeWidth: 2, ...r })}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);
export const IconPlus = ({ size = 20, ...r }: IconProps) => (
  <svg {...base(size, { strokeWidth: 2, ...r })}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconOffline = ({ size = 18, ...r }: IconProps) => (
  <svg {...base(size, r)}>
    <path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0" />
    <circle cx="12" cy="19" r="1" fill="currentColor" />
    <path d="m3 3 18 18" />
  </svg>
);
export const IconSpark = ({ size = 18, ...r }: IconProps) => (
  <svg {...base(size, r)}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
  </svg>
);
export const IconCheck = ({ size = 16, ...r }: IconProps) => (
  <svg {...base(size, { strokeWidth: 2.2, ...r })}>
    <path d="m5 12 4.5 4.5L19 7" />
  </svg>
);
