/**
 * 📤 SHARE BUTTON
 *
 * Reusable CTA button that captures a ViewShot ref
 * and shares the resulting image via the system share sheet.
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { useIsDarkMode, useVantaTheme } from "@/components/ui/PremiumUI";
import { Palette, Radius, Spacing } from "@/constants/Theme";
import { Haptic } from "@/utils/haptics";
import { useLocale } from "@/utils/i18n";
import { captureAndShare } from "@/utils/social-sharing";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { RefObject } from "react";
import type ViewShot from "react-native-view-shot";

interface ShareButtonProps {
  viewRef: RefObject<ViewShot | null>;
  shareText?: string;
  label?: string;
  compact?: boolean;
}

export function ShareButton({
  viewRef,
  shareText,
  label,
  compact = false,
}: ShareButtonProps) {
  const theme = useVantaTheme();
  const isDark = useIsDarkMode();
  const { t } = useLocale();
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    Haptic.impactMedium();

    try {
      const success = await captureAndShare(viewRef, shareText);
      if (!success) {
        Alert.alert(t("sharing.shareFailed"));
      }
    } catch {
      Alert.alert(t("sharing.shareFailed"));
    } finally {
      setSharing(false);
    }
  }, [viewRef, shareText, sharing, t]);

  const buttonLabel = label || t("sharing.shareCard");
  const goldColor = isDark ? Palette.metal.gold : Palette.metal.champagne;

  if (compact) {
    return (
      <Pressable
        onPress={handleShare}
        disabled={sharing}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        style={[
          styles.compactButton,
          {
            backgroundColor: `${goldColor}15`,
            borderColor: `${goldColor}30`,
          },
        ]}
      >
        {sharing ? (
          <ActivityIndicator size="small" color={goldColor} />
        ) : (
          <AppIcon name="share" size={18} color={goldColor} />
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handleShare}
      disabled={sharing}
      accessibilityRole="button"
      accessibilityLabel={buttonLabel}
      style={[
        styles.button,
        {
          backgroundColor: goldColor,
          opacity: sharing ? 0.7 : 1,
        },
      ]}
    >
      {sharing ? (
        <ActivityIndicator size="small" color="#0a0a0a" />
      ) : (
        <View style={styles.buttonContent}>
          <AppIcon name="share" size={18} color="#0a0a0a" />
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0a0a0a",
    letterSpacing: 0.5,
  },
  compactButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
