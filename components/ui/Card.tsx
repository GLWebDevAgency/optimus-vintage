import { Theme } from "@/constants/Theme";
import { StyleSheet, ViewStyle } from "react-native";
import { View } from "../Themed";
import { useColorScheme } from "../useColorScheme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "outlined";
}

export function Card({ children, style, variant = "default" }: CardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        variant === "outlined" && styles.outlined,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderCurve: "continuous",
    padding: 16,
    marginBottom: 12,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  },
  outlined: {
    borderWidth: 1,
    boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
  },
});
