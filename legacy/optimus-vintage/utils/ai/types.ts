/**
 * 🤖 AI SCANNER TYPES - Vintage Clothing Analysis
 *
 * Types et interfaces pour le système de reconnaissance IA
 * Multi-model voting: Gemini + GPT + Claude
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 📷 INPUT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ScanInput {
  /** Base64 encoded image */
  imageBase64: string;
  /** MIME type (image/jpeg, image/png) */
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  /** Optional context about the item */
  context?: {
    /** Known brand if visible */
    brand?: string;
    /** Category hint */
    category?: string;
    /** Purchase price if known */
    purchasePrice?: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏷️ CLOTHING IDENTIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

export type ClothingCategory =
  | "jacket"
  | "coat"
  | "sweater"
  | "shirt"
  | "t-shirt"
  | "pants"
  | "jeans"
  | "shorts"
  | "dress"
  | "skirt"
  | "shoes"
  | "boots"
  | "sneakers"
  | "bag"
  | "accessory"
  | "hat"
  | "scarf"
  | "belt"
  | "other";

export type ClothingCondition =
  | "mint"
  | "excellent"
  | "very_good"
  | "good"
  | "fair"
  | "poor";

export type ClothingEra =
  | "1950s"
  | "1960s"
  | "1970s"
  | "1980s"
  | "1990s"
  | "2000s"
  | "2010s"
  | "modern"
  | "unknown";

export interface ClothingIdentification {
  /** Detected brand */
  brand: string | null;
  /** Brand confidence (0-1) */
  brandConfidence: number;
  /** Category */
  category: ClothingCategory;
  /** Category confidence */
  categoryConfidence: number;
  /** Detected type/model (e.g., "Levi's 501", "North Face Nuptse") */
  model: string | null;
  /** Estimated era/decade */
  era: ClothingEra;
  /** Material composition if detectable */
  materials: string[];
  /** Color(s) detected */
  colors: string[];
  /** Size if visible */
  size: string | null;
  /** Condition assessment */
  condition: ClothingCondition;
  /** Condition details */
  conditionNotes: string[];
  /** Is it a vintage/collectible piece? */
  isVintage: boolean;
  /** Notable features (rare colorway, limited edition, etc.) */
  notableFeatures: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 PRICE ESTIMATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface PriceEstimation {
  /** Low estimate (quick sale) */
  lowPrice: number;
  /** Mid estimate (fair market) */
  midPrice: number;
  /** High estimate (patient sale, collector) */
  highPrice: number;
  /** Currency */
  currency: "EUR" | "USD" | "GBP";
  /** Confidence in estimate (0-1) */
  confidence: number;
  /** Factors affecting price */
  priceFactors: {
    factor: string;
    impact: "positive" | "negative" | "neutral";
    weight: number;
  }[];
  /** Recommended platforms for sale */
  recommendedPlatforms: {
    name: string;
    estimatedPrice: number;
    estimatedDays: number;
  }[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 MARKET ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

export type DemandLevel = "very_high" | "high" | "medium" | "low" | "very_low";

export interface MarketAnalysis {
  /** Current demand level */
  demandLevel: DemandLevel;
  /** Market trend */
  trend: "rising" | "stable" | "declining";
  /** Target demographics */
  targetAudience: string[];
  /** Similar items selling */
  marketComparison: string;
  /** Seasonality notes */
  seasonality: string | null;
  /** Rarity assessment (1-10) */
  rarityScore: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ✅ RECOMMENDATION
// ═══════════════════════════════════════════════════════════════════════════════

export type ActionRecommendation =
  | "strong_buy"
  | "buy"
  | "consider"
  | "pass"
  | "strong_pass";

export interface Recommendation {
  /** Action to take */
  action: ActionRecommendation;
  /** Confidence in recommendation (0-1) */
  confidence: number;
  /** Key reasons */
  reasons: string[];
  /** Suggested buy price if applicable */
  suggestedBuyPrice: number | null;
  /** Potential profit margin % */
  potentialMargin: number | null;
  /** Risk level (1-10) */
  riskLevel: number;
  /** Tips for selling */
  sellingTips: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 COMPLETE ANALYSIS RESULT
// ═══════════════════════════════════════════════════════════════════════════════

export interface AIAnalysisResult {
  /** Unique analysis ID */
  id: string;
  /** Timestamp */
  timestamp: Date;
  /** Source model */
  model: "gemini" | "gpt" | "claude";
  /** Model version */
  modelVersion: string;
  /** Analysis success */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Clothing identification */
  identification: ClothingIdentification;
  /** Price estimation */
  pricing: PriceEstimation;
  /** Market analysis */
  market: MarketAnalysis;
  /** Final recommendation */
  recommendation: Recommendation;
  /** Raw response for debugging */
  rawResponse?: string;
  /** Processing time in ms */
  processingTimeMs: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🗳️ MULTI-MODEL VOTING
// ═══════════════════════════════════════════════════════════════════════════════

export interface MultiModelVote {
  /** All individual results */
  results: AIAnalysisResult[];
  /** Consensus result (aggregated) */
  consensus: AIAnalysisResult | null;
  /** Agreement level between models (0-1) */
  agreementScore: number;
  /** Models that agreed on recommendation */
  agreeingModels: string[];
  /** Total processing time */
  totalProcessingTimeMs: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📱 UI STATE
// ═══════════════════════════════════════════════════════════════════════════════

export type ScannerState =
  | "idle"
  | "capturing"
  | "analyzing"
  | "success"
  | "error";

export interface ScannerUIState {
  state: ScannerState;
  progress: number;
  currentModel: string | null;
  error: string | null;
  result: AIAnalysisResult | null;
}
