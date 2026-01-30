/**
 * 🎬 Animation Showcase - Demo of all animation capabilities
 *
 * This file demonstrates the premium animation system
 * Copy patterns from here to use in your screens
 */

import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated from "react-native-reanimated";

// Import our animation system
import {
    AnimatedBadge,
    AnimatedButton,
    // Moti components
    AnimatedCard,
    AnimatedListItem,
    AnimatedPresenceWrapper,
    AnimatedSkeleton,
    AnimatedSpinner,
    AnimatedStat,
    ExitingAnimations,
    LayoutTransitions,
    PulseIndicator,
    createStaggeredEntering,
    useShakeAnimation,
    useSuccessAnimation
} from "@/utils/animations-index";

import { useColorScheme } from "@/components/useColorScheme";
import { Theme } from "@/constants/Theme";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 EXAMPLE 1: Staggered List Animation
// ═══════════════════════════════════════════════════════════════════════════════

function StaggeredListExample() {
  const items = ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"];
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        📋 Staggered List
      </Text>
      {items.map((item, index) => (
        <AnimatedListItem key={item} index={index}>
          <View style={[styles.listItem, { backgroundColor: theme.surface }]}>
            <Text style={{ color: theme.text }}>{item}</Text>
          </View>
        </AnimatedListItem>
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 EXAMPLE 2: Animated Cards with Press Feedback
// ═══════════════════════════════════════════════════════════════════════════════

function AnimatedCardsExample() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        📦 Animated Cards
      </Text>

      <AnimatedCard index={0} onPress={() => console.log("Card 1 pressed")}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          Default Card
        </Text>
        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
          Tap me for press feedback
        </Text>
      </AnimatedCard>

      <AnimatedCard index={1} variant="outlined">
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          Outlined Card
        </Text>
        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
          With border style
        </Text>
      </AnimatedCard>

      <AnimatedCard index={2} variant="elevated">
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          Elevated Card
        </Text>
        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
          With shadow effect
        </Text>
      </AnimatedCard>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 EXAMPLE 3: Animated Stats (KPIs)
// ═══════════════════════════════════════════════════════════════════════════════

function AnimatedStatsExample() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        📊 Animated Stats
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <AnimatedStat
            value={1234}
            style={[styles.statValue, { color: theme.text }]}
            delay={0}
          />
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Total Items
          </Text>
        </View>

        <View style={styles.statBox}>
          <AnimatedStat
            value={89.5}
            suffix="%"
            decimals={1}
            style={[styles.statValue, { color: theme.primary }]}
            delay={200}
          />
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Profit Margin
          </Text>
        </View>

        <View style={styles.statBox}>
          <AnimatedStat
            value={42500}
            prefix="€"
            style={[styles.statValue, { color: theme.secondary }]}
            delay={400}
          />
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Revenue
          </Text>
        </View>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 EXAMPLE 4: Loading States
// ═══════════════════════════════════════════════════════════════════════════════

function LoadingStatesExample() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        ⏳ Loading States
      </Text>

      <View style={styles.skeletonContainer}>
        <AnimatedSkeleton width={60} height={60} borderRadius={30} />
        <View style={styles.skeletonContent}>
          <AnimatedSkeleton width="80%" height={16} />
          <AnimatedSkeleton width="60%" height={12} style={{ marginTop: 8 }} />
        </View>
      </View>

      <View style={styles.spinnerRow}>
        <AnimatedSpinner size={24} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading...
        </Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 EXAMPLE 5: Interactive Elements
// ═══════════════════════════════════════════════════════════════════════════════

function InteractiveExample() {
  const [showContent, setShowContent] = useState(false);
  const [count, setCount] = useState(3);
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];

  const { shake, animatedStyle: shakeStyle } = useShakeAnimation();
  const { trigger: triggerSuccess, animatedStyle: successStyle } =
    useSuccessAnimation();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        🎮 Interactive Elements
      </Text>

      {/* Toggle content */}
      <AnimatedButton
        onPress={() => setShowContent(!showContent)}
        variant="primary"
        style={{ marginBottom: 16 }}
      >
        <Text style={styles.buttonText}>
          {showContent ? "Hide Content" : "Show Content"}
        </Text>
      </AnimatedButton>

      <AnimatedPresenceWrapper visible={showContent} animation="slideUp">
        <View style={[styles.contentBox, { backgroundColor: theme.surface }]}>
          <Text style={{ color: theme.text }}>
            This content animates in and out!
          </Text>
        </View>
      </AnimatedPresenceWrapper>

      {/* Badge counter */}
      <View style={styles.badgeRow}>
        <Text style={{ color: theme.text }}>Notifications:</Text>
        <AnimatedBadge count={count} />
        <TouchableOpacity onPress={() => setCount((c) => c + 1)}>
          <Text style={{ color: theme.primary, marginLeft: 12 }}>+1</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCount(0)}>
          <Text style={{ color: theme.primary, marginLeft: 12 }}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Shake animation */}
      <Animated.View style={shakeStyle}>
        <AnimatedButton
          onPress={shake}
          variant="secondary"
          style={{ marginTop: 12 }}
        >
          <Text style={{ color: theme.text }}>Shake Me!</Text>
        </AnimatedButton>
      </Animated.View>

      {/* Pulse indicator */}
      <View style={styles.pulseRow}>
        <PulseIndicator color={theme.primary} size={10} />
        <Text style={{ color: theme.text, marginLeft: 12 }}>Live Status</Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 EXAMPLE 6: Reanimated Layout Animations
// ═══════════════════════════════════════════════════════════════════════════════

function ReanimatedExample() {
  const [items, setItems] = useState([1, 2, 3]);
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];

  const addItem = () => {
    setItems([...items, items.length + 1]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        ⚡ Reanimated Layout Animations
      </Text>

      <AnimatedButton
        onPress={addItem}
        variant="primary"
        style={{ marginBottom: 16 }}
      >
        <Text style={styles.buttonText}>Add Item</Text>
      </AnimatedButton>

      {items.map((item, index) => (
        <Animated.View
          key={item}
          entering={createStaggeredEntering(index)}
          exiting={ExitingAnimations.fadeUp}
          layout={LayoutTransitions.spring}
        >
          <TouchableOpacity
            onPress={() => removeItem(index)}
            style={[styles.reanimatedItem, { backgroundColor: theme.surface }]}
          >
            <Text style={{ color: theme.text }}>Item {item}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              Tap to remove
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 MAIN SHOWCASE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AnimationShowcase() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={[styles.title, { color: theme.text }]}>
        🎬 Animation System
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Premium animations powered by Reanimated 3 + Moti
      </Text>

      <StaggeredListExample />
      <AnimatedCardsExample />
      <AnimatedStatsExample />
      <LoadingStatesExample />
      <InteractiveExample />
      <ReanimatedExample />
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  listItem: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderCurve: "continuous",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  skeletonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  spinnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  contentBox: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  pulseRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  reanimatedItem: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderCurve: "continuous",
  },
});
