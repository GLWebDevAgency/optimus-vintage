/**
 * ✏️ EDIT LOT SCREEN - Vanta-Aether Edition
 * Edit existing lot with pre-filled data
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { useColorScheme } from "@/components/useColorScheme";
import { LotsRepository, NewLot } from "@/db/repositories";
import { useSettingsStore } from "@/store/settings";
import { useLocale } from "@/utils/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
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

// ═══ VANTA-AETHER DESIGN TOKENS ═══
const VANTA = {
  black: "#000000",
  obsidian: "#0a0a0a",
  obsidianLight: "#1a1a1a",
  titanium: "#111111",
  carbon: "#1c1c1c",
  gold: "#f4c025",
  goldGlow: "rgba(244, 192, 37, 0.6)",
  goldSubtle: "rgba(244, 192, 37, 0.15)",
  success: "#22c55e",
  successSubtle: "rgba(34, 197, 94, 0.15)",
  danger: "#ef4444",
  dangerSubtle: "rgba(239, 68, 68, 0.15)",
  warning: "#f59e0b",
  warningSubtle: "rgba(245, 158, 11, 0.15)",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255, 255, 255, 0.6)",
  textMuted: "rgba(255, 255, 255, 0.4)",
  light: {
    background: "#fafafa",
    surface: "#ffffff",
    gold: "#d4a017",
    text: "#1a1a1a",
    textSecondary: "rgba(0, 0, 0, 0.6)",
    textMuted: "rgba(0, 0, 0, 0.4)",
    border: "rgba(0, 0, 0, 0.08)",
  },
};

function getColors(isDark: boolean) {
  return {
    background: isDark ? VANTA.black : VANTA.light.background,
    surface: isDark ? VANTA.obsidianLight : VANTA.light.surface,
    surfaceCard: isDark ? VANTA.titanium : VANTA.light.surface,
    gold: isDark ? VANTA.gold : VANTA.light.gold,
    text: isDark ? VANTA.textPrimary : VANTA.light.text,
    textSecondary: isDark ? VANTA.textSecondary : VANTA.light.textSecondary,
    textMuted: isDark ? VANTA.textMuted : VANTA.light.textMuted,
    border: isDark ? "rgba(255, 255, 255, 0.08)" : VANTA.light.border,
    success: VANTA.success,
    successSubtle: VANTA.successSubtle,
    danger: VANTA.danger,
    dangerSubtle: VANTA.dangerSubtle,
    warning: VANTA.warning,
    warningSubtle: VANTA.warningSubtle,
  };
}

// Provider options
const PROVIDERS = [
  { id: "eureka", label: "Eureka", icon: "store" },
  { id: "fleek", label: "Fleek", icon: "local-shipping" },
  { id: "personnel", label: "Personnel", icon: "person" },
] as const;

// Lot types
const LOT_TYPES = [
  { id: "BULK", label: "Bulk / Kilo" },
  { id: "PIECEWISE", label: "Piecewise" },
] as const;

export default function EditLotScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = getColors(isDark);
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const currency = useSettingsStore((s) => s.currency);
  const currencySymbol = ({ EUR: "€", USD: "$", GBP: "£", CHF: "CHF", JPY: "¥", CAD: "CA$" } as Record<string, string>)[currency] || "€";

  // Form state
  const [provider, setProvider] = useState("");
  const [name, setName] = useState("");
  const [buyDate, setBuyDate] = useState(new Date());
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [lotType, setLotType] = useState("BULK");
  const [totalCost, setTotalCost] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [isFormReady, setIsFormReady] = useState(false);

  const lotId = id ? parseInt(id, 10) : null;

  // Fetch existing lot data
  const lotQuery = useQuery({
    queryKey: ["lot", lotId],
    enabled: !!lotId,
    queryFn: () => LotsRepository.getById(lotId as number),
  });

  // Pre-fill form when lot data is loaded
  useEffect(() => {
    if (lotQuery.data && !isFormReady) {
      const lot = lotQuery.data;
      setProvider(lot.provider);
      setName(lot.name || "");
      setBuyDate(new Date(lot.buyDate));
      setLotType(lot.type);
      setTotalCost(lot.totalCost);
      setShippingCost(lot.additionalFees || "0");
      setQuantity(lot.initialQuantity);
      setIsFormReady(true);
    }
  }, [lotQuery.data, isFormReady]);

  // Update mutation
  const updateLot = useMutation({
    mutationFn: async (payload: Partial<NewLot>) => {
      if (!lotId) throw new Error("No lot ID");
      return LotsRepository.update(lotId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lots"] });
      queryClient.invalidateQueries({ queryKey: ["lots-summary"] });
      queryClient.invalidateQueries({ queryKey: ["lot", lotId] });
      queryClient.invalidateQueries({ queryKey: ["lot-detail", lotId] });
    },
  });

  // Delete mutation
  const deleteLot = useMutation({
    mutationFn: async () => {
      if (!lotId) throw new Error("No lot ID");
      return LotsRepository.delete(lotId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lots"] });
      queryClient.invalidateQueries({ queryKey: ["lots-summary"] });
      router.dismissAll();
      router.replace("/(tabs)/lots");
    },
  });

  const isSubmitting = updateLot.isPending;
  const isDeleting = deleteLot.isPending;

  // Calculations
  const totalAmount =
    (parseFloat(totalCost) || 0) + (parseFloat(shippingCost) || 0);
  const unitCost = quantity > 0 ? (totalAmount / quantity).toFixed(2) : "0.00";

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Generate date options
  const generateDateOptions = () => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = -60; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const handleUpdate = async () => {
    if (!provider) {
      Alert.alert(t("common.error"), t("lots.validation.selectProvider"));
      return;
    }
    if (!totalCost || parseFloat(totalCost) <= 0) {
      Alert.alert(t("common.error"), t("lots.validation.validCost"));
      return;
    }
    if (quantity <= 0) {
      Alert.alert(t("common.error"), t("lots.validation.setQuantity"));
      return;
    }

    try {
      const cost = parseFloat(totalCost.replace(",", "."));
      const shipping = parseFloat(shippingCost.replace(",", ".")) || 0;

      await updateLot.mutateAsync({
        name: name || undefined,
        provider,
        buyDate: buyDate.toISOString().split("T")[0],
        totalCost: cost.toFixed(2),
        additionalFees: shipping.toFixed(2),
        initialQuantity: quantity,
        type: lotType,
      });

      Alert.alert(t("common.success") + " ✅", t("lots.updatedSuccess"), [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert(t("common.error"), t("lots.updateError"));
    }
  };

  const handleDelete = () => {
    Alert.alert(t("lots.deleteLot"), t("lots.confirmDelete"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteLot.mutateAsync();
            Alert.alert(t("common.success"), t("lots.deletedSuccess"));
          } catch (e) {
            console.error(e);
            Alert.alert(t("common.error"), t("lots.deleteError"));
          }
        },
      },
    ]);
  };

  // Loading state
  if (lotQuery.isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.gold} />
        <Text
          style={{
            fontFamily: "Manrope_500Medium",
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
  if (!lotQuery.data) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <View
          style={[styles.errorIcon, { backgroundColor: colors.dangerSubtle }]}
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
          {t("lots.notFound")}
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 24,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 12,
            backgroundColor: VANTA.goldSubtle,
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

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen
        options={{
          title: t("lots.editLot"),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <AppIcon name="close" size={24} color={colors.text} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleDelete} hitSlop={8} disabled={isDeleting}>
              <AppIcon
                name="cancel"
                size={24}
                color={isDeleting ? colors.textMuted : colors.danger}
              />
            </Pressable>
          ),
        }}
      />
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Name (optional) */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t("lots.lotName")} ({t("common.optional")})
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Summer Collection"
            placeholderTextColor={colors.textMuted}
          />
        </Animated.View>

        {/* Provider */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t("lots.provider")}
          </Text>
          <View style={styles.typeSelector}>
            {PROVIDERS.map((p) => (
              <Pressable
                key={p.id}
                style={[
                  styles.typeButton,
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
                  color={provider === p.id ? "#FFF" : colors.textMuted}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    {
                      color: provider === p.id ? "#FFF" : colors.textMuted,
                    },
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Buy Date */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t("lots.buyDate")}
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

          {showDateSelector && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dateScroller}
              contentContainerStyle={styles.dateScrollerContent}
            >
              {generateDateOptions().map((date, index) => {
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
                          : colors.surface,
                        borderColor: isSelected
                          ? colors.gold
                          : isToday
                            ? colors.success
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
                          color: isSelected ? "#FFF" : colors.textMuted,
                        },
                      ]}
                    >
                      {date.toLocaleDateString("fr-FR", { weekday: "short" })}
                    </Text>
                    <Text
                      style={[
                        styles.dateChipDate,
                        { color: isSelected ? "#FFF" : colors.text },
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    <Text
                      style={[
                        styles.dateChipMonth,
                        {
                          color: isSelected ? "#FFF" : colors.textMuted,
                        },
                      ]}
                    >
                      {date.toLocaleDateString("fr-FR", { month: "short" })}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>

        {/* Lot Type */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t("lots.type")}
          </Text>
          <View style={styles.typeSelector}>
            {LOT_TYPES.map((t) => (
              <Pressable
                key={t.id}
                style={[
                  styles.typeButton,
                  styles.typeButtonWide,
                  {
                    backgroundColor:
                      lotType === t.id ? colors.gold : colors.surface,
                    borderColor: lotType === t.id ? colors.gold : colors.border,
                  },
                ]}
                onPress={() => setLotType(t.id)}
              >
                <Text
                  style={[
                    styles.typeLabel,
                    {
                      color: lotType === t.id ? "#FFF" : colors.textMuted,
                    },
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Financials */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t("lots.finances")}
          </Text>
          <View style={styles.financialGrid}>
            <View style={styles.financialInput}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                {t("lots.totalCost")}
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
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
            <View style={styles.financialInput}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                {t("lots.shipping")}
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
                <Text
                  style={[styles.currencySymbol, { color: colors.textMuted }]}
                >
                  {currencySymbol}
                </Text>
                <TextInput
                  style={[styles.currencyValue, { color: colors.text }]}
                  value={shippingCost}
                  onChangeText={setShippingCost}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quantity */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t("lots.initialQuantity")}
          </Text>
          <View style={styles.quantityRow}>
            <Pressable
              style={[
                styles.quantityButton,
                { backgroundColor: VANTA.goldSubtle },
              ]}
              onPress={() => setQuantity(Math.max(0, quantity - 1))}
            >
              <AppIcon name="remove" size={24} color={colors.gold} />
            </Pressable>
            <TextInput
              style={[
                styles.quantityInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={quantity.toString()}
              onChangeText={(t) => setQuantity(parseInt(t) || 0)}
              keyboardType="number-pad"
            />
            <Pressable
              style={[
                styles.quantityButton,
                { backgroundColor: VANTA.goldSubtle },
              ]}
              onPress={() => setQuantity(quantity + 1)}
            >
              <AppIcon name="add" size={24} color={colors.gold} />
            </Pressable>
          </View>
          {quantity > 0 && totalAmount > 0 && (
            <View
              style={[
                styles.unitCostBadge,
                { backgroundColor: colors.successSubtle },
              ]}
            >
              <Text style={[styles.unitCostText, { color: colors.success }]}>
                {t("lots.unitCost")}: {currencySymbol}{unitCost}
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={[styles.ctaContainer, { paddingBottom: insets.bottom + 16 }]}
      >
        <Pressable
          onPress={handleUpdate}
          disabled={isSubmitting || !provider}
          style={[
            styles.ctaButton,
            {
              backgroundColor:
                isSubmitting || !provider ? colors.textMuted : colors.gold,
              opacity: isSubmitting || !provider ? 0.6 : 1,
            },
          ]}
        >
          <AppIcon name="check-circle" size={20} color="#FFF" />
          <Text style={styles.ctaButtonText}>
            {isSubmitting ? t("lots.updating") : t("lots.saveChanges")}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textInput: {
    fontFamily: "Manrope_400Regular",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeButtonWide: {
    flex: 1,
  },
  typeLabel: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
  },
  dateScroller: {
    marginTop: 16,
  },
  dateScrollerContent: {
    gap: 8,
  },
  dateChip: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 60,
  },
  dateChipDay: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 10,
    textTransform: "uppercase",
  },
  dateChipDate: {
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
    marginVertical: 2,
  },
  dateChipMonth: {
    fontFamily: "Manrope_500Medium",
    fontSize: 10,
  },
  financialGrid: {
    flexDirection: "row",
    gap: 16,
  },
  financialInput: {
    flex: 1,
  },
  inputLabel: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    marginBottom: 4,
  },
  currencyInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
    marginRight: 4,
  },
  currencyValue: {
    flex: 1,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    paddingVertical: 16,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityInput: {
    flex: 1,
    fontFamily: "Manrope_700Bold",
    textAlign: "center",
    fontSize: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  unitCostBadge: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  unitCostText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  ctaButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
    color: "#FFF",
  },
});
