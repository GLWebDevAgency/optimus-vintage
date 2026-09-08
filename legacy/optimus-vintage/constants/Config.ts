/**
 * 🔧 Environment Configuration for Mobile App
 * 
 * Uses Expo's environment variable system.
 * Create a .env file in the root with your settings.
 */

// API Configuration
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

// Environment
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Feature Flags
export const ENABLE_ANALYTICS = process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true';
export const ENABLE_CRASH_REPORTING = process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true';

// Timeouts
export const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10);

// Validation
if (IS_PRODUCTION && API_URL.includes('localhost')) {
  console.warn('⚠️ Production build is using localhost API URL!');
}

export const config = {
  api: {
    url: API_URL,
    timeout: API_TIMEOUT,
  },
  environment: {
    isProduction: IS_PRODUCTION,
    isDevelopment: IS_DEVELOPMENT,
  },
  features: {
    analytics: ENABLE_ANALYTICS,
    crashReporting: ENABLE_CRASH_REPORTING,
  },
} as const;
