/** Fixtures partagées des tests IA : requête type, sortie JSON valide, transport factice. */
import type { AppraisalOutput, FetchLike } from "../src/ai/core.js";
import type { AppraisalRequest } from "../src/ports.js";

export const request = (over: Partial<AppraisalRequest> = {}): AppraisalRequest => ({
  imageBase64: "AA==",
  mimeType: "image/jpeg",
  currency: "EUR",
  locale: "fr",
  ...over,
});

/** Sortie conforme au schéma, montants décimaux dans la devise de la requête. */
export const validOutput = (over: Partial<AppraisalOutput> = {}): AppraisalOutput => ({
  identification: {
    brand: "Lacoste",
    brandConfidence: 0.92,
    category: "TRACKSUIT",
    model: "Devanlay 90s",
    era: "1990s",
    materials: ["polyester"],
    colors: ["navy"],
    size: "L",
    condition: "VERY_GOOD",
    conditionNotes: ["Légères marques d'usage"],
    isVintage: true,
    notableFeatures: ["Crocodile brodé"],
  },
  price: {
    low: 35,
    mid: 45.5,
    high: 65,
    retailNew: 150,
    confidence: 0.8,
    perPlatform: [
      { platform: "VINTED", price: 49, daysToSell: 9 },
      { platform: "EBAY", price: 59, daysToSell: 21 },
    ],
  },
  market: {
    demand: "HIGH",
    trend: "RISING",
    rarity: 0.55,
    audience: ["Amateurs de sportswear vintage"],
    seasonality: "Septembre à mars",
  },
  advice: {
    action: "BUY",
    maxBuyPrice: 18,
    reasons: ["Marque recherchée"],
    risk: 0.25,
    sellingTips: ["Photographier le crocodile"],
  },
  listingCopy: {
    title: "Survêtement Lacoste vintage 90s",
    description: "Ensemble complet, très bon état.",
    hashtags: ["#lacoste", "vintage"],
  },
  ...over,
});

export interface RecordedCall {
  readonly url: string;
  readonly init: RequestInit;
  readonly body: Record<string, unknown>;
  readonly headers: Record<string, string>;
}

/** Transport factice : enregistre les appels et renvoie les réponses fournies dans l'ordre. */
export function fakeFetch(
  responses: ReadonlyArray<Response | ((call: RecordedCall) => Response | Promise<Response>)>,
): { fetch: FetchLike; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const queue = [...responses];
  const fetch: FetchLike = async (input, init = {}) => {
    const headers: Record<string, string> = {};
    new Headers(init.headers).forEach((v, k) => {
      headers[k] = v;
    });
    const call: RecordedCall = {
      url: String(input),
      init,
      body: typeof init.body === "string" ? JSON.parse(init.body) : {},
      headers,
    };
    calls.push(call);
    const next = queue.shift();
    if (!next) throw new Error("fakeFetch : aucune réponse prévue");
    return typeof next === "function" ? next(call) : next;
  };
  return { fetch, calls };
}

export const jsonResponse = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

/** Transport qui ne répond jamais, sauf pour rejeter quand le signal est annulé. */
export const hangingFetch: FetchLike = (_input, init) =>
  new Promise((_, reject) => {
    const signal = init?.signal;
    if (!signal) return;
    const abort = () => reject(new DOMException("The operation was aborted.", "AbortError"));
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  });
