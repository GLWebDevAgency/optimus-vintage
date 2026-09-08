import { Money, ScheduleFeePolicy, simulatePrice } from "@chine/domain";
import { tokens } from "@chine/ui/tokens";
import { StyleSheet, Text, View, useColorScheme } from "react-native";

/**
 * Écran de démonstration : prouve que le domaine partagé tourne tel quel en natif.
 * Exemple Lacoste : acheté 20 €, cible 75 € sur Vinted, port 4,95 €.
 */
export default function Home() {
  const scheme = useColorScheme() ?? "light";
  const p = scheme === "dark" ? tokens.palettes.dark : tokens.palettes.light;
  const sim = simulatePrice("VINTED", Money.of(75, "EUR"), Money.of(20, "EUR"), new ScheduleFeePolicy(), Money.of(4.95, "EUR"));
  return (
    <View style={[styles.root, { backgroundColor: p.bg }]}>
      <Text style={[styles.eyebrow, { color: p.thread }]}>CHINÉ · NATIF · PHASE 2</Text>
      <Text style={[styles.title, { color: p.ink }]}>Ensemble Lacoste</Text>
      <Text style={[styles.price, { color: p.ink }]}>{sim.price.format("fr-FR")}</Text>
      <Text style={[styles.line, { color: p.ink2 }]}>Marge nette {sim.margin.format("fr-FR")}</Text>
      <Text style={[styles.line, { color: p.brass }]}>ROI +{Math.round((sim.roi ?? 0) * 100)} %</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, justifyContent: "center", gap: 8 },
  eyebrow: { fontSize: 11, letterSpacing: 2 },
  title: { fontSize: 28, fontWeight: "700" },
  price: { fontSize: 56, fontStyle: "italic" },
  line: { fontSize: 16 },
});
