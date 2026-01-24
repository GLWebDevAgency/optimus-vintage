import { Stack } from "expo-router/stack";

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
