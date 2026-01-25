/**
 * ✏️ EDIT ITEM SCREEN - Luxury Edition
 * Edit existing item with pre-filled data
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { Button, ShimmerSkeleton } from "@/components/ui/Components";
import { ItemPhotoPicker } from "@/components/ui/ItemPhotoPicker";
import { useNeuTheme } from "@/constants/ThemeContext";
import { ItemsRepository, NewItem } from "@/db/repositories";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
import Animated, { FadeInDown } from "react-native-reanimated";
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

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { palette, shadows, spacing, radius, typography, isDark } =
    useNeuTheme();
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

  // Loading state
  if (itemQuery.isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: palette.background.main },
        ]}
      >
        <ShimmerSkeleton width={200} height={100} borderRadius={radius.xl} />
        <Text
          style={[
            typography.body.sm,
            { color: palette.text.muted, marginTop: spacing.md },
          ]}
        >
          Chargement de l'article...
        </Text>
      </View>
    );
  }

  // Error state
  if (!itemQuery.data) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: palette.background.main },
        ]}
      >
        <View
          style={[
            styles.errorIcon,
            { backgroundColor: palette.accent.red + "20" },
          ]}
        >
          <AppIcon name="error-outline" size={40} color={palette.accent.red} />
        </View>
        <Text style={[typography.heading.md, { color: palette.text.primary }]}>
          Item Not Found
        </Text>
        <Button
          variant="ghost"
          size="md"
          onPress={() => router.back()}
          style={{ marginTop: spacing.xl }}
        >
          Go Back
        </Button>
      </View>
    );
  }

  const item = itemQuery.data;

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: palette.background.main }]}
    >
      <Stack.Screen
        options={{
          title: "Edit Item",
          headerStyle: { backgroundColor: palette.background.main },
          headerTintColor: palette.text.primary,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <AppIcon name="close" size={24} color={palette.text.primary} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleDelete} hitSlop={8} disabled={isDeleting}>
              <AppIcon
                name="cancel"
                size={24}
                color={isDeleting ? palette.text.muted : palette.accent.red}
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
            style={[
              styles.itemIcon,
              { backgroundColor: palette.primary.subtle },
            ]}
          >
            <AppIcon name="checkroom" size={28} color={palette.primary.main} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={[typography.body.sm, { color: palette.text.muted }]}>
              Lot #{item.lotId}
            </Text>
            <Text
              style={[typography.heading.sm, { color: palette.text.primary }]}
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
          <Text style={[styles.label, { color: palette.text.muted }]}>
            Photos
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
          <Text style={[styles.label, { color: palette.text.muted }]}>
            Brand
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: palette.background.elevated,
                color: palette.text.primary,
                borderColor: palette.background.dark,
              },
            ]}
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g., Nike, Levi's, Zara..."
            placeholderTextColor={palette.text.muted}
          />
        </Animated.View>

        {/* Type */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: palette.text.muted }]}>
            Type
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipContainer}
          >
            {ITEM_TYPES.map((t) => (
              <Pressable
                key={t}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      type === t
                        ? palette.primary.main
                        : palette.background.elevated,
                    borderColor:
                      type === t
                        ? palette.primary.main
                        : palette.background.dark,
                  },
                ]}
                onPress={() => setType(t)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: type === t ? "#FFF" : palette.text.muted },
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Color */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: palette.text.muted }]}>
            Color
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: palette.background.elevated,
                color: palette.text.primary,
                borderColor: palette.background.dark,
              },
            ]}
            value={color}
            onChangeText={setColor}
            placeholder="e.g., Black, Navy Blue..."
            placeholderTextColor={palette.text.muted}
          />
        </Animated.View>

        {/* Size */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: palette.text.muted }]}>
            Size
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipContainer}
          >
            {SIZES.map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.chip,
                  styles.chipSmall,
                  {
                    backgroundColor:
                      size === s
                        ? palette.primary.main
                        : palette.background.elevated,
                    borderColor:
                      size === s
                        ? palette.primary.main
                        : palette.background.dark,
                  },
                ]}
                onPress={() => setSize(s)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: size === s ? "#FFF" : palette.text.muted },
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Condition */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: palette.text.muted }]}>
            Condition
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipContainer}
          >
            {CONDITIONS.map((c) => (
              <Pressable
                key={c}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      condition === c
                        ? palette.primary.main
                        : palette.background.elevated,
                    borderColor:
                      condition === c
                        ? palette.primary.main
                        : palette.background.dark,
                  },
                ]}
                onPress={() => setCondition(c)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: condition === c ? "#FFF" : palette.text.muted },
                  ]}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Unit Cost */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: palette.text.muted }]}>
            Unit Cost
          </Text>
          <View
            style={[
              styles.currencyInput,
              {
                backgroundColor: palette.background.elevated,
                borderColor: palette.background.dark,
              },
            ]}
          >
            <Text
              style={[styles.currencySymbol, { color: palette.primary.main }]}
            >
              €
            </Text>
            <TextInput
              style={[styles.currencyValue, { color: palette.text.primary }]}
              value={unitCost}
              onChangeText={setUnitCost}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={palette.text.muted}
            />
          </View>
        </Animated.View>

        {/* Status */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: palette.text.muted }]}>
            Status
          </Text>
          <View style={styles.statusContainer}>
            {STATUS_OPTIONS.map((s) => {
              const statusColor =
                s.color === "success"
                  ? palette.accent.green
                  : s.color === "warning"
                    ? palette.accent.amber
                    : palette.primary.main;
              return (
                <Pressable
                  key={s.id}
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor:
                        status === s.id
                          ? statusColor + "20"
                          : palette.background.elevated,
                      borderColor:
                        status === s.id ? statusColor : palette.background.dark,
                    },
                  ]}
                  onPress={() => setStatus(s.id)}
                >
                  <View
                    style={[styles.statusDot, { backgroundColor: statusColor }]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          status === s.id ? statusColor : palette.text.muted,
                      },
                    ]}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={[
          styles.ctaContainer,
          { paddingBottom: insets.bottom + spacing.lg },
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
    marginBottom: 20,
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
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  chipContainer: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipSmall: {
    paddingHorizontal: 8,
    minWidth: 44,
    alignItems: "center",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  currencyInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "700",
    marginRight: 4,
  },
  currencyValue: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    paddingVertical: 16,
  },
  statusContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  ctaButton: {
    width: "100%",
  },
});
