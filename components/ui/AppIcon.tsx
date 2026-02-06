import { SymbolView, type SymbolViewProps } from "expo-symbols";
import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Text } from "react-native";

const ICON_MAP = {
  home: { symbol: "house.fill", material: "home" },
  "inventory-2": { symbol: "shippingbox.fill", material: "inventory-2" },
  checkroom: { symbol: "tshirt.fill", material: "checkroom" },
  "point-of-sale": { symbol: "creditcard.fill", material: "point-of-sale" },
  settings: { symbol: "gearshape.fill", material: "settings" },
  "account-balance-wallet": {
    symbol: "wallet.pass.fill",
    material: "account-balance-wallet",
  },
  add: { symbol: "plus", material: "add" },
  "arrow-forward": { symbol: "arrow.right", material: "arrow-forward" },
  "arrow-back": { symbol: "arrow.left", material: "arrow-back" },
  "check-circle": { symbol: "checkmark.circle.fill", material: "check-circle" },
  "emoji-events": { symbol: "trophy.fill", material: "emoji-events" },
  insights: { symbol: "chart.line.uptrend.xyaxis", material: "insights" },
  "keyboard-arrow-down": {
    symbol: "chevron.down",
    material: "keyboard-arrow-down",
  },
  lightbulb: { symbol: "lightbulb.fill", material: "lightbulb" },
  "local-shipping": { symbol: "truck.box.fill", material: "local-shipping" },
  "priority-high": {
    symbol: "exclamationmark.triangle.fill",
    material: "priority-high",
  },
  history: { symbol: "clock.arrow.circlepath", material: "history" },
  "attach-money": {
    symbol: "dollarsign.circle.fill",
    material: "attach-money",
  },
  warning: { symbol: "exclamationmark.triangle.fill", material: "warning" },
  sort: { symbol: "arrow.up.arrow.down", material: "sort" },
  schedule: { symbol: "clock", material: "schedule" },
  "keyboard-arrow-up": { symbol: "chevron.up", material: "keyboard-arrow-up" },
  speed: { symbol: "speedometer", material: "speed" },
  "trending-up": {
    symbol: "chart.line.uptrend.xyaxis",
    material: "trending-up",
  },
  "trending-down": {
    symbol: "chart.line.downtrend.xyaxis",
    material: "trending-down",
  },
  close: { symbol: "xmark", material: "close" },
  folder: { symbol: "folder.fill", material: "folder" },
  search: { symbol: "magnifyingglass", material: "search" },
  "search-off": { symbol: "magnifyingglass", material: "search-off" },
  analytics: { symbol: "chart.bar.fill", material: "analytics" },
  inventory: { symbol: "shippingbox", material: "inventory" },
  sell: { symbol: "tag.fill", material: "sell" },
  receipt: { symbol: "doc.text", material: "receipt" },
  store: { symbol: "building.2.fill", material: "store" },
  person: { symbol: "person.fill", material: "person" },
  "chevron-right": { symbol: "chevron.right", material: "chevron-right" },
  download: { symbol: "arrow.down.circle.fill", material: "download" },
  refresh: { symbol: "arrow.clockwise", material: "refresh" },
  storage: { symbol: "externaldrive.fill", material: "storage" },
  tune: { symbol: "slider.horizontal.3", material: "tune" },
  edit: { symbol: "pencil", material: "edit" },
  "error-outline": {
    symbol: "exclamationmark.circle",
    material: "error-outline",
  },
  shield: { symbol: "shield.fill", material: "shield" },
  "auto-awesome": { symbol: "sparkles", material: "auto-awesome" },
  "edit-note": { symbol: "square.and.pencil", material: "edit-note" },
  remove: { symbol: "minus", material: "remove" },
  "offline-bolt": { symbol: "bolt.slash", material: "offline-bolt" },
  cancel: { symbol: "xmark.circle.fill", material: "cancel" },
  "view-stream": { symbol: "list.bullet", material: "view-stream" },
  "view-agenda": { symbol: "rectangle.grid.1x2", material: "view-agenda" },
  "grid-view": { symbol: "square.grid.2x2", material: "grid-view" },
  "camera-add": { symbol: "camera.badge.plus", material: "add-a-photo" },
  photo: { symbol: "photo", material: "photo" },
  // New icons for Warm Luxury theme
  "expand-more": { symbol: "chevron.down", material: "expand-more" },
  "expand-less": { symbol: "chevron.up", material: "expand-less" },
  today: { symbol: "calendar", material: "today" },
  "date-range": { symbol: "calendar", material: "date-range" },
  "event-note": { symbol: "calendar.badge.clock", material: "event-note" },
  "calendar-today": { symbol: "calendar.circle", material: "calendar-today" },
  "all-inclusive": { symbol: "infinity", material: "all-inclusive" },
  payments: { symbol: "banknote", material: "payments" },
  "add-box": { symbol: "plus.rectangle.fill", material: "add-box" },
  "add-shopping-cart": {
    symbol: "cart.badge.plus",
    material: "add-shopping-cart",
  },
  // Additional utility icons
  "arrow-upward": { symbol: "arrow.up", material: "arrow-upward" },
  "arrow-downward": { symbol: "arrow.down", material: "arrow-downward" },
  "receipt-long": { symbol: "doc.text.fill", material: "receipt-long" },
  // Theme mode icons
  "dark-mode": { symbol: "moon.fill", material: "dark-mode" },
  "light-mode": { symbol: "sun.max.fill", material: "light-mode" },
  smartphone: { symbol: "iphone", material: "smartphone" },
  // Settings icons
  language: { symbol: "globe", material: "language" },
  euro: { symbol: "eurosign.circle.fill", material: "euro-symbol" },
  "currency-exchange": {
    symbol: "arrow.triangle.2.circlepath",
    material: "currency-exchange",
  },
  vibration: { symbol: "waveform", material: "vibration" },
  lock: { symbol: "lock.fill", material: "lock" },
  fingerprint: { symbol: "touchid", material: "fingerprint" },
  // Visibility icons for lot controller
  visibility: { symbol: "eye.fill", material: "visibility" },
  "visibility-off": { symbol: "eye.slash.fill", material: "visibility-off" },
  // Item detail icons
  "shopping-bag": { symbol: "bag.fill", material: "shopping-bag" },
  palette: { symbol: "paintpalette.fill", material: "palette" },
  straighten: { symbol: "ruler.fill", material: "straighten" },
  verified: { symbol: "checkmark.seal.fill", material: "verified" },
  event: { symbol: "calendar", material: "event" },
  delete: { symbol: "trash.fill", material: "delete" },
  public: { symbol: "globe", material: "public" },
  replay: { symbol: "arrow.counterclockwise", material: "replay" },
} as const;

export type AppIconName = keyof typeof ICON_MAP;

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function AppIcon({
  name,
  size = 24,
  color,
  style,
  accessibilityLabel,
}: AppIconProps) {
  const icon = ICON_MAP[name];
  const fallbackLabel = icon.material
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 1)
    .toUpperCase();

  return (
    <SymbolView
      name={icon.symbol as SymbolViewProps["name"]}
      size={size}
      tintColor={color}
      style={style}
      accessibilityLabel={accessibilityLabel}
      fallback={
        <Text
          style={{
            color,
            fontSize: Math.max(10, Math.round(size * 0.6)),
            fontWeight: "700",
          }}
          accessibilityLabel={accessibilityLabel}
        >
          {fallbackLabel}
        </Text>
      }
    />
  );
}
