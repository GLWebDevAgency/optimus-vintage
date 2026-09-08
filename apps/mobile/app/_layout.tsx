import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { tokens } from "@chine/ui/tokens";

/**
 * Racine de l'app native. Même identité Selvedge que le web via les tokens partagés.
 * Phase 2 : navigation par onglets, écrans branchés sur l'API /api/v1 via @chine/contract.
 */
export default function RootLayout() {
  const scheme = useColorScheme() ?? "light";
  const palette = scheme === "dark" ? tokens.palettes.dark : tokens.palettes.light;
  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.bg },
        }}
      />
    </>
  );
}
