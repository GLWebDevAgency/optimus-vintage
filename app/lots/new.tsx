/**
 * ➕ NEW LOT SCREEN - Vanta-Aether Edition
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { VantaScreen, useVantaTheme } from "@/components/ui/PremiumUI";
import { Radius, Spacing } from "@/constants/Theme";
import { ItemsRepository, LotsRepository } from "@/db/repositories";
import { useSettingsStore } from "@/store/settings";
import { useLocale } from "@/utils/i18n";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Provider options
const PROVIDERS = [
  { id: "eureka", labelKey: "lots.providers.eureka", icon: "store" },
  { id: "fleek", labelKey: "lots.providers.fleek", icon: "local-shipping" },
  { id: "personnel", labelKey: "lots.providers.personnel", icon: "person" },
] as const;

// Lot types - must match API validation: 'BULK' | 'PIECEWISE'
const LOT_TYPES = [
  { id: "BULK", labelKey: "lots.types.bulk" },
  { id: "PIECEWISE", labelKey: "lots.types.piecewise" },
] as const;

export default function AddLotScreen() {
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
  const { t, locale } = useLocale();
  const currency = useSettingsStore((s) => s.currency);
  const currencySymbol =
    (
      {
        EUR: "€",
        USD: "$",
        GBP: "£",
        CHF: "CHF",
        JPY: "¥",
        CAD: "CA$",
      } as Record<string, string>
    )[currency] || "€";

  // Form state
  const [provider, setProvider] = useState("");
  const [buyDate, setBuyDate] = useState(new Date());
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [lotType, setLotType] = useState("BULK");

  // Financials
  const [totalCost, setTotalCost] = useState("");
  const [shippingCost, setShippingCost] = useState("");

  // Items
  const [quantity, setQuantity] = useState(0);
  const [itemSetupMode, setItemSetupMode] = useState<"bulk" | "manual" | null>(
    null,
  );

  const queryClient = useQueryClient();
  const createLot = useMutation({
    mutationFn: async (payload: {
      provider: string;
      buyDate: Date;
      totalCost: string;
      shippingCost: string;
      quantity: number;
      lotType: string;
      itemSetupMode: "bulk" | "manual" | null;
    }) => {
      const cost = parseFloat(payload.totalCost.replace(",", "."));
      const shipping = parseFloat(payload.shippingCost.replace(",", ".")) || 0;
      const unitCost = (cost + shipping) / payload.quantity;

      const newLot = await LotsRepository.create({
        provider: payload.provider,
        buyDate: payload.buyDate.toISOString().split("T")[0],
        totalCost: cost.toFixed(2),
        additionalFees: shipping.toFixed(2),
        initialQuantity: payload.quantity,
        type: payload.lotType,
      });

      if (payload.itemSetupMode === "bulk") {
        const itemsToCreate = Array.from({ length: payload.quantity }).map(
          () => ({
            lotId: newLot.id,
            unitCost: unitCost.toFixed(2),
            status: "STOCK",
            type: "Clothing",
            brand: "Unknown",
            condition: "Good",
          }),
        );
        await ItemsRepository.createBatch(itemsToCreate);
      }

      return newLot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lots"] });
      queryClient.invalidateQueries({ queryKey: ["lots-summary"] });
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
    },
  });

  const isSubmitting = createLot.isPending;

  // Calculations
  const totalAmount =
    (parseFloat(totalCost) || 0) + (parseFloat(shippingCost) || 0);
  const unitCost = quantity > 0 ? (totalAmount / quantity).toFixed(2) : "0.00";

  // Generate date options for the picker (last 30 days + next 7 days)
  const generateDateOptions = () => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = -30; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  };
  const dateOptions = generateDateOptions();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale, {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatDateFull = (date: Date) => {
    return date.toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const incrementQuantity = () => setQuantity((q) => q + 1);
  const decrementQuantity = () => setQuantity((q) => Math.max(0, q - 1));

  const handleCreate = async () => {
    if (!provider || !totalCost || quantity === 0) {
      Alert.alert(t("common.error"), t("lots.validation.fillRequired"));
      return;
    }

    try {
      await createLot.mutateAsync({
        provider,
        buyDate,
        totalCost,
        shippingCost,
        quantity,
        lotType,
        itemSetupMode,
      });

      Alert.alert(t("common.success") + " 🎉", t("lots.createdSuccess"), [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert(t("common.error"), t("lots.createError"));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <VantaScreen style={{ flex: 1 }}>
        <Stack.Screen
          options={{
            title: t("lots.newLot"),
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitleStyle: { fontFamily: "Manrope_700Bold", fontSize: 17 },
            headerShadowVisible: false,
            headerLeft: () => (
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <AppIcon name="close" size={24} color={colors.text} />
              </Pressable>
            ),
          }}
        />

        {/* Completion Progress Bar */}
        <View
          style={[
            styles.progressContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          <View
            style={[
              styles.progressTrackFull,
              { backgroundColor: colors.border },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.gold,
                  width: `${Math.min(100, (provider ? 25 : 0) + (totalCost ? 25 : 0) + (quantity > 0 ? 25 : 0) + (itemSetupMode ? 25 : 0))}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
            {provider && totalCost && quantity > 0 && itemSetupMode
              ? `✓ ${t("lots.readyToCreate")}`
              : t("lots.completeInfo")}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 120 },
          ]}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Informations de base */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIcon,
                  { backgroundColor: colors.goldSubtle },
                ]}
              >
                <AppIcon name="folder" size={18} color={colors.gold} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("lots.basicInfo")}
              </Text>
            </View>

            {/* Supplier Selector */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
              {t("lots.provider").toUpperCase()}
            </Text>
            <View style={styles.typeSelector}>
              {PROVIDERS.map((p) => (
                <Pressable
                  key={p.id}
                  style={[
                    styles.providerChip,
                    {
                      backgroundColor:
                        provider === p.id ? colors.gold : colors.surface,
                      borderColor:
                        provider === p.id ? colors.gold : colors.border,
                    },
                  ]}
                  onPress={() => setProvider(p.id)}
                >
                  <AppIcon
                    name={p.icon as any}
                    size={18}
                    color={
                      provider === p.id ? theme.textOnAccent : colors.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      {
                        color:
                          provider === p.id ? theme.textOnAccent : colors.text,
                      },
                    ]}
                  >
                    {t(p.labelKey)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Date Selector */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
              {t("lots.buyDate").toUpperCase()}
            </Text>
            <Pressable
              style={[
                styles.dateButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setShowDateSelector(!showDateSelector)}
            >
              <Text style={[styles.dateText, { color: colors.text }]}>
                {formatDate(buyDate)}
              </Text>
              <AppIcon
                name={
                  showDateSelector ? "keyboard-arrow-up" : "keyboard-arrow-down"
                }
                size={24}
                color={colors.gold}
              />
            </Pressable>

            {/* Inline Date Options */}
            {showDateSelector && (
              <Animated.View
                entering={FadeInDown.duration(200)}
                style={[
                  styles.inlineDatePicker,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dateChipsContainer}
                >
                  {dateOptions.slice(25, 38).map((date, index) => {
                    const isSelected =
                      date.toDateString() === buyDate.toDateString();
                    const isToday =
                      date.toDateString() === new Date().toDateString();
                    return (
                      <Pressable
                        key={index}
                        style={[
                          styles.dateChip,
                          {
                            backgroundColor: isSelected
                              ? colors.gold
                              : colors.background,
                            borderColor:
                              isToday && !isSelected
                                ? colors.gold
                                : colors.border,
                          },
                        ]}
                        onPress={() => {
                          setBuyDate(date);
                          setShowDateSelector(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dateChipDay,
                            {
                              color: isSelected
                                ? theme.textOnAccent
                                : colors.textMuted,
                            },
                          ]}
                        >
                          {date.toLocaleDateString(locale, {
                            weekday: "short",
                          })}
                        </Text>
                        <Text
                          style={[
                            styles.dateChipNumber,
                            {
                              color: isSelected
                                ? theme.textOnAccent
                                : colors.text,
                            },
                          ]}
                        >
                          {date.getDate()}
                        </Text>
                        {isToday && (
                          <View
                            style={[
                              styles.todayDot,
                              {
                                backgroundColor: isSelected
                                  ? "#FFF"
                                  : colors.gold,
                              },
                            ]}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </Animated.View>
            )}

            {/* Lot Type */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
              {t("lots.type").toUpperCase()}
            </Text>
            <View style={styles.typeSelector}>
              {LOT_TYPES.map((type) => (
                <Pressable
                  key={type.id}
                  style={[
                    styles.typeOption,
                    {
                      backgroundColor:
                        lotType === type.id ? colors.gold : colors.surface,
                      borderColor:
                        lotType === type.id ? colors.gold : colors.border,
                    },
                  ]}
                  onPress={() => setLotType(type.id)}
                >
                  <Text
                    style={[
                      styles.typeLabel,
                      { color: lotType === type.id ? "#FFF" : colors.text },
                    ]}
                  >
                    {t(type.labelKey)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Section: Finances */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIcon,
                  { backgroundColor: colors.successSubtle },
                ]}
              >
                <AppIcon
                  name="account-balance-wallet"
                  size={18}
                  color={colors.success}
                />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("lots.finances")}
              </Text>
            </View>

            <View style={styles.financialsRow}>
              {/* Total Cost */}
              <View style={styles.financialField}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                  {t("lots.totalCost").toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.currencyInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.currencySymbol, { color: colors.gold }]}>
                    {currencySymbol}
                  </Text>
                  <TextInput
                    style={[styles.currencyValue, { color: colors.text }]}
                    value={totalCost}
                    onChangeText={setTotalCost}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* Shipping */}
              <View style={styles.financialField}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                  {t("lots.shippingFees").toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.currencyInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.currencySymbol, { color: colors.gold }]}>
                    {currencySymbol}
                  </Text>
                  <TextInput
                    style={[styles.currencyValue, { color: colors.text }]}
                    value={shippingCost}
                    onChangeText={setShippingCost}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            {/* Item Count with +/- buttons */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
              {t("lots.itemCount").toUpperCase()}
            </Text>
            <View
              style={[
                styles.quantityContainer,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Pressable
                style={[
                  styles.quantityButton,
                  { backgroundColor: colors.goldSubtle },
                ]}
                onPress={decrementQuantity}
              >
                <AppIcon name="remove" size={24} color={colors.gold} />
              </Pressable>

              <TextInput
                style={[styles.quantityInput, { color: colors.text }]}
                value={quantity.toString()}
                onChangeText={(t) => setQuantity(parseInt(t) || 0)}
                keyboardType="number-pad"
                textAlign="center"
              />

              <Pressable
                style={[
                  styles.quantityButton,
                  { backgroundColor: colors.goldSubtle },
                ]}
                onPress={incrementQuantity}
              >
                <AppIcon name="add" size={24} color={colors.gold} />
              </Pressable>
            </View>

            {/* Estimated Cost Card */}
            <View
              style={[
                styles.estimatedCard,
                { backgroundColor: colors.goldSubtle },
              ]}
            >
              <Text style={[styles.estimatedLabel, { color: colors.gold }]}>
                {t("lots.estimatedCost").toUpperCase()}
              </Text>
              <Text
                style={[styles.estimatedSubLabel, { color: colors.textMuted }]}
              >
                {t("lots.perItem")}
              </Text>
              <Text style={[styles.estimatedValue, { color: colors.text }]}>
                {currencySymbol}
                {unitCost}
              </Text>
            </View>
          </Animated.View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Section: Configuration des articles */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIcon,
                  { backgroundColor: colors.goldSubtle },
                ]}
              >
                <AppIcon name="inventory-2" size={18} color={colors.warning} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("lots.itemsConfig")}
              </Text>
            </View>

            {/* Bulk Generate Option */}
            <Pressable
              style={[
                styles.setupOption,
                {
                  backgroundColor: colors.surface,
                  borderColor:
                    itemSetupMode === "bulk" ? colors.gold : colors.border,
                },
              ]}
              onPress={() => setItemSetupMode("bulk")}
            >
              <View
                style={[
                  styles.setupIcon,
                  { backgroundColor: colors.goldSubtle },
                ]}
              >
                <AppIcon name="auto-awesome" size={20} color={colors.gold} />
              </View>
              <View style={styles.setupText}>
                <Text style={[styles.setupTitle, { color: colors.text }]}>
                  {t("lots.autoGenerate")}
                </Text>
                <Text style={[styles.setupDesc, { color: colors.textMuted }]}>
                  {t("lots.autoGenerateDesc")}
                </Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor:
                      itemSetupMode === "bulk" ? colors.gold : colors.border,
                  },
                ]}
              >
                {itemSetupMode === "bulk" && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: colors.gold },
                    ]}
                  />
                )}
              </View>
            </Pressable>

            {/* Manual Entry Option */}
            <Pressable
              style={[
                styles.setupOption,
                {
                  backgroundColor: colors.surface,
                  borderColor:
                    itemSetupMode === "manual" ? colors.gold : colors.border,
                },
              ]}
              onPress={() => setItemSetupMode("manual")}
            >
              <View
                style={[
                  styles.setupIcon,
                  { backgroundColor: colors.goldSubtle },
                ]}
              >
                <AppIcon name="edit-note" size={20} color={colors.gold} />
              </View>
              <View style={styles.setupText}>
                <Text style={[styles.setupTitle, { color: colors.text }]}>
                  {t("lots.manualEntry")}
                </Text>
                <Text style={[styles.setupDesc, { color: colors.textMuted }]}>
                  {t("lots.manualEntryDesc")}
                </Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor:
                      itemSetupMode === "manual" ? colors.gold : colors.border,
                  },
                ]}
              >
                {itemSetupMode === "manual" && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: colors.gold },
                    ]}
                  />
                )}
              </View>
            </Pressable>
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + Spacing.md,
            },
          ]}
        >
          {/* Summary info */}
          <View style={styles.footerSummary}>
            <View style={styles.footerSummaryItem}>
              <Text style={[styles.footerSummaryValue, { color: colors.text }]}>
                {quantity > 0 ? quantity : "-"}
              </Text>
              <Text
                style={[styles.footerSummaryLabel, { color: colors.textMuted }]}
              >
                {t("items.title").toLowerCase()}
              </Text>
            </View>
            <View
              style={[styles.footerDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.footerSummaryItem}>
              <Text style={[styles.footerSummaryValue, { color: colors.gold }]}>
                {currencySymbol}
                {unitCost}
              </Text>
              <Text
                style={[styles.footerSummaryLabel, { color: colors.textMuted }]}
              >
                /{t("items.title").toLowerCase().slice(0, -1)}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={handleCreate}
            disabled={isSubmitting || !provider || !totalCost || quantity === 0}
            style={({ pressed }) => [
              styles.continueButton,
              {
                backgroundColor:
                  isSubmitting || !provider || !totalCost || quantity === 0
                    ? colors.textMuted
                    : colors.gold,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <AppIcon name="check-circle" size={20} color={theme.textOnAccent} />
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Manrope_700Bold",
                color: theme.textOnAccent,
              }}
            >
              {isSubmitting ? t("lots.creating") : t("lots.createLot")}
            </Text>
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
  progressContainer: {
    flexDirection: "column",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  progressTrackFull: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  content: {
    padding: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: 16,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
  },
  dateModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  dateModalContent: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
  },
  dateModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  typeSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  typeOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  providerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  inlineDatePicker: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  dateChipsContainer: {
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  dateChip: {
    width: 56,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  dateChipDay: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
  },
  dateChipNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xl,
  },
  financialsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  financialField: {
    flex: 1,
  },
  currencyInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
  },
  currencyValue: {
    flex: 1,
    fontSize: 16,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  quantityButton: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    paddingVertical: Spacing.md,
  },
  estimatedCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    marginTop: Spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    borderCurve: "continuous",
  },
  estimatedLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  estimatedSubLabel: {
    fontSize: 13,
    width: "60%",
  },
  estimatedValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  setupOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    borderCurve: "continuous",
  },
  setupIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  setupText: {
    flex: 1,
  },
  setupTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  setupDesc: {
    fontSize: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  footerSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    gap: Spacing.lg,
  },
  footerSummaryItem: {
    alignItems: "center",
  },
  footerSummaryValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  footerSummaryLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  footerDivider: {
    width: 1,
    height: 32,
  },
  continueButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    borderRadius: Radius["2xl"],
    padding: Spacing.xl,
    borderCurve: "continuous",
  },
  providerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
  },
  providerLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  dateScrollView: {
    maxHeight: 300,
  },
  dateOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
  },
  dateOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dateOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  todayBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFF",
  },
});
