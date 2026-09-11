/**
 * 💰 NEW SALE SCREEN - Vanta-Aether Edition
 */

import {
    AnimatedButton,
    AnimatedSkeleton,
} from "@/components/ui/AnimatedComponents";
import { AppIcon } from "@/components/ui/AppIcon";
import { Card } from "@/components/ui/Components";
import {
    CurvedItem,
    ScrollEdgeFade,
    useCurvedScroll,
} from "@/components/ui/CurvedScroll";
import { VantaScreen, useVantaTheme } from "@/components/ui/PremiumUI";
import { Radius, Spacing } from "@/constants/Theme";
import { Item, ItemsRepository, SalesRepository } from "@/db/repositories";
import { useSettingsStore } from "@/store/settings";
import { useLocale } from "@/utils/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import React, { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NewSaleScreen() {
  const params = useLocalSearchParams<{ itemId?: string; lotId?: string }>();
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
  const { scrollY, scrollHandler } = useCurvedScroll();
  const { t } = useLocale();
  const currency = useSettingsStore((s) => s.currency);
  const currencySymbol = ({ EUR: "€", USD: "$", GBP: "£", CHF: "CHF", JPY: "¥", CAD: "CA$" } as Record<string, string>)[currency] || "€";

  const [price, setPrice] = useState("");
  const [platformFees, setPlatformFees] = useState("");
  const [shippingFees, setShippingFees] = useState("0");
  const queryClient = useQueryClient();
  const itemId = params.itemId ? parseInt(params.itemId, 10) : null;
  const itemQuery = useQuery({
    queryKey: ["item", itemId],
    enabled: !!itemId,
    queryFn: () => ItemsRepository.getById(itemId as number),
  });
  const item = itemQuery.data ?? null;

  const createSale = useMutation({
    mutationFn: async (payload: {
      item: Item;
      price: string;
      platformFees: string;
      shippingFees: string;
    }) => {
      const pGross = parseFloat(payload.price.replace(",", "."));
      const pFees = parseFloat(payload.platformFees.replace(",", ".") || "0");
      const pShip = parseFloat(payload.shippingFees.replace(",", ".") || "0");
      const pNet = pGross - pFees - pShip;

      await SalesRepository.create({
        itemId: payload.item.id,
        lotId: payload.item.lotId,
        platform: "VINTED",
        priceGross: pGross.toFixed(2),
        platformFees: pFees.toFixed(2),
        shippingFees: pShip.toFixed(2),
        priceNet: pNet.toFixed(2),
        saleDate: new Date().toISOString().split("T")[0],
        status: "COMPLETED",
      });

      await ItemsRepository.updateStatus(payload.item.id, "SOLD");

      return { net: pNet };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["lots-summary"] });
      queryClient.invalidateQueries({ queryKey: ["lots"] });
    },
  });

  const isSubmitting = createSale.isPending;

  const netAmount = useMemo(() => {
    if (!price) return "0.00";
    const pGross = parseFloat(price.replace(",", "."));
    const pFees = parseFloat(platformFees.replace(",", ".") || "0");
    const pShip = parseFloat(shippingFees.replace(",", ".") || "0");
    return (pGross - pFees - pShip).toFixed(2);
  }, [price, platformFees, shippingFees]);

  const profit = useMemo(() => {
    if (!item || !price) return "0.00";
    return (
      parseFloat(netAmount) - parseFloat(String(item.unitCost || 0))
    ).toFixed(2);
  }, [item, netAmount, price]);

  const handleSave = async () => {
    if (!price || !item) {
      Alert.alert(t("common.error"), t("sales.missingFields"));
      return;
    }

    try {
      const result = await createSale.mutateAsync({
        item,
        price,
        platformFees,
        shippingFees,
      });

      Alert.alert(
        t("sales.saleRecorded"),
        t("sales.saleRecordedDesc", { amount: `${currencySymbol}${result.net.toFixed(2)}` }),
        [
          {
            text: t("common.confirm"),
            onPress: () => {
              // Dismiss modal stack first, then navigate to sales tab
              router.dismissAll();
              router.replace("/(tabs)/sales");
            },
          },
        ],
      );
    } catch (e) {
      console.error(e);
      Alert.alert(t("common.error"), t("sales.createError"));
    }
  };

  if (itemId && itemQuery.isLoading) {
    return (
      <VantaScreen style={styles.loadingContainer}>
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 400 }}
          style={{ width: "100%", maxWidth: 360 }}
        >
          {/* Item card skeleton */}
          <AnimatedSkeleton
            width="100%"
            height={100}
            borderRadius={Radius.xl}
            delay={0}
          />

          {/* Price inputs skeleton */}
          <View style={{ marginTop: Spacing.xl }}>
            <AnimatedSkeleton
              width={100}
              height={14}
              borderRadius={4}
              delay={100}
            />
            <AnimatedSkeleton
              width="100%"
              height={56}
              borderRadius={Radius.md}
              delay={150}
              style={{ marginTop: Spacing.sm }}
            />
          </View>

          <View style={{ marginTop: Spacing.lg }}>
            <AnimatedSkeleton
              width={80}
              height={14}
              borderRadius={4}
              delay={200}
            />
            <AnimatedSkeleton
              width="100%"
              height={56}
              borderRadius={Radius.md}
              delay={250}
              style={{ marginTop: Spacing.sm }}
            />
          </View>

          {/* Summary skeleton */}
          <AnimatedSkeleton
            width="100%"
            height={80}
            borderRadius={Radius.lg}
            delay={300}
            style={{ marginTop: Spacing.xl }}
          />
        </MotiView>

        <Text
          style={{
            fontFamily: "Manrope_400Regular",
            fontSize: 14,
            color: colors.textMuted,
            marginTop: Spacing.xl,
          }}
        >
          {t("common.loading")}
        </Text>
      </VantaScreen>
    );
  }

  if (itemId && !item) {
    return (
      <VantaScreen style={styles.errorContainer}>
        <MotiView
          from={{ opacity: 0, scale: 0.8, translateY: 20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <View
            style={[styles.errorIcon, { backgroundColor: colors.dangerSubtle }]}
          >
            <AppIcon name="error-outline" size={40} color={colors.danger} />
          </View>
        </MotiView>
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 200 }}
        >
          <Text
            style={{
              fontFamily: "Manrope_700Bold",
              fontSize: 20,
              color: colors.text,
              textAlign: "center",
            }}
          >
            {t("errors.notFound")}
          </Text>
          <Text
            style={{
              fontFamily: "Manrope_400Regular",
              fontSize: 14,
              color: colors.textMuted,
              textAlign: "center",
              marginTop: Spacing.sm,
            }}
          >
            {t("errors.loadFailed")}
          </Text>
        </MotiView>
        <AnimatedButton
          variant="ghost"
          size="md"
          onPress={() => router.back()}
          delay={400}
          style={{ marginTop: Spacing.xl }}
        >
          {t("common.back")}
        </AnimatedButton>
      </VantaScreen>
    );
  }

  if (!params.itemId && !item) {
    return (
      <VantaScreen style={styles.errorContainer}>
        <MotiView
          from={{ opacity: 0, scale: 0.8, translateY: 20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <View
            style={[styles.errorIcon, { backgroundColor: colors.dangerSubtle }]}
          >
            <AppIcon name="error-outline" size={40} color={colors.danger} />
          </View>
        </MotiView>
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 200 }}
        >
          <Text
            style={{
              fontFamily: "Manrope_700Bold",
              fontSize: 20,
              color: colors.text,
              textAlign: "center",
            }}
          >
            {t("sales.empty.title")}
          </Text>
          <Text
            style={{
              fontFamily: "Manrope_400Regular",
              fontSize: 14,
              color: colors.textMuted,
              textAlign: "center",
              marginTop: Spacing.sm,
            }}
          >
            {t("sales.empty.description")}
          </Text>
        </MotiView>
        <AnimatedButton
          variant="primary"
          size="lg"
          onPress={() => {
            router.dismissAll();
            router.replace("/(tabs)/stock");
          }}
          delay={400}
          style={{ marginTop: Spacing.xl }}
        >
          {t("navigation.stock")}
        </AnimatedButton>
      </VantaScreen>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <VantaScreen style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: t("sales.newSale"),
          presentation: "formSheet",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      <View style={{ flex: 1 }}>
        <ScrollEdgeFade color={colors.background} position="top" scrollY={scrollY} />
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* Item Header */}
          <CurvedItem scrollY={scrollY} preset="subtle">
            <Animated.View entering={FadeInUp.delay(100).duration(400)}>
              <Card variant="elevated" style={styles.itemHeader}>
                <View
                  style={[styles.itemIcon, { backgroundColor: colors.goldSubtle }]}
                >
                  <AppIcon name="checkroom" size={24} color={colors.gold} />
                </View>
                <View style={styles.itemInfo}>
                  <Text
                    style={{
                      fontFamily: "Manrope_700Bold",
                      fontSize: 16,
                      color: colors.text,
                    }}
                  >
                    {item
                      ? `${item.type || t("items.defaultType")} ${item.brand || ""}`
                      : t("common.loading")}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Manrope_400Regular",
                      fontSize: 12,
                      color: colors.textMuted,
                    }}
                  >
                    Lot #{item?.lotId} • ID: {item?.id} • Cost: {currencySymbol}
                    {item ? parseFloat(String(item.unitCost)).toFixed(2) : "0.00"}
                  </Text>
                </View>
              </Card>
            </Animated.View>
          </CurvedItem>

          {/* Sale Form */}
          <CurvedItem scrollY={scrollY} preset="subtle">
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <Card variant="elevated" style={styles.formCard}>
                <Text
                  style={{
                    fontFamily: "Manrope_700Bold",
                    fontSize: 16,
                    color: colors.text,
                    marginBottom: Spacing.lg,
                  }}
                >
                  {t("sales.saleDetails")}
                </Text>

                <Text
                  style={{
                    fontFamily: "Manrope_400Regular",
                    fontSize: 14,
                    color: colors.textMuted,
                    marginBottom: Spacing.xs,
                  }}
                >
                  {t("sales.priceGross")} ({currencySymbol}) *
                </Text>
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceCard,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                />

                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Text
                      style={{
                        fontFamily: "Manrope_400Regular",
                        fontSize: 14,
                        color: colors.textMuted,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      {t("sales.platformFees")}
                    </Text>
                    <TextInput
                      value={platformFees}
                      onChangeText={setPlatformFees}
                      placeholder="0.00"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surfaceCard,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text
                      style={{
                        fontFamily: "Manrope_400Regular",
                        fontSize: 14,
                        color: colors.textMuted,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      {t("sales.shippingFees")}
                    </Text>
                    <TextInput
                      value={shippingFees}
                      onChangeText={setShippingFees}
                      placeholder="0.00"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surfaceCard,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Net Calculation */}
                <View
                  style={[styles.calcCard, { backgroundColor: colors.surfaceCard }]}
                >
                  <View style={styles.calcRow}>
                    <Text
                      style={{
                        fontFamily: "Manrope_400Regular",
                        fontSize: 14,
                        color: colors.textMuted,
                      }}
                    >
                      {t("sales.priceNet")}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "Manrope_600SemiBold",
                        fontSize: 18,
                        color: colors.text,
                      }}
                    >
                      {currencySymbol}{netAmount}
                    </Text>
                  </View>
                  <View
                    style={[styles.calcDivider, { backgroundColor: colors.border }]}
                  />
                  <View style={styles.calcRow}>
                    <Text
                      style={{
                        fontFamily: "Manrope_400Regular",
                        fontSize: 14,
                        color: colors.textMuted,
                      }}
                    >
                      {t("sales.profit")}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "Manrope_700Bold",
                        fontSize: 22,
                        color:
                          parseFloat(profit) >= 0 ? colors.success : colors.danger,
                      }}
                    >
                      {parseFloat(profit) >= 0 ? "+" : ""}{currencySymbol}{profit}
                    </Text>
                  </View>
                </View>
              </Card>
            </Animated.View>
          </CurvedItem>
        </Animated.ScrollView>
        <ScrollEdgeFade color={colors.background} position="bottom" />
      </View>

      {/* Sticky CTA */}
      <View
        style={[
          styles.ctaContainer,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
      >
        <View
          style={[styles.ctaGradient, { backgroundColor: colors.background }]}
        />
        <Pressable
          onPress={handleSave}
          disabled={isSubmitting || !price}
          accessibilityRole="button"
          accessibilityLabel={t("sales.confirmSale")}
          accessibilityState={{ disabled: isSubmitting || !price, busy: isSubmitting }}
          style={({ pressed }) => [
            styles.ctaButton,
            {
              backgroundColor:
                isSubmitting || !price ? colors.textMuted : colors.success,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <AppIcon name="check-circle" size={20} color="#FFF" />
            <Text
              style={{
                fontFamily: "Manrope_700Bold",
                fontSize: 16,
                color: "#FFF",
              }}
            >
              {isSubmitting ? t("common.loading") : t("sales.confirmSale")}
            </Text>
          </View>
        </Pressable>
      </View>

      <StatusBar style={theme.dark ? "light" : "dark"} />
      </VantaScreen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorIcon: {
    width: 88,
    height: 88,
    borderRadius: Radius["2xl"],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    borderCurve: "continuous",
  },
  content: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  itemIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    borderCurve: "continuous",
  },
  itemInfo: {
    flex: 1,
  },
  formCard: {
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  calcCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderCurve: "continuous",
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calcDivider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
  },
  ctaGradient: {
    ...StyleSheet.absoluteFillObject,
    height: 80,
    top: -40,
  },
  ctaButton: {
    width: "100%",
    borderRadius: Radius.xl,
    borderCurve: "continuous",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  input: {
    fontSize: 18,
    fontFamily: "Manrope_600SemiBold",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderCurve: "continuous",
  },
});
