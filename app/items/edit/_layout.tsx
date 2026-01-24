import { Stack } from "expo-router/stack";

export default function EditItemLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        presentation: "modal",
      }}
    />
  );
}
