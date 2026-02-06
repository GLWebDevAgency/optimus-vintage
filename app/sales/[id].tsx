/**
 * 📜 SALE DETAIL SCREEN - Vanta-Aether Edition
 * Shows sale details with cancel/refund option
 *
 * v2.0 - Enhanced with Vanta premium components
 */

import { AppIcon } from "@/components/ui/AppIcon";
import {
    useVantaTheme,
    VantaScreen
} from "@/components/ui/PremiumUI";
import { ItemsRepository, SalesRepository } from "@/db/repositories";
import { useSettingsStore } from "@/store/settings";
import { useLocale } from "@/utils/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const theme = useVantaTheme();
  const colors = {
    background: theme.background,
    surface: theme.surface,
    surfaceCard: theme.surfaceCard,
    gold: theme.primary,
    goldSubtle: theme.primarySubtle,
    text: theme.text,
    textSecondary: theme.textSecondary,
    textMuted: theme.textMuted,
    border: theme.borderGlass,
    success: theme.success,
    successSubtle: theme.successSubtle,
    danger: theme.danger,
    dangerSubtle: theme.dangerSubtle,
    warning: theme.warning,
    warningSubtle: theme.warningSubtle,
  };
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const currency = useSettingsStore((s) => s.currency);
  const currencySymbol = { EUR: "€", USD: "$", GBP: "£", CHF: "CHF", JPY: "¥", CAD: "CA$" }[currency] || "€";
  const locale = useSettingsStore((s) => s.locale);

  const saleId = id ? parseInt(id, 10) : null;

  // Fetch sale data
  const saleQuery = useQuery({
    queryKey: ["sale", saleId],
    enabled: !!saleId,
    queryFn: () => SalesRepository.getById(saleId as number),
  });

  // Fetch linked item if exists
  const itemQuery = useQuery({
    queryKey: ["item", saleQuery.data?.itemId],
    enabled: !!saleQuery.data?.itemId,
    queryFn: () => ItemsRepository.getById(saleQuery.data!.itemId as number),
  });

  // Cancel mutation
  const cancelSale = useMutation({
    mutationFn: async () => {
      if (!saleId) throw new Error("No sale ID");
      return SalesRepository.cancel(saleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale", saleId] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      if (saleQuery.data?.lotId) {
        queryClient.invalidateQueries({
          queryKey: ["lot-detail", saleQuery.data.lotId],
        });
      }
    },
  });

  const handleCancel = () => {
    if (saleQuery.data?.status !== "COMPLETED") {
      Alert.alert(t("common.error"), t("sales.alreadyCancelled"));
      return;
    }

    Alert.alert(
      t("sales.cancelSale"),
      t("sales.cancelSaleConfirm"),
      [
        { text: t("sales.keepSale"), style: "cancel" },
        {
          text: t("sales.cancelSale"),
          style: "destructive",
          onPress: async () => {
            try {
              await cancelSale.mutateAsync();
              Alert.alert(
                t("sales.saleCancelled"),
                t("sales.itemReturnedToStock"),
                [{ text: "OK", onPress: () => router.back() }],
              );
            } catch (e) {
              console.error(e);
              Alert.alert(t("common.error"), t("sales.cancelError"));
            }
          },
        },
      ],
    );
  };

  // Loading state
  if (saleQuery.isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.gold} />
        <Text
          style={{
            fontFamily: "Manrope_400Regular",
            fontSize: 14,
            color: colors.textMuted,
            marginTop: 16,
          }}
        >
          {t("common.loading")}
        </Text>
      </View>
    );
  }

  // Error state
  if (!saleQuery.data) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          backgroundColor: colors.background,
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
            borderCurve: "continuous",
            backgroundColor: colors.dangerSubtle,
          }}
        >
          <AppIcon name="error-outline" size={40} color={colors.danger} />
        </View>
        <Text
          style={{
            fontFamily: "Manrope_700Bold",
            fontSize: 20,
            color: colors.text,
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
            backgroundColor: colors.goldSubtle,
          }}
        >
          <Text
            style={{
              fontFamily: "Manrope_600SemiBold",
              fontSize: 14,
              color: colors.gold,
            }}
          >
            {t("common.back")}
          </Text>
        </Pressable>
      </View>
    );
  }

  const sale = saleQuery.data;
  const item = itemQuery.data;
  const isCompleted = sale.status === "COMPLETED";
  const isCancelled = sale.status === "CANCELLED";

  const priceGross = parseFloat(String(sale.priceGross));
  const platformFees = parseFloat(String(sale.platformFees || 0));
  const shippingFees = parseFloat(String(sale.shippingFees || 0));
  const miscFees = parseFloat(String(sale.miscFees || 0));
  const priceNet = parseFloat(String(sale.priceNet));
  const itemCost = item ? parseFloat(String(item.unitCost || 0)) : 0;
  const realProfit = priceNet - itemCost;

  return (
    <VantaScreen>
      <Stack.Screen
        options={{
          title: t("sales.saleDetails"),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <AppIcon name="close" size={24} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <StatusBar style={theme.dark ? "light" : "dark"} />

      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 120,
        }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Status Header */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          style={{ alignItems: "center", marginBottom: 24 }}
        >
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
              borderCurve: "continuous",
              backgroundColor: isCompleted
                ? colors.successSubtle
                : isCancelled
                  ? colors.dangerSubtle
                  : colors.warningSubtle,
            }}
          >
            <AppIcon
              name={
                isCompleted
                  ? "check-circle"
                  : isCancelled
                    ? "cancel"
                    : "schedule"
              }
              size={36}
              color={
                isCompleted
                  ? colors.success
                  : isCancelled
                    ? colors.danger
                    : colors.warning
              }
            />
          </View>
          <Text
            style={{
              fontFamily: "Manrope_700Bold",
              fontSize: 24,
              color: colors.text,
            }}
          >
            {isCompleted ? t("sales.status.completed") : sale.status}
          </Text>
          <Text
            style={{
              fontFamily: "Manrope_400Regular",
              fontSize: 14,
              color: colors.textMuted,
            }}
          >
            {new Date(sale.saleDate).toLocaleDateString(locale === "fr" ? "fr-FR" : locale === "de" ? "de-DE" : "en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </Animated.View>

        {/* Amount Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View
            style={{
              alignItems: "center",
              paddingVertical: 24,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontFamily: "Manrope_500Medium",
                fontSize: 11,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: colors.textMuted,
              }}
            >
              {t("sales.priceNet")}
            </Text>
            <Text
              style={{
                fontFamily: "Manrope_700Bold",
                fontSize: 48,
                color: isCompleted ? colors.success : colors.textMuted,
                textDecorationLine: isCancelled ? "line-through" : "none",
              }}
            >
              {currencySymbol}{priceNet.toFixed(2)}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                marginTop: 16,
                borderCurve: "continuous",
                backgroundColor: colors.goldSubtle,
              }}
            >
              <AppIcon name="store" size={14} color={colors.gold} />
              <Text
                style={{
                  fontFamily: "Manrope_500Medium",
                  fontSize: 11,
                  letterSpacing: 0.5,
                  color: colors.gold,
                }}
              >
                {sale.platform || "Vinted"}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Breakdown */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={{ marginBottom: 24 }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: "Manrope_600SemiBold",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 8,
              color: colors.textSecondary,
            }}
          >
            {t("sales.saleDetails")}
          </Text>
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "Manrope_400Regular",
                  fontSize: 16,
                  color: colors.text,
                }}
              >
                {t("sales.priceGross")}
              </Text>
              <Text
                style={{
                  fontFamily: "Manrope_600SemiBold",
                  fontSize: 16,
                  fontVariant: ["tabular-nums"],
                  color: colors.text,
                }}
              >
                {currencySymbol}{priceGross.toFixed(2)}
              </Text>
            </View>
            <View
              style={{
                height: 1,
                marginVertical: 8,
                backgroundColor: colors.border,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "Manrope_400Regular",
                  fontSize: 14,
                  color: colors.textMuted,
                }}
              >
                {t("sales.platformFees")}
              </Text>
              <Text
                style={{
                  fontFamily: "Manrope_600SemiBold",
                  fontSize: 14,
                  fontVariant: ["tabular-nums"],
                  color: colors.danger,
                }}
              >
                -{currencySymbol}{platformFees.toFixed(2)}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "Manrope_400Regular",
                  fontSize: 14,
                  color: colors.textMuted,
                }}
              >
                {t("sales.shippingFees")}
              </Text>
              <Text
                style={{
                  fontFamily: "Manrope_600SemiBold",
                  fontSize: 14,
                  fontVariant: ["tabular-nums"],
                  color: colors.danger,
                }}
              >
                -{currencySymbol}{shippingFees.toFixed(2)}
              </Text>
            </View>
            {miscFees > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Manrope_400Regular",
                    fontSize: 14,
                    color: colors.textMuted,
                  }}
                >
                  {t("lots.additionalFees")}
                </Text>
                <Text
                  style={{
                    fontFamily: "Manrope_600SemiBold",
                    fontSize: 14,
                    fontVariant: ["tabular-nums"],
                    color: colors.danger,
                  }}
                >
                  -{currencySymbol}{miscFees.toFixed(2)}
                </Text>
              </View>
            )}
            <View
              style={{
                height: 1,
                marginVertical: 8,
                backgroundColor: colors.border,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "Manrope_700Bold",
                  fontSize: 16,
                  color: colors.text,
                }}
              >
                {t("sales.profit")}
              </Text>
              <Text
                style={{
                  fontFamily: "Manrope_700Bold",
                  fontSize: 16,
                  fontVariant: ["tabular-nums"],
                  color: realProfit >= 0 ? colors.success : colors.danger,
                }}
              >
                {realProfit >= 0 ? "+" : ""}{currencySymbol}{realProfit.toFixed(2)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Item Info */}
        {item && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={{ marginBottom: 24 }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Manrope_600SemiBold",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 8,
                color: colors.textSecondary,
              }}
            >
              {t("items.title")}
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  justifyContent: "center",
                  alignItems: "center",
                  borderCurve: "continuous",
                  backgroundColor: colors.goldSubtle,
                }}
              >
                <AppIcon name="checkroom" size={24} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "Manrope_700Bold",
                    fontSize: 14,
                    color: colors.text,
                  }}
                >
                  {item.brand || t("items.unknownBrand")}
                </Text>
                <Text
                  style={{
                    fontFamily: "Manrope_400Regular",
                    fontSize: 14,
                    color: colors.textMuted,
                  }}
                >
                  {item.type || t("items.defaultType")} • {item.size || t("items.defaultSize")} •{" "}
                  {item.condition || t("items.conditions.good")}
                </Text>
                <Text
                  style={{
                    fontFamily: "Manrope_400Regular",
                    fontSize: 12,
                    color: colors.textMuted,
                  }}
                >
                  {t("items.unitCost")}: {currencySymbol}{parseFloat(String(item.unitCost)).toFixed(2)}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  backgroundColor:
                    item.status === "SOLD"
                      ? colors.successSubtle
                      : item.status === "STOCK"
                        ? colors.goldSubtle
                        : colors.warningSubtle,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Manrope_500Medium",
                    fontSize: 11,
                    letterSpacing: 0.5,
                    color:
                      item.status === "SOLD"
                        ? colors.success
                        : item.status === "STOCK"
                          ? colors.gold
                          : colors.warning,
                  }}
                >
                  {item.status}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Lot Reference */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          style={{ marginBottom: 24 }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: "Manrope_600SemiBold",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 8,
              color: colors.textSecondary,
            }}
          >
            {t("navigation.lots")}
          </Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                borderWidth: 1.5,
                borderCurve: "continuous",
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <AppIcon name="inventory-2" size={16} color={colors.gold} />
              <Text
                style={{
                  fontFamily: "Manrope_500Medium",
                  fontSize: 11,
                  letterSpacing: 0.5,
                  color: colors.text,
                }}
              >
                Lot #{sale.lotId}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                borderWidth: 1.5,
                borderCurve: "continuous",
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <AppIcon name="receipt" size={16} color={colors.textMuted} />
              <Text
                style={{
                  fontFamily: "Manrope_500Medium",
                  fontSize: 11,
                  letterSpacing: 0.5,
                  color: colors.text,
                }}
              >
                {t("sales.title")} #{sale.id}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Cancel CTA - only show for completed sales */}
      {isCompleted && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            paddingBottom: insets.bottom + 20,
          }}
        >
          <Pressable
            onPress={handleCancel}
            disabled={cancelSale.isPending}
            style={({ pressed }) => ({
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 16,
              borderRadius: 16,
              borderCurve: "continuous",
              backgroundColor: colors.danger,
              opacity: pressed || cancelSale.isPending ? 0.8 : 1,
            })}
          >
            <AppIcon name="cancel" size={20} color="#FFF" />
            <Text
              style={{
                fontFamily: "Manrope_700Bold",
                fontSize: 16,
                color: "#FFF",
              }}
            >
              {cancelSale.isPending ? t("common.loading") : t("common.cancel")}
            </Text>
          </Pressable>
        </View>
      )}
    </VantaScreen>
  );
}
