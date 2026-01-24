/**
 * ✏️ EDIT LOT SCREEN - Ultra Premium Edition
 * Edit existing lot with pre-filled data
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { AnimatedPremiumBackground, Button } from "@/components/ui/Components";
import { useColorScheme } from "@/components/useColorScheme";
import { Radius, Spacing, Theme, Typography } from "@/constants/Theme";
import { LotsRepository, NewLot } from "@/db/repositories";
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
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];
  const queryClient = useQueryClient();

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
      Alert.alert("Missing Info", "Please select a provider");
      return;
    }
    if (!totalCost || parseFloat(totalCost) <= 0) {
      Alert.alert("Missing Info", "Please enter a valid cost");
      return;
    }
    if (quantity <= 0) {
      Alert.alert("Missing Info", "Please set a quantity");
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

      Alert.alert("Success! ✅", "Lot updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not update the lot.");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Lot",
      "Are you sure you want to delete this lot? This action cannot be undone and will also delete all associated items and sales.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteLot.mutateAsync();
              Alert.alert("Deleted", "Lot has been deleted.");
            } catch (e) {
              console.error(e);
              Alert.alert("Error", "Could not delete the lot.");
            }
          },
        },
      ],
    );
  };

  // Loading state
  if (lotQuery.isLoading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text
          style={[
            Typography.body.sm,
            { color: theme.textMuted, marginTop: Spacing.md },
          ]}
        >
          Loading lot...
        </Text>
      </View>
    );
  }

  // Error state
  if (!lotQuery.data) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: theme.background }]}
      >
        <View
          style={[styles.errorIcon, { backgroundColor: theme.dangerSubtle }]}
        >
          <AppIcon name="error-outline" size={40} color={theme.danger} />
        </View>
        <Text style={[Typography.heading.md, { color: theme.text }]}>
          Lot Not Found
        </Text>
        <Button
          variant="ghost"
          size="md"
          onPress={() => router.back()}
          style={{ marginTop: Spacing.xl }}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* ═══ Animated Premium Background ═══ */}
      <AnimatedPremiumBackground variant="light" />

      <Stack.Screen
        options={{
          title: "Edit Lot",
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
        {/* Name (optional) */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: theme.textMuted }]}>
            Lot Name (optional)
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Summer Collection"
            placeholderTextColor={theme.textMuted}
          />
        </Animated.View>

        {/* Provider */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: theme.textMuted }]}>
            Provider
          </Text>
          <View style={styles.typeSelector}>
            {PROVIDERS.map((p) => (
              <Pressable
                key={p.id}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor:
                      provider === p.id ? theme.primary : theme.surface,
                    borderColor:
                      provider === p.id ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setProvider(p.id)}
              >
                <AppIcon
                  name={p.icon as any}
                  size={18}
                  color={provider === p.id ? "#FFF" : theme.textMuted}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    {
                      color: provider === p.id ? "#FFF" : theme.textMuted,
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
          <Text style={[styles.label, { color: theme.textMuted }]}>
            Purchase Date
          </Text>
          <Pressable
            style={[
              styles.dateButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => setShowDateSelector(!showDateSelector)}
          >
            <Text style={[styles.dateText, { color: theme.text }]}>
              {formatDate(buyDate)}
            </Text>
            <AppIcon
              name={
                showDateSelector ? "keyboard-arrow-up" : "keyboard-arrow-down"
              }
              size={24}
              color={theme.primary}
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
                          ? theme.primary
                          : theme.surface,
                        borderColor: isSelected
                          ? theme.primary
                          : isToday
                            ? theme.success
                            : theme.border,
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
                          color: isSelected ? "#FFF" : theme.textMuted,
                        },
                      ]}
                    >
                      {date.toLocaleDateString("fr-FR", { weekday: "short" })}
                    </Text>
                    <Text
                      style={[
                        styles.dateChipDate,
                        { color: isSelected ? "#FFF" : theme.text },
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    <Text
                      style={[
                        styles.dateChipMonth,
                        {
                          color: isSelected ? "#FFF" : theme.textMuted,
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
          <Text style={[styles.label, { color: theme.textMuted }]}>
            Lot Type
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
                      lotType === t.id ? theme.primary : theme.surface,
                    borderColor:
                      lotType === t.id ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setLotType(t.id)}
              >
                <Text
                  style={[
                    styles.typeLabel,
                    {
                      color: lotType === t.id ? "#FFF" : theme.textMuted,
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
          <Text style={[styles.label, { color: theme.textMuted }]}>
            Financials
          </Text>
          <View style={styles.financialGrid}>
            <View style={styles.financialInput}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                Total Cost
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
                  value={totalCost}
                  onChangeText={setTotalCost}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>
            <View style={styles.financialInput}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                Shipping
              </Text>
              <View
                style={[
                  styles.currencyInput,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text
                  style={[styles.currencySymbol, { color: theme.textMuted }]}
                >
                  €
                </Text>
                <TextInput
                  style={[styles.currencyValue, { color: theme.text }]}
                  value={shippingCost}
                  onChangeText={setShippingCost}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={theme.textMuted}
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
          <Text style={[styles.label, { color: theme.textMuted }]}>
            Quantity
          </Text>
          <View style={styles.quantityRow}>
            <Pressable
              style={[
                styles.quantityButton,
                { backgroundColor: theme.primaryMuted },
              ]}
              onPress={() => setQuantity(Math.max(0, quantity - 1))}
            >
              <AppIcon name="remove" size={24} color={theme.primary} />
            </Pressable>
            <TextInput
              style={[
                styles.quantityInput,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={quantity.toString()}
              onChangeText={(t) => setQuantity(parseInt(t) || 0)}
              keyboardType="number-pad"
            />
            <Pressable
              style={[
                styles.quantityButton,
                { backgroundColor: theme.primaryMuted },
              ]}
              onPress={() => setQuantity(quantity + 1)}
            >
              <AppIcon name="add" size={24} color={theme.primary} />
            </Pressable>
          </View>
          {quantity > 0 && totalAmount > 0 && (
            <View
              style={[
                styles.unitCostBadge,
                { backgroundColor: theme.successSubtle },
              ]}
            >
              <Text style={[styles.unitCostText, { color: theme.success }]}>
                Unit cost: €{unitCost}
              </Text>
            </View>
          )}
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
          disabled={isSubmitting || !provider}
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  content: {
    padding: Spacing.xl,
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
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  typeButtonWide: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
  },
  dateScroller: {
    marginTop: Spacing.md,
  },
  dateScrollerContent: {
    gap: Spacing.sm,
  },
  dateChip: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    minWidth: 60,
  },
  dateChipDay: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  dateChipDate: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 2,
  },
  dateChipMonth: {
    fontSize: 10,
    fontWeight: "500",
  },
  financialGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  financialInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  currencyInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "700",
    marginRight: Spacing.xs,
  },
  currencyValue: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    paddingVertical: Spacing.md,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  unitCostBadge: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    alignSelf: "flex-start",
  },
  unitCostText: {
    fontSize: 14,
    fontWeight: "600",
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
