/**
 * 📦 LOTS LAYOUT - Stack navigation for lot screens
 */

import { useNeuColors } from "@/components/ui/Neumorphic";
import { Stack } from "expo-router";

export default function LotsLayout() {
  const { palette, typography } = useNeuColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.background.elevated },
        headerTintColor: palette.text.primary,
        headerTitleStyle: typography.heading.sm,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.background.main },
      }}
    >
      <Stack.Screen
        name="new"
        options={{
          title: "New Inventory Lot",
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Lot Details",
        }}
      />
    </Stack>
  );
}
