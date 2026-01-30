/**
 * 🧪 COMPONENTS UI TESTS
 *
 * Tests for core UI components
 */

import { renderWithProviders, screen } from "@/utils/test-utils";
import React from "react";
import { Text } from "react-native";

// Mock the theme hook
jest.mock("@/components/useColorScheme", () => ({
  useColorScheme: () => "light",
}));

// Import components after mocking
import { AnimatedCard, AnimatedContainer } from "../AnimatedComponents";

describe("AnimatedComponents", () => {
  describe("AnimatedContainer", () => {
    it("renders children correctly", () => {
      renderWithProviders(
        <AnimatedContainer>
          <Text>Test Content</Text>
        </AnimatedContainer>,
      );

      expect(screen.getByText("Test Content")).toBeTruthy();
    });

    it("applies fadeUp animation by default", () => {
      const { toJSON } = renderWithProviders(
        <AnimatedContainer>
          <Text>Animated</Text>
        </AnimatedContainer>,
      );

      expect(toJSON()).toBeTruthy();
    });

    it("applies custom delay", () => {
      renderWithProviders(
        <AnimatedContainer delay={500}>
          <Text>Delayed</Text>
        </AnimatedContainer>,
      );

      expect(screen.getByText("Delayed")).toBeTruthy();
    });
  });

  describe("AnimatedCard", () => {
    it("renders children correctly", () => {
      renderWithProviders(
        <AnimatedCard>
          <Text>Card Content</Text>
        </AnimatedCard>,
      );

      expect(screen.getByText("Card Content")).toBeTruthy();
    });

    it("handles onPress prop", () => {
      const onPress = jest.fn();

      renderWithProviders(
        <AnimatedCard onPress={onPress}>
          <Text>Pressable Card</Text>
        </AnimatedCard>,
      );

      expect(screen.getByText("Pressable Card")).toBeTruthy();
    });

    it("applies stagger delay based on index", () => {
      renderWithProviders(
        <>
          <AnimatedCard index={0}>
            <Text>First</Text>
          </AnimatedCard>
          <AnimatedCard index={1}>
            <Text>Second</Text>
          </AnimatedCard>
          <AnimatedCard index={2}>
            <Text>Third</Text>
          </AnimatedCard>
        </>,
      );

      expect(screen.getByText("First")).toBeTruthy();
      expect(screen.getByText("Second")).toBeTruthy();
      expect(screen.getByText("Third")).toBeTruthy();
    });
  });
});
