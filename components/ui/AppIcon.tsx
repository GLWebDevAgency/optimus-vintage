import { Feather } from "@expo/vector-icons";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Platform, Text } from "react-native";

const ICON_MAP = {
  home: { symbol: "house.fill", feather: "home" },
  "inventory-2": { symbol: "shippingbox.fill", feather: "package" },
  checkroom: { symbol: "tshirt.fill", feather: "tag" },
  "point-of-sale": { symbol: "creditcard.fill", feather: "credit-card" },
  settings: { symbol: "gearshape.fill", feather: "settings" },
  "account-balance-wallet": {
    symbol: "wallet.pass.fill",
    feather: "credit-card",
  },
  add: { symbol: "plus", feather: "plus" },
  "arrow-forward": { symbol: "arrow.right", feather: "arrow-right" },
  "arrow-back": { symbol: "arrow.left", feather: "arrow-left" },
  "check-circle": { symbol: "checkmark.circle.fill", feather: "check-circle" },
  "emoji-events": { symbol: "trophy.fill", feather: "award" },
  insights: { symbol: "chart.line.uptrend.xyaxis", feather: "trending-up" },
  "keyboard-arrow-down": {
    symbol: "chevron.down",
    feather: "chevron-down",
  },
  lightbulb: { symbol: "lightbulb.fill", feather: "zap" },
  "local-shipping": { symbol: "truck.box.fill", feather: "truck" },
  "priority-high": {
    symbol: "exclamationmark.triangle.fill",
    feather: "alert-triangle",
  },
  history: { symbol: "clock.arrow.circlepath", feather: "clock" },
  "attach-money": {
    symbol: "dollarsign.circle.fill",
    feather: "dollar-sign",
  },
  warning: {
    symbol: "exclamationmark.triangle.fill",
    feather: "alert-triangle",
  },
  sort: { symbol: "arrow.up.arrow.down", feather: "filter" },
  schedule: { symbol: "clock", feather: "clock" },
  "keyboard-arrow-up": { symbol: "chevron.up", feather: "chevron-up" },
  speed: { symbol: "speedometer", feather: "activity" },
  "trending-up": {
    symbol: "chart.line.uptrend.xyaxis",
    feather: "trending-up",
  },
  "trending-down": {
    symbol: "chart.line.downtrend.xyaxis",
    feather: "trending-down",
  },
  close: { symbol: "xmark", feather: "x" },
  folder: { symbol: "folder.fill", feather: "folder" },
  search: { symbol: "magnifyingglass", feather: "search" },
  "search-off": { symbol: "magnifyingglass", feather: "search" },
  analytics: { symbol: "chart.bar.fill", feather: "bar-chart-2" },
  inventory: { symbol: "shippingbox", feather: "box" },
  sell: { symbol: "tag.fill", feather: "tag" },
  receipt: { symbol: "doc.text", feather: "file-text" },
  store: { symbol: "building.2.fill", feather: "shopping-bag" },
  person: { symbol: "person.fill", feather: "user" },
  "chevron-right": { symbol: "chevron.right", feather: "chevron-right" },
  download: { symbol: "arrow.down.circle.fill", feather: "download" },
  refresh: { symbol: "arrow.clockwise", feather: "refresh-cw" },
  storage: { symbol: "externaldrive.fill", feather: "hard-drive" },
  tune: { symbol: "slider.horizontal.3", feather: "sliders" },
  edit: { symbol: "pencil", feather: "edit-2" },
  "error-outline": {
    symbol: "exclamationmark.circle",
    feather: "alert-circle",
  },
  shield: { symbol: "shield.fill", feather: "shield" },
  "auto-awesome": { symbol: "sparkles", feather: "star" },
  "edit-note": { symbol: "square.and.pencil", feather: "edit-3" },
  remove: { symbol: "minus", feather: "minus" },
  "offline-bolt": { symbol: "bolt.slash", feather: "zap-off" },
  cancel: { symbol: "xmark.circle.fill", feather: "x-circle" },
  "view-stream": { symbol: "list.bullet", feather: "list" },
  "view-agenda": { symbol: "rectangle.grid.1x2", feather: "layout" },
  "grid-view": { symbol: "square.grid.2x2", feather: "grid" },
  "camera-add": { symbol: "camera.badge.plus", feather: "camera" },
  photo: { symbol: "photo", feather: "image" },
  // Warm Luxury theme icons
  "expand-more": { symbol: "chevron.down", feather: "chevron-down" },
  "expand-less": { symbol: "chevron.up", feather: "chevron-up" },
  today: { symbol: "calendar", feather: "calendar" },
  "date-range": { symbol: "calendar", feather: "calendar" },
  "event-note": { symbol: "calendar.badge.clock", feather: "calendar" },
  "calendar-today": { symbol: "calendar.circle", feather: "calendar" },
  "all-inclusive": { symbol: "infinity", feather: "repeat" },
  payments: { symbol: "banknote", feather: "credit-card" },
  "add-box": { symbol: "plus.rectangle.fill", feather: "plus-square" },
  "add-shopping-cart": {
    symbol: "cart.badge.plus",
    feather: "shopping-cart",
  },
  // Additional utility icons
  "arrow-upward": { symbol: "arrow.up", feather: "arrow-up" },
  "arrow-downward": { symbol: "arrow.down", feather: "arrow-down" },
  "receipt-long": { symbol: "doc.text.fill", feather: "file-text" },
  // Theme mode icons
  "dark-mode": { symbol: "moon.fill", feather: "moon" },
  "light-mode": { symbol: "sun.max.fill", feather: "sun" },
  smartphone: { symbol: "iphone", feather: "smartphone" },
  // Settings icons
  language: { symbol: "globe", feather: "globe" },
  euro: { symbol: "eurosign.circle.fill", feather: "dollar-sign" },
  "currency-exchange": {
    symbol: "arrow.triangle.2.circlepath",
    feather: "refresh-cw",
  },
  vibration: { symbol: "waveform", feather: "smartphone" },
  lock: { symbol: "lock.fill", feather: "lock" },
  fingerprint: { symbol: "touchid", feather: "key" },
  // Visibility icons for lot controller
  visibility: { symbol: "eye.fill", feather: "eye" },
  "visibility-off": { symbol: "eye.slash.fill", feather: "eye-off" },
  // Item detail icons
  "shopping-bag": { symbol: "bag.fill", feather: "shopping-bag" },
  palette: { symbol: "paintpalette.fill", feather: "droplet" },
  straighten: { symbol: "ruler.fill", feather: "maximize-2" },
  verified: { symbol: "checkmark.seal.fill", feather: "check-circle" },
  event: { symbol: "calendar", feather: "calendar" },
  delete: { symbol: "trash.fill", feather: "trash-2" },
  public: { symbol: "globe", feather: "globe" },
  replay: { symbol: "arrow.counterclockwise", feather: "rotate-ccw" },
  // Gamification & sharing icons
  "local-fire-department": { symbol: "flame.fill", feather: "zap" },
  "photo-camera": { symbol: "camera.fill", feather: "camera" },
  "bar-chart": { symbol: "chart.bar.fill", feather: "bar-chart-2" },
  "thumb-up": { symbol: "hand.thumbsup.fill", feather: "thumbs-up" },
  share: { symbol: "square.and.arrow.up", feather: "share" },
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

  // Android & Web: use Feather icons (SF Symbols not available)
  if (Platform.OS !== "ios") {
    return (
      <Feather
        name={icon.feather as keyof typeof Feather.glyphMap}
        size={size}
        color={color}
        style={style}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  // iOS: use native SF Symbols via SymbolView
  const fallbackLabel = icon.feather
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
