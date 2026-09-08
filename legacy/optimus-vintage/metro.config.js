// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Stub out native-only modules on web to prevent Metro bundling errors.
// These modules use native APIs / import.meta / WASM that don't work in Metro web SSR.
const WEB_STUBBED_MODULES = [
  "framer-motion", // pulled by moti, tslib ESM/CJS crash
  "react-native-purchases", // RevenueCat native SDK
  "react-native-purchases-ui", // RevenueCat native UI
  "expo-haptics", // native-only haptics
  "moti", // uses framer-motion on web
  "moti/interactions", // moti sub-path
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web") {
    // Stub native-only modules
    const shouldStub = WEB_STUBBED_MODULES.some(
      (m) => moduleName === m || moduleName.startsWith(m + "/"),
    );
    if (shouldStub) {
      return { type: "empty" };
    }

    // Force zustand to use CJS builds instead of ESM on web.
    // The ESM builds (esm/*.mjs) use import.meta.env which Metro
    // cannot transform, causing "Cannot use import.meta outside a module".
    if (moduleName.startsWith("zustand")) {
      const zustandRoot = path.dirname(require.resolve("zustand/package.json"));
      // zustand -> zustand/index.js
      // zustand/middleware -> zustand/middleware.js
      // zustand/react -> zustand/react.js
      const subpath = moduleName.replace("zustand", "").replace(/^\//, "");
      const cjsFile = path.join(
        zustandRoot,
        subpath ? `${subpath}.js` : "index.js",
      );
      return { type: "sourceFile", filePath: cjsFile };
    }
  }
  // Fall back to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
