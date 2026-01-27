/**
 * ✏️ EDIT ITEM SCREEN - Luxury Edition with Premium Animations
 * Edit existing item with pre-filled data
 */

import {
  AnimatedButton,
  AnimatedSkeleton,
} from "@/components/ui/AnimatedComponents";
import { AppIcon } from "@/components/ui/AppIcon";
import { Button } from "@/components/ui/Components";
import { ItemPhotoPicker } from "@/components/ui/ItemPhotoPicker";
import { useColorScheme } from "@/components/useColorScheme";
import { Radius, Spacing, Theme, Typography } from "@/constants/Theme";
import { ItemsRepository, NewItem } from "@/db/repositories";
import { ReanimatedSpring } from "@/utils/animations-reanimated";
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

// Common options
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"] as const;
const ITEM_TYPES = [
  "Clothing",
  "Shoes",
  "Accessories",
  "Bags",
  "Jewelry",
  "Other",
] as const;
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size", "N/A"] as const;
const STATUS_OPTIONS = [
  { id: "STOCK", label: "En stock", color: "success" },
  { id: "SOLD", label: "Vendu", color: "primary" },
  { id: "RESERVED", label: "Réservé", color: "warning" },
] as const;

/**
 * 🎨 Animated Chip Component - Premium Selection
 */
function AnimatedChip({
  label,
  isSelected,
  onPress,
  theme,
  small = false,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  theme: typeof Theme.dark;
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
      [theme.surface, theme.primary],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.border, theme.primary],
    ),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [theme.textMuted, "#FFF"]),
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
      <Animated.View
        style={[styles.chip, small && styles.chipSmall, animatedStyle]}
      >
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
  theme,
}: {
  id: string;
  label: string;
  colorType: "success" | "primary" | "warning";
  isSelected: boolean;
  onPress: () => void;
  theme: typeof Theme.dark;
}) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(isSelected ? 1 : 0);

  const statusColor =
    colorType === "success"
      ? theme.success
      : colorType === "warning"
        ? theme.warning
        : theme.primary;

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
      [theme.surface, statusColor + "20"],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.border, statusColor],
    ),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value * 0.4 + 0.6 }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [theme.textMuted, statusColor],
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
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Theme[colorScheme];
  const queryClient = useQueryClient();

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
      Alert.alert("Missing Info", "Please enter a valid cost");
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

      Alert.alert("Success! ✅", "Item updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not update the item.");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteItem.mutateAsync();
              Alert.alert("Deleted", "Item has been deleted.");
            } catch (e) {
              console.error(e);
              Alert.alert("Error", "Could not delete the item.");
            }
          },
        },
      ],
    );
  };

  // Loading state - Premium animated skeletons
  if (itemQuery.isLoading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
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
              borderRadius={Radius.md}
              delay={0}
            />
            <View style={{ gap: Spacing.xs }}>
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
          <View style={{ marginTop: Spacing.xl }}>
            <AnimatedSkeleton
              width={60}
              height={14}
              borderRadius={4}
              delay={150}
            />
            <View style={[styles.skeletonPhotos, { marginTop: Spacing.sm }]}>
              {[0, 1, 2].map((i) => (
                <AnimatedSkeleton
                  key={i}
                  width={80}
                  height={80}
                  borderRadius={Radius.md}
                  delay={200 + i * 50}
                />
              ))}
            </View>
          </View>

          {/* Fields skeleton */}
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ marginTop: Spacing.xl }}>
              <AnimatedSkeleton
                width={80}
                height={14}
                borderRadius={4}
                delay={350 + i * 100}
              />
              <AnimatedSkeleton
                width="100%"
                height={48}
                borderRadius={Radius.md}
                delay={400 + i * 100}
                style={{ marginTop: Spacing.sm }}
              />
            </View>
          ))}
        </MotiView>

        <Text
          style={[
            Typography.body.sm,
            { color: theme.textMuted, marginTop: Spacing.xl },
          ]}
        >
          Chargement de l'article...
        </Text>
      </View>
    );
  }

  // Error state - Animated
  if (!itemQuery.data) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: theme.background }]}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.8, translateY: 20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <View
            style={[styles.errorIcon, { backgroundColor: theme.dangerSubtle }]}
          >
            <AppIcon name="error-outline" size={40} color={theme.danger} />
          </View>
        </MotiView>
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 200 }}
        >
          <Text
            style={[
              Typography.heading.md,
              { color: theme.text, textAlign: "center" },
            ]}
          >
            Item Not Found
          </Text>
        </MotiView>
        <AnimatedButton
          variant="ghost"
          size="md"
          onPress={() => router.back()}
          delay={400}
          style={{ marginTop: Spacing.xl }}
        >
          Go Back
        </AnimatedButton>
      </View>
    );
  }

  const item = itemQuery.data;

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Stack.Screen
        options={{
          title: "Edit Item",
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <AppIcon name="close" size={24} color={theme.text} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleDelete} hitSlop={8} disabled={isDeleting}>
              <AppIcon
                name="cancel"
                size={24}
                color={isDeleting ? theme.textMuted : theme.danger}
              />
            </Pressable>
          ),
        }}
      />
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

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
            style={[styles.itemIcon, { backgroundColor: theme.primaryMuted }]}
          >
            <AppIcon name="checkroom" size={28} color={theme.primary} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
              Lot #{item.lotId}
            </Text>
            <Text style={[Typography.heading.sm, { color: theme.text }]}>
              Item #{item.id}
            </Text>
          </View>
        </Animated.View>

        {/* Photos */}
        <Animated.View
          entering={FadeInDown.delay(75).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: theme.textMuted }]}>Photos</Text>
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
          <Text style={[styles.label, { color: theme.textMuted }]}>Brand</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g., Nike, Levi's, Zara..."
            placeholderTextColor={theme.textMuted}
          />
        </Animated.View>

        {/* Type */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          layout={LinearTransition.springify()}
          style={styles.section}
        >
          <Text style={[styles.label, { color: theme.textMuted }]}>Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipContainer}
          >
            {ITEM_TYPES.map((t) => (
              <AnimatedChip
                key={t}
                label={t}
                isSelected={type === t}
                onPress={() => setType(t)}
                theme={theme}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Color */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: theme.textMuted }]}>Color</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={color}
            onChangeText={setColor}
            placeholder="e.g., Black, Navy Blue..."
            placeholderTextColor={theme.textMuted}
          />
        </Animated.View>

        {/* Size */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          layout={LinearTransition.springify()}
          style={styles.section}
        >
          <Text style={[styles.label, { color: theme.textMuted }]}>Size</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipContainer}
          >
            {SIZES.map((s) => (
              <AnimatedChip
                key={s}
                label={s}
                isSelected={size === s}
                onPress={() => setSize(s)}
                theme={theme}
                small
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
          <Text style={[styles.label, { color: theme.textMuted }]}>
            Condition
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipContainer}
          >
            {CONDITIONS.map((c) => (
              <AnimatedChip
                key={c}
                label={c}
                isSelected={condition === c}
                onPress={() => setCondition(c)}
                theme={theme}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Unit Cost */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: theme.textMuted }]}>
            Unit Cost
          </Text>
          <View
            style={[
              styles.currencyInput,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.currencySymbol, { color: theme.primary }]}>
              €
            </Text>
            <TextInput
              style={[styles.currencyValue, { color: theme.text }]}
              value={unitCost}
              onChangeText={setUnitCost}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </Animated.View>

        {/* Status */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          layout={LinearTransition.springify()}
          style={styles.section}
        >
          <Text style={[styles.label, { color: theme.textMuted }]}>Status</Text>
          <View style={styles.statusContainer}>
            {STATUS_OPTIONS.map((s) => (
              <AnimatedStatusButton
                key={s.id}
                id={s.id}
                label={s.label}
                colorType={s.color}
                isSelected={status === s.id}
                onPress={() => setStatus(s.id)}
                theme={theme}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={[
          styles.ctaContainer,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
      >
        <Button
          variant="primary"
          size="lg"
          onPress={handleUpdate}
          disabled={isSubmitting}
          icon={<AppIcon name="check-circle" size={20} color="#FFF" />}
          style={styles.ctaButton}
        >
          {isSubmitting ? "Updating..." : "Save Changes"}
        </Button>
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
    padding: Spacing.xl,
  },
  loadingContent: {
    width: "100%",
    maxWidth: 360,
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  skeletonPhotos: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
    borderCurve: "continuous",
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.03), 0 8px 16px rgba(0,0,0,0.02), 0 16px 32px rgba(239,68,68,0.12), inset 0 1px 0 rgba(255,255,255,0.5)",
  },
  content: {
    padding: Spacing.xl,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  itemIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    justifyContent: "center",
    alignItems: "center",
    borderCurve: "continuous",
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04), 0 8px 16px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.5)",
  },
  itemInfo: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    fontSize: 17,
    borderCurve: "continuous",
    // Premium multi-layer inset shadow
    boxShadow:
      "inset 0 2px 4px rgba(0,0,0,0.03), inset 0 4px 8px rgba(0,0,0,0.02), inset 0 1px 2px rgba(0,0,0,0.05)",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderCurve: "continuous",
    // Premium glassmorphic convex effect
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.03), 0 8px 16px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.6)",
  },
  chipSmall: {
    paddingHorizontal: Spacing.sm,
    minWidth: 48,
    alignItems: "center",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  currencyInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    borderCurve: "continuous",
    // Ultra-premium multi-layer inset shadow
    boxShadow:
      "inset 0 2px 4px rgba(0,0,0,0.03), inset 0 4px 8px rgba(0,0,0,0.02), inset 0 1px 2px rgba(0,0,0,0.05)",
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: "700",
    marginRight: Spacing.sm,
  },
  currencyValue: {
    flex: 1,
    fontSize: 22,
    fontWeight: "600",
    paddingVertical: Spacing.lg,
  },
  statusContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statusButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderCurve: "continuous",
    minHeight: 56,
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.03), 0 8px 16px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.5)",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    boxShadow: "0 1px 3px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.15)",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
  },
  ctaButton: {
    width: "100%",
  },
});
