/**
 * 📜 SALE DETAIL SCREEN - View and manage sale
 * Shows sale details with cancel/refund option
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { Button } from "@/components/ui/Components";
import { useColorScheme } from "@/components/useColorScheme";
import { Radius, Spacing, Theme, Typography } from "@/constants/Theme";
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
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];
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
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text
          style={[
            Typography.body.sm,
            { color: theme.textMuted, marginTop: Spacing.md },
          ]}
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
        style={[styles.errorContainer, { backgroundColor: theme.background }]}
      >
        <View
          style={[styles.errorIcon, { backgroundColor: theme.dangerSubtle }]}
        >
          <AppIcon name="error-outline" size={40} color={theme.danger} />
        </View>
        <Text style={[Typography.heading.md, { color: theme.text }]}>
          Sale Not Found
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: "Sale Details",
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <AppIcon name="close" size={24} color={theme.text} />
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
        {/* Status Header */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          style={styles.statusHeader}
        >
          <View
            style={[
              styles.statusIcon,
              {
                backgroundColor: isCompleted
                  ? theme.successSubtle
                  : isCancelled
                    ? theme.dangerSubtle
                    : theme.warningSubtle,
              },
            ]}
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
                  ? theme.success
                  : isCancelled
                    ? theme.danger
                    : theme.warning
              }
            />
          </View>
          <Text style={[Typography.heading.lg, { color: theme.text }]}>
            {isCompleted ? "Sale Completed" : sale.status}
          </Text>
          <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
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
          <View style={styles.amountCard}>
            <Text style={[Typography.label.sm, { color: theme.textMuted }]}>
              NET AMOUNT
            </Text>
            <Text
              style={[
                Typography.hero,
                {
                  color: isCompleted ? theme.success : theme.textMuted,
                  textDecorationLine: isCancelled ? "line-through" : "none",
                },
              ]}
            >
              €{priceNet.toFixed(2)}
            </Text>
            <View
              style={[
                styles.platformBadge,
                { backgroundColor: theme.primaryMuted },
              ]}
            >
              <AppIcon name="store" size={14} color={theme.primary} />
              <Text style={[Typography.label.sm, { color: theme.primary }]}>
                {sale.platform || "Vinted"}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Breakdown */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Breakdown
          </Text>
          <View>
            <View style={styles.breakdownRow}>
              <Text style={[Typography.body.md, { color: theme.text }]}>
                Gross Price
              </Text>
              <Text style={[Typography.number.md, { color: theme.text }]}>
                €{priceGross.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.breakdownRow}>
              <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
                Platform Fees
              </Text>
              <Text style={[Typography.number.sm, { color: theme.danger }]}>
                -€{platformFees.toFixed(2)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
                Shipping Fees
              </Text>
              <Text style={[Typography.number.sm, { color: theme.danger }]}>
                -€{shippingFees.toFixed(2)}
              </Text>
            </View>
            {miscFees > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
                  Other Fees
                </Text>
                <Text style={[Typography.number.sm, { color: theme.danger }]}>
                  -€{miscFees.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.breakdownRow}>
              <Text style={[Typography.heading.sm, { color: theme.text }]}>
                Net Profit
              </Text>
              <Text
                style={[
                  Typography.number.md,
                  { color: theme.success, fontWeight: "700" },
                ]}
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
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Item
            </Text>
            <View style={styles.itemCard}>
              <View
                style={[
                  styles.itemIcon,
                  { backgroundColor: theme.primaryMuted },
                ]}
              >
                <AppIcon name="checkroom" size={24} color={theme.primary} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={[Typography.heading.xs, { color: theme.text }]}>
                  {item.brand || "Unknown Brand"}
                </Text>
                <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
                  {item.type || "Clothing"} • {item.size || "OS"} •{" "}
                  {item.condition || "Good"}
                </Text>
                <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
                  Cost: €{parseFloat(String(item.unitCost)).toFixed(2)}
                </Text>
              </View>
              <View
                style={[
                  styles.itemStatus,
                  {
                    backgroundColor:
                      item.status === "SOLD"
                        ? theme.successSubtle
                        : item.status === "STOCK"
                          ? theme.primaryMuted
                          : theme.warningSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    Typography.label.xs,
                    {
                      color:
                        item.status === "SOLD"
                          ? theme.success
                          : item.status === "STOCK"
                            ? theme.primary
                            : theme.warning,
                    },
                  ]}
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
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Reference
          </Text>
          <View style={styles.referenceRow}>
            <View
              style={[
                styles.refBadge,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <AppIcon name="inventory-2" size={16} color={theme.primary} />
              <Text style={[Typography.label.sm, { color: theme.text }]}>
                Lot #{sale.lotId}
              </Text>
            </View>
            <View
              style={[
                styles.refBadge,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <AppIcon name="receipt" size={16} color={theme.textMuted} />
              <Text style={[Typography.label.sm, { color: theme.text }]}>
                Sale #{sale.id}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Cancel CTA - only show for completed sales */}
      {isCompleted && (
        <View
          style={[
            styles.ctaContainer,
            { paddingBottom: insets.bottom + Spacing.lg },
          ]}
        >
          <Button
            variant="danger"
            size="lg"
            onPress={handleCancel}
            disabled={cancelSale.isPending}
            icon={<AppIcon name="cancel" size={20} color="#FFF" />}
            style={styles.ctaButton}
          >
            {cancelSale.isPending ? "Cancelling..." : "Cancel Sale"}
          </Button>
        </View>
      )}
    </View>
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
  statusHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  amountCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  referenceRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  refBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
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
