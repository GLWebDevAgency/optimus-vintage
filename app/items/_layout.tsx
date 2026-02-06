import { Stack } from "expo-router/stack";

export default function ItemsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        presentation: "modal",
      }}
    />
  );
}
