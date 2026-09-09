import type { Appraisal } from "@chine/domain";
import type { AppraisalDto } from "../dto.js";
import { toIso, toMoneyDto, toMoneyDtoOrNull } from "./core.js";

export function toAppraisalDto(a: Appraisal): AppraisalDto {
  return {
    id: a.id,
    workspaceId: a.workspaceId,
    itemId: a.itemId ?? null,
    provider: a.provider,
    model: a.model,
    credits: a.credits,
    tokens: a.tokens ? { input: a.tokens.input, output: a.tokens.output } : null,
    createdAt: toIso(a.createdAt),
    identification: a.identification,
    price: {
      low: toMoneyDto(a.price.low),
      mid: toMoneyDto(a.price.mid),
      high: toMoneyDto(a.price.high),
      retailNew: toMoneyDtoOrNull(a.price.retailNew),
      confidence: a.price.confidence,
      perPlatform: a.price.perPlatform.map((p) => ({
        platform: p.platform,
        price: toMoneyDto(p.price),
        daysToSell: p.daysToSell,
      })),
    },
    market: a.market,
    advice: {
      action: a.advice.action,
      maxBuyPrice: toMoneyDtoOrNull(a.advice.maxBuyPrice),
      reasons: a.advice.reasons,
      risk: a.advice.risk,
      sellingTips: a.advice.sellingTips,
    },
    listingCopy: a.listingCopy,
    latencyMs: a.latencyMs,
  };
}
