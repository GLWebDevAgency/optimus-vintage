/**
 * 👁️ ITEM DETAIL SCREEN - Read-only Consultation
 * World-class article detail view with photo gallery, stats, timeline & quick actions
 *
 * v1.0 - Vanta-Aether Architecture
 */

import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
import { useVantaTheme, VantaScreen } from "@/components/ui/PremiumUI";
import {
  ItemsRepository,
  LotsRepository,
  SalesRepository,
} from "@/db/repositories";
import { useSettingsStore } from "@/store/settings";
import { useLocale } from "@/utils/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
  type ViewToken,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_HEIGHT = SCREEN_WIDTH * 1.1;
const isIOS = process.env.EXPO_OS === "ios";

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 CURRENCY HELPER
// ═══════════════════════════════════════════════════════════════════════════════

const CURRENCY_MAP: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CHF: "CHF",
  JPY: "¥",
  CAD: "CA$",
};

function useCurrencySymbol() {
  const currency = useSettingsStore((s) => s.currency);
  return CURRENCY_MAP[currency] || "€";
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📸 PHOTO GALLERY
// ═══════════════════════════════════════════════════════════════════════════════

function PhotoGallery({
  photos,
  theme,
}: {
  photos: string[];
  theme: ReturnType<typeof useVantaTheme>;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  if (photos.length === 0) {
    return (
      <View
        style={{
          width: SCREEN_WIDTH,
          height: PHOTO_HEIGHT,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.surfaceCard,
        }}
      >
        <AppIcon name="checkroom" size={80} color={theme.textMuted} />
      </View>
    );
  }

  return (
    <View>
      <Animated.FlatList
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        renderItem={({ item: uri }) => (
          <Image
            source={{ uri }}
            style={{
              width: SCREEN_WIDTH,
              height: PHOTO_HEIGHT,
            }}
            contentFit="cover"
            transition={200}
          />
        )}
        keyExtractor={(_, i) => `photo-${i}`}
      />

      {/* Dots Indicator */}
      {photos.length > 1 && (
        <View
          style={{
            position: "absolute",
            bottom: 16,
            alignSelf: "center",
            flexDirection: "row",
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          }}
        >
          {photos.map((_, i) => (
            <View
              key={i}
              style={{
                width: activeIndex === i ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  activeIndex === i
                    ? "#FFFFFF"
                    : "rgba(255, 255, 255, 0.4)",
                borderCurve: "continuous",
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 STAT PILL
// ═══════════════════════════════════════════════════════════════════════════════

function StatPill({
  icon,
  label,
  value,
  color,
  theme,
}: {
  icon: AppIconName;
  label: string;
  value: string;
  color?: string;
  theme: ReturnType<typeof useVantaTheme>;
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRadius: 16,
        borderCurve: "continuous",
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.borderGlass,
      }}
    >
      <AppIcon
        name={icon}
        size={20}
        color={color || theme.primary}
      />
      <Text
        style={{
          fontFamily: "Manrope_700Bold",
          fontSize: 16,
          color: color || theme.text,
          marginTop: 6,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: "Manrope_500Medium",
          fontSize: 10,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: theme.textMuted,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 INFO ROW
// ═══════════════════════════════════════════════════════════════════════════════

function InfoRow({
  label,
  value,
  icon,
  theme,
  valueColor,
}: {
  label: string;
  value: string;
  icon: AppIconName;
  theme: ReturnType<typeof useVantaTheme>;
  valueColor?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.borderGlass,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.primarySubtle,
          borderCurve: "continuous",
          marginRight: 12,
        }}
      >
        <AppIcon name={icon} size={18} color={theme.primary} />
      </View>
      <Text
        style={{
          flex: 1,
          fontFamily: "Manrope_500Medium",
          fontSize: 14,
          color: theme.textSecondary,
        }}
      >
        {label}
      </Text>
      <Text
        selectable
        style={{
          fontFamily: "Manrope_600SemiBold",
          fontSize: 14,
          color: valueColor || theme.text,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎬 ACTION BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

function ActionButton({
  icon,
  label,
  onPress,
  color,
  bgColor,
  theme,
}: {
  icon: AppIconName;
  label: string;
  onPress: () => void;
  color: string;
  bgColor: string;
  theme: ReturnType<typeof useVantaTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        borderCurve: "continuous",
        backgroundColor: bgColor,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <AppIcon name={icon} size={18} color={color} />
      <Text
        style={{
          fontFamily: "Manrope_700Bold",
          fontSize: 14,
          color,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📱 MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const theme = useVantaTheme();
  const { t } = useLocale();
  const currencySymbol = useCurrencySymbol();
  const locale = useSettingsStore((s) => s.locale);
  const queryClient = useQueryClient();

  const itemId = id ? parseInt(id, 10) : null;

  // ─── Data Queries ──────────────────────────────────────────────────────────

  const itemQuery = useQuery({
    queryKey: ["item", itemId],
    enabled: !!itemId,
    queryFn: () => ItemsRepository.getById(itemId as number),
  });

  const lotQuery = useQuery({
    queryKey: ["lot", itemQuery.data?.lotId],
    enabled: !!itemQuery.data?.lotId,
    queryFn: () => LotsRepository.getById(itemQuery.data!.lotId),
  });

  // Find if this item has been sold
  const salesQuery = useQuery({
    queryKey: ["sales"],
    queryFn: () => SalesRepository.getAll(),
  });

  const itemSale = useMemo(() => {
    if (!salesQuery.data || !itemId) return null;
    return salesQuery.data.find(
      (s) => s.itemId === itemId && s.status === "COMPLETED",
    );
  }, [salesQuery.data, itemId]);

  // ─── Delete Mutation ───────────────────────────────────────────────────────

  const deleteItem = useMutation({
    mutationFn: async () => {
      if (!itemId) throw new Error("No item ID");
      return ItemsRepository.delete(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      if (itemQuery.data?.lotId) {
        queryClient.invalidateQueries({
          queryKey: ["lot-items", itemQuery.data.lotId],
        });
      }
      router.back();
    },
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleEdit = useCallback(() => {
    if (itemId) {
      router.push(`/items/edit/${itemId}`);
    }
  }, [itemId]);

  const handleSell = useCallback(() => {
    if (itemId && itemQuery.data?.lotId) {
      router.push({
        pathname: "/sales/new",
        params: { itemId, lotId: itemQuery.data.lotId },
      });
    }
  }, [itemId, itemQuery.data?.lotId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      t("items.deleteItem"),
      t("items.confirmDelete"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => deleteItem.mutateAsync(),
        },
      ],
    );
  }, [t, deleteItem]);

  const handleViewLot = useCallback(() => {
    if (itemQuery.data?.lotId) {
      router.push(`/lots/${itemQuery.data.lotId}`);
    }
  }, [itemQuery.data?.lotId]);

  const handleViewSale = useCallback(() => {
    if (itemSale) {
      router.push(`/sales/${itemSale.id}`);
    }
  }, [itemSale]);

  // ─── Loading / Error States ────────────────────────────────────────────────

  if (itemQuery.isLoading) {
    return (
      <VantaScreen>
        <Stack.Screen
          options={{
            title: t("items.itemDetails"),
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerShadowVisible: false,
          }}
        />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "Manrope_400Regular",
              fontSize: 14,
              color: theme.textMuted,
            }}
          >
            {t("common.loading")}
          </Text>
        </View>
      </VantaScreen>
    );
  }

  if (!itemQuery.data) {
    return (
      <VantaScreen>
        <Stack.Screen
          options={{
            title: t("items.itemDetails"),
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerShadowVisible: false,
          }}
        />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
              backgroundColor: theme.dangerSubtle,
            }}
          >
            <AppIcon name="error-outline" size={40} color={theme.danger} />
          </View>
          <Text
            style={{
              fontFamily: "Manrope_700Bold",
              fontSize: 20,
              color: theme.text,
            }}
          >
            {t("errors.notFound")}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              marginTop: 24,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: theme.primarySubtle,
            }}
          >
            <Text
              style={{
                fontFamily: "Manrope_600SemiBold",
                fontSize: 14,
                color: theme.primary,
              }}
            >
              {t("common.back")}
            </Text>
          </Pressable>
        </View>
      </VantaScreen>
    );
  }

  // ─── Data ──────────────────────────────────────────────────────────────────

  const item = itemQuery.data;
  const lot = lotQuery.data;
  const photos: string[] = item.photos
    ? JSON.parse(item.photos as string)
    : [];
  const unitCost = parseFloat(String(item.unitCost || 0));
  const isSold = item.status === "SOLD";
  const isOnline = item.status === "ONLINE";

  // Calculate profit if sold
  const salePrice = itemSale
    ? parseFloat(String(itemSale.priceNet))
    : 0;
  const profit = itemSale ? salePrice - unitCost : 0;
  const profitPercent =
    itemSale && unitCost > 0 ? ((profit / unitCost) * 100) : 0;

  // Status config
  const statusConfig = {
    STOCK: {
      color: theme.primary,
      bg: theme.primarySubtle,
      label: t("items.status.stock"),
      icon: "inventory-2" as AppIconName,
    },
    ONLINE: {
      color: theme.info,
      bg: theme.infoSubtle,
      label: t("items.status.online"),
      icon: "public" as AppIconName,
    },
    SOLD: {
      color: theme.success,
      bg: theme.successSubtle,
      label: t("items.status.sold"),
      icon: "check-circle" as AppIconName,
    },
    RETURNED: {
      color: theme.warning,
      bg: theme.warningSubtle,
      label: t("items.status.available"),
      icon: "replay" as AppIconName,
    },
    LOST: {
      color: theme.danger,
      bg: theme.dangerSubtle,
      label: "Lost",
      icon: "error-outline" as AppIconName,
    },
  };

  const status =
    statusConfig[item.status as keyof typeof statusConfig] ||
    statusConfig.STOCK;

  // Condition display
  const conditionKey = item.condition || "good";
  const conditionLabel =
    t(`items.conditions.${conditionKey}`) || item.condition || "-";

  // Date formatting
  const dateLocale =
    locale === "fr" ? "fr-FR" : locale === "de" ? "de-DE" : "en-US";
  const createdAt = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString(dateLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  return (
    <VantaScreen>
      <Stack.Screen
        options={{
          title: "",
          headerTransparent: true,
          headerStyle: { backgroundColor: "transparent" },
          headerTintColor: "#FFFFFF",
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0, 0, 0, 0.4)",
              }}
            >
              <AppIcon name="close" size={20} color="#FFFFFF" />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={handleEdit}
              hitSlop={8}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0, 0, 0, 0.4)",
              }}
            >
              <AppIcon name="edit" size={18} color="#FFFFFF" />
            </Pressable>
          ),
        }}
      />
      <StatusBar style="light" />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* ═══ PHOTO GALLERY ════════════════════════════════════════════════ */}
        <PhotoGallery photos={photos} theme={theme} />

        {/* ═══ CONTENT ════════════════════════════════════════════════════ */}
        <View
          style={{
            marginTop: -24,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: theme.background,
            paddingTop: 24,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 100,
            borderCurve: "continuous",
          }}
        >
          {/* ─── Header: Brand + Status ──────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.delay(50).duration(400)}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                selectable
                style={{
                  fontFamily: "Manrope_800ExtraBold",
                  fontSize: 28,
                  letterSpacing: -0.5,
                  color: theme.text,
                }}
              >
                {item.brand || t("items.unknownBrand")}
              </Text>
              <Text
                style={{
                  fontFamily: "Manrope_400Regular",
                  fontSize: 15,
                  color: theme.textSecondary,
                  marginTop: 4,
                }}
              >
                {item.type || t("items.defaultType")} •{" "}
                {item.size || t("items.defaultSize")}
              </Text>
            </View>

            {/* Status Badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: status.bg,
                borderCurve: "continuous",
              }}
            >
              <AppIcon name={status.icon} size={14} color={status.color} />
              <Text
                style={{
                  fontFamily: "Manrope_600SemiBold",
                  fontSize: 12,
                  letterSpacing: 0.3,
                  color: status.color,
                }}
              >
                {status.label}
              </Text>
            </View>
          </Animated.View>

          {/* ─── Stats Row ─────────────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={{
              flexDirection: "row",
              gap: 10,
              marginBottom: 24,
            }}
          >
            <StatPill
              icon="shopping-bag"
              label={t("items.unitCost")}
              value={`${currencySymbol}${unitCost.toFixed(0)}`}
              theme={theme}
            />
            {isSold && itemSale ? (
              <>
                <StatPill
                  icon="point-of-sale"
                  label={t("sales.priceNet")}
                  value={`${currencySymbol}${salePrice.toFixed(0)}`}
                  color={theme.success}
                  theme={theme}
                />
                <StatPill
                  icon="trending-up"
                  label={t("sales.profit")}
                  value={`${profit >= 0 ? "+" : ""}${currencySymbol}${profit.toFixed(0)}`}
                  color={profit >= 0 ? theme.success : theme.danger}
                  theme={theme}
                />
              </>
            ) : (
              <StatPill
                icon="schedule"
                label={t("items.statusLabel")}
                value={status.label}
                color={status.color}
                theme={theme}
              />
            )}
          </Animated.View>

          {/* ─── Details Section ────────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(400)}
            style={{ marginBottom: 24 }}
          >
            <Text
              style={{
                fontFamily: "Manrope_700Bold",
                fontSize: 13,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: theme.textMuted,
                marginBottom: 8,
              }}
            >
              {t("items.itemDetails")}
            </Text>

            <View
              style={{
                borderRadius: 16,
                borderCurve: "continuous",
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.borderGlass,
                paddingHorizontal: 16,
              }}
            >
              <InfoRow
                icon="sell"
                label={t("items.brand")}
                value={item.brand || "-"}
                theme={theme}
              />
              <InfoRow
                icon="checkroom"
                label={t("items.type")}
                value={item.type || "-"}
                theme={theme}
              />
              <InfoRow
                icon="palette"
                label={t("items.color")}
                value={item.color || "-"}
                theme={theme}
              />
              <InfoRow
                icon="straighten"
                label={t("items.size")}
                value={item.size || "-"}
                theme={theme}
              />
              <InfoRow
                icon="verified"
                label={t("items.condition")}
                value={conditionLabel}
                theme={theme}
              />
              <InfoRow
                icon="shopping-bag"
                label={t("items.unitCost")}
                value={`${currencySymbol}${unitCost.toFixed(2)}`}
                theme={theme}
                valueColor={theme.primary}
              />
              <View style={{ borderBottomWidth: 0 }}>
                <InfoRow
                  icon="event"
                  label={t("common.today")}
                  value={createdAt}
                  theme={theme}
                />
              </View>
            </View>
          </Animated.View>

          {/* ─── Lot Reference ──────────────────────────────────────── */}
          {lot && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={{ marginBottom: 24 }}
            >
              <Text
                style={{
                  fontFamily: "Manrope_700Bold",
                  fontSize: 13,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  color: theme.textMuted,
                  marginBottom: 8,
                }}
              >
                {t("navigation.lots")}
              </Text>

              <Pressable
                onPress={handleViewLot}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  padding: 16,
                  borderRadius: 16,
                  borderCurve: "continuous",
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.borderGlass,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: theme.primarySubtle,
                    borderCurve: "continuous",
                  }}
                >
                  <AppIcon
                    name="inventory-2"
                    size={22}
                    color={theme.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "Manrope_600SemiBold",
                      fontSize: 15,
                      color: theme.text,
                    }}
                  >
                    {lot.name || `Lot #${lot.id}`}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Manrope_400Regular",
                      fontSize: 13,
                      color: theme.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {lot.provider || "-"} •{" "}
                    {new Date(lot.buyDate).toLocaleDateString(dateLocale)}
                  </Text>
                </View>
                <AppIcon
                  name="chevron-right"
                  size={20}
                  color={theme.textMuted}
                />
              </Pressable>
            </Animated.View>
          )}

          {/* ─── Sale Info ──────────────────────────────────────────── */}
          {itemSale && (
            <Animated.View
              entering={FadeInDown.delay(250).duration(400)}
              style={{ marginBottom: 24 }}
            >
              <Text
                style={{
                  fontFamily: "Manrope_700Bold",
                  fontSize: 13,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  color: theme.textMuted,
                  marginBottom: 8,
                }}
              >
                {t("sales.title")}
              </Text>

              <Pressable
                onPress={handleViewSale}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  padding: 16,
                  borderRadius: 16,
                  borderCurve: "continuous",
                  backgroundColor: theme.successSubtle,
                  borderWidth: 1,
                  borderColor: `${theme.success}20`,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: `${theme.success}20`,
                    borderCurve: "continuous",
                  }}
                >
                  <AppIcon
                    name="point-of-sale"
                    size={22}
                    color={theme.success}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "Manrope_600SemiBold",
                      fontSize: 15,
                      color: theme.text,
                    }}
                  >
                    {itemSale.platform || "Vinted"} •{" "}
                    {currencySymbol}
                    {parseFloat(String(itemSale.priceNet)).toFixed(2)}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Manrope_400Regular",
                      fontSize: 13,
                      color: theme.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {new Date(itemSale.saleDate).toLocaleDateString(dateLocale)}{" "}
                    •{" "}
                    <Text
                      style={{
                        color:
                          profit >= 0 ? theme.success : theme.danger,
                        fontFamily: "Manrope_600SemiBold",
                      }}
                    >
                      {profit >= 0 ? "+" : ""}
                      {currencySymbol}
                      {profit.toFixed(2)} ({profitPercent >= 0 ? "+" : ""}
                      {profitPercent.toFixed(0)}%)
                    </Text>
                  </Text>
                </View>
                <AppIcon
                  name="chevron-right"
                  size={20}
                  color={theme.textMuted}
                />
              </Pressable>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* ═══ BOTTOM ACTIONS BAR ═════════════════════════════════════════════ */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          paddingBottom: insets.bottom + 16,
          backgroundColor: theme.background,
          borderTopWidth: 1,
          borderTopColor: theme.borderGlass,
        }}
      >
        <Animated.View
          entering={FadeInUp.delay(300).duration(400)}
          style={{
            flexDirection: "row",
            gap: 10,
          }}
        >
          {!isSold && (
            <ActionButton
              icon="point-of-sale"
              label={t("sales.newSale")}
              onPress={handleSell}
              color={theme.success}
              bgColor={theme.successSubtle}
              theme={theme}
            />
          )}
          <ActionButton
            icon="edit"
            label={t("common.edit")}
            onPress={handleEdit}
            color={theme.primary}
            bgColor={theme.primarySubtle}
            theme={theme}
          />
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              borderRadius: 14,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: theme.dangerSubtle,
              borderCurve: "continuous",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <AppIcon name="delete" size={20} color={theme.danger} />
          </Pressable>
        </Animated.View>
      </View>
    </VantaScreen>
  );
}
