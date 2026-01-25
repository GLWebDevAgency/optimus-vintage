/**
 * 📦 LOT DETAIL SCREEN - Neumorphic Dark Edition
 *
 * Design fidèle 100% au mockup détails_du_lot_neumorphic_dark
 * Style: Soft UI, Dark Neumorphic, Circular Gauges, Timeline
 */

import { AppIcon } from "@/components/ui/AppIcon";
import {
    NeuCard,
    NeuProgressBar,
    NeuScreen,
    useNeuColors,
} from "@/components/ui/Neumorphic";
import { SkeletonList } from "@/components/ui/Skeleton";
import {
    Item,
    ItemsRepository,
    LotsRepository,
    Sale,
    SalesRepository,
} from "@/db/repositories";
import {
    computeLotSummary,
    computeProtection,
    LotSummary,
    ProtectionAnalysis,
} from "@/utils/engine/calculations";
import { Haptic } from "@/utils/haptics";
import { useQuery } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
    FadeInDown,
    SlideInRight,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ═══════════════════════════════════════════════════════════════════════════════
// 🔘 NEUMORPHIC ICON BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface NeuIconButtonProps {
  icon: string;
  onPress: () => void;
  size?: number;
  iconColor?: string;
}

function NeuIconButton({
  icon,
  onPress,
  size = 22,
  iconColor,
}: NeuIconButtonProps) {
  const { palette, shadows, spacing, radius } = useNeuColors();
  const finalIconColor = iconColor ?? palette.text.secondary;
  const scale = useSharedValue(1);
  const shadowIntensity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
    shadowIntensity.value = 0;
    Haptic.selection();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    shadowIntensity.value = 1;
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          {
            width: 48,
            height: 48,
            borderRadius: radius.lg,
            backgroundColor: palette.background.main,
            alignItems: "center" as const,
            justifyContent: "center" as const,
          },
          Platform.OS === "web" && {
            boxShadow: shadows.convex.css as any,
          },
          Platform.OS === "ios" && shadows.convex.ios,
          Platform.OS === "android" && {
            elevation: shadows.convex.android,
          },
        ]}
      >
        <AppIcon name={icon as any} size={size} color={finalIconColor} />
      </Pressable>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

type SegmentOption = "top" | "losses" | "all";

interface ItemWithSale extends Item {
  sale?: Sale;
  profit?: number;
}

function formatCurrency(value: number): string {
  return `€${Math.abs(value).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎬 NEUMORPHIC ACTION BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface NeuActionButtonProps {
  label: string;
  onPress: () => void;
  icon?: string;
}

function NeuActionButton({ label, onPress, icon }: NeuActionButtonProps) {
  const { palette, shadows, spacing, radius } = useNeuColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
    Haptic.selection();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          {
            backgroundColor: palette.background.main,
            borderRadius: radius.xl,
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing.xl,
            alignItems: "center" as const,
            justifyContent: "center" as const,
            flexDirection: "row" as const,
            marginTop: spacing.md,
          },
          Platform.OS === "web" && {
            boxShadow: `${shadows.flat.css}, ${shadows.glow.cssSm}` as any,
          },
          Platform.OS === "ios" && [shadows.flat.ios, shadows.glow.iosSm],
        ]}
      >
        {icon && (
          <AppIcon
            name={icon as any}
            size={20}
            color={palette.primary.main}
            style={{ marginRight: spacing.sm }}
          />
        )}
        <Text
          style={{
            color: palette.primary.main,
            fontSize: 16,
            fontWeight: "700" as const,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎬 NEUMORPHIC SEGMENT BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface NeuSegmentButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function NeuSegmentButton({ label, isActive, onPress }: NeuSegmentButtonProps) {
  const { palette, shadows, spacing, radius } = useNeuColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          {
            paddingVertical: spacing.sm,
            alignItems: "center" as const,
            borderRadius: radius.md,
            backgroundColor: isActive
              ? palette.primary.main + "20"
              : "transparent",
          },
          isActive &&
            Platform.OS === "web" && {
              boxShadow: shadows.glow.cssSm as any,
            },
          isActive && Platform.OS === "ios" && shadows.glow.iosSm,
        ]}
      >
        <Text
          style={{
            color: isActive ? palette.primary.main : palette.text.muted,
            fontSize: 13,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⭕ CIRCULAR GAUGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface CircularGaugeProps {
  value: string;
  label: string;
  progress: number;
  color?: string;
  isHighlighted?: boolean;
}

function CircularGauge({
  value,
  label,
  progress,
  color,
  isHighlighted = false,
}: CircularGaugeProps) {
  const { palette, shadows, spacing } = useNeuColors();
  const gaugeColor = color ?? palette.primary.main;

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center" as const,
        gap: spacing.sm,
      }}
    >
      <View
        style={[
          {
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: palette.background.main,
            alignItems: "center" as const,
            justifyContent: "center" as const,
          },
          Platform.OS === "web" && { boxShadow: shadows.flat.css as any },
          isHighlighted && {
            borderWidth: 1,
            borderColor: gaugeColor + "15",
          },
        ]}
      >
        {/* Simple Progress Ring Representation */}
        <View
          style={[
            {
              position: "absolute" as const,
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 3,
            },
            {
              borderColor: gaugeColor,
              borderTopColor: "transparent",
              borderRightColor: progress > 25 ? gaugeColor : "transparent",
              borderBottomColor: progress > 50 ? gaugeColor : "transparent",
              borderLeftColor: progress > 75 ? gaugeColor : "transparent",
            },
          ]}
        />
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700" as const,
            color: isHighlighted ? gaugeColor : palette.text.primary,
          }}
        >
          {value}
        </Text>
      </View>
      <Text
        style={[
          {
            fontSize: 12,
            fontWeight: "500" as const,
            color: palette.text.muted,
          },
          isHighlighted && {
            color: gaugeColor,
            textShadowColor: gaugeColor + "50",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 5,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 SPEC ROW COMPONENT (Sunken Bar)
// ═══════════════════════════════════════════════════════════════════════════════

interface SpecRowProps {
  label: string;
  value: string;
  isPrimary?: boolean;
}

function SpecRow({ label, value, isPrimary = false }: SpecRowProps) {
  const { palette, shadows, spacing, radius } = useNeuColors();

  return (
    <View
      style={[
        {
          flexDirection: "row" as const,
          justifyContent: "space-between" as const,
          alignItems: "center" as const,
          backgroundColor: palette.background.main,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
        Platform.OS === "web" && { boxShadow: shadows.pressed.css as any },
      ]}
    >
      <Text
        style={{
          color: palette.text.muted,
          fontSize: 14,
          fontWeight: "500" as const,
        }}
      >
        {label}
      </Text>
      <Text
        style={[
          {
            color: palette.text.primary,
            fontSize: 14,
            fontWeight: "700" as const,
          },
          isPrimary && { color: palette.primary.main },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⏱️ TIMELINE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface TimelineStep {
  label: string;
  date: string;
  status: "completed" | "current" | "pending";
}

interface TimelineProps {
  steps: TimelineStep[];
}

function Timeline({ steps }: TimelineProps) {
  const { palette, shadows, spacing } = useNeuColors();

  return (
    <View
      style={{
        paddingLeft: spacing.sm,
        position: "relative" as const,
      }}
    >
      {/* Vertical Track */}
      <View
        style={[
          {
            position: "absolute" as const,
            left: 26,
            top: 20,
            bottom: 20,
            width: 6,
            borderRadius: 3,
            backgroundColor: palette.background.main,
          },
          Platform.OS === "web" && { boxShadow: shadows.pressed.css as any },
        ]}
      />

      {steps.map((step, index) => (
        <View
          key={index}
          style={{
            flexDirection: "row" as const,
            alignItems: "center" as const,
            gap: spacing.md,
            marginBottom: spacing.xl,
            zIndex: 10,
          }}
        >
          {/* Dot/Icon */}
          <View
            style={[
              {
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: palette.background.main,
                alignItems: "center" as const,
                justifyContent: "center" as const,
              },
              Platform.OS === "web" && {
                boxShadow:
                  step.status === "current"
                    ? shadows.flat.css
                    : (shadows.pressed.css as any),
              },
              step.status === "completed" && {
                borderWidth: 1,
                borderColor: palette.primary.main + "30",
              },
              step.status === "pending" && { opacity: 0.6 },
            ]}
          >
            {step.status === "completed" ? (
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: palette.primary.main,
                  shadowColor: palette.primary.main,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 4,
                }}
              />
            ) : step.status === "current" ? (
              <AppIcon
                name="autorenew"
                size={18}
                color={palette.primary.main}
              />
            ) : (
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: palette.text.muted,
                }}
              />
            )}
          </View>

          {/* Glow for current */}
          {step.status === "current" && (
            <View
              style={{
                position: "absolute" as const,
                left: -5,
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: palette.primary.main + "15",
              }}
            />
          )}

          {/* Content */}
          <View
            style={[{ flex: 1 }, step.status === "pending" && { opacity: 0.6 }]}
          >
            <Text
              style={[
                {
                  color: palette.text.primary,
                  fontSize: 16,
                  fontWeight: "700" as const,
                },
                step.status === "current" && { color: palette.primary.main },
              ]}
            >
              {step.label}
            </Text>
            <Text
              style={{
                color: palette.text.muted,
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {step.date}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 LOT DETAIL SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function LotDetailScreen() {
  const { palette, shadows, spacing, radius } = useNeuColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [activeSegment, setActiveSegment] = useState<SegmentOption>("all");
  const lotId = id ? parseInt(id, 10) : null;

  // ─── Data Query ──────────────────────────────────────────────────────
  const lotQuery = useQuery({
    queryKey: ["lot-detail", lotId],
    enabled: !!lotId,
    queryFn: async () => {
      if (!lotId) {
        return { lot: null, items: [], sales: [] };
      }
      const [lot, items, sales] = await Promise.all([
        LotsRepository.getById(lotId),
        ItemsRepository.getByLotId(lotId),
        SalesRepository.getByLotId(lotId),
      ]);
      return { lot, items, sales };
    },
  });

  const loading = lotQuery.isLoading;
  const lot = lotQuery.data?.lot ?? null;
  const rawItems = lotQuery.data?.items ?? [];
  const rawSales = lotQuery.data?.sales ?? [];

  const items = useMemo<ItemWithSale[]>(() => {
    return rawItems.map((item) => {
      const itemSale = rawSales.find((sale) => sale.itemId === item.id);
      const unitCost = parseFloat(String(item.unitCost)) || 0;
      const saleNet = itemSale ? parseFloat(String(itemSale.priceNet)) || 0 : 0;
      return {
        ...item,
        sale: itemSale,
        profit: itemSale ? saleNet - unitCost : undefined,
      };
    });
  }, [rawItems, rawSales]);

  const summary = useMemo<LotSummary | null>(() => {
    if (!lot) return null;
    return computeLotSummary(lot, rawItems, rawSales);
  }, [lot, rawItems, rawSales]);

  const protection = useMemo<ProtectionAnalysis | null>(() => {
    if (!summary) return null;
    return computeProtection(summary.delta, summary.remainingQuantity, 0);
  }, [summary]);

  const filteredItems = useMemo<ItemWithSale[]>(() => {
    switch (activeSegment) {
      case "top":
        return items
          .filter((item) => item.status === "SOLD" && (item.profit ?? 0) > 0)
          .sort((a, b) => (b.profit ?? 0) - (a.profit ?? 0));
      case "losses":
        return items
          .filter((item) => item.status === "SOLD" && (item.profit ?? 0) < 0)
          .sort((a, b) => (a.profit ?? 0) - (b.profit ?? 0));
      case "all":
      default:
        return items;
    }
  }, [items, activeSegment]);

  // ─── Timeline Steps ──────────────────────────────────────────────────
  const timelineSteps: TimelineStep[] = useMemo(() => {
    if (!lot) return [];

    const soldCount = rawSales.filter((s) => s.status === "COMPLETED").length;
    const totalItems = lot.initialQuantity;
    const allSold = soldCount >= totalItems && totalItems > 0;

    return [
      {
        label: "Achat du lot",
        date: lot.buyDate ? formatDate(lot.buyDate) + " • Validé" : "Validé",
        status: "completed" as const,
      },
      {
        label: "Mise en vente",
        date:
          soldCount > 0 ? `${soldCount}/${totalItems} vendus` : "En cours...",
        status: soldCount > 0 ? ("current" as const) : ("pending" as const),
      },
      {
        label: "Lot terminé",
        date: allSold ? "Complété" : "En attente",
        status: allSold ? ("completed" as const) : ("pending" as const),
      },
    ];
  }, [lot, rawSales]);

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleBack = () => {
    Haptic.selection();
    router.back();
  };

  const handleMore = () => {
    Haptic.selection();
  };

  const handleEditLot = () => {
    Haptic.selection();
  };

  // ─── Loading State ───────────────────────────────────────────────────
  if (loading) {
    return (
      <NeuScreen style={{ paddingTop: insets.top }}>
        <Stack.Screen options={{ headerShown: false }} />
        <SkeletonList />
      </NeuScreen>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────
  if (!lot || !summary || !protection) {
    return (
      <NeuScreen style={{ paddingTop: insets.top }}>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={{
            flex: 1,
            alignItems: "center" as const,
            justifyContent: "center" as const,
            gap: spacing.lg,
          }}
        >
          <View
            style={[
              {
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: palette.background.main,
                alignItems: "center" as const,
                justifyContent: "center" as const,
              },
              Platform.OS === "web" && {
                boxShadow: shadows.pressed.css as any,
              },
            ]}
          >
            <AppIcon
              name="error-outline"
              size={48}
              color={palette.accent.red}
            />
          </View>
          <Text
            style={{
              color: palette.text.primary,
              fontSize: 18,
              fontWeight: "700" as const,
            }}
          >
            Lot introuvable
          </Text>
          <Pressable
            onPress={handleBack}
            style={{
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
              backgroundColor: palette.primary.main + "20",
              borderRadius: radius.lg,
            }}
          >
            <Text
              style={{
                color: palette.primary.main,
                fontSize: 14,
                fontWeight: "600" as const,
              }}
            >
              Retour
            </Text>
          </Pressable>
        </View>
      </NeuScreen>
    );
  }

  // ─── Computed Values ─────────────────────────────────────────────────
  const investmentProgress = 75;
  const feesProgress = 20;
  const marginProgress = Math.min(100, Math.max(0, summary.roiPercent));
  const recoveryPercent =
    summary.totalInvestment > 0
      ? Math.min(100, (summary.totalRevenue / summary.totalInvestment) * 100)
      : 0;

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <NeuScreen>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          gap: spacing.xl,
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={{
            flexDirection: "row" as const,
            alignItems: "center" as const,
            justifyContent: "space-between" as const,
            gap: spacing.md,
          }}
        >
          <NeuIconButton icon="arrow-back" onPress={handleBack} />

          <Text
            style={{
              flex: 1,
              color: palette.text.primary,
              fontSize: 18,
              fontWeight: "700" as const,
              textAlign: "center" as const,
            }}
            numberOfLines={1}
          >
            Lot #{lot.id}
          </Text>

          <NeuIconButton icon="more-vert" onPress={handleMore} />
        </Animated.View>

        {/* ─── Image Carousel (Pressed style) ───────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View
            style={[
              {
                backgroundColor: palette.background.main,
                borderRadius: radius.xl,
                padding: spacing.sm,
                overflow: "hidden" as const,
              },
              Platform.OS === "web" && {
                boxShadow: shadows.pressed.css as any,
              },
            ]}
          >
            <View
              style={{
                aspectRatio: 4 / 3,
                backgroundColor: palette.background.light,
                borderRadius: radius.lg,
                alignItems: "center" as const,
                justifyContent: "center" as const,
                gap: spacing.sm,
              }}
            >
              <AppIcon
                name="inventory-2"
                size={48}
                color={palette.text.muted}
              />
              <Text
                style={{
                  color: palette.text.muted,
                  fontSize: 14,
                  fontWeight: "600" as const,
                }}
              >
                {lot.name || lot.provider}
              </Text>
            </View>
            {/* Carousel Dots */}
            <View
              style={{
                flexDirection: "row" as const,
                justifyContent: "center" as const,
                gap: spacing.xs,
                paddingTop: spacing.sm,
              }}
            >
              <View
                style={[
                  {
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: palette.text.muted + "50",
                  },
                  {
                    backgroundColor: palette.primary.main,
                    shadowColor: palette.primary.main,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                  },
                ]}
              />
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: palette.text.muted + "50",
                }}
              />
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: palette.text.muted + "50",
                }}
              />
            </View>
          </View>
        </Animated.View>

        {/* ─── Circular Gauges ────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={{
            flexDirection: "row" as const,
            justifyContent: "space-between" as const,
          }}
        >
          <CircularGauge
            value={formatCurrency(summary.totalInvestment)}
            label="Investissement"
            progress={investmentProgress}
            color={palette.primary.main}
          />
          <CircularGauge
            value={formatCurrency(
              Math.abs(
                summary.totalInvestment - summary.totalRevenue - summary.profit,
              ),
            )}
            label="Frais"
            progress={feesProgress}
            color={palette.accent.yellow}
          />
          <CircularGauge
            value={`${summary.roiPercent >= 0 ? "+" : ""}${summary.roiPercent.toFixed(0)}%`}
            label="Marge est."
            progress={marginProgress}
            color={palette.primary.main}
            isHighlighted
          />
        </Animated.View>

        {/* ─── Specifications ─────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={{ gap: spacing.md }}
        >
          <Text
            style={{
              color: palette.text.primary,
              fontSize: 18,
              fontWeight: "700" as const,
              marginLeft: spacing.xs,
            }}
          >
            Caractéristiques
          </Text>
          <View style={{ gap: spacing.sm }}>
            <SpecRow label="Fournisseur" value={lot.provider || "—"} />
            <SpecRow label="Type" value={lot.type || "BULK"} />
            <SpecRow label="Quantité" value={`${lot.initialQuantity} pièces`} />
            <SpecRow
              label="Statut"
              value={summary.remainingQuantity === 0 ? "Terminé" : "En cours"}
              isPrimary={summary.remainingQuantity === 0}
            />
          </View>
        </Animated.View>

        {/* ─── Progress / Recovery ────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(400)}
          style={{ gap: spacing.md }}
        >
          <Text
            style={{
              color: palette.text.primary,
              fontSize: 18,
              fontWeight: "700" as const,
              marginLeft: spacing.xs,
            }}
          >
            Récupération
          </Text>
          <NeuCard style={{ padding: spacing.lg, gap: spacing.md }}>
            <View
              style={{
                flexDirection: "row" as const,
                justifyContent: "space-between" as const,
                alignItems: "center" as const,
              }}
            >
              <Text
                style={{
                  color: palette.text.secondary,
                  fontSize: 14,
                  fontWeight: "600" as const,
                }}
              >
                {summary.soldQuantity}/{lot.initialQuantity} vendus
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700" as const,
                  color:
                    summary.profit >= 0
                      ? palette.accent.green
                      : palette.accent.red,
                }}
              >
                {summary.profit >= 0 ? "+" : ""}
                {formatCurrency(summary.profit)}
              </Text>
            </View>
            <NeuProgressBar
              progress={recoveryPercent}
              height={12}
              color={
                recoveryPercent >= 100
                  ? palette.accent.green
                  : palette.primary.main
              }
            />
            <View
              style={{
                flexDirection: "row" as const,
                justifyContent: "space-between" as const,
              }}
            >
              <Text
                style={{
                  color: palette.text.muted,
                  fontSize: 11,
                  fontWeight: "500" as const,
                }}
              >
                €0
              </Text>
              <Text
                style={{
                  color: palette.text.muted,
                  fontSize: 11,
                  fontWeight: "500" as const,
                }}
              >
                {recoveryPercent >= 100
                  ? "Seuil atteint ✓"
                  : `${recoveryPercent.toFixed(0)}%`}
              </Text>
              <Text
                style={{
                  color: palette.text.muted,
                  fontSize: 11,
                  fontWeight: "500" as const,
                }}
              >
                {formatCurrency(summary.totalInvestment)}
              </Text>
            </View>
          </NeuCard>
        </Animated.View>

        {/* ─── Timeline / Historique ──────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(400)}
          style={{ gap: spacing.md }}
        >
          <Text
            style={{
              color: palette.text.primary,
              fontSize: 18,
              fontWeight: "700" as const,
              marginLeft: spacing.xs,
            }}
          >
            Historique
          </Text>
          <Timeline steps={timelineSteps} />
        </Animated.View>

        {/* ─── Items Segment ──────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(400)}
          style={{ gap: spacing.md }}
        >
          <Text
            style={{
              color: palette.text.primary,
              fontSize: 18,
              fontWeight: "700" as const,
              marginLeft: spacing.xs,
            }}
          >
            Articles ({items.length})
          </Text>

          {/* Segmented Control */}
          <View
            style={[
              {
                flexDirection: "row" as const,
                backgroundColor: palette.background.main,
                borderRadius: radius.lg,
                padding: 4,
              },
              Platform.OS === "web" && {
                boxShadow: shadows.pressed.css as any,
              },
            ]}
          >
            {[
              { key: "all", label: "Tous" },
              { key: "top", label: "Top" },
              { key: "losses", label: "Pertes" },
            ].map((seg) => (
              <NeuSegmentButton
                key={seg.key}
                label={seg.label}
                isActive={activeSegment === seg.key}
                onPress={() => {
                  Haptic.selection();
                  setActiveSegment(seg.key as SegmentOption);
                }}
              />
            ))}
          </View>

          {/* Items List */}
          {filteredItems.length === 0 ? (
            <View
              style={{
                alignItems: "center" as const,
                paddingVertical: spacing["2xl"],
                gap: spacing.sm,
              }}
            >
              <AppIcon
                name="inventory-2"
                size={32}
                color={palette.text.muted}
              />
              <Text
                style={{
                  color: palette.text.muted,
                  fontSize: 14,
                }}
              >
                Aucun article
              </Text>
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {filteredItems.slice(0, 5).map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={SlideInRight.delay(index * 50).duration(250)}
                >
                  <View
                    style={[
                      {
                        flexDirection: "row" as const,
                        alignItems: "center" as const,
                        backgroundColor: palette.background.main,
                        borderRadius: radius.lg,
                        padding: spacing.md,
                        gap: spacing.md,
                      },
                      Platform.OS === "web" && {
                        boxShadow: shadows.flat.cssSm as any,
                      },
                    ]}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: palette.background.light,
                        alignItems: "center" as const,
                        justifyContent: "center" as const,
                      }}
                    >
                      <AppIcon
                        name="checkroom"
                        size={20}
                        color={
                          item.status === "SOLD"
                            ? palette.accent.green
                            : palette.primary.main
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: palette.text.primary,
                          fontSize: 14,
                          fontWeight: "700" as const,
                        }}
                        numberOfLines={1}
                      >
                        {item.brand || item.type || `Article #${item.id}`}
                      </Text>
                      <Text
                        style={{
                          color: palette.text.muted,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {item.status} •{" "}
                        {formatCurrency(parseFloat(String(item.unitCost)) || 0)}
                      </Text>
                    </View>
                    {item.profit !== undefined && (
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700" as const,
                          color:
                            item.profit >= 0
                              ? palette.accent.green
                              : palette.accent.red,
                        }}
                      >
                        {item.profit >= 0 ? "+" : ""}
                        {formatCurrency(item.profit)}
                      </Text>
                    )}
                  </View>
                </Animated.View>
              ))}
              {filteredItems.length > 5 && (
                <Text
                  style={{
                    color: palette.text.muted,
                    fontSize: 13,
                    textAlign: "center" as const,
                    marginTop: spacing.sm,
                  }}
                >
                  +{filteredItems.length - 5} autres articles
                </Text>
              )}
            </View>
          )}
        </Animated.View>

        {/* ─── Bottom Action ──────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(800).duration(400)}>
          <NeuActionButton
            label="Modifier le Lot"
            onPress={handleEditLot}
            icon="edit"
          />
        </Animated.View>
      </ScrollView>
    </NeuScreen>
  );
}
