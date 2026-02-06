/**
 * 🎯 AI SCANNER SERVICE - Main Entry Point
 *
 * Service principal pour l'analyse IA de vêtements vintage
 * Gère les différents modèles et le système de voting
 */

import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

import { ANALYSIS_SETTINGS, isAIConfigured } from "./config";
import { analyzeWithGemini } from "./gemini-service";
import type { AIAnalysisResult, ScanInput, ScannerUIState } from "./types";

// ═══════════════════════════════════════════════════════════════════════════════
// 📸 IMAGE PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Prepare image for AI analysis
 * - Resize to max dimension
 * - Convert to JPEG
 * - Return base64
 */
export async function prepareImageForAnalysis(
  imageUri: string,
): Promise<ScanInput> {
  // Resize and compress
  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [
      {
        resize: {
          width: ANALYSIS_SETTINGS.maxImageDimension,
        },
      },
    ],
    {
      compress: ANALYSIS_SETTINGS.jpegQuality,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  // Read as base64
  const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
    encoding: "base64",
  });

  return {
    imageBase64: base64,
    mimeType: "image/jpeg",
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 SINGLE MODEL ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze image with primary model (Gemini)
 */
export async function analyzeImage(
  imageUri: string,
  onProgress?: (state: ScannerUIState) => void,
): Promise<AIAnalysisResult> {
  // Check configuration
  if (!isAIConfigured()) {
    throw new Error(
      "AI not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.",
    );
  }

  // Update progress
  onProgress?.({
    state: "analyzing",
    progress: 0.1,
    currentModel: "Préparation image...",
    error: null,
    result: null,
  });

  // Prepare image
  const input = await prepareImageForAnalysis(imageUri);

  onProgress?.({
    state: "analyzing",
    progress: 0.3,
    currentModel: "Gemini Flash",
    error: null,
    result: null,
  });

  // Analyze with Gemini
  const result = await analyzeWithGemini(input);

  onProgress?.({
    state: result.success ? "success" : "error",
    progress: 1,
    currentModel: null,
    error: result.error || null,
    result: result.success ? result : null,
  });

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🗳️ MULTI-MODEL VOTING (Future)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze with multiple models and aggregate results
 * TODO: Implement when GPT and Claude are configured
 */
export async function analyzeWithVoting(
  imageUri: string,
  onProgress?: (state: ScannerUIState) => void,
): Promise<AIAnalysisResult> {
  // For now, just use single model
  return analyzeImage(imageUri, onProgress);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 RESULT FORMATTING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get color for recommendation action
 */
export function getRecommendationColor(
  action: AIAnalysisResult["recommendation"]["action"],
): string {
  switch (action) {
    case "strong_buy":
      return "#22C55E"; // Green
    case "buy":
      return "#4ADE80"; // Light green
    case "consider":
      return "#FACC15"; // Yellow
    case "pass":
      return "#FB923C"; // Orange
    case "strong_pass":
      return "#EF4444"; // Red
    default:
      return "#737373"; // Gray
  }
}

/**
 * Get label for recommendation action
 */
export function getRecommendationLabel(
  action: AIAnalysisResult["recommendation"]["action"],
): string {
  switch (action) {
    case "strong_buy":
      return "ACHETER 🔥";
    case "buy":
      return "ACHETER ✓";
    case "consider":
      return "À CONSIDÉRER";
    case "pass":
      return "PASSER";
    case "strong_pass":
      return "ÉVITER ✗";
    default:
      return "INCONNU";
  }
}

/**
 * Get emoji for demand level
 */
export function getDemandEmoji(
  level: AIAnalysisResult["market"]["demandLevel"],
): string {
  switch (level) {
    case "very_high":
      return "🔥";
    case "high":
      return "📈";
    case "medium":
      return "➡️";
    case "low":
      return "📉";
    case "very_low":
      return "❄️";
    default:
      return "❓";
  }
}

/**
 * Format condition for display
 */
export function getConditionLabel(
  condition: AIAnalysisResult["identification"]["condition"],
): string {
  switch (condition) {
    case "mint":
      return "Neuf";
    case "excellent":
      return "Excellent";
    case "very_good":
      return "Très bon";
    case "good":
      return "Bon";
    case "fair":
      return "Correct";
    case "poor":
      return "Mauvais";
    default:
      return "Inconnu";
  }
}

/**
 * Format category for display
 */
export function getCategoryLabel(
  category: AIAnalysisResult["identification"]["category"],
): string {
  const labels: Record<string, string> = {
    jacket: "Veste",
    coat: "Manteau",
    sweater: "Pull",
    shirt: "Chemise",
    "t-shirt": "T-shirt",
    pants: "Pantalon",
    jeans: "Jean",
    shorts: "Short",
    dress: "Robe",
    skirt: "Jupe",
    shoes: "Chaussures",
    boots: "Bottes",
    sneakers: "Sneakers",
    bag: "Sac",
    accessory: "Accessoire",
    hat: "Chapeau",
    scarf: "Écharpe",
    belt: "Ceinture",
    other: "Autre",
  };
  return labels[category] || category;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export { getConfiguredModels, isAIConfigured } from "./config";
export * from "./types";

