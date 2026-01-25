/**
 * 💰 SALES LAYOUT - Stack navigation for sales screens
 */

import { useNeuColors } from "@/components/ui/Neumorphic";
import { Stack } from "expo-router";

export default function SalesLayout() {
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
          title: "New Sale",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Sale Details",
          headerShown: false,
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
