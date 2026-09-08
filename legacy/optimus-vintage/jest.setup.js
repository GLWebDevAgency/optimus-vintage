/**
 * 🧪 JEST SETUP
 *
 * Configuration globale des tests pour Optimus Vintage
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 📱 REACT NATIVE MOCKS
// ═══════════════════════════════════════════════════════════════════════════════

// Mock Reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Safe Area Context
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock Expo Router
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
  useFocusEffect: jest.fn(),
  usePathname: () => "/",
  Link: ({ children }) => children,
  Stack: {
    Screen: () => null,
  },
}));

// Mock Expo Blur
jest.mock("expo-blur", () => ({
  BlurView: ({ children }) => children,
}));

// Mock Expo Image
jest.mock("expo-image", () => ({
  Image: "Image",
}));

// Mock Expo Haptics
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
  },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
}));

// Mock Expo Localization
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "fr", languageTag: "fr-FR" }],
  getCalendars: () => [{ calendar: "gregory" }],
}));

// Mock Expo SQLite localStorage shim (use jsdom localStorage in tests)
jest.mock("expo-sqlite/localStorage/install", () => ({}));

// Mock FlashList
jest.mock("@shopify/flash-list", () => {
  const { FlatList } = require("react-native");
  return {
    FlashList: FlatList,
    FlashListRef: {},
    MasonryFlashList: FlatList,
  };
});

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 GLOBAL MOCKS
// ═══════════════════════════════════════════════════════════════════════════════

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress logs in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
  }),
);

// Mock Date.now for consistent snapshots
const RealDate = Date;
const mockDate = new RealDate("2025-01-01T12:00:00.000Z");
global.Date = class extends RealDate {
  constructor(...args) {
    if (args.length === 0) {
      return mockDate;
    }
    return new RealDate(...args);
  }
  static now() {
    return mockDate.getTime();
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🧹 CLEANUP
// ═══════════════════════════════════════════════════════════════════════════════

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Suppress act() warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (/Warning.*not wrapped in act/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
