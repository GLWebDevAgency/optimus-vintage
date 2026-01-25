/**
 * 💰 NEW SALE SCREEN - Ultra Premium Edition
 */

import { AppIcon } from "@/components/ui/AppIcon";
import {
    AnimatedPremiumBackground,
    Button,
    Card,
    ShimmerSkeleton,
} from "@/components/ui/Components";
import { useNeuColors } from "@/components/ui/Neumorphic";
import { Item, ItemsRepository, SalesRepository } from "@/db/repositories";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NewSaleScreen() {
  const params = useLocalSearchParams<{ itemId?: string; lotId?: string }>();
  const insets = useSafeAreaInsets();
  const { palette, shadows, spacing, radius, typography, colorScheme } =
    useNeuColors();

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
      Alert.alert("Missing", "Price or item is missing.");
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
        "Congrats! 💸",
        `Sale recorded. Net profit: €${result.net.toFixed(2)}`,
        [
          {
            text: "Awesome",
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
      Alert.alert("Error", "Could not record the sale.");
    }
  };

  if (itemId && itemQuery.isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: spacing.xl,
          backgroundColor: palette.background.main,
        }}
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

  if (itemId && !item) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: spacing.xl,
          backgroundColor: palette.background.main,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: radius["2xl"],
            alignItems: "center",
            justifyContent: "center",
            marginBottom: spacing.lg,
            backgroundColor: palette.accent.redGlow,
          }}
        >
          <AppIcon name="error-outline" size={40} color={palette.accent.red} />
        </View>
        <Text style={[typography.heading.md, { color: palette.text.primary }]}>
          Item Not Found
        </Text>
        <Text
          style={[
            typography.body.sm,
            { color: palette.text.muted, textAlign: "center" },
          ]}
        >
          The selected item could not be loaded. Please try again.
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

  if (!params.itemId && !item) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: spacing.xl,
          backgroundColor: palette.background.main,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: radius["2xl"],
            alignItems: "center",
            justifyContent: "center",
            marginBottom: spacing.lg,
            backgroundColor: palette.accent.redGlow,
          }}
        >
          <AppIcon name="error-outline" size={40} color={palette.accent.red} />
        </View>
        <Text style={[typography.heading.md, { color: palette.text.primary }]}>
          No Item Selected
        </Text>
        <Text
          style={[
            typography.body.sm,
            { color: palette.text.muted, textAlign: "center" },
          ]}
        >
          Please select an item from the Stock screen to record a sale.
        </Text>
        <Button
          variant="primary"
          size="md"
          onPress={() => {
            // Dismiss modal stack first, then navigate to stock tab
            router.dismissAll();
            router.replace("/(tabs)/stock");
          }}
          style={{ marginTop: spacing.xl }}
        >
          Go to Stock
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: palette.background.main }}
    >
      {/* ═══ Animated Premium Background ═══ */}
      <AnimatedPremiumBackground variant="light" />

      <Stack.Screen
        options={{
          title: "New Sale",
          presentation: "formSheet",
          headerStyle: { backgroundColor: palette.background.main },
          headerTintColor: palette.text.primary,
        }}
      />

      <View
        style={{
          flex: 1,
          padding: spacing.xl,
          paddingBottom: insets.bottom + 100,
        }}
      >
        {/* Item Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <Card
            variant="elevated"
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: spacing.lg,
              marginBottom: spacing.lg,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: radius.lg,
                alignItems: "center",
                justifyContent: "center",
                marginRight: spacing.md,
                backgroundColor: palette.primary.subtle,
              }}
            >
              <AppIcon
                name="checkroom"
                size={24}
                color={palette.primary.main}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[typography.heading.sm, { color: palette.text.primary }]}
              >
                {item
                  ? `${item.type || "Item"} ${item.brand || ""}`
                  : "Loading..."}
              </Text>
              <Text style={[typography.body.xs, { color: palette.text.muted }]}>
                Lot #{item?.lotId} • ID: {item?.id} • Cost: €
                {item ? parseFloat(String(item.unitCost)).toFixed(2) : "0.00"}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Sale Form */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Card variant="elevated" style={{ padding: spacing.xl }}>
            <Text
              style={[
                typography.heading.sm,
                { color: palette.text.primary, marginBottom: spacing.lg },
              ]}
            >
              Sale Details
            </Text>

            <Text
              style={[
                typography.body.sm,
                { color: palette.text.muted, marginBottom: spacing.xs },
              ]}
            >
              Prix de vente brut (€) *
            </Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              placeholderTextColor={palette.text.muted}
              keyboardType="numeric"
              style={{
                fontSize: 16,
                fontFamily: "Manrope_600SemiBold",
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                borderRadius: radius.lg,
                borderWidth: 1,
                backgroundColor: palette.background.elevated,
                color: palette.text.primary,
                borderColor: palette.divider.main,
              }}
            />

            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    typography.body.sm,
                    { color: palette.text.muted, marginBottom: spacing.xs },
                  ]}
                >
                  Frais plateforme
                </Text>
                <TextInput
                  value={platformFees}
                  onChangeText={setPlatformFees}
                  placeholder="0.00"
                  placeholderTextColor={palette.text.muted}
                  keyboardType="numeric"
                  style={{
                    fontSize: 16,
                    fontFamily: "Manrope_600SemiBold",
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    backgroundColor: palette.background.elevated,
                    color: palette.text.primary,
                    borderColor: palette.divider.main,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    typography.body.sm,
                    { color: palette.text.muted, marginBottom: spacing.xs },
                  ]}
                >
                  Expédition
                </Text>
                <TextInput
                  value={shippingFees}
                  onChangeText={setShippingFees}
                  placeholder="0.00"
                  placeholderTextColor={palette.text.muted}
                  keyboardType="numeric"
                  style={{
                    fontSize: 16,
                    fontFamily: "Manrope_600SemiBold",
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    backgroundColor: palette.background.elevated,
                    color: palette.text.primary,
                    borderColor: palette.divider.main,
                  }}
                />
              </View>
            </View>

            {/* Net Calculation */}
            <View
              style={{
                borderRadius: radius.lg,
                padding: spacing.lg,
                marginTop: spacing.lg,
                backgroundColor: palette.background.elevated,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={[typography.body.sm, { color: palette.text.muted }]}
                >
                  Montant net
                </Text>
                <Text
                  style={[
                    typography.number.md,
                    { color: palette.text.primary },
                  ]}
                >
                  €{netAmount}
                </Text>
              </View>
              <View
                style={{
                  height: 1,
                  marginVertical: spacing.md,
                  backgroundColor: palette.divider.main,
                }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={[typography.body.sm, { color: palette.text.muted }]}
                >
                  Bénéfice
                </Text>
                <Text
                  style={[
                    typography.number.lg,
                    {
                      color:
                        parseFloat(profit) >= 0
                          ? palette.accent.green
                          : palette.accent.red,
                    },
                  ]}
                >
                  {parseFloat(profit) >= 0 ? "+" : ""}€{profit}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>
      </View>

      {/* Sticky CTA */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.lg,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: -40,
            left: 0,
            right: 0,
            bottom: 0,
            height: 80,
            backgroundColor: palette.background.main,
          }}
        />
        <Button
          variant="success"
          size="lg"
          onPress={handleSave}
          disabled={isSubmitting || !price}
          icon={<AppIcon name="check-circle" size={20} color="#FFF" />}
          style={{ width: "100%" }}
        >
          {isSubmitting ? "Recording..." : "Record Sale"}
        </Button>
      </View>

      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </KeyboardAvoidingView>
  );
}
