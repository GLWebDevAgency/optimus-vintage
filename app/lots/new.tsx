/**
 * ➕ NEW LOT SCREEN - Ultra Premium Edition
 * Redesigned with modern UI patterns
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { AnimatedPremiumBackground, Button } from "@/components/ui/Components";
import { useColorScheme } from "@/components/useColorScheme";
import { Radius, Spacing, Theme, Typography } from "@/constants/Theme";
import { ItemsRepository, LotsRepository } from "@/db/repositories";
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
  { id: "eureka", label: "Eureka", icon: "store" },
  { id: "fleek", label: "Fleek", icon: "local-shipping" },
  { id: "personnel", label: "Personnel", icon: "person" },
] as const;

// Lot types - must match API validation: 'BULK' | 'PIECEWISE'
const LOT_TYPES = [
  { id: "BULK", label: "Bulk / Kilo" },
  { id: "PIECEWISE", label: "Piecewise" },
] as const;

export default function AddLotScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];

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
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatDateFull = (date: Date) => {
    return date.toLocaleDateString("en-US", {
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
      Alert.alert("Missing Fields", "Please fill in all required fields.");
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

      Alert.alert("Success! 🎉", "Lot created successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not create the lot.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* ═══ Animated Premium Background ═══ */}
      <AnimatedPremiumBackground variant="light" />

      <Stack.Screen
        options={{
          title: "Nouveau lot",
          headerShown: true,
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
          headerTitleStyle: Typography.heading.sm,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <AppIcon name="close" size={24} color={theme.text} />
            </Pressable>
          ),
        }}
      />

      {/* Completion Progress Bar - Single unified bar */}
      <View
        style={[styles.progressContainer, { backgroundColor: theme.surface }]}
      >
        <View
          style={[styles.progressTrackFull, { backgroundColor: theme.border }]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.primary,
                width: `${Math.min(100, (provider ? 25 : 0) + (totalCost ? 25 : 0) + (quantity > 0 ? 25 : 0) + (itemSetupMode ? 25 : 0))}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressLabel, { color: theme.textMuted }]}>
          {provider && totalCost && quantity > 0 && itemSetupMode
            ? "✓ Prêt à créer"
            : "Compléter les informations"}
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
                { backgroundColor: theme.primaryMuted },
              ]}
            >
              <AppIcon name="folder" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Informations de base
            </Text>
          </View>

          {/* Supplier Selector */}
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
            FOURNISSEUR
          </Text>
          <View style={styles.typeSelector}>
            {PROVIDERS.map((p) => (
              <Pressable
                key={p.id}
                style={[
                  styles.providerChip,
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
                    { color: provider === p.id ? "#FFF" : theme.text },
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Date Selector */}
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
            DATE D'ACHAT
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

          {/* Inline Date Options */}
          {showDateSelector && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={[
                styles.inlineDatePicker,
                { backgroundColor: theme.surface, borderColor: theme.border },
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
                            ? theme.primary
                            : theme.background,
                          borderColor:
                            isToday && !isSelected
                              ? theme.primary
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
                          { color: isSelected ? "#FFF" : theme.textMuted },
                        ]}
                      >
                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                      </Text>
                      <Text
                        style={[
                          styles.dateChipNumber,
                          { color: isSelected ? "#FFF" : theme.text },
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
                                : theme.primary,
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
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
            TYPE DE LOT
          </Text>
          <View style={styles.typeSelector}>
            {LOT_TYPES.map((type) => (
              <Pressable
                key={type.id}
                style={[
                  styles.typeOption,
                  {
                    backgroundColor:
                      lotType === type.id ? theme.primary : theme.surface,
                    borderColor:
                      lotType === type.id ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setLotType(type.id)}
              >
                <Text
                  style={[
                    styles.typeLabel,
                    { color: lotType === type.id ? "#FFF" : theme.text },
                  ]}
                >
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Section: Finances */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIcon,
                { backgroundColor: theme.successMuted },
              ]}
            >
              <AppIcon
                name="account-balance-wallet"
                size={18}
                color={theme.success}
              />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Finances
            </Text>
          </View>

          <View style={styles.financialsRow}>
            {/* Total Cost */}
            <View style={styles.financialField}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                COÛT TOTAL
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
                  placeholder="0.00"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Shipping */}
            <View style={styles.financialField}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                FRAIS DE PORT
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
                  value={shippingCost}
                  onChangeText={setShippingCost}
                  placeholder="0.00"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* Item Count with +/- buttons */}
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
            NOMBRE D'ARTICLES
          </Text>
          <View
            style={[
              styles.quantityContainer,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Pressable
              style={[
                styles.quantityButton,
                { backgroundColor: theme.primaryMuted },
              ]}
              onPress={decrementQuantity}
            >
              <AppIcon name="remove" size={24} color={theme.primary} />
            </Pressable>

            <TextInput
              style={[styles.quantityInput, { color: theme.text }]}
              value={quantity.toString()}
              onChangeText={(t) => setQuantity(parseInt(t) || 0)}
              keyboardType="number-pad"
              textAlign="center"
            />

            <Pressable
              style={[
                styles.quantityButton,
                { backgroundColor: theme.primaryMuted },
              ]}
              onPress={incrementQuantity}
            >
              <AppIcon name="add" size={24} color={theme.primary} />
            </Pressable>
          </View>

          {/* Estimated Cost Card */}
          <View
            style={[
              styles.estimatedCard,
              { backgroundColor: theme.primaryMuted },
            ]}
          >
            <Text style={[styles.estimatedLabel, { color: theme.primary }]}>
              COÛT ESTIMÉ
            </Text>
            <Text
              style={[styles.estimatedSubLabel, { color: theme.textMuted }]}
            >
              Par article
            </Text>
            <Text style={[styles.estimatedValue, { color: theme.text }]}>
              €{unitCost}
            </Text>
          </View>
        </Animated.View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Section: Configuration des articles */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIcon,
                { backgroundColor: theme.primaryMuted },
              ]}
            >
              <AppIcon name="inventory-2" size={18} color={theme.warning} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Configuration des articles
            </Text>
          </View>

          {/* Bulk Generate Option */}
          <Pressable
            style={[
              styles.setupOption,
              {
                backgroundColor: theme.surface,
                borderColor:
                  itemSetupMode === "bulk" ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setItemSetupMode("bulk")}
          >
            <View
              style={[
                styles.setupIcon,
                { backgroundColor: theme.primaryMuted },
              ]}
            >
              <AppIcon name="auto-awesome" size={20} color={theme.primary} />
            </View>
            <View style={styles.setupText}>
              <Text style={[styles.setupTitle, { color: theme.text }]}>
                Génération automatique
              </Text>
              <Text style={[styles.setupDesc, { color: theme.textMuted }]}>
                Créer des IDs anonymes automatiquement (ex: Lot-001)
              </Text>
            </View>
            <View
              style={[
                styles.radioOuter,
                {
                  borderColor:
                    itemSetupMode === "bulk" ? theme.primary : theme.border,
                },
              ]}
            >
              {itemSetupMode === "bulk" && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: theme.primary },
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
                backgroundColor: theme.surface,
                borderColor:
                  itemSetupMode === "manual" ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setItemSetupMode("manual")}
          >
            <View
              style={[
                styles.setupIcon,
                { backgroundColor: theme.primaryMuted },
              ]}
            >
              <AppIcon name="edit-note" size={20} color={theme.primary} />
            </View>
            <View style={styles.setupText}>
              <Text style={[styles.setupTitle, { color: theme.text }]}>
                Saisie manuelle
              </Text>
              <Text style={[styles.setupDesc, { color: theme.textMuted }]}>
                Saisir les détails de chaque article individuellement
              </Text>
            </View>
            <View
              style={[
                styles.radioOuter,
                {
                  borderColor:
                    itemSetupMode === "manual" ? theme.primary : theme.border,
                },
              ]}
            >
              {itemSetupMode === "manual" && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: theme.primary },
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
            backgroundColor: theme.background,
            paddingBottom: insets.bottom + Spacing.md,
          },
        ]}
      >
        {/* Summary info */}
        <View style={styles.footerSummary}>
          <View style={styles.footerSummaryItem}>
            <Text style={[styles.footerSummaryValue, { color: theme.text }]}>
              {quantity > 0 ? quantity : "-"}
            </Text>
            <Text
              style={[styles.footerSummaryLabel, { color: theme.textMuted }]}
            >
              articles
            </Text>
          </View>
          <View
            style={[styles.footerDivider, { backgroundColor: theme.border }]}
          />
          <View style={styles.footerSummaryItem}>
            <Text style={[styles.footerSummaryValue, { color: theme.primary }]}>
              €{unitCost}
            </Text>
            <Text
              style={[styles.footerSummaryLabel, { color: theme.textMuted }]}
            >
              /article
            </Text>
          </View>
        </View>
        <Button
          variant="primary"
          size="lg"
          onPress={handleCreate}
          disabled={isSubmitting || !provider || !totalCost || quantity === 0}
          icon={<AppIcon name="check-circle" size={20} color="#FFF" />}
          style={styles.continueButton}
        >
          {isSubmitting ? "Création..." : "Créer le lot"}
        </Button>
      </View>

      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
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
    width: 48,
    height: 48,
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
    borderRadius: Radius.lg,
    marginTop: Spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
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
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  setupIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
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
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
    borderRadius: Radius.xl,
    padding: Spacing.xl,
  },
  providerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
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
    borderRadius: Radius.lg,
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
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFF",
  },
});
