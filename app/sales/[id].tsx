/**
 * 📜 SALE DETAIL SCREEN - View and manage sale
 * Shows sale details with cancel/refund option
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { Button } from "@/components/ui/Components";
import { useNeuColors } from "@/components/ui/Neumorphic";
import { ItemsRepository, SalesRepository } from "@/db/repositories";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { palette, shadows, spacing, radius, typography, colorScheme } =
    useNeuColors();
  const queryClient = useQueryClient();

  const saleId = id ? parseInt(id, 10) : null;

  // Fetch sale data
  const saleQuery = useQuery({
    queryKey: ["sale", saleId],
    enabled: !!saleId,
    queryFn: () => SalesRepository.getById(saleId as number),
  });

  // Fetch linked item if exists
  const itemQuery = useQuery({
    queryKey: ["item", saleQuery.data?.itemId],
    enabled: !!saleQuery.data?.itemId,
    queryFn: () => ItemsRepository.getById(saleQuery.data!.itemId as number),
  });

  // Cancel mutation
  const cancelSale = useMutation({
    mutationFn: async () => {
      if (!saleId) throw new Error("No sale ID");
      return SalesRepository.cancel(saleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale", saleId] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      if (saleQuery.data?.lotId) {
        queryClient.invalidateQueries({
          queryKey: ["lot-detail", saleQuery.data.lotId],
        });
      }
    },
  });

  const handleCancel = () => {
    if (saleQuery.data?.status !== "COMPLETED") {
      Alert.alert("Info", "This sale is already cancelled or refunded.");
      return;
    }

    Alert.alert(
      "Cancel Sale",
      "Are you sure you want to cancel this sale? The item will be returned to stock.",
      [
        { text: "Keep Sale", style: "cancel" },
        {
          text: "Cancel Sale",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelSale.mutateAsync();
              Alert.alert(
                "Sale Cancelled",
                "The item has been returned to stock.",
                [{ text: "OK", onPress: () => router.back() }],
              );
            } catch (e) {
              console.error(e);
              Alert.alert("Error", "Could not cancel the sale.");
            }
          },
        },
      ],
    );
  };

  // Loading state
  if (saleQuery.isLoading) {
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
        <ActivityIndicator size="large" color={palette.primary.main} />
        <Text
          style={{
            ...typography.body.sm,
            color: palette.text.muted,
            marginTop: spacing.md,
          }}
        >
          Loading sale...
        </Text>
      </View>
    );
  }

  // Error state
  if (!saleQuery.data) {
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
            borderRadius: 40,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: spacing.lg,
            backgroundColor: "rgba(239, 68, 68, 0.15)",
          }}
        >
          <AppIcon name="error-outline" size={40} color={palette.accent.red} />
        </View>
        <Text style={{ ...typography.heading.md, color: palette.text.primary }}>
          Sale Not Found
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

  const sale = saleQuery.data;
  const item = itemQuery.data;
  const isCompleted = sale.status === "COMPLETED";
  const isCancelled = sale.status === "CANCELLED";

  const priceGross = parseFloat(String(sale.priceGross));
  const platformFees = parseFloat(String(sale.platformFees || 0));
  const shippingFees = parseFloat(String(sale.shippingFees || 0));
  const miscFees = parseFloat(String(sale.miscFees || 0));
  const priceNet = parseFloat(String(sale.priceNet));

  return (
    <View style={{ flex: 1, backgroundColor: palette.background.main }}>
      <Stack.Screen
        options={{
          title: "Sale Details",
          headerStyle: { backgroundColor: palette.background.main },
          headerTintColor: palette.text.primary,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <AppIcon name="close" size={24} color={palette.text.primary} />
            </Pressable>
          ),
        }}
      />
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 120,
        }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Status Header */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          style={{ alignItems: "center", marginBottom: spacing.xl }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: spacing.md,
              backgroundColor: isCompleted
                ? "rgba(16, 185, 129, 0.15)"
                : isCancelled
                  ? "rgba(239, 68, 68, 0.15)"
                  : "rgba(245, 158, 11, 0.15)",
            }}
          >
            <AppIcon
              name={
                isCompleted
                  ? "check-circle"
                  : isCancelled
                    ? "cancel"
                    : "schedule"
              }
              size={36}
              color={
                isCompleted
                  ? palette.accent.green
                  : isCancelled
                    ? palette.accent.red
                    : palette.accent.yellow
              }
            />
          </View>
          <Text
            style={{ ...typography.heading.lg, color: palette.text.primary }}
          >
            {isCompleted ? "Sale Completed" : sale.status}
          </Text>
          <Text style={{ ...typography.body.sm, color: palette.text.muted }}>
            {new Date(sale.saleDate).toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </Animated.View>

        {/* Amount Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View
            style={{
              alignItems: "center",
              paddingVertical: spacing.xl,
              marginBottom: spacing.xl,
            }}
          >
            <Text style={{ ...typography.label.sm, color: palette.text.muted }}>
              NET AMOUNT
            </Text>
            <Text
              style={{
                ...typography.display["2xl"],
                color: isCompleted ? palette.accent.green : palette.text.muted,
                textDecorationLine: isCancelled ? "line-through" : "none",
              }}
            >
              €{priceNet.toFixed(2)}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radius.full,
                marginTop: spacing.md,
                backgroundColor: palette.primary.subtle,
              }}
            >
              <AppIcon name="store" size={14} color={palette.primary.main} />
              <Text
                style={{ ...typography.label.sm, color: palette.primary.main }}
              >
                {sale.platform || "Vinted"}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Breakdown */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={{ marginBottom: spacing.xl }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: spacing.sm,
              color: palette.text.secondary,
            }}
          >
            Breakdown
          </Text>
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: spacing.sm,
              }}
            >
              <Text
                style={{ ...typography.body.md, color: palette.text.primary }}
              >
                Gross Price
              </Text>
              <Text
                style={{ ...typography.number.md, color: palette.text.primary }}
              >
                €{priceGross.toFixed(2)}
              </Text>
            </View>
            <View
              style={{
                height: 1,
                marginVertical: spacing.sm,
                backgroundColor: palette.divider.main,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: spacing.sm,
              }}
            >
              <Text
                style={{ ...typography.body.sm, color: palette.text.muted }}
              >
                Platform Fees
              </Text>
              <Text
                style={{ ...typography.number.sm, color: palette.accent.red }}
              >
                -€{platformFees.toFixed(2)}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: spacing.sm,
              }}
            >
              <Text
                style={{ ...typography.body.sm, color: palette.text.muted }}
              >
                Shipping Fees
              </Text>
              <Text
                style={{ ...typography.number.sm, color: palette.accent.red }}
              >
                -€{shippingFees.toFixed(2)}
              </Text>
            </View>
            {miscFees > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: spacing.sm,
                }}
              >
                <Text
                  style={{ ...typography.body.sm, color: palette.text.muted }}
                >
                  Other Fees
                </Text>
                <Text
                  style={{ ...typography.number.sm, color: palette.accent.red }}
                >
                  -€{miscFees.toFixed(2)}
                </Text>
              </View>
            )}
            <View
              style={{
                height: 1,
                marginVertical: spacing.sm,
                backgroundColor: palette.divider.main,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: spacing.sm,
              }}
            >
              <Text
                style={{
                  ...typography.heading.sm,
                  color: palette.text.primary,
                }}
              >
                Net Profit
              </Text>
              <Text
                style={{
                  ...typography.number.md,
                  color: palette.accent.green,
                  fontWeight: "700",
                }}
              >
                €{priceNet.toFixed(2)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Item Info */}
        {item && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={{ marginBottom: spacing.xl }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: spacing.sm,
                color: palette.text.secondary,
              }}
            >
              Item
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: radius.md,
                  justifyContent: "center",
                  alignItems: "center",
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
                  style={{
                    ...typography.heading.sm,
                    color: palette.text.primary,
                  }}
                >
                  {item.brand || "Unknown Brand"}
                </Text>
                <Text
                  style={{ ...typography.body.sm, color: palette.text.muted }}
                >
                  {item.type || "Clothing"} • {item.size || "OS"} •{" "}
                  {item.condition || "Good"}
                </Text>
                <Text
                  style={{ ...typography.body.xs, color: palette.text.muted }}
                >
                  Cost: €{parseFloat(String(item.unitCost)).toFixed(2)}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.sm,
                  backgroundColor:
                    item.status === "SOLD"
                      ? "rgba(16, 185, 129, 0.15)"
                      : item.status === "STOCK"
                        ? palette.primary.subtle
                        : "rgba(245, 158, 11, 0.15)",
                }}
              >
                <Text
                  style={{
                    ...typography.label.xs,
                    color:
                      item.status === "SOLD"
                        ? palette.accent.green
                        : item.status === "STOCK"
                          ? palette.primary.main
                          : palette.accent.yellow,
                  }}
                >
                  {item.status}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Lot Reference */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          style={{ marginBottom: spacing.xl }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: spacing.sm,
              color: palette.text.secondary,
            }}
          >
            Reference
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
                borderWidth: 1,
                backgroundColor: palette.background.elevated,
                borderColor: palette.divider.main,
              }}
            >
              <AppIcon
                name="inventory-2"
                size={16}
                color={palette.primary.main}
              />
              <Text
                style={{ ...typography.label.sm, color: palette.text.primary }}
              >
                Lot #{sale.lotId}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
                borderWidth: 1,
                backgroundColor: palette.background.elevated,
                borderColor: palette.divider.main,
              }}
            >
              <AppIcon name="receipt" size={16} color={palette.text.muted} />
              <Text
                style={{ ...typography.label.sm, color: palette.text.primary }}
              >
                Sale #{sale.id}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Cancel CTA - only show for completed sales */}
      {isCompleted && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
          }}
        >
          <Button
            variant="danger"
            size="lg"
            onPress={handleCancel}
            disabled={cancelSale.isPending}
            icon={<AppIcon name="cancel" size={20} color="#FFF" />}
            style={{ width: "100%" }}
          >
            {cancelSale.isPending ? "Cancelling..." : "Cancel Sale"}
          </Button>
        </View>
      )}
    </View>
  );
}
