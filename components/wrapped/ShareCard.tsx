/**
 * WRAPPED SLIDE 5 — Share Your Success
 *
 * Branded shareable card with share CTA.
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { PremiumButton } from "@/components/ui/PremiumUI";
import { useVantaTheme } from "@/components/ui/PremiumUI";
import { Palette, Radius, Spacing, Typography } from "@/constants/Theme";
import type { WrappedData } from "@/utils/data/wrapped-data";
import { useLocale } from "@/utils/i18n";
import React, { useRef } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import ViewShot from "react-native-view-shot";

import { captureAndShare } from "@/utils/social-sharing";

interface ShareCardProps {
  data: WrappedData;
  reduceMotion: boolean;
}

export function ShareCard({ data, reduceMotion }: ShareCardProps) {
  const theme = useVantaTheme();
  const { t } = useLocale();
  const { width, height } = useWindowDimensions();
  const viewShotRef = useRef<ViewShot>(null);

  const handleShare = async () => {
    const shareText = t("wrapped.shareText", {
      month: data.monthLabel,
      revenue: `${data.totalRevenue.toFixed(0)}€`,
      items: String(data.itemsSold),
    });
    await captureAndShare(viewShotRef, shareText);
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.content}>
        <Animated.Text
          entering={
            reduceMotion
              ? undefined
              : FadeInDown.delay(100).duration(600).springify()
          }
          style={[
            Typography.heading.lg,
            { color: theme.text, textAlign: "center" },
          ]}
        >
          {t("wrapped.slide5.title")}
        </Animated.Text>

        <Animated.Text
          entering={
            reduceMotion
              ? undefined
              : FadeInDown.delay(200).duration(500).springify()
          }
          style={[
            Typography.body.sm,
            { color: theme.textMuted, textAlign: "center" },
          ]}
        >
          {t("wrapped.slide5.subtitle")}
        </Animated.Text>

        {/* Shareable card */}
        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeInDown.delay(400).duration(500).springify()
          }
        >
          <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
            <View
              style={[
                styles.shareableCard,
                { backgroundColor: Palette.vanta.black },
              ]}
            >
              <Text style={styles.shareableBrand}>OPTIMUS VINTAGE</Text>
              <Text style={styles.shareableMonth}>{data.monthLabel}</Text>

              <View style={styles.shareableStats}>
                <View style={styles.shareableStat}>
                  <Text style={styles.shareableValue}>
                    {data.totalRevenue.toFixed(0)}€
                  </Text>
                  <Text style={styles.shareableLabel}>Revenue</Text>
                </View>
                <View style={styles.shareableStat}>
                  <Text style={styles.shareableValue}>{data.itemsSold}</Text>
                  <Text style={styles.shareableLabel}>Sold</Text>
                </View>
                {data.roiChange !== null && (
                  <View style={styles.shareableStat}>
                    <Text
                      style={[
                        styles.shareableValue,
                        {
                          color:
                            data.roiChange >= 0
                              ? "#10B981"
                              : "#EF4444",
                        },
                      ]}
                    >
                      {data.roiChange >= 0 ? "+" : ""}
                      {data.roiChange.toFixed(1)}%
                    </Text>
                    <Text style={styles.shareableLabel}>Growth</Text>
                  </View>
                )}
              </View>

              <Text style={styles.shareableFooter}>resellwrapped.com</Text>
            </View>
          </ViewShot>
        </Animated.View>

        {/* Share button */}
        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeInDown.delay(600).duration(500).springify()
          }
          style={styles.ctaContainer}
        >
          <PremiumButton
            variant="primary"
            size="lg"
            fullWidth
            icon="share"
            onPress={handleShare}
          >
            {t("wrapped.slide5.shareButton")}
          </PremiumButton>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
    alignItems: "center",
    width: "100%",
  },
  shareableCard: {
    borderRadius: Radius.xl,
    padding: Spacing["2xl"],
    alignItems: "center",
    gap: Spacing.lg,
    overflow: "hidden",
  },
  shareableBrand: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    color: Palette.metal.gold,
  },
  shareableMonth: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  shareableStats: {
    flexDirection: "row",
    gap: Spacing["2xl"],
    marginTop: Spacing.md,
  },
  shareableStat: {
    alignItems: "center",
    gap: 4,
  },
  shareableValue: {
    fontSize: 24,
    fontWeight: "800",
    color: Palette.metal.gold,
  },
  shareableLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1,
  },
  shareableFooter: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    marginTop: Spacing.md,
    letterSpacing: 1,
  },
  ctaContainer: {
    width: "100%",
  },
});
