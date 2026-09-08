/**
 * 🧪 TEST UTILITIES
 *
 * Helpers and mocks for testing React Native components
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, RenderOptions } from "@testing-library/react-native";
import React, { ReactElement, ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 CUSTOM RENDER WITH PROVIDERS
// ═══════════════════════════════════════════════════════════════════════════════

interface WrapperProps {
  children: ReactNode;
}

/**
 * Create a fresh QueryClient for each test
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry failed queries in tests
        gcTime: 0, // Don't cache between tests
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * All providers wrapper for testing
 */
function AllProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 375, height: 812 },
          insets: { top: 47, left: 0, right: 0, bottom: 34 },
        }}
      >
        {children}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

/**
 * Custom render function that wraps components with all necessary providers
 *
 * @example
 * ```tsx
 * import { renderWithProviders, screen } from '@/utils/test-utils';
 *
 * test('renders correctly', () => {
 *   renderWithProviders(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeTruthy();
 * });
 * ```
 */
function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎭 MOCKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Mock data for lots
 */
export const mockLots = [
  {
    id: 1,
    name: "Lot Test 1",
    provider: "Eureka",
    buyDate: "2025-01-15",
    type: "BULK",
    totalCost: "150.00",
    additionalFees: "10.00",
    initialQuantity: 20,
    currency: "EUR",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z",
  },
  {
    id: 2,
    name: "Lot Test 2",
    provider: "Kilostock",
    buyDate: "2025-02-01",
    type: "PIECEWISE",
    totalCost: "200.00",
    additionalFees: "0.00",
    initialQuantity: 10,
    currency: "EUR",
    createdAt: "2025-02-01T10:00:00Z",
    updatedAt: "2025-02-01T10:00:00Z",
  },
];

/**
 * Mock data for items
 */
export const mockItems = [
  {
    id: 1,
    lotId: 1,
    brand: "Levi's",
    type: "Jeans",
    size: "32",
    color: "Blue",
    condition: "VERY_GOOD",
    unitCost: "8.00",
    status: "AVAILABLE",
    photos: '["photo1.jpg"]',
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z",
  },
  {
    id: 2,
    lotId: 1,
    brand: "Nike",
    type: "Jacket",
    size: "M",
    color: "Black",
    condition: "GOOD",
    unitCost: "8.00",
    status: "SOLD",
    photos: null,
    createdAt: "2025-01-16T10:00:00Z",
    updatedAt: "2025-01-20T10:00:00Z",
  },
];

/**
 * Mock data for sales
 */
export const mockSales = [
  {
    id: 1,
    itemId: 2,
    lotId: 1,
    platform: "VINTED",
    priceGross: "25.00",
    platformFees: "2.50",
    shippingFees: "5.00",
    miscFees: "0.00",
    priceNet: "17.50",
    saleDate: "2025-01-20",
    status: "COMPLETED",
    createdAt: "2025-01-20T10:00:00Z",
    updatedAt: "2025-01-20T10:00:00Z",
  },
];

/**
 * Mock for expo-router
 */
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  setParams: jest.fn(),
};

/**
 * Mock for expo-haptics
 */
export const mockHaptics = {
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
};

/**
 * Mock useColorScheme hook
 */
export const mockColorScheme = jest.fn(() => "light");

// ═══════════════════════════════════════════════════════════════════════════════
// 🛠️ UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Wait for async operations to complete
 */
export async function waitForAsync(ms: number = 0): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Silence console methods during tests
 */
export function silenceConsole() {
  const originalConsole = { ...console };

  beforeAll(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });
}

/**
 * Create a mock API response
 */
export function createMockResponse<T>(data: T, delay: number = 0) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

/**
 * Create a mock API error
 */
export function createMockError(message: string, status: number = 500) {
  const error = new Error(message);
  (error as unknown as { status: number }).status = status;
  return error;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// Re-export everything from testing-library
export * from "@testing-library/react-native";

// Export custom render
export { renderWithProviders };
