/**
 * 📦 ADD TO STOCK SCREEN - Scanner → Stock Integration
 *
 * Pré-remplit un formulaire d'article avec les données de l'analyse IA.
 * L'utilisateur choisit un lot existant et ajuste les informations.
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { ItemPhotoPicker } from "@/components/ui/ItemPhotoPicker";
import { useVantaTheme, VantaScreen } from "@/components/ui/PremiumUI";
import { Palette, Radius, Spacing } from "@/constants/Theme";
import { ItemsRepository, LotsRepository } from "@/db/repositories";
import { useSettingsStore } from "@/store/settings";
import { Haptic } from "@/utils/haptics";
import { useLocale } from "@/utils/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
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
import Animated, {
  FadeInDown,
  interpolateColor,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const CONDITIONS = ["new", "likeNew", "veryGood", "good", "fair"] as const;
const ITEM_TYPES = [
  "Clothing",
  "Shoes",
  "Accessories",
  "Bags",
  "Jewelry",
  "Other",
] as const;
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size", "N/A"] as const;

const ITEM_TYPE_LABELS: Record<string, string> = {
  Clothing: "items.types.clothing",
  Shoes: "items.types.shoes",
  Accessories: "items.types.accessories",
  Bags: "items.types.bags",
  Jewelry: "items.types.jewelry",
  Other: "items.types.other",
};

const SIZE_LABELS: Record<string, string> = {
  "One Size": "items.sizes.oneSize",
  "N/A": "items.sizes.na",
};

// Map AI categories to item types
function mapCategoryToType(category: string): (typeof ITEM_TYPES)[number] {
  const mapping: Record<string, (typeof ITEM_TYPES)[number]> = {
    jacket: "Clothing",
    coat: "Clothing",
    sweater: "Clothing",
    shirt: "Clothing",
    "t-shirt": "Clothing",
    pants: "Clothing",
    jeans: "Clothing",
    shorts: "Clothing",
    dress: "Clothing",
    skirt: "Clothing",
    shoes: "Shoes",
    boots: "Shoes",
    sneakers: "Shoes",
    bag: "Bags",
    accessory: "Accessories",
    hat: "Accessories",
    scarf: "Accessories",
    belt: "Accessories",
    other: "Other",
  };
  return mapping[category] || "Clothing";
}

// Map AI condition to form condition
function mapCondition(aiCondition: string): (typeof CONDITIONS)[number] {
  const mapping: Record<string, (typeof CONDITIONS)[number]> = {
    mint: "new",
    excellent: "likeNew",
    very_good: "veryGood",
    good: "good",
    fair: "fair",
    poor: "fair",
  };
  return mapping[aiCondition] || "good";
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 ANIMATED CHIP
// ═══════════════════════════════════════════════════════════════════════════════

function AnimatedChip({
  label,
  isSelected,
  onPress,
  colors,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  colors: Record<string, string>;
}) {
  const progress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isSelected ? 1 : 0, {
      damping: 16,
      stiffness: 200,
    });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.surface, colors.gold],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.border, colors.gold],
    ),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [colors.textMuted, "#FFFFFF"],
    ),
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.chip, animatedStyle]}>
        <Animated.Text style={[styles.chipText, textStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 ADD TO STOCK SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function AddToStockScreen() {
  const params = useLocalSearchParams<{
    imageUri: string;
    brand?: string;
    category?: string;
    model?: string;
    condition?: string;
    colors?: string;
    size?: string;
    suggestedBuyPrice?: string;
    midPrice?: string;
    era?: string;
  }>();

  const insets = useSafeAreaInsets();
  const theme = useVantaTheme();
  const isDark = theme.dark;
  const { t } = useLocale();
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
  const queryClient = useQueryClient();

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
  };

  // Fetch lots for picker
  const lotsQuery = useQuery({
    queryKey: ["lots"],
    queryFn: () => LotsRepository.getAll(),
  });

  // Form state — pre-filled from AI
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
  const [brand, setBrand] = useState(params.brand || "");
  const [type, setType] = useState<(typeof ITEM_TYPES)[number]>(
    mapCategoryToType(params.category || ""),
  );
  const [color, setColor] = useState(
    params.colors?.split(",")[0]?.trim() || "",
  );
  const [size, setSize] = useState(params.size || "");
  const [condition, setCondition] = useState<(typeof CONDITIONS)[number]>(
    mapCondition(params.condition || "good"),
  );
  const [unitCost, setUnitCost] = useState(params.suggestedBuyPrice || "");
  const [photos, setPhotos] = useState<string[]>(
    params.imageUri ? [params.imageUri] : [],
  );

  // AI badge info
  const aiInfo = useMemo(() => {
    const parts: string[] = [];
    if (params.brand) parts.push(params.brand);
    if (params.model) parts.push(params.model);
    if (params.era && params.era !== "unknown") parts.push(params.era);
    return parts.join(" • ");
  }, [params]);

  const midPrice = params.midPrice ? parseFloat(params.midPrice) : null;

  // Create item mutation
  const createItem = useMutation({
    mutationFn: async () => {
      if (!selectedLotId) throw new Error("Veuillez sélectionner un lot");

      const cost = parseFloat(unitCost.replace(",", ".")) || 0;

      return ItemsRepository.create({
        lotId: selectedLotId,
        brand: brand || undefined,
        type: type || undefined,
        color: color || undefined,
        size: size || undefined,
        condition: condition || undefined,
        unitCost: cost.toFixed(2),
        status: "STOCK",
        photos: JSON.stringify(photos),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["lots"] });
      queryClient.invalidateQueries({ queryKey: ["lots-summary"] });
      if (selectedLotId) {
        queryClient.invalidateQueries({
          queryKey: ["lot-detail", selectedLotId],
        });
      }
    },
  });

  const isSubmitting = createItem.isPending;

  const handleCreate = async () => {
    if (!selectedLotId) {
      Alert.alert(t("common.error"), t("scanner.selectLotRequired"));
      return;
    }

    if (!unitCost || parseFloat(unitCost.replace(",", ".")) <= 0) {
      Alert.alert(t("common.error"), t("scanner.enterCost"));
      return;
    }

    try {
      await createItem.mutateAsync();
      Haptic.success();
      Alert.alert(t("common.success") + " 🎉", t("scanner.itemAdded"), [
        {
          text: "OK",
          onPress: () => {
            // Go back to the root/dashboard
            router.dismissAll();
            router.replace("/(tabs)/stock");
          },
        },
      ]);
    } catch (e: any) {
      Haptic.error();
      Alert.alert(t("common.error"), e.message || t("errors.saveFailed"));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <VantaScreen style={{ flex: 1 }}>
        <Stack.Screen
          options={{
            title: t("scanner.addToStock"),
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerLeft: () => (
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <AppIcon name="arrow-back" size={24} color={colors.text} />
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
          {/* AI Badge */}
          {aiInfo ? (
            <Animated.View
              entering={FadeInDown.delay(50).duration(400)}
              style={[
                styles.aiBadge,
                {
                  backgroundColor: colors.goldSubtle,
                  borderColor: colors.gold,
                },
              ]}
            >
              <AppIcon name="auto-awesome" size={18} color={colors.gold} />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.aiBadgeTitle, { color: colors.gold }]}
                  numberOfLines={1}
                >
                  {t("scanner.aiDetected")}
                </Text>
                <Text
                  style={[styles.aiBadgeInfo, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {aiInfo}
                </Text>
              </View>
              {midPrice != null && (
                <View style={styles.aiPriceBadge}>
                  <Text
                    style={[styles.aiPriceLabel, { color: colors.textMuted }]}
                  >
                    {t("scanner.marketPrice")}
                  </Text>
                  <Text style={[styles.aiPriceValue, { color: colors.gold }]}>
                    {currencySymbol}
                    {midPrice}
                  </Text>
                </View>
              )}
            </Animated.View>
          ) : null}

          {/* Lot Selector */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.section}
          >
            <Text style={[styles.label, { color: colors.textMuted }]}>
              {t("scanner.selectLot")} *
            </Text>
            {lotsQuery.isLoading ? (
              <View
                style={[
                  styles.lotPlaceholder,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={{ color: colors.textMuted }}>
                  {t("common.loading")}
                </Text>
              </View>
            ) : lotsQuery.data && lotsQuery.data.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.lotContainer}
              >
                {lotsQuery.data.map((lot) => {
                  const isActive = selectedLotId === lot.id;
                  return (
                    <Pressable
                      key={lot.id}
                      onPress={() => {
                        Haptic.selection();
                        setSelectedLotId(lot.id);
                      }}
                      style={[
                        styles.lotCard,
                        {
                          backgroundColor: isActive
                            ? colors.goldSubtle
                            : colors.surface,
                          borderColor: isActive ? colors.gold : colors.border,
                        },
                      ]}
                    >
                      <AppIcon
                        name="inventory-2"
                        size={20}
                        color={isActive ? colors.gold : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.lotCardProvider,
                          { color: isActive ? colors.gold : colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {lot.provider}
                      </Text>
                      <Text
                        style={[
                          styles.lotCardDate,
                          { color: colors.textMuted },
                        ]}
                      >
                        {lot.buyDate?.split("-").reverse().join("/")}
                      </Text>
                      <Text
                        style={[
                          styles.lotCardItems,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {lot.initialQuantity} {t("scanner.items")}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <Pressable
                style={[styles.createLotButton, { borderColor: colors.gold }]}
                onPress={() => router.push("/lots/new")}
              >
                <AppIcon name="add" size={20} color={colors.gold} />
                <Text style={[styles.createLotText, { color: colors.gold }]}>
                  {t("scanner.createLotFirst")}
                </Text>
              </Pressable>
            )}
          </Animated.View>

          {/* Photos */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(400)}
            style={styles.section}
          >
            <Text style={[styles.label, { color: colors.textMuted }]}>
              {t("items.photos")}
            </Text>
            <ItemPhotoPicker
              photos={photos}
              onPhotosChange={setPhotos}
              maxPhotos={5}
            />
          </Animated.View>

          {/* Brand */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.section}
          >
            <Text style={[styles.label, { color: colors.textMuted }]}>
              {t("scanner.brand")}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: brand ? colors.gold : colors.border,
                },
              ]}
              value={brand}
              onChangeText={setBrand}
              placeholder={t("items.placeholders.brand")}
              placeholderTextColor={colors.textMuted}
            />
          </Animated.View>

          {/* Type */}
          <Animated.View
            entering={FadeInDown.delay(250).duration(400)}
            layout={LinearTransition.springify()}
            style={styles.section}
          >
            <Text style={[styles.label, { color: colors.textMuted }]}>
              {t("items.type")}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipContainer}
            >
              {ITEM_TYPES.map((itemType) => (
                <AnimatedChip
                  key={itemType}
                  label={t(ITEM_TYPE_LABELS[itemType])}
                  isSelected={type === itemType}
                  onPress={() => setType(itemType)}
                  colors={colors}
                />
              ))}
            </ScrollView>
          </Animated.View>

          {/* Color */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={styles.section}
          >
            <Text style={[styles.label, { color: colors.textMuted }]}>
              {t("scanner.colors")}
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
              value={color}
              onChangeText={setColor}
              placeholder={t("items.placeholders.color")}
              placeholderTextColor={colors.textMuted}
            />
          </Animated.View>

          {/* Size */}
          <Animated.View
            entering={FadeInDown.delay(350).duration(400)}
            layout={LinearTransition.springify()}
            style={styles.section}
          >
            <Text style={[styles.label, { color: colors.textMuted }]}>
              {t("items.size")}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipContainer}
            >
              {SIZES.map((s) => (
                <AnimatedChip
                  key={s}
                  label={SIZE_LABELS[s] ? t(SIZE_LABELS[s]) : s}
                  isSelected={size === s}
                  onPress={() => setSize(s)}
                  colors={colors}
                />
              ))}
            </ScrollView>
          </Animated.View>

          {/* Condition */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            layout={LinearTransition.springify()}
            style={styles.section}
          >
            <Text style={[styles.label, { color: colors.textMuted }]}>
              {t("scanner.condition")}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipContainer}
            >
              {CONDITIONS.map((c) => (
                <AnimatedChip
                  key={c}
                  label={t(`items.conditions.${c}`)}
                  isSelected={condition === c}
                  onPress={() => setCondition(c)}
                  colors={colors}
                />
              ))}
            </ScrollView>
          </Animated.View>

          {/* Unit Cost (Buy Price) */}
          <Animated.View
            entering={FadeInDown.delay(450).duration(400)}
            style={styles.section}
          >
            <Text style={[styles.label, { color: colors.textMuted }]}>
              {t("scanner.buyPrice")} *
            </Text>
            <View
              style={[
                styles.currencyInput,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.currencySymbol, { color: colors.gold }]}>
                {currencySymbol}
              </Text>
              <TextInput
                style={[styles.currencyValue, { color: colors.text }]}
                value={unitCost}
                onChangeText={setUnitCost}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            {midPrice != null && (
              <Text style={[styles.priceHint, { color: colors.textMuted }]}>
                💡 {t("scanner.suggestedSellPrice")}: {currencySymbol}
                {midPrice}
              </Text>
            )}
          </Animated.View>
        </ScrollView>

        {/* Sticky CTA */}
        <View
          style={[
            styles.ctaContainer,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          <Pressable
            onPress={handleCreate}
            disabled={isSubmitting || !selectedLotId}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: Spacing.sm,
              backgroundColor:
                isSubmitting || !selectedLotId ? colors.textMuted : colors.gold,
              paddingVertical: Spacing.md,
              paddingHorizontal: Spacing.xl,
              borderRadius: Radius.lg,
              borderCurve: "continuous",
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <AppIcon name="check-circle" size={22} color="#FFF" />
            <Text style={styles.ctaText}>
              {isSubmitting ? t("common.loading") : t("scanner.addToStock")}
            </Text>
          </Pressable>
        </View>
      </VantaScreen>
    </KeyboardAvoidingView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    borderCurve: "continuous",
  },
  aiBadgeTitle: {
    fontSize: 11,
    fontFamily: "Manrope_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  aiBadgeInfo: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    marginTop: 2,
  },
  aiPriceBadge: {
    alignItems: "flex-end",
  },
  aiPriceLabel: {
    fontSize: 10,
    fontFamily: "Manrope_500Medium",
  },
  aiPriceValue: {
    fontSize: 18,
    fontFamily: "Manrope_800ExtraBold",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  lotContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  lotCard: {
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderCurve: "continuous",
    minWidth: 120,
  },
  lotCardProvider: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
  },
  lotCardDate: {
    fontSize: 11,
    fontFamily: "Manrope_400Regular",
  },
  lotCardItems: {
    fontSize: 11,
    fontFamily: "Manrope_500Medium",
  },
  lotPlaceholder: {
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  createLotButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  createLotText: {
    fontSize: 15,
    fontFamily: "Manrope_600SemiBold",
  },
  textInput: {
    fontFamily: "Manrope_400Regular",
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: 17,
    borderCurve: "continuous",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderCurve: "continuous",
  },
  chipText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  currencyInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    borderCurve: "continuous",
  },
  currencySymbol: {
    fontFamily: "Manrope_700Bold",
    fontSize: 22,
    marginRight: Spacing.sm,
  },
  currencyValue: {
    fontFamily: "Manrope_600SemiBold",
    flex: 1,
    fontSize: 22,
    paddingVertical: Spacing.md,
  },
  priceHint: {
    fontSize: 12,
    fontFamily: "Manrope_500Medium",
    marginTop: Spacing.xs,
  },
  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  ctaText: {
    color: "#FFF",
    fontSize: 17,
    fontFamily: "Manrope_700Bold",
  },
});
