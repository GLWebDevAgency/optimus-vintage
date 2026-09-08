/**
 * 🔒 AI PROXY CLIENT - Secure server-side AI analysis
 *
 * Calls the API server's /api/ai/analyze endpoint instead of
 * calling Gemini directly from the client. This keeps the
 * GEMINI_API_KEY safe on the server.
 */

import { API_URL } from "@/constants/Config";
import type { AIAnalysisResult, ScanInput } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Server-proxied analysis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyze image via API server proxy (secure — API key stays server-side)
 */
export async function analyzeViaProxy(
  input: ScanInput,
): Promise<AIAnalysisResult> {
  const startTime = Date.now();
  const analysisId = `proxy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const response = await fetch(`${API_URL}/ai/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
        context: input.context,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        (errorBody as { error?: { message?: string } })?.error?.message ||
          `Server error: ${response.status}`,
      );
    }

    const data = await response.json();

    // Map server response to AIAnalysisResult
    const result: AIAnalysisResult = {
      id: analysisId,
      timestamp: new Date(),
      model: data.model || "gemini",
      modelVersion: data.modelVersion || "gemini-2.0-flash",
      success: true,
      identification: {
        brand: data.identification?.brand || null,
        brandConfidence: data.identification?.brandConfidence || 0,
        category: data.identification?.category || "other",
        categoryConfidence: data.identification?.categoryConfidence || 0,
        model: data.identification?.model || null,
        era: data.identification?.era || "unknown",
        materials: data.identification?.materials || [],
        colors: data.identification?.colors || [],
        size: data.identification?.size || null,
        condition: data.identification?.condition || "good",
        conditionNotes: data.identification?.conditionNotes || [],
        isVintage: data.identification?.isVintage || false,
        notableFeatures: data.identification?.notableFeatures || [],
      },
      pricing: {
        lowPrice: data.pricing?.lowPrice || 0,
        midPrice: data.pricing?.midPrice || 0,
        highPrice: data.pricing?.highPrice || 0,
        currency: "EUR",
        confidence: data.pricing?.confidence || 0,
        priceFactors: data.pricing?.priceFactors || [],
        recommendedPlatforms: data.pricing?.recommendedPlatforms || [],
      },
      market: {
        demandLevel: data.market?.demandLevel || "medium",
        trend: data.market?.trend || "stable",
        targetAudience: data.market?.targetAudience || [],
        marketComparison: data.market?.marketComparison || "",
        seasonality: data.market?.seasonality || null,
        rarityScore: data.market?.rarityScore || 5,
      },
      recommendation: {
        action: data.recommendation?.action || "consider",
        confidence: data.recommendation?.confidence || 0,
        reasons: data.recommendation?.reasons || [],
        suggestedBuyPrice: data.recommendation?.suggestedBuyPrice || null,
        potentialMargin: data.recommendation?.potentialMargin || null,
        riskLevel: data.recommendation?.riskLevel || 5,
        sellingTips: data.recommendation?.sellingTips || [],
      },
      processingTimeMs: Date.now() - startTime,
    };

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      id: analysisId,
      timestamp: new Date(),
      model: "gemini",
      modelVersion: "gemini-2.0-flash",
      success: false,
      error: errorMessage,
      identification: {
        brand: null,
        brandConfidence: 0,
        category: "other",
        categoryConfidence: 0,
        model: null,
        era: "unknown",
        materials: [],
        colors: [],
        size: null,
        condition: "good",
        conditionNotes: [],
        isVintage: false,
        notableFeatures: [],
      },
      pricing: {
        lowPrice: 0,
        midPrice: 0,
        highPrice: 0,
        currency: "EUR",
        confidence: 0,
        priceFactors: [],
        recommendedPlatforms: [],
      },
      market: {
        demandLevel: "medium",
        trend: "stable",
        targetAudience: [],
        marketComparison: "",
        seasonality: null,
        rarityScore: 5,
      },
      recommendation: {
        action: "consider",
        confidence: 0,
        reasons: ["Analyse échouée"],
        suggestedBuyPrice: null,
        potentialMargin: null,
        riskLevel: 5,
        sellingTips: [],
      },
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Check if the AI proxy server is configured and reachable
 */
export async function isProxyAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/ai/status`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return Boolean(data.configured);
  } catch {
    return false;
  }
}
