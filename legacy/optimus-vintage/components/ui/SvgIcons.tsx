/**
 * 🎨 SVG ICONS - Framer Style Icons
 *
 * Icônes SVG personnalisées inspirées du style Framer
 * Toutes les icônes utilisent un viewBox de 24x24
 *
 * Usage:
 * <SvgIcon name="arrow-down" size={24} color="#FF6B35" />
 */

import React from "react";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type SvgIconName =
  | "arrow-down"
  | "arrow-up"
  | "arrow-left"
  | "arrow-right"
  | "chevron-down"
  | "chevron-up"
  | "chevron-left"
  | "chevron-right"
  | "home"
  | "box"
  | "shirt"
  | "tag"
  | "settings"
  | "wallet"
  | "plus"
  | "minus"
  | "check"
  | "close"
  | "search"
  | "chart"
  | "trending-up"
  | "trending-down"
  | "dollar"
  | "clock"
  | "calendar"
  | "star"
  | "heart"
  | "truck"
  | "camera"
  | "photo"
  | "trash"
  | "edit"
  | "refresh"
  | "download"
  | "upload"
  | "filter"
  | "sort"
  | "menu"
  | "more"
  | "user"
  | "folder"
  | "document"
  | "warning"
  | "info"
  | "success"
  | "error";

export interface SvgIconProps {
  name: SvgIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  opacity?: number;
  style?: object;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 ICON PATHS (Framer-style, stroke-based)
// ═══════════════════════════════════════════════════════════════════════════════

const iconPaths: Record<
  SvgIconName,
  (props: { color: string; strokeWidth: number }) => React.ReactNode
> = {
  // Navigation arrows
  "arrow-down": ({ color, strokeWidth }) => (
    <Path
      d="M12 5v14M19 12l-7 7-7-7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  "arrow-up": ({ color, strokeWidth }) => (
    <Path
      d="M12 19V5M5 12l7-7 7 7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  "arrow-left": ({ color, strokeWidth }) => (
    <Path
      d="M19 12H5M12 19l-7-7 7-7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  "arrow-right": ({ color, strokeWidth }) => (
    <Path
      d="M5 12h14M12 5l7 7-7 7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),

  // Chevrons
  "chevron-down": ({ color, strokeWidth }) => (
    <Path
      d="M6 9l6 6 6-6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  "chevron-up": ({ color, strokeWidth }) => (
    <Path
      d="M18 15l-6-6-6 6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  "chevron-left": ({ color, strokeWidth }) => (
    <Path
      d="M15 18l-6-6 6-6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  "chevron-right": ({ color, strokeWidth }) => (
    <Path
      d="M9 18l6-6-6-6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),

  // Navigation
  home: ({ color, strokeWidth }) => (
    <G>
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M9 22V12h6v10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),

  // Inventory
  box: ({ color, strokeWidth }) => (
    <G>
      <Path
        d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),

  // Clothing
  shirt: ({ color, strokeWidth }) => (
    <Path
      d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),

  // Sales
  tag: ({ color, strokeWidth }) => (
    <G>
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx="7" cy="7" r="1" fill={color} />
    </G>
  ),

  // Settings
  settings: ({ color, strokeWidth }) => (
    <G>
      <Circle
        cx="12"
        cy="12"
        r="3"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),

  // Wallet
  wallet: ({ color, strokeWidth }) => (
    <G>
      <Rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="2"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Path
        d="M22 10H18a2 2 0 000 4h4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx="18" cy="12" r="1" fill={color} />
    </G>
  ),

  // Actions
  plus: ({ color, strokeWidth }) => (
    <Path
      d="M12 5v14M5 12h14"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  minus: ({ color, strokeWidth }) => (
    <Path
      d="M5 12h14"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  check: ({ color, strokeWidth }) => (
    <Path
      d="M20 6L9 17l-5-5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  close: ({ color, strokeWidth }) => (
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),

  // Search
  search: ({ color, strokeWidth }) => (
    <G>
      <Circle
        cx="11"
        cy="11"
        r="8"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Path
        d="M21 21l-4.35-4.35"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),

  // Analytics
  chart: ({ color, strokeWidth }) => (
    <G>
      <Path
        d="M18 20V10M12 20V4M6 20v-6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),
  "trending-up": ({ color, strokeWidth }) => (
    <Path
      d="M23 6l-9.5 9.5-5-5L1 18M23 6h-6M23 6v6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  "trending-down": ({ color, strokeWidth }) => (
    <Path
      d="M23 18l-9.5-9.5-5 5L1 6M23 18h-6M23 18v-6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),

  // Money
  dollar: ({ color, strokeWidth }) => (
    <G>
      <Path
        d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),

  // Time
  clock: ({ color, strokeWidth }) => (
    <G>
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Path
        d="M12 6v6l4 2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),
  calendar: ({ color, strokeWidth }) => (
    <G>
      <Rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Path
        d="M16 2v4M8 2v4M3 10h18"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),

  // Favorites
  star: ({ color, strokeWidth }) => (
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  heart: ({ color, strokeWidth }) => (
    <Path
      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),

  // Shipping
  truck: ({ color, strokeWidth }) => (
    <G>
      <Rect
        x="1"
        y="3"
        width="15"
        height="13"
        rx="1"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Path
        d="M16 8h4l3 3v5h-7V8z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle
        cx="5.5"
        cy="18.5"
        r="2.5"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx="18.5"
        cy="18.5"
        r="2.5"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
    </G>
  ),

  // Media
  camera: ({ color, strokeWidth }) => (
    <G>
      <Path
        d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle
        cx="12"
        cy="13"
        r="4"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
    </G>
  ),
  photo: ({ color, strokeWidth }) => (
    <G>
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
      <Path
        d="M21 15l-5-5L5 21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),

  // File operations
  trash: ({ color, strokeWidth }) => (
    <G>
      <Path
        d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M10 11v6M14 11v6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),
  edit: ({ color, strokeWidth }) => (
    <Path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  refresh: ({ color, strokeWidth }) => (
    <G>
      <Path
        d="M23 4v6h-6M1 20v-6h6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),
  download: ({ color, strokeWidth }) => (
    <G>
      <Path
        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M7 10l5 5 5-5M12 15V3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),
  upload: ({ color, strokeWidth }) => (
    <G>
      <Path
        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M17 8l-5-5-5 5M12 3v12"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),

  // Filter & Sort
  filter: ({ color, strokeWidth }) => (
    <Path
      d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  sort: ({ color, strokeWidth }) => (
    <Path
      d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),

  // Menu
  menu: ({ color, strokeWidth }) => (
    <Path
      d="M3 12h18M3 6h18M3 18h18"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  more: ({ color, strokeWidth }) => (
    <G>
      <Circle cx="12" cy="12" r="1" fill={color} />
      <Circle cx="19" cy="12" r="1" fill={color} />
      <Circle cx="5" cy="12" r="1" fill={color} />
    </G>
  ),

  // User
  user: ({ color, strokeWidth }) => (
    <G>
      <Circle
        cx="12"
        cy="7"
        r="4"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),

  // Files
  folder: ({ color, strokeWidth }) => (
    <Path
      d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  document: ({ color, strokeWidth }) => (
    <G>
      <Path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),

  // Status
  warning: ({ color, strokeWidth }) => (
    <G>
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M12 9v4M12 17h.01"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),
  info: ({ color, strokeWidth }) => (
    <G>
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Path
        d="M12 16v-4M12 8h.01"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),
  success: ({ color, strokeWidth }) => (
    <G>
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),
  error: ({ color, strokeWidth }) => (
    <G>
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Path
        d="M15 9l-6 6M9 9l6 6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function SvgIcon({
  name,
  size = 24,
  color = "#0A1628",
  strokeWidth = 2,
  opacity = 1,
  style,
}: SvgIconProps) {
  const renderIcon = iconPaths[name];

  if (!renderIcon) {
    console.warn(`SvgIcon: Unknown icon name "${name}"`);
    return null;
  }

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={[{ opacity }, style]}
    >
      {renderIcon({ color, strokeWidth })}
    </Svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 PRESET ICON VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

// Tab bar icons (slightly thicker stroke)
export function TabIcon({
  name,
  size = 24,
  color = "#0A1628",
  focused = false,
}: {
  name: SvgIconName;
  size?: number;
  color?: string;
  focused?: boolean;
}) {
  return (
    <SvgIcon
      name={name}
      size={size}
      color={color}
      strokeWidth={focused ? 2.5 : 2}
      opacity={focused ? 1 : 0.7}
    />
  );
}

// Action button icons (thinner stroke)
export function ActionIcon({
  name,
  size = 20,
  color = "#FF6B35",
}: {
  name: SvgIconName;
  size?: number;
  color?: string;
}) {
  return <SvgIcon name={name} size={size} color={color} strokeWidth={1.5} />;
}

// Status icons with semantic colors
export function StatusIcon({
  status,
  size = 20,
}: {
  status: "success" | "warning" | "error" | "info";
  size?: number;
}) {
  const colors = {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  };

  return (
    <SvgIcon name={status} size={size} color={colors[status]} strokeWidth={2} />
  );
}

export default SvgIcon;
