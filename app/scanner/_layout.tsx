/**
 * 📸 SCANNER LAYOUT - Stack navigation for scanner
 */

import { Stack } from "expo-router";

export default function ScannerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: "slide_from_right",
      }}
    />
  );
}
