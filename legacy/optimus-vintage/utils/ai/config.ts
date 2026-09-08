/**
 * 🔑 AI CONFIGURATION - API Keys & Model Settings
 *
 * Configuration centralisée pour les modèles IA
 * Gemini 3 Flash | GPT-5-nano | Claude Sonnet 4.5
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 🔐 API KEYS (from environment variables)
// ═══════════════════════════════════════════════════════════════════════════════

export const AI_CONFIG = {
  gemini: {
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || "",
    model: "gemini-2.0-flash", // Latest stable flash model
    maxTokens: 4096,
    temperature: 0.3, // Low for consistent analysis
  },
  openai: {
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
    model: "gpt-4o-mini", // Fast and efficient
    maxTokens: 4096,
    temperature: 0.3,
  },
  anthropic: {
    apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || "",
    model: "claude-sonnet-4-5-20250514", // Claude Sonnet 4.5
    maxTokens: 4096,
    temperature: 0.3,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 ANALYSIS PROMPTS
// ═══════════════════════════════════════════════════════════════════════════════

export const VINTAGE_ANALYSIS_PROMPT = `Tu es un expert en vêtements vintage et mode secondhand avec 20 ans d'expérience.
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

CONTEXTE MARCHÉ FRANÇAIS:
- Vinted: plateforme dominante, prix accessibles
- Vestiaire Collective: luxe et premium
- Depop: streetwear et créateurs
- eBay: vintage rare et collector

Sois précis, objectif et pragmatique dans ton évaluation.`;

// ═══════════════════════════════════════════════════════════════════════════════
// ⚙️ ANALYSIS SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

export const ANALYSIS_SETTINGS = {
  /** Use all models for voting (slower but more accurate) */
  enableMultiModelVoting: false, // Start with single model for MVP
  /** Primary model for quick analysis */
  primaryModel: "gemini" as const,
  /** Timeout per model in ms */
  timeoutMs: 30000,
  /** Retry attempts per model */
  maxRetries: 2,
  /** Minimum confidence to trust result */
  minConfidence: 0.6,
  /** Image max dimension (resize before sending) */
  maxImageDimension: 1024,
  /** JPEG quality for compression */
  jpegQuality: 0.8,
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

export function isAIConfigured(): boolean {
  return Boolean(AI_CONFIG.gemini.apiKey);
}

export function getConfiguredModels(): string[] {
  const models: string[] = [];
  if (AI_CONFIG.gemini.apiKey) models.push("gemini");
  if (AI_CONFIG.openai.apiKey) models.push("openai");
  if (AI_CONFIG.anthropic.apiKey) models.push("anthropic");
  return models;
}
