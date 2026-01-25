/**
 * ➕ NEW LOT SCREEN - Ultra Premium Edition
 * Redesigned with modern UI patterns
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { AnimatedPremiumBackground, Button } from "@/components/ui/Components";
import { useNeuColors } from "@/components/ui/Neumorphic";
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
  const { palette, shadows, spacing, radius, typography, colorScheme } =
    useNeuColors();

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
      style={{ flex: 1, backgroundColor: palette.background.main }}
    >
      {/* ═══ Animated Premium Background ═══ */}
      <AnimatedPremiumBackground variant="light" />

      <Stack.Screen
        options={{
          title: "Nouveau lot",
          headerShown: true,
          headerStyle: { backgroundColor: palette.background.elevated },
          headerTintColor: palette.text.primary,
          headerTitleStyle: typography.heading.sm,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <AppIcon name="close" size={24} color={palette.text.primary} />
            </Pressable>
          ),
        }}
      />

      {/* Completion Progress Bar - Single unified bar */}
      <View
        style={{
          flexDirection: "column",
          gap: spacing.xs,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          backgroundColor: palette.background.elevated,
        }}
      >
        <View
          style={{
            width: "100%",
            height: 4,
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: palette.divider.main,
          }}
        >
          <Animated.View
            style={{
              height: "100%",
              borderRadius: 2,
              backgroundColor: palette.primary.main,
              width: `${Math.min(100, (provider ? 25 : 0) + (totalCost ? 25 : 0) + (quantity > 0 ? 25 : 0) + (itemSetupMode ? 25 : 0))}%`,
            }}
          />
        </View>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "500",
            textAlign: "center",
            marginTop: spacing.xs,
            color: palette.text.muted,
          }}
        >
          {provider && totalCost && quantity > 0 && itemSetupMode
            ? "✓ Prêt à créer"
            : "Compléter les informations"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 120,
        }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Informations de base */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              marginBottom: spacing.lg,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.md,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.primary.subtle,
              }}
            >
              <AppIcon name="folder" size={18} color={palette.primary.main} />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: palette.text.primary,
              }}
            >
              Informations de base
            </Text>
          </View>

          {/* Supplier Selector */}
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.5,
              marginBottom: spacing.sm,
              marginTop: spacing.md,
              color: palette.text.muted,
            }}
          >
            FOURNISSEUR
          </Text>
          <View
            style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}
          >
            {PROVIDERS.map((p) => (
              <Pressable
                key={p.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.full,
                  borderWidth: 1,
                  backgroundColor:
                    provider === p.id
                      ? palette.primary.main
                      : palette.background.elevated,
                  borderColor:
                    provider === p.id
                      ? palette.primary.main
                      : palette.divider.main,
                }}
                onPress={() => setProvider(p.id)}
              >
                <AppIcon
                  name={p.icon as any}
                  size={18}
                  color={provider === p.id ? "#FFF" : palette.text.muted}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: provider === p.id ? "#FFF" : palette.text.primary,
                  }}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Date Selector */}
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.5,
              marginBottom: spacing.sm,
              marginTop: spacing.md,
              color: palette.text.muted,
            }}
          >
            DATE D'ACHAT
          </Text>
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderRadius: radius.lg,
              borderWidth: 1,
              backgroundColor: palette.background.elevated,
              borderColor: palette.divider.main,
            }}
            onPress={() => setShowDateSelector(!showDateSelector)}
          >
            <Text style={{ fontSize: 16, color: palette.text.primary }}>
              {formatDate(buyDate)}
            </Text>
            <AppIcon
              name={
                showDateSelector ? "keyboard-arrow-up" : "keyboard-arrow-down"
              }
              size={24}
              color={palette.primary.main}
            />
          </Pressable>

          {/* Inline Date Options */}
          {showDateSelector && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={{
                marginTop: spacing.sm,
                paddingVertical: spacing.md,
                borderRadius: radius.lg,
                borderWidth: 1,
                backgroundColor: palette.background.elevated,
                borderColor: palette.divider.main,
              }}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: spacing.sm,
                  gap: spacing.sm,
                }}
              >
                {dateOptions.slice(25, 38).map((date, index) => {
                  const isSelected =
                    date.toDateString() === buyDate.toDateString();
                  const isToday =
                    date.toDateString() === new Date().toDateString();
                  return (
                    <Pressable
                      key={index}
                      style={{
                        width: 56,
                        height: 72,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: radius.lg,
                        borderWidth: 1,
                        backgroundColor: isSelected
                          ? palette.primary.main
                          : palette.background.main,
                        borderColor:
                          isToday && !isSelected
                            ? palette.primary.main
                            : palette.divider.main,
                      }}
                      onPress={() => {
                        setBuyDate(date);
                        setShowDateSelector(false);
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "500",
                          marginBottom: 4,
                          color: isSelected ? "#FFF" : palette.text.muted,
                        }}
                      >
                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                      </Text>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "700",
                          color: isSelected ? "#FFF" : palette.text.primary,
                        }}
                      >
                        {date.getDate()}
                      </Text>
                      {isToday && (
                        <View
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: 2.5,
                            marginTop: 4,
                            backgroundColor: isSelected
                              ? "#FFF"
                              : palette.primary.main,
                          }}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}

          {/* Lot Type */}
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.5,
              marginBottom: spacing.sm,
              marginTop: spacing.md,
              color: palette.text.muted,
            }}
          >
            TYPE DE LOT
          </Text>
          <View
            style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}
          >
            {LOT_TYPES.map((type) => (
              <Pressable
                key={type.id}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.full,
                  borderWidth: 1,
                  backgroundColor:
                    lotType === type.id
                      ? palette.primary.main
                      : palette.background.elevated,
                  borderColor:
                    lotType === type.id
                      ? palette.primary.main
                      : palette.divider.main,
                }}
                onPress={() => setLotType(type.id)}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: lotType === type.id ? "#FFF" : palette.text.primary,
                  }}
                >
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            marginVertical: spacing.xl,
            backgroundColor: palette.divider.main,
          }}
        />

        {/* Section: Finances */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              marginBottom: spacing.lg,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.md,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.accent.greenGlow,
              }}
            >
              <AppIcon
                name="account-balance-wallet"
                size={18}
                color={palette.semantic.success}
              />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: palette.text.primary,
              }}
            >
              Finances
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: spacing.md }}>
            {/* Total Cost */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                  marginBottom: spacing.sm,
                  marginTop: spacing.md,
                  color: palette.text.muted,
                }}
              >
                COÛT TOTAL
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  gap: spacing.sm,
                  backgroundColor: palette.background.elevated,
                  borderColor: palette.divider.main,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: palette.primary.main,
                  }}
                >
                  €
                </Text>
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: palette.text.primary }}
                  value={totalCost}
                  onChangeText={setTotalCost}
                  placeholder="0.00"
                  placeholderTextColor={palette.text.muted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Shipping */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                  marginBottom: spacing.sm,
                  marginTop: spacing.md,
                  color: palette.text.muted,
                }}
              >
                FRAIS DE PORT
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  gap: spacing.sm,
                  backgroundColor: palette.background.elevated,
                  borderColor: palette.divider.main,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: palette.primary.main,
                  }}
                >
                  €
                </Text>
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: palette.text.primary }}
                  value={shippingCost}
                  onChangeText={setShippingCost}
                  placeholder="0.00"
                  placeholderTextColor={palette.text.muted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* Item Count with +/- buttons */}
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.5,
              marginBottom: spacing.sm,
              marginTop: spacing.md,
              color: palette.text.muted,
            }}
          >
            NOMBRE D'ARTICLES
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderRadius: radius.lg,
              borderWidth: 1,
              overflow: "hidden",
              backgroundColor: palette.background.elevated,
              borderColor: palette.divider.main,
            }}
          >
            <Pressable
              style={{
                width: 48,
                height: 48,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.primary.subtle,
              }}
              onPress={decrementQuantity}
            >
              <AppIcon name="remove" size={24} color={palette.primary.main} />
            </Pressable>

            <TextInput
              style={{
                flex: 1,
                fontSize: 18,
                fontWeight: "600",
                paddingVertical: spacing.md,
                color: palette.text.primary,
              }}
              value={quantity.toString()}
              onChangeText={(t) => setQuantity(parseInt(t) || 0)}
              keyboardType="number-pad"
              textAlign="center"
            />

            <Pressable
              style={{
                width: 48,
                height: 48,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.primary.subtle,
              }}
              onPress={incrementQuantity}
            >
              <AppIcon name="add" size={24} color={palette.primary.main} />
            </Pressable>
          </View>

          {/* Estimated Cost Card */}
          <View
            style={{
              padding: spacing.lg,
              borderRadius: radius.lg,
              marginTop: spacing.lg,
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: palette.primary.subtle,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 0.5,
                color: palette.primary.main,
              }}
            >
              COÛT ESTIMÉ
            </Text>
            <Text
              style={{
                fontSize: 13,
                width: "60%",
                color: palette.text.muted,
              }}
            >
              Par article
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: palette.text.primary,
              }}
            >
              €{unitCost}
            </Text>
          </View>
        </Animated.View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            marginVertical: spacing.xl,
            backgroundColor: palette.divider.main,
          }}
        />

        {/* Section: Configuration des articles */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              marginBottom: spacing.lg,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.md,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.primary.subtle,
              }}
            >
              <AppIcon
                name="inventory-2"
                size={18}
                color={palette.semantic.warning}
              />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: palette.text.primary,
              }}
            >
              Configuration des articles
            </Text>
          </View>

          {/* Bulk Generate Option */}
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: spacing.lg,
              borderRadius: radius.lg,
              borderWidth: 1,
              marginBottom: spacing.md,
              gap: spacing.md,
              backgroundColor: palette.background.elevated,
              borderColor:
                itemSetupMode === "bulk"
                  ? palette.primary.main
                  : palette.divider.main,
            }}
            onPress={() => setItemSetupMode("bulk")}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.primary.subtle,
              }}
            >
              <AppIcon
                name="auto-awesome"
                size={20}
                color={palette.primary.main}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  marginBottom: 2,
                  color: palette.text.primary,
                }}
              >
                Génération automatique
              </Text>
              <Text style={{ fontSize: 12, color: palette.text.muted }}>
                Créer des IDs anonymes automatiquement (ex: Lot-001)
              </Text>
            </View>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 2,
                alignItems: "center",
                justifyContent: "center",
                borderColor:
                  itemSetupMode === "bulk"
                    ? palette.primary.main
                    : palette.divider.main,
              }}
            >
              {itemSetupMode === "bulk" && (
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: palette.primary.main,
                  }}
                />
              )}
            </View>
          </Pressable>

          {/* Manual Entry Option */}
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: spacing.lg,
              borderRadius: radius.lg,
              borderWidth: 1,
              marginBottom: spacing.md,
              gap: spacing.md,
              backgroundColor: palette.background.elevated,
              borderColor:
                itemSetupMode === "manual"
                  ? palette.primary.main
                  : palette.divider.main,
            }}
            onPress={() => setItemSetupMode("manual")}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.primary.subtle,
              }}
            >
              <AppIcon
                name="edit-note"
                size={20}
                color={palette.primary.main}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  marginBottom: 2,
                  color: palette.text.primary,
                }}
              >
                Saisie manuelle
              </Text>
              <Text style={{ fontSize: 12, color: palette.text.muted }}>
                Saisir les détails de chaque article individuellement
              </Text>
            </View>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 2,
                alignItems: "center",
                justifyContent: "center",
                borderColor:
                  itemSetupMode === "manual"
                    ? palette.primary.main
                    : palette.divider.main,
              }}
            >
              {itemSetupMode === "manual" && (
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: palette.primary.main,
                  }}
                />
              )}
            </View>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          borderTopWidth: 1,
          borderTopColor: "rgba(0,0,0,0.05)",
          backgroundColor: palette.background.main,
          paddingBottom: insets.bottom + spacing.md,
        }}
      >
        {/* Summary info */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: spacing.md,
            gap: spacing.lg,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: palette.text.primary,
              }}
            >
              {quantity > 0 ? quantity : "-"}
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: palette.text.muted,
              }}
            >
              articles
            </Text>
          </View>
          <View
            style={{
              width: 1,
              height: 32,
              backgroundColor: palette.divider.main,
            }}
          />
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: palette.primary.main,
              }}
            >
              €{unitCost}
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: palette.text.muted,
              }}
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
          style={{ width: "100%" }}
        >
          {isSubmitting ? "Création..." : "Créer le lot"}
        </Button>
      </View>

      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </KeyboardAvoidingView>
  );
}
