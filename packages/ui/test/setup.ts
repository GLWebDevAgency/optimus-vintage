import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom n'implémente ni matchMedia ni ResizeObserver ni vibrate.
if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
  if (!("ResizeObserver" in window)) {
    class RO {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Object.defineProperty(window, "ResizeObserver", { writable: true, value: RO });
  }
  Object.defineProperty(navigator, "vibrate", {
    writable: true,
    configurable: true,
    value: vi.fn(() => true),
  });
}

afterEach(() => cleanup());
