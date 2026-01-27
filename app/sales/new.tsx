/**
 * 💰 NEW SALE SCREEN - Ultra Premium Edition with Animations
 */

import {
    AnimatedButton,
    AnimatedSkeleton,
} from "@/components/ui/AnimatedComponents";
import { AppIcon } from "@/components/ui/AppIcon";
import {
    AnimatedPremiumBackground,
    Button,
    Card,
} from "@/components/ui/Components";
import { useColorScheme } from "@/components/useColorScheme";
import { Radius, Spacing, Theme, Typography } from "@/constants/Theme";
import { Item, ItemsRepository, SalesRepository } from "@/db/repositories";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import React, { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NewSaleScreen() {
  const params = useLocalSearchParams<{ itemId?: string; lotId?: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];

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
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 400 }}
          style={{ width: "100%", maxWidth: 360 }}
        >
          {/* Item card skeleton */}
          <AnimatedSkeleton
            width="100%"
            height={100}
            borderRadius={Radius.xl}
            delay={0}
          />

          {/* Price inputs skeleton */}
          <View style={{ marginTop: Spacing.xl }}>
            <AnimatedSkeleton
              width={100}
              height={14}
              borderRadius={4}
              delay={100}
            />
            <AnimatedSkeleton
              width="100%"
              height={56}
              borderRadius={Radius.md}
              delay={150}
              style={{ marginTop: Spacing.sm }}
            />
          </View>

          <View style={{ marginTop: Spacing.lg }}>
            <AnimatedSkeleton
              width={80}
              height={14}
              borderRadius={4}
              delay={200}
            />
            <AnimatedSkeleton
              width="100%"
              height={56}
              borderRadius={Radius.md}
              delay={250}
              style={{ marginTop: Spacing.sm }}
            />
          </View>

          {/* Summary skeleton */}
          <AnimatedSkeleton
            width="100%"
            height={80}
            borderRadius={Radius.lg}
            delay={300}
            style={{ marginTop: Spacing.xl }}
          />
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

  if (itemId && !item) {
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
          <Text
            style={[
              Typography.body.sm,
              {
                color: theme.textMuted,
                textAlign: "center",
                marginTop: Spacing.sm,
              },
            ]}
          >
            The selected item could not be loaded. Please try again.
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

  if (!params.itemId && !item) {
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
            No Item Selected
          </Text>
          <Text
            style={[
              Typography.body.sm,
              {
                color: theme.textMuted,
                textAlign: "center",
                marginTop: Spacing.sm,
              },
            ]}
          >
            Please select an item from the Stock screen to record a sale.
          </Text>
        </MotiView>
        <AnimatedButton
          variant="primary"
          size="lg"
          onPress={() => {
            router.dismissAll();
            router.replace("/(tabs)/stock");
          }}
          delay={400}
          style={{ marginTop: Spacing.xl }}
        >
          Go to Stock
        </AnimatedButton>
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
          title: "New Sale",
          presentation: "formSheet",
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />

      <View style={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        {/* Item Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <Card variant="elevated" style={styles.itemHeader}>
            <View
              style={[styles.itemIcon, { backgroundColor: theme.primaryMuted }]}
            >
              <AppIcon name="checkroom" size={24} color={theme.primary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={[Typography.heading.sm, { color: theme.text }]}>
                {item
                  ? `${item.type || "Item"} ${item.brand || ""}`
                  : "Loading..."}
              </Text>
              <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
                Lot #{item?.lotId} • ID: {item?.id} • Cost: €
                {item ? parseFloat(String(item.unitCost)).toFixed(2) : "0.00"}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Sale Form */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Card variant="elevated" style={styles.formCard}>
            <Text
              style={[
                Typography.heading.sm,
                { color: theme.text, marginBottom: Spacing.lg },
              ]}
            >
              Sale Details
            </Text>

            <Text
              style={[
                Typography.body.sm,
                { color: theme.textMuted, marginBottom: Spacing.xs },
              ]}
            >
              Prix de vente brut (€) *
            </Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              style={[
                styles.input,
                {
                  backgroundColor: theme.surfaceCard,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text
                  style={[
                    Typography.body.sm,
                    { color: theme.textMuted, marginBottom: Spacing.xs },
                  ]}
                >
                  Frais plateforme
                </Text>
                <TextInput
                  value={platformFees}
                  onChangeText={setPlatformFees}
                  placeholder="0.00"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceCard,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>
              <View style={styles.halfInput}>
                <Text
                  style={[
                    Typography.body.sm,
                    { color: theme.textMuted, marginBottom: Spacing.xs },
                  ]}
                >
                  Expédition
                </Text>
                <TextInput
                  value={shippingFees}
                  onChangeText={setShippingFees}
                  placeholder="0.00"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceCard,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Net Calculation */}
            <View
              style={[styles.calcCard, { backgroundColor: theme.surfaceCard }]}
            >
              <View style={styles.calcRow}>
                <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
                  Montant net
                </Text>
                <Text style={[Typography.number.md, { color: theme.text }]}>
                  €{netAmount}
                </Text>
              </View>
              <View
                style={[styles.calcDivider, { backgroundColor: theme.border }]}
              />
              <View style={styles.calcRow}>
                <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
                  Bénéfice
                </Text>
                <Text
                  style={[
                    Typography.number.lg,
                    {
                      color:
                        parseFloat(profit) >= 0 ? theme.success : theme.danger,
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
        style={[
          styles.ctaContainer,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
      >
        <View
          style={[styles.ctaGradient, { backgroundColor: theme.background }]}
        />
        <Button
          variant="success"
          size="lg"
          onPress={handleSave}
          disabled={isSubmitting || !price}
          icon={<AppIcon name="check-circle" size={20} color="#FFF" />}
          style={styles.ctaButton}
        >
          {isSubmitting ? "Recording..." : "Record Sale"}
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorIcon: {
    width: 88,
    height: 88,
    borderRadius: Radius["2xl"],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    borderCurve: "continuous",
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.03), 0 8px 16px rgba(0,0,0,0.02), 0 16px 32px rgba(239,68,68,0.12), inset 0 1px 0 rgba(255,255,255,0.5)",
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  itemIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    borderCurve: "continuous",
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04), 0 8px 16px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,0.5)",
  },
  itemInfo: {
    flex: 1,
  },
  formCard: {
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
    boxShadow:
      "0 1px 2px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.03), 0 4px 8px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.01), inset 0 1px 0 rgba(255,255,255,0.6)",
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  calcCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderCurve: "continuous",
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.03), 0 8px 16px rgba(16,185,129,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calcDivider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
  },
  ctaGradient: {
    ...StyleSheet.absoluteFillObject,
    height: 80,
    top: -40,
  },
  ctaButton: {
    width: "100%",
    borderRadius: Radius.xl,
    borderCurve: "continuous",
    boxShadow:
      "0 2px 4px rgba(16,185,129,0.3), 0 4px 8px rgba(16,185,129,0.25), 0 8px 16px rgba(16,185,129,0.2), 0 16px 32px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.3)",
  },
  input: {
    fontSize: 18,
    fontFamily: "Manrope_600SemiBold",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderCurve: "continuous",
    boxShadow:
      "inset 0 2px 4px rgba(0,0,0,0.04), inset 0 4px 8px rgba(0,0,0,0.03), inset 0 1px 2px rgba(0,0,0,0.05)",
  },
});
