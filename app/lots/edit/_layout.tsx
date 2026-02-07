import { Stack } from "expo-router/stack";

export { ScreenErrorBoundary as ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function EditLotLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        presentation: "modal",
      }}
    />
  );
}
