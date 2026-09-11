/**
 * ⭐ IN-APP REVIEW PROMPT LOGIC
 *
 * Smart review prompting: asks at key milestones,
 * never too frequently, respects user experience.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const STORAGE_KEY = "@optimus_review_prompt";
const MIN_INTERVAL_DAYS = 30;
const MILESTONES = [5, 20, 50, 100];

interface ReviewState {
  lastPromptDate: string | null;
  promptCount: number;
  lastMilestone: number;
}

async function getReviewState(): Promise<ReviewState> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore
  }
  return { lastPromptDate: null, promptCount: 0, lastMilestone: 0 };
}

async function saveReviewState(state: ReviewState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore
  }
}

/**
 * Check if we should prompt for a review based on sales count.
 */
export async function shouldPromptReview(
  salesCount: number,
): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const state = await getReviewState();

  // Check if we've hit a new milestone
  const nextMilestone = MILESTONES.find(
    (m) => m > state.lastMilestone && salesCount >= m,
  );
  if (!nextMilestone) return false;

  // Check minimum interval
  if (state.lastPromptDate) {
    const daysSince = Math.floor(
      (Date.now() - new Date(state.lastPromptDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysSince < MIN_INTERVAL_DAYS) return false;
  }

  return true;
}

/**
 * Request an in-app review and record the prompt.
 */
export async function requestReview(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const StoreReview = await import("expo-store-review");
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return;

    await StoreReview.requestReview();

    // Record the prompt
    const state = await getReviewState();
    await saveReviewState({
      ...state,
      lastPromptDate: new Date().toISOString(),
      promptCount: state.promptCount + 1,
    });
  } catch {
    // Silently fail — review prompts should never break the app
  }
}

/**
 * Record that a milestone has been reached (even if review wasn't shown).
 */
export async function recordMilestone(salesCount: number): Promise<void> {
  const state = await getReviewState();
  const reachedMilestone = MILESTONES.filter((m) => salesCount >= m).pop();
  if (reachedMilestone && reachedMilestone > state.lastMilestone) {
    await saveReviewState({ ...state, lastMilestone: reachedMilestone });
  }
}
