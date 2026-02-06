/**
 * 📸 SCANNER SCREEN - AI Vintage Analysis
 *
 * Écran de capture photo pour l'analyse IA
 * Interface Vanta Aether avec animations premium
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { useVantaTheme, VantaScreen } from "@/components/ui/PremiumUI";
import { Palette, Radius, Spacing } from "@/constants/Theme";
import { useAccessibility } from "@/utils/accessibility";
import { Haptic } from "@/utils/haptics";
import { useLocale } from "@/utils/i18n";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 SCANNER SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const theme = useVantaTheme();
  const { t } = useLocale();
  const { isReduceMotionEnabled } = useAccessibility();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashMode, setFlashMode] = useState<"off" | "on">("off");

  // Animation values
  const scanLinePosition = useSharedValue(0);
  const captureScale = useSharedValue(1);

  // Colors
  const colors = {
    background: theme.background,
    surface: theme.surface,
    gold: Palette.metal.gold,
    goldSubtle: Palette.metal.goldSubtle,
    text: theme.text,
    textMuted: theme.textMuted,
  };

  // Start scan line animation
  React.useEffect(() => {
    if (!isReduceMotionEnabled) {
      scanLinePosition.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000 }),
          withTiming(0, { duration: 2000 }),
        ),
        -1,
        false,
      );
    }
  }, [isReduceMotionEnabled]);

  // Scan line animated style
  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLinePosition.value * 300 }],
  }));

  // Capture button animation
  const captureButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: captureScale.value }],
  }));

  // Handle photo capture
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    Haptic.impactMedium();
    captureScale.value = withSpring(0.9, { damping: 10 });

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      captureScale.value = withSpring(1);

      if (photo?.uri) {
        // Navigate to analysis with photo URI
        router.push({
          pathname: "/scanner/analyze",
          params: { imageUri: photo.uri },
        });
      }
    } catch (error) {
      console.error("Failed to capture:", error);
      Haptic.error();
    } finally {
      setIsCapturing(false);
      captureScale.value = withSpring(1);
    }
  }, [isCapturing]);

  // Handle gallery pick
  const handlePickFromGallery = useCallback(async () => {
    Haptic.selection();

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 5],
    });

    if (!result.canceled && result.assets[0]?.uri) {
      router.push({
        pathname: "/scanner/analyze",
        params: { imageUri: result.assets[0].uri },
      });
    }
  }, []);

  // Toggle flash
  const toggleFlash = useCallback(() => {
    Haptic.selection();
    setFlashMode((prev) => (prev === "off" ? "on" : "off"));
  }, []);

  // Permission not granted
  if (!permission) {
    return (
      <VantaScreen>
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      </VantaScreen>
    );
  }

  if (!permission.granted) {
    return (
      <VantaScreen>
        <Stack.Screen
          options={{
            title: "Scanner IA",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <View style={[styles.centered, { paddingHorizontal: Spacing.xl }]}>
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.permissionCard}
          >
            <View
              style={[
                styles.permissionIcon,
                { backgroundColor: colors.goldSubtle },
              ]}
            >
              <AppIcon name="camera-add" size={48} color={colors.gold} />
            </View>
            <Text style={[styles.permissionTitle, { color: colors.text }]}>
              Accès à la caméra
            </Text>
            <Text style={[styles.permissionDesc, { color: colors.textMuted }]}>
              Pour scanner et analyser vos articles vintage, l'application a
              besoin d'accéder à votre caméra.
            </Text>
            <Pressable
              style={[
                styles.permissionButton,
                { backgroundColor: colors.gold },
              ]}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>
                Autoriser la caméra
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </VantaScreen>
    );
  }

  return (
    <VantaScreen>
      <Stack.Screen
        options={{
          title: "Scanner IA",
          headerStyle: { backgroundColor: "transparent" },
          headerTintColor: "#FFFFFF",
          headerTransparent: true,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={styles.headerButton}
              hitSlop={8}
            >
              <AppIcon name="close" size={24} color="#FFFFFF" />
            </Pressable>
          ),
        }}
      />
      <StatusBar style="light" />

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          flash={flashMode}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top gradient */}
          <View style={[styles.gradientTop, { paddingTop: insets.top + 60 }]}>
            <Text style={styles.instructionText}>Cadrez l'article vintage</Text>
            <Text style={styles.instructionSubtext}>
              L'IA analysera la marque, l'état et le prix
            </Text>
          </View>

          {/* Scan frame */}
          <View style={styles.scanFrame}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Scan line */}
            {!isReduceMotionEnabled && (
              <Animated.View style={[styles.scanLine, scanLineStyle]}>
                <View
                  style={[
                    styles.scanLineInner,
                    { backgroundColor: colors.gold },
                  ]}
                />
              </Animated.View>
            )}
          </View>

          {/* Bottom controls */}
          <View
            style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}
          >
            {/* Gallery button */}
            <Pressable
              style={[
                styles.sideButton,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
              onPress={handlePickFromGallery}
              accessibilityLabel="Choisir depuis la galerie"
            >
              <AppIcon name="photo" size={24} color="#FFFFFF" />
            </Pressable>

            {/* Capture button */}
            <Animated.View style={captureButtonStyle}>
              <Pressable
                style={[styles.captureButton, { borderColor: colors.gold }]}
                onPress={handleCapture}
                disabled={isCapturing}
                accessibilityLabel="Prendre une photo"
                accessibilityRole="button"
              >
                {isCapturing ? (
                  <ActivityIndicator size="large" color={colors.gold} />
                ) : (
                  <View
                    style={[
                      styles.captureInner,
                      { backgroundColor: colors.gold },
                    ]}
                  />
                )}
              </Pressable>
            </Animated.View>

            {/* Flash button */}
            <Pressable
              style={[
                styles.sideButton,
                {
                  backgroundColor:
                    flashMode === "on" ? colors.gold : "rgba(255,255,255,0.2)",
                },
              ]}
              onPress={toggleFlash}
              accessibilityLabel={`Flash ${flashMode === "on" ? "activé" : "désactivé"}`}
            >
              <AppIcon
                name="lightbulb"
                size={24}
                color={flashMode === "on" ? "#000000" : "#FFFFFF"}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </VantaScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  gradientTop: {
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
  },
  instructionText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  instructionSubtext: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontFamily: "Manrope_400Regular",
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  scanFrame: {
    width: 280,
    height: 350,
    alignSelf: "center",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: Palette.metal.gold,
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: "absolute",
    left: 10,
    right: 10,
    height: 2,
  },
  scanLineInner: {
    flex: 1,
    borderRadius: 1,
    boxShadow: `0 0 10px ${Palette.metal.goldGlow}`,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing["3xl"],
    paddingHorizontal: Spacing.xl,
  },
  sideButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  permissionCard: {
    alignItems: "center",
    padding: Spacing["2xl"],
  },
  permissionIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  permissionTitle: {
    fontSize: 22,
    fontFamily: "Manrope_700Bold",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  permissionDesc: {
    fontSize: 15,
    fontFamily: "Manrope_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: Radius.lg,
  },
  permissionButtonText: {
    color: "#000000",
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
  },
});
