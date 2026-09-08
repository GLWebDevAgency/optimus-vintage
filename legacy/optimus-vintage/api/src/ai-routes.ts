/**
 * 🤖 AI PROXY ROUTES - Secure server-side AI analysis
 *
 * Proxies AI requests through the API server so API keys
 * are NEVER exposed to the client app.
 *
 * POST /api/ai/analyze - Analyze clothing image with Gemini
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { asyncHandler, validateBody } from "./middleware";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const MAX_TOKENS = 4096;
const TEMPERATURE = 0.3;

// ─────────────────────────────────────────────────────────────────────────────
// Prompt (server-side only — never sent to client)
// ─────────────────────────────────────────────────────────────────────────────

const ANALYSIS_PROMPT = `Tu es un expert en vêtements et mode secondhand avec 20 ans d'expérience.
Analyse cette image de vêtement et fournis une évaluation détaillée.

IMPORTANT: Réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après.

Structure de réponse requise:
{
  "identification": {
    "brand": "string ou null",
    "brandConfidence": 0.0-1.0,
    "category": "jacket|coat|sweater|shirt|t-shirt|pants|jeans|shorts|dress|skirt|shoes|boots|sneakers|bag|accessory|hat|scarf|belt|other",
    "categoryConfidence": 0.0-1.0,
    "model": "string ou null (ex: Levi's 501, Nike Air Max 90)",
    "era": "1950s|1960s|1970s|1980s|1990s|2000s|2010s|modern|unknown",
    "materials": ["coton", "laine", "polyester", etc.],
    "colors": ["bleu marine", "beige", etc.],
    "size": "string ou null",
    "condition": "mint|excellent|very_good|good|fair|poor",
    "conditionNotes": ["petite usure au col", "boutons intacts", etc.],
    "isVintage": true/false,
    "notableFeatures": ["coloris rare", "édition limitée", "collaboration", etc.]
  },
  "pricing": {
    "lowPrice": number (en EUR, vente rapide),
    "midPrice": number (prix marché),
    "highPrice": number (vente patiente/collectionneur),
    "currency": "EUR",
    "confidence": 0.0-1.0,
    "priceFactors": [
      {"factor": "description", "impact": "positive|negative|neutral", "weight": 0.0-1.0}
    ],
    "recommendedPlatforms": [
      {"name": "Vinted|Vestiaire Collective|Depop|eBay|Grailed", "estimatedPrice": number, "estimatedDays": number}
    ]
  },
  "market": {
    "demandLevel": "very_high|high|medium|low|very_low",
    "trend": "rising|stable|declining",
    "targetAudience": ["millennials mode", "collectionneurs streetwear", etc.],
    "marketComparison": "description brève du marché actuel",
    "seasonality": "string ou null (meilleur moment pour vendre)",
    "rarityScore": 1-10
  },
  "recommendation": {
    "action": "strong_buy|buy|consider|pass|strong_pass",
    "confidence": 0.0-1.0,
    "reasons": ["raison 1", "raison 2", etc.],
    "suggestedBuyPrice": number ou null (prix max à payer),
    "potentialMargin": number ou null (% de marge potentielle),
    "riskLevel": 1-10,
    "sellingTips": ["conseil 1", "conseil 2", etc.]
  }
}

CONTEXTE MARCHÉ:
- Vinted: plateforme dominante en Europe, tous types de vêtements
- Vestiaire Collective: luxe et premium
- Depop: streetwear et créateurs
- eBay: vintage rare et collector
- Leboncoin: marché français général

Si l'article est vintage (pré-2000s), évalue particulièrement la rareté et la valeur collector.
Sois précis, objectif et pragmatique dans ton évaluation.`;

// ─────────────────────────────────────────────────────────────────────────────
// Validation schema
// ─────────────────────────────────────────────────────────────────────────────

const analyzeSchema = z.object({
  imageBase64: z
    .string()
    .min(100, "Image data too small")
    .max(10_000_000, "Image too large (max ~7.5MB)"),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  context: z
    .object({
      brand: z.string().optional(),
      category: z.string().optional(),
      purchasePrice: z.number().optional(),
    })
    .optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Gemini client (singleton)
// ─────────────────────────────────────────────────────────────────────────────

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured on server");
    }
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────

export const aiRouter = Router();

// Stricter rate limit for AI endpoint (expensive calls)
const aiRateLimit = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 10, // 10 analyses per minute max
  message: {
    error: {
      message: "Too many AI analysis requests. Please wait.",
      code: "AI_RATE_LIMITED",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

aiRouter.use(aiRateLimit);

// GET /api/ai/status — Check if AI is configured
aiRouter.get(
  "/status",
  asyncHandler(async (_req, res) => {
    res.json({
      configured: Boolean(GEMINI_API_KEY),
      model: GEMINI_MODEL,
    });
  }),
);

// POST /api/ai/analyze — Analyze clothing image
aiRouter.post(
  "/analyze",
  validateBody(analyzeSchema),
  asyncHandler(async (req, res) => {
    const { imageBase64, mimeType, context } = req.body;
    const startTime = Date.now();

    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        maxOutputTokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      },
    });

    // Build prompt with optional context
    let prompt = ANALYSIS_PROMPT;
    if (context) {
      prompt += "\n\nCONTEXTE ADDITIONNEL:";
      if (context.brand) prompt += `\n- Marque suspectée: ${context.brand}`;
      if (context.category) prompt += `\n- Catégorie: ${context.category}`;
      if (context.purchasePrice)
        prompt += `\n- Prix d'achat: ${context.purchasePrice}€`;
    }

    // Call Gemini
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(422).json({
        error: {
          message: "AI returned invalid response format",
          code: "AI_PARSE_ERROR",
        },
      });
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    res.json({
      success: true,
      model: "gemini",
      modelVersion: GEMINI_MODEL,
      processingTimeMs: Date.now() - startTime,
      identification: parsed.identification || {},
      pricing: parsed.pricing || {},
      market: parsed.market || {},
      recommendation: parsed.recommendation || {},
    });
  }),
);
