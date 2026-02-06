/**
 * 🤖 GEMINI SERVICE - Google AI Analysis
 *
 * Service d'analyse d'images avec Gemini 2.0 Flash
 * Optimisé pour la reconnaissance de vêtements vintage
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

import { AI_CONFIG, VINTAGE_ANALYSIS_PROMPT } from "./config";
import type { AIAnalysisResult, ScanInput } from "./types";

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 GEMINI CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!AI_CONFIG.gemini.apiKey) {
      throw new Error("Gemini API key not configured");
    }
    genAI = new GoogleGenerativeAI(AI_CONFIG.gemini.apiKey);
  }
  return genAI;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📸 ANALYZE IMAGE
// ═══════════════════════════════════════════════════════════════════════════════

export async function analyzeWithGemini(
  input: ScanInput,
): Promise<AIAnalysisResult> {
  const startTime = Date.now();
  const analysisId = `gemini-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: AI_CONFIG.gemini.model,
      generationConfig: {
        maxOutputTokens: AI_CONFIG.gemini.maxTokens,
        temperature: AI_CONFIG.gemini.temperature,
      },
    });

    // Build context-aware prompt
    let prompt = VINTAGE_ANALYSIS_PROMPT;
    if (input.context) {
      prompt += "\n\nCONTEXTE ADDITIONNEL:";
      if (input.context.brand) {
        prompt += `\n- Marque suspectée: ${input.context.brand}`;
      }
      if (input.context.category) {
        prompt += `\n- Catégorie: ${input.context.category}`;
      }
      if (input.context.purchasePrice) {
        prompt += `\n- Prix d'achat: ${input.context.purchasePrice}€`;
      }
    }

    // Prepare image for Gemini
    const imagePart = {
      inlineData: {
        data: input.imageBase64,
        mimeType: input.mimeType,
      },
    };

    // Generate content
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Build result
    const analysisResult: AIAnalysisResult = {
      id: analysisId,
      timestamp: new Date(),
      model: "gemini",
      modelVersion: AI_CONFIG.gemini.model,
      success: true,
      identification: {
        brand: parsed.identification?.brand || null,
        brandConfidence: parsed.identification?.brandConfidence || 0,
        category: parsed.identification?.category || "other",
        categoryConfidence: parsed.identification?.categoryConfidence || 0,
        model: parsed.identification?.model || null,
        era: parsed.identification?.era || "unknown",
        materials: parsed.identification?.materials || [],
        colors: parsed.identification?.colors || [],
        size: parsed.identification?.size || null,
        condition: parsed.identification?.condition || "good",
        conditionNotes: parsed.identification?.conditionNotes || [],
        isVintage: parsed.identification?.isVintage || false,
        notableFeatures: parsed.identification?.notableFeatures || [],
      },
      pricing: {
        lowPrice: parsed.pricing?.lowPrice || 0,
        midPrice: parsed.pricing?.midPrice || 0,
        highPrice: parsed.pricing?.highPrice || 0,
        currency: "EUR",
        confidence: parsed.pricing?.confidence || 0,
        priceFactors: parsed.pricing?.priceFactors || [],
        recommendedPlatforms: parsed.pricing?.recommendedPlatforms || [],
      },
      market: {
        demandLevel: parsed.market?.demandLevel || "medium",
        trend: parsed.market?.trend || "stable",
        targetAudience: parsed.market?.targetAudience || [],
        marketComparison: parsed.market?.marketComparison || "",
        seasonality: parsed.market?.seasonality || null,
        rarityScore: parsed.market?.rarityScore || 5,
      },
      recommendation: {
        action: parsed.recommendation?.action || "consider",
        confidence: parsed.recommendation?.confidence || 0,
        reasons: parsed.recommendation?.reasons || [],
        suggestedBuyPrice: parsed.recommendation?.suggestedBuyPrice || null,
        potentialMargin: parsed.recommendation?.potentialMargin || null,
        riskLevel: parsed.recommendation?.riskLevel || 5,
        sellingTips: parsed.recommendation?.sellingTips || [],
      },
      rawResponse: text,
      processingTimeMs: Date.now() - startTime,
    };

    return analysisResult;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      id: analysisId,
      timestamp: new Date(),
      model: "gemini",
      modelVersion: AI_CONFIG.gemini.model,
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
