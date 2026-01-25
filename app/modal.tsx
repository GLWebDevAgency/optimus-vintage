/**
 * 📱 MODAL SCREEN - Neumorphic Dark Edition
 *
 * Modal générique avec design neumorphique dark
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { NeuButton, NeuScreen, useNeuColors } from "@/components/ui/Neumorphic";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    SlideInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ModalScreen() {
  const insets = useSafeAreaInsets();
  const { palette, shadows, spacing, radius } = useNeuColors();

  const handleClose = () => {
    router.back();
  };

  return (
    <NeuScreen>
      <StatusBar style="light" />

      <Animated.View
        entering={SlideInUp.duration(400)}
        style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        {/* Handle Bar */}
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: palette.text.muted,
            alignSelf: "center",
            marginBottom: spacing.md,
            opacity: 0.3,
          }}
        />

        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: spacing.xl,
          }}
        >
          <View style={{ width: 44 }} />
          <Text
            style={{
              color: palette.text.primary,
              fontSize: 18,
              fontWeight: "700",
            }}
          >
            Modal
          </Text>
          <Pressable
            onPress={handleClose}
            style={[
              {
                width: 44,
                height: 44,
                borderRadius: radius.lg,
                backgroundColor: palette.background.main,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: shadows.pressed.borderColor,
              },
              Platform.OS === "web" && {
                boxShadow: shadows.pressed.css as any,
              },
            ]}
          >
            <AppIcon name="close" size={20} color={palette.text.muted} />
          </Pressable>
        </Animated.View>

        {/* Content */}
        <Animated.View
          entering={FadeIn.delay(300).duration(400)}
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: spacing.lg,
          }}
        >
          <View
            style={[
              {
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: palette.background.main,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: spacing.xl,
                borderWidth: 1,
                borderColor: shadows.pressed.borderColor,
              },
              Platform.OS === "web" && {
                boxShadow: shadows.pressed.css as any,
              },
            ]}
          >
            <AppIcon name="info" size={32} color={palette.primary.main} />
          </View>

          <Text
            style={{
              color: palette.text.primary,
              fontSize: 24,
              fontWeight: "800",
              marginBottom: spacing.sm,
              textAlign: "center",
            }}
          >
            Contenu Modal
          </Text>
          <Text
            style={{
              color: palette.text.muted,
              fontSize: 14,
              textAlign: "center",
              lineHeight: 22,
              marginBottom: spacing.xl,
            }}
          >
            Cette modal est prête à être personnalisée selon vos besoins.
            Utilisez-la pour afficher des formulaires, des confirmations, ou
            tout autre contenu.
          </Text>

          {/* Action Buttons */}
          <View
            style={{
              flexDirection: "row",
              gap: spacing.md,
              width: "100%",
            }}
          >
            <NeuButton
              label="Annuler"
              variant="secondary"
              onPress={handleClose}
              style={{ flex: 1 }}
            />
            <NeuButton
              label="Confirmer"
              variant="primary"
              onPress={handleClose}
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </NeuScreen>
  );
}
