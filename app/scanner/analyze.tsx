/**
 * 🔍 ANALYZE SCREEN - AI Processing & Results
 *
 * Écran d'analyse avec animation de chargement
 * et affichage des résultats de l'IA
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { useVantaTheme, VantaScreen } from "@/components/ui/PremiumUI";
import { Palette, Radius, Spacing } from "@/constants/Theme";
import {
    analyzeImage,
    getCategoryLabel,
    getConditionLabel,
    getDemandEmoji,
    getRecommendationColor,
    getRecommendationLabel,
    type ScannerUIState
} from "@/utils/ai";
import { Haptic } from "@/utils/haptics";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 ANALYZE SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function AnalyzeScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const insets = useSafeAreaInsets();
  const theme = useVantaTheme();
  const isDark = theme.dark;

  const [scanState, setScanState] = useState<ScannerUIState>({
    state: "analyzing",
    progress: 0,
    currentModel: null,
    error: null,
    result: null,
  });

  // Animation values
  const pulseScale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const colors = {
    background: theme.background,
    surface: theme.surface,
    surfaceCard: theme.surfaceCard,
    gold: Palette.metal.gold,
    goldSubtle: Palette.metal.goldSubtle,
    text: theme.text,
    textSecondary: theme.textSecondary,
    textMuted: theme.textMuted,
    border: theme.borderGlass,
    success: theme.success,
    danger: theme.danger,
  };

  // Start animations
  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  // Run analysis
  useEffect(() => {
    if (!imageUri) {
      setScanState((prev) => ({
        ...prev,
        state: "error",
        error: "Aucune image fournie",
      }));
      return;
    }

    analyzeImage(imageUri, setScanState)
      .then((result) => {
        if (result.success) {
          Haptic.success();
        } else {
          Haptic.error();
        }
      })
      .catch((error) => {
        console.error("Analysis failed:", error);
        Haptic.error();
        setScanState({
          state: "error",
          progress: 0,
          currentModel: null,
          error: error.message || "Erreur d'analyse",
          result: null,
        });
      });
  }, [imageUri]);

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Handle retry
  const handleRetry = useCallback(() => {
    Haptic.selection();
    setScanState({
      state: "analyzing",
      progress: 0,
      currentModel: null,
      error: null,
      result: null,
    });
    analyzeImage(imageUri!, setScanState);
  }, [imageUri]);

  // Handle add to stock
  const handleAddToStock = useCallback(() => {
    Haptic.impactMedium();
    if (!scanState.result) return;

    const result = scanState.result;
    router.push({
      pathname: "/scanner/add-to-stock",
      params: {
        imageUri: imageUri || "",
        brand: result.identification.brand || "",
        category: result.identification.category || "",
        model: result.identification.model || "",
        condition: result.identification.condition || "",
        colors: result.identification.colors?.join(", ") || "",
        size: result.identification.size || "",
        suggestedBuyPrice: result.recommendation.suggestedBuyPrice?.toString() || "",
        midPrice: result.pricing.midPrice?.toString() || "",
        era: result.identification.era || "",
      },
    });
  }, [scanState.result, imageUri]);

  // Render loading state
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.imagePreviewContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.imagePreview}
          contentFit="cover"
        />
        <View style={styles.imageOverlay}>
          <Animated.View style={[styles.scanRing, pulseStyle]}>
            <View
              style={[styles.scanRingInner, { borderColor: colors.gold }]}
            />
          </Animated.View>
        </View>
      </View>

      <Animated.View entering={FadeInUp.delay(200)} style={styles.loadingInfo}>
        <Animated.View style={rotateStyle}>
          <AppIcon name="auto-awesome" size={32} color={colors.gold} />
        </Animated.View>
        <Text style={[styles.loadingTitle, { color: colors.text }]}>
          Analyse en cours...
        </Text>
        <Text style={[styles.loadingSubtitle, { color: colors.textMuted }]}>
          {scanState.currentModel || "Préparation de l'image"}
        </Text>

        {/* Progress bar */}
        <View
          style={[styles.progressTrack, { backgroundColor: colors.border }]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.gold,
                width: `${scanState.progress * 100}%`,
              },
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );

  // Render error state
  const renderError = () => (
    <View style={styles.errorContainer}>
      <View
        style={[styles.errorIcon, { backgroundColor: `${colors.danger}20` }]}
      >
        <AppIcon name="error-outline" size={48} color={colors.danger} />
      </View>
      <Text style={[styles.errorTitle, { color: colors.text }]}>
        Analyse échouée
      </Text>
      <Text style={[styles.errorMessage, { color: colors.textMuted }]}>
        {scanState.error || "Une erreur est survenue"}
      </Text>
      <Pressable
        style={[styles.retryButton, { backgroundColor: colors.gold }]}
        onPress={handleRetry}
      >
        <AppIcon name="refresh" size={20} color="#000000" />
        <Text style={styles.retryButtonText}>Réessayer</Text>
      </Pressable>
    </View>
  );

  // Render results
  const renderResults = () => {
    const result = scanState.result!;
    const recColor = getRecommendationColor(result.recommendation.action);
    const recLabel = getRecommendationLabel(result.recommendation.action);

    return (
      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          paddingTop: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image & Recommendation Badge */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.resultHeader}
        >
          <Image
            source={{ uri: imageUri }}
            style={styles.resultImage}
            contentFit="cover"
          />
          <View
            style={[styles.recommendationBadge, { backgroundColor: recColor }]}
          >
            <Text style={styles.recommendationText}>{recLabel}</Text>
          </View>
        </Animated.View>

        {/* Identification */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <AppIcon name="checkroom" size={20} color={colors.gold} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Identification
            </Text>
          </View>

          {/* Brand */}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
              Marque
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {result.identification.brand || "Non identifiée"}
              {result.identification.brandConfidence > 0 && (
                <Text style={{ color: colors.textMuted }}>
                  {" "}
                  ({Math.round(result.identification.brandConfidence * 100)}%)
                </Text>
              )}
            </Text>
          </View>

          {/* Category */}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
              Catégorie
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {getCategoryLabel(result.identification.category)}
            </Text>
          </View>

          {/* Model */}
          {result.identification.model && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Modèle
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {result.identification.model}
              </Text>
            </View>
          )}

          {/* Era */}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
              Époque
            </Text>
            <View style={styles.tagRow}>
              <View
                style={[styles.tag, { backgroundColor: colors.goldSubtle }]}
              >
                <Text style={[styles.tagText, { color: colors.gold }]}>
                  {result.identification.era}
                </Text>
              </View>
              {result.identification.isVintage && (
                <View
                  style={[
                    styles.tag,
                    { backgroundColor: `${colors.success}20` },
                  ]}
                >
                  <Text style={[styles.tagText, { color: colors.success }]}>
                    VINTAGE
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Condition */}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
              État
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {getConditionLabel(result.identification.condition)}
            </Text>
          </View>

          {/* Colors */}
          {result.identification.colors.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Couleurs
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {result.identification.colors.join(", ")}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Pricing */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <AppIcon name="attach-money" size={20} color={colors.gold} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Estimation prix
            </Text>
            <View style={styles.confidenceBadge}>
              <Text
                style={[styles.confidenceText, { color: colors.textMuted }]}
              >
                {Math.round(result.pricing.confidence * 100)}% confiance
              </Text>
            </View>
          </View>

          {/* Price range */}
          <View style={styles.priceGrid}>
            <View style={styles.priceItem}>
              <Text style={[styles.priceLabel, { color: colors.textMuted }]}>
                Vente rapide
              </Text>
              <Text style={[styles.priceValue, { color: colors.text }]}>
                €{result.pricing.lowPrice}
              </Text>
            </View>
            <View style={[styles.priceItem, styles.priceItemMain]}>
              <Text style={[styles.priceLabel, { color: colors.gold }]}>
                Prix marché
              </Text>
              <Text style={[styles.priceValueMain, { color: colors.gold }]}>
                €{result.pricing.midPrice}
              </Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={[styles.priceLabel, { color: colors.textMuted }]}>
                Collectionneur
              </Text>
              <Text style={[styles.priceValue, { color: colors.text }]}>
                €{result.pricing.highPrice}
              </Text>
            </View>
          </View>

          {/* Suggested buy price */}
          {result.recommendation.suggestedBuyPrice && (
            <View
              style={[
                styles.suggestedPrice,
                { backgroundColor: colors.goldSubtle },
              ]}
            >
              <AppIcon name="lightbulb" size={16} color={colors.gold} />
              <Text style={[styles.suggestedPriceText, { color: colors.gold }]}>
                Prix d'achat max suggéré: €
                {result.recommendation.suggestedBuyPrice}
              </Text>
            </View>
          )}

          {/* Platforms */}
          {result.pricing.recommendedPlatforms.length > 0 && (
            <View style={styles.platformsSection}>
              <Text
                style={[styles.platformsTitle, { color: colors.textMuted }]}
              >
                Plateformes recommandées
              </Text>
              {result.pricing.recommendedPlatforms.map((platform, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.platformRow,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text style={[styles.platformName, { color: colors.text }]}>
                    {platform.name}
                  </Text>
                  <View style={styles.platformInfo}>
                    <Text
                      style={[styles.platformPrice, { color: colors.success }]}
                    >
                      €{platform.estimatedPrice}
                    </Text>
                    <Text
                      style={[styles.platformDays, { color: colors.textMuted }]}
                    >
                      ~{platform.estimatedDays}j
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Market */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <AppIcon name="analytics" size={20} color={colors.gold} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Analyse marché
            </Text>
          </View>

          <View style={styles.marketGrid}>
            <View style={styles.marketItem}>
              <Text style={[styles.marketLabel, { color: colors.textMuted }]}>
                Demande
              </Text>
              <Text style={[styles.marketValue, { color: colors.text }]}>
                {getDemandEmoji(result.market.demandLevel)}{" "}
                {result.market.demandLevel.replace("_", " ")}
              </Text>
            </View>
            <View style={styles.marketItem}>
              <Text style={[styles.marketLabel, { color: colors.textMuted }]}>
                Tendance
              </Text>
              <Text style={[styles.marketValue, { color: colors.text }]}>
                {result.market.trend === "rising"
                  ? "📈"
                  : result.market.trend === "declining"
                    ? "📉"
                    : "➡️"}{" "}
                {result.market.trend}
              </Text>
            </View>
            <View style={styles.marketItem}>
              <Text style={[styles.marketLabel, { color: colors.textMuted }]}>
                Rareté
              </Text>
              <Text style={[styles.marketValue, { color: colors.text }]}>
                {result.market.rarityScore}/10
              </Text>
            </View>
          </View>

          {result.market.targetAudience.length > 0 && (
            <View style={styles.audienceSection}>
              <Text style={[styles.audienceLabel, { color: colors.textMuted }]}>
                Cible
              </Text>
              <View style={styles.tagRow}>
                {result.market.targetAudience
                  .slice(0, 3)
                  .map((audience, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.tag,
                        { backgroundColor: colors.surfaceCard },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {audience}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>
          )}
        </Animated.View>

        {/* Recommendation reasons */}
        {result.recommendation.reasons.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <AppIcon name="lightbulb" size={20} color={colors.gold} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Points clés
              </Text>
            </View>

            {result.recommendation.reasons.map((reason, idx) => (
              <View key={idx} style={styles.reasonRow}>
                <View
                  style={[styles.reasonDot, { backgroundColor: colors.gold }]}
                />
                <Text style={[styles.reasonText, { color: colors.text }]}>
                  {reason}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Processing info */}
        <Text style={[styles.processingInfo, { color: colors.textMuted }]}>
          Analysé par {result.model} en {result.processingTimeMs}ms
        </Text>
      </ScrollView>
    );
  };

  return (
    <VantaScreen>
      <Stack.Screen
        options={{
          title:
            scanState.state === "success" ? "Résultat analyse" : "Analyse IA",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <AppIcon name="arrow-back" size={24} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <StatusBar style={isDark ? "light" : "dark"} />

      {scanState.state === "analyzing" && renderLoading()}
      {scanState.state === "error" && renderError()}
      {scanState.state === "success" && scanState.result && renderResults()}

      {/* Bottom CTA */}
      {scanState.state === "success" && (
        <Animated.View
          entering={FadeIn.delay(500)}
          style={[
            styles.bottomCTA,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + Spacing.md,
            },
          ]}
        >
          <Pressable
            style={[styles.addButton, { backgroundColor: colors.gold }]}
            onPress={handleAddToStock}
          >
            <AppIcon name="add" size={24} color="#000000" />
            <Text style={styles.addButtonText}>Ajouter au stock</Text>
          </Pressable>
          <Pressable
            style={[styles.scanAgainButton, { borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <AppIcon name="camera-add" size={20} color={colors.text} />
            <Text style={[styles.scanAgainText, { color: colors.text }]}>
              Scanner autre
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </VantaScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  imagePreviewContainer: {
    width: 200,
    height: 250,
    borderRadius: Radius.xl,
    overflow: "hidden",
    marginBottom: Spacing["2xl"],
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanRing: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  scanRingInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
  },
  loadingInfo: {
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingTitle: {
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
  },
  loadingSubtitle: {
    fontSize: 14,
    fontFamily: "Manrope_400Regular",
  },
  progressTrack: {
    width: 200,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: Spacing.md,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  errorTitle: {
    fontSize: 22,
    fontFamily: "Manrope_700Bold",
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    fontSize: 15,
    fontFamily: "Manrope_400Regular",
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
  },
  retryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
  },
  resultsScroll: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  resultHeader: {
    marginBottom: Spacing.lg,
    position: "relative",
  },
  resultImage: {
    width: "100%",
    height: 300,
    borderRadius: Radius.xl,
  },
  recommendationBadge: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
  },
  recommendationText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Manrope_800ExtraBold",
    letterSpacing: 1,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    textAlign: "right",
    flex: 1,
    marginLeft: Spacing.md,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
  },
  tagText: {
    fontSize: 11,
    fontFamily: "Manrope_600SemiBold",
    letterSpacing: 0.5,
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  confidenceText: {
    fontSize: 11,
    fontFamily: "Manrope_500Medium",
  },
  priceGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  priceItem: {
    alignItems: "center",
    flex: 1,
  },
  priceItemMain: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  priceLabel: {
    fontSize: 11,
    fontFamily: "Manrope_500Medium",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontFamily: "Manrope_700Bold",
  },
  priceValueMain: {
    fontSize: 24,
    fontFamily: "Manrope_800ExtraBold",
  },
  suggestedPrice: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  suggestedPriceText: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
  },
  platformsSection: {
    marginTop: Spacing.sm,
  },
  platformsTitle: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
    marginBottom: Spacing.sm,
  },
  platformRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  platformName: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
  },
  platformInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  platformPrice: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
  },
  platformDays: {
    fontSize: 12,
    fontFamily: "Manrope_400Regular",
  },
  marketGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  marketItem: {
    alignItems: "center",
    flex: 1,
  },
  marketLabel: {
    fontSize: 11,
    fontFamily: "Manrope_500Medium",
    marginBottom: 4,
  },
  marketValue: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    textTransform: "capitalize",
  },
  audienceSection: {
    marginTop: Spacing.sm,
  },
  audienceLabel: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
    marginBottom: Spacing.sm,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reasonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Manrope_400Regular",
    lineHeight: 20,
  },
  processingInfo: {
    fontSize: 11,
    fontFamily: "Manrope_400Regular",
    textAlign: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  bottomCTA: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  addButtonText: {
    color: "#000000",
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
  },
  scanAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  scanAgainText: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
  },
});
