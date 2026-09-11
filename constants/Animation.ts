/**
 * 🌊 VANTA ANIMATION SYSTEM
 *
 * Centralized spring physics and animation constants.
 * "Gravity-based inertia — heavy, luxurious feel"
 *
 * Used across: Dashboard, Tab bar, Stock, Lots, Settings
 */

// ─── Spring Presets ──────────────────────────────────────────────────────────

/** Heavy, luxurious feel — used for focus/scale transitions */
export const SPRING_GRAVITY = {
  damping: 22,
  stiffness: 180,
  mass: 1.2,
  overshootClamping: false,
} as const;

/** Quick snap response — used for press feedback */
export const SPRING_SNAP = {
  damping: 16,
  stiffness: 400,
  mass: 0.6,
} as const;

/** Responsive but smooth — used for tab transitions, toggles */
export const SPRING_SNAPPY = {
  damping: 25,
  stiffness: 350,
  mass: 0.6,
} as const;

/** Gentle float — used for ambient animations */
export const SPRING_GENTLE = {
  damping: 30,
  stiffness: 120,
  mass: 1.0,
} as const;

// ─── Duration Presets ────────────────────────────────────────────────────────

export const Duration = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  ambient: 1500,
  float: 3000,
} as const;

// ─── Stagger Delays ─────────────────────────────────────────────────────────

export const Stagger = {
  /** Tight stagger for list items */
  tight: 50,
  /** Normal stagger for sections */
  normal: 80,
  /** Wide stagger for hero elements */
  wide: 100,
} as const;
