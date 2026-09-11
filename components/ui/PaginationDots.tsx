/**
 * ● ○ ○ ○ PAGINATION DOTS
 *
 * Animated pagination indicator for horizontal pagers.
 * Active dot uses theme primary (gold), inactive is ghost.
 */

import { Palette, Radius, Spacing } from "@/constants/Theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

interface PaginationDotsProps {
  count: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
  activeColor?: string;
  inactiveColor?: string;
}

export function PaginationDots({
  count,
  scrollX,
  pageWidth,
  activeColor = Palette.metal.gold,
  inactiveColor = "rgba(255,255,255,0.2)",
}: PaginationDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <Dot
          key={index}
          index={index}
          scrollX={scrollX}
          pageWidth={pageWidth}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
        />
      ))}
    </View>
  );
}

function Dot({
  index,
  scrollX,
  pageWidth,
  activeColor,
  inactiveColor,
}: {
  index: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
  activeColor: string;
  inactiveColor: string;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * pageWidth,
      index * pageWidth,
      (index + 1) * pageWidth,
    ];

    const width = interpolate(scrollX.value, inputRange, [8, 24, 8], "clamp");
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      "clamp",
    );

    return { width, opacity };
  });

  const colorStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * pageWidth,
      index * pageWidth,
      (index + 1) * pageWidth,
    ];

    const isActive = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      "clamp",
    );

    return {
      backgroundColor: isActive > 0.5 ? activeColor : inactiveColor,
    };
  });

  return (
    <Animated.View style={[styles.dot, animatedStyle, colorStyle]} />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  dot: {
    height: 8,
    borderRadius: Radius.full,
  },
});
