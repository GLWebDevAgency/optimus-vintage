/**
 * 📤 SOCIAL SHARING — Capture & Share utilities
 *
 * Generates shareable image cards from React Native Views
 * using react-native-view-shot + expo-sharing.
 */

import {
  cacheDirectory,
  copyAsync,
  deleteAsync,
} from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import type { RefObject } from "react";
import type ViewShot from "react-native-view-shot";

/**
 * Capture a ViewShot ref as a PNG and share via system share sheet.
 */
export async function captureAndShare(
  viewRef: RefObject<ViewShot | null>,
  shareText?: string,
): Promise<boolean> {
  if (!viewRef.current?.capture) return false;

  try {
    // Capture the view as a temporary PNG
    const uri = await viewRef.current.capture();
    if (!uri) return false;

    // Check if sharing is available
    if (Platform.OS === "web") {
      // Web: try navigator.share or fallback
      if (navigator.share) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], "optimus-vintage-stats.png", {
          type: "image/png",
        });
        await navigator.share({
          text: shareText,
          files: [file],
        });
        return true;
      }
      return false;
    }

    // Native: use expo-sharing
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) return false;

    // Copy to a permanent location for sharing
    const fileName = `optimus-vintage-${Date.now()}.png`;
    const destination = `${cacheDirectory}${fileName}`;
    await copyAsync({ from: uri, to: destination });

    await Sharing.shareAsync(destination, {
      mimeType: "image/png",
      dialogTitle: shareText || "Share your Optimus Vintage stats",
    });

    // Clean up
    try {
      await deleteAsync(destination, { idempotent: true });
    } catch {
      // Ignore cleanup errors
    }

    return true;
  } catch {
    return false;
  }
}
