/**
 * ✏️ EDIT ITEM SCREEN - Vanta-Aether Edition
 * Edit existing item with pre-filled data
 */

import { AnimatedSkeleton } from "@/components/ui/AnimatedComponents";
import { AppIcon } from "@/components/ui/AppIcon";
import { ItemPhotoPicker } from "@/components/ui/ItemPhotoPicker";
import { useColorScheme } from "@/components/useColorScheme";
import { ItemsRepository, NewItem } from "@/db/repositories";
import { ReanimatedSpring } from "@/utils/animations-reanimated";
import { useSettingsStore } from "@/store/settings";
import { useLocale } from "@/utils/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import { MotiPressable } from "moti/interactions";
import React, { useEffect, useState } from "react";
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

// ═══════════════════════════════════════════════════════════════════
// 🎨 VANTA-AETHER DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════
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

// Common options
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
const STATUS_OPTIONS = [
  { id: "STOCK", labelKey: "items.status.stock", color: "success" },
  { id: "SOLD", labelKey: "items.status.sold", color: "primary" },
  { id: "RESERVED", labelKey: "items.status.reserved", color: "warning" },
] as const;

/**
 * 🎨 Animated Chip Component - Premium Selection
 */
function AnimatedChip({
  label,
  isSelected,
  onPress,
  colors,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof getColors>;
  small?: boolean;
}) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(
      isSelected ? 1 : 0,
      ReanimatedSpring.responsive,
    );
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
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
    color: interpolateColor(progress.value, [0, 1], [colors.textMuted, "#FFF"]),
  }));

  return (
    <MotiPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.92, ReanimatedSpring.responsive);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, ReanimatedSpring.bouncy);
      }}
    >
      <Animated.View style={[styles.chip, animatedStyle]}>
        <Animated.Text style={[styles.chipText, textStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </MotiPressable>
  );
}

/**
 * 🎨 Animated Status Button - Premium Selection
 */
function AnimatedStatusButton({
  id,
  label,
  colorType,
  isSelected,
  onPress,
  colors,
}: {
  id: string;
  label: string;
  colorType: "success" | "primary" | "warning";
  isSelected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof getColors>;
  t?: (key: string) => string;
}) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(isSelected ? 1 : 0);

  const statusColor =
    colorType === "success"
      ? colors.success
      : colorType === "warning"
        ? colors.warning
        : colors.gold;

  useEffect(() => {
    progress.value = withSpring(
      isSelected ? 1 : 0,
      ReanimatedSpring.responsive,
    );
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.surface, statusColor + "20"],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.border, statusColor],
    ),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value * 0.4 + 0.6 }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [colors.textMuted, statusColor],
    ),
  }));

  return (
    <MotiPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, ReanimatedSpring.responsive);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, ReanimatedSpring.bouncy);
      }}
      style={{ flex: 1 }}
    >
      <Animated.View style={[styles.statusButton, animatedStyle]}>
        <Animated.View
          style={[styles.statusDot, { backgroundColor: statusColor }, dotStyle]}
        />
        <Animated.Text style={[styles.statusText, textStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </MotiPressable>
  );
}

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = getColors(isDark);
  const queryClient = useQueryClient();
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

  // Form state
  const [brand, setBrand] = useState("");
  const [type, setType] = useState("Clothing");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState("Good");
  const [unitCost, setUnitCost] = useState("");
  const [status, setStatus] = useState("STOCK");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isFormReady, setIsFormReady] = useState(false);

  const itemId = id ? parseInt(id, 10) : null;

  // Fetch existing item data
  const itemQuery = useQuery({
    queryKey: ["item", itemId],
    enabled: !!itemId,
    queryFn: () => ItemsRepository.getById(itemId as number),
  });

  // Pre-fill form when item data is loaded
  useEffect(() => {
    if (itemQuery.data && !isFormReady) {
      const item = itemQuery.data;
      setBrand(item.brand || "");
      setType(item.type || "Clothing");
      setColor(item.color || "");
      setSize(item.size || "");
      setCondition(item.condition || "Good");
      setUnitCost(item.unitCost);
      setStatus(item.status);
      // Parse photos from JSON string
      try {
        const savedPhotos = item.photos ? JSON.parse(item.photos) : [];
        setPhotos(Array.isArray(savedPhotos) ? savedPhotos : []);
      } catch {
        setPhotos([]);
      }
      setIsFormReady(true);
    }
  }, [itemQuery.data, isFormReady]);

  // Update mutation
  const updateItem = useMutation({
    mutationFn: async (payload: Partial<NewItem>) => {
      if (!itemId) throw new Error("No item ID");
      return ItemsRepository.update(itemId, payload);
    },
    onSuccess: () => {
      const lotId = itemQuery.data?.lotId;
      queryClient.invalidateQueries({ queryKey: ["item", itemId] });
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      if (lotId) {
        queryClient.invalidateQueries({ queryKey: ["lot-detail", lotId] });
      }
    },
  });

  // Delete mutation
  const deleteItem = useMutation({
    mutationFn: async () => {
      if (!itemId) throw new Error("No item ID");
      return ItemsRepository.delete(itemId);
    },
    onSuccess: () => {
      const lotId = itemQuery.data?.lotId;
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      if (lotId) {
        queryClient.invalidateQueries({ queryKey: ["lot-detail", lotId] });
      }
      router.dismissAll();
      router.replace("/(tabs)/stock");
    },
  });

  const isSubmitting = updateItem.isPending;
  const isDeleting = deleteItem.isPending;

  const handleUpdate = async () => {
    if (!unitCost || parseFloat(unitCost) < 0) {
      Alert.alert(t("errors.validation"), t("lots.validation.validCost"));
      return;
    }

    try {
      const cost = parseFloat(unitCost.replace(",", "."));

      await updateItem.mutateAsync({
        brand: brand || undefined,
        type: type || undefined,
        color: color || undefined,
        size: size || undefined,
        condition: condition || undefined,
        unitCost: cost.toFixed(2),
        status,
        photos: JSON.stringify(photos),
      });

      Alert.alert(t("common.success") + " ✅", t("lots.updatedSuccess"), [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert(t("common.error"), t("errors.saveFailed"));
    }
  };

  const handleDelete = () => {
    Alert.alert(t("items.deleteItem"), t("items.confirmDelete"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteItem.mutateAsync();
            Alert.alert(t("common.success"), t("lots.deletedSuccess"));
          } catch (e) {
            console.error(e);
            Alert.alert(t("common.error"), t("errors.deleteFailed"));
          }
        },
      },
    ]);
  };

  // Loading state - Premium animated skeletons
  if (itemQuery.isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 400 }}
          style={styles.loadingContent}
        >
          {/* Header skeleton */}
          <View style={styles.skeletonHeader}>
            <AnimatedSkeleton
              width={56}
              height={56}
              borderRadius={12}
              delay={0}
            />
            <View style={{ gap: 6 }}>
              <AnimatedSkeleton
                width={80}
                height={14}
                borderRadius={4}
                delay={50}
              />
              <AnimatedSkeleton
                width={120}
                height={20}
                borderRadius={4}
                delay={100}
              />
            </View>
          </View>

          {/* Photos skeleton */}
          <View style={{ marginTop: 24 }}>
            <AnimatedSkeleton
              width={60}
              height={14}
              borderRadius={4}
              delay={150}
            />
            <View style={[styles.skeletonPhotos, { marginTop: 12 }]}>
              {[0, 1, 2].map((i) => (
                <AnimatedSkeleton
                  key={i}
                  width={80}
                  height={80}
                  borderRadius={12}
                  delay={200 + i * 50}
                />
              ))}
            </View>
          </View>

          {/* Fields skeleton */}
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ marginTop: 24 }}>
              <AnimatedSkeleton
                width={80}
                height={14}
                borderRadius={4}
                delay={350 + i * 100}
              />
              <AnimatedSkeleton
                width="100%"
                height={48}
                borderRadius={12}
                delay={400 + i * 100}
                style={{ marginTop: 12 }}
              />
            </View>
          ))}
        </MotiView>

        <Text
          style={{
            fontFamily: "Manrope_400Regular",
            fontSize: 14,
            color: colors.textMuted,
            marginTop: 24,
          }}
        >
          {t("common.loading")}
        </Text>
      </View>
    );
  }

  // Error state - Animated
  if (!itemQuery.data) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
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
        </MotiView>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            marginTop: 24,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: "Manrope_600SemiBold",
              fontSize: 16,
              color: colors.text,
            }}
          >
            {t("common.back")}
          </Text>
        </Pressable>
      </View>
    );
  }

  const item = itemQuery.data;

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen
        options={{
          title: t("items.editItem"),
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
        {/* Item Info Header */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          style={styles.itemHeader}
        >
          <View
            style={[styles.itemIcon, { backgroundColor: VANTA.goldSubtle }]}
          >
            <AppIcon name="checkroom" size={28} color={colors.gold} />
          </View>
          <View style={styles.itemInfo}>
            <Text
              style={{
                fontFamily: "Manrope_400Regular",
                fontSize: 14,
                color: colors.textMuted,
              }}
            >
              Lot #{item.lotId}
            </Text>
            <Text
              style={{
                fontFamily: "Manrope_700Bold",
                fontSize: 18,
                color: colors.text,
              }}
            >
              Item #{item.id}
            </Text>
          </View>
        </Animated.View>

        {/* Photos */}
        <Animated.View
          entering={FadeInDown.delay(75).duration(400)}
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
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t("items.brand")}
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
            value={brand}
            onChangeText={setBrand}
            placeholder={t("items.placeholders.brand")}
            placeholderTextColor={colors.textMuted}
          />
        </Animated.View>

        {/* Type */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
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
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t("items.color")}
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
          entering={FadeInDown.delay(250).duration(400)}
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
          entering={FadeInDown.delay(300).duration(400)}
          layout={LinearTransition.springify()}
          style={styles.section}
        >
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t("items.condition")}
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

        {/* Unit Cost */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t("items.unitCost")}
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
        </Animated.View>

        {/* Status */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          layout={LinearTransition.springify()}
          style={styles.section}
        >
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t("items.statusLabel")}
          </Text>
          <View style={styles.statusContainer}>
            {STATUS_OPTIONS.map((s) => (
              <AnimatedStatusButton
                key={s.id}
                id={s.id}
                label={t(s.labelKey)}
                colorType={s.color}
                isSelected={status === s.id}
                onPress={() => setStatus(s.id)}
                colors={colors}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={[styles.ctaContainer, { paddingBottom: insets.bottom + 20 }]}
      >
        <Pressable
          onPress={handleUpdate}
          disabled={isSubmitting}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backgroundColor: isSubmitting ? colors.textMuted : colors.gold,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 16,
            borderCurve: "continuous",
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <AppIcon name="check-circle" size={20} color="#FFF" />
          <Text
            style={{
              fontFamily: "Manrope_700Bold",
              fontSize: 17,
              color: "#FFF",
            }}
          >
            {isSubmitting ? t("lots.updating") : t("common.save")}
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
  loadingContent: {
    width: "100%",
    maxWidth: 360,
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  skeletonPhotos: {
    flexDirection: "row",
    gap: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderCurve: "continuous",
  },
  content: {
    padding: 24,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  itemIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderCurve: "continuous",
  },
  itemInfo: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textInput: {
    fontFamily: "Manrope_400Regular",
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    fontSize: 17,
    borderCurve: "continuous",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  chip: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
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
    borderRadius: 16,
    paddingHorizontal: 18,
    borderCurve: "continuous",
  },
  currencySymbol: {
    fontFamily: "Manrope_700Bold",
    fontSize: 22,
    marginRight: 10,
  },
  currencyValue: {
    fontFamily: "Manrope_600SemiBold",
    flex: 1,
    fontSize: 22,
    paddingVertical: 16,
  },
  statusContainer: {
    flexDirection: "row",
    gap: 14,
  },
  statusButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderCurve: "continuous",
    minHeight: 56,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
});
