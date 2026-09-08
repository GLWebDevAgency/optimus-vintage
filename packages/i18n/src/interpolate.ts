/**
 * Interpolation ICU-lite, sans dépendance :
 *  - `{name}` → valeur formatée selon la locale (nombres, dates) ;
 *  - `{count, plural, =0{…} one{…} other{…}}` avec `#` = nombre formaté ;
 *  - `{kind, select, LOT{…} other{…}}` ;
 *  - `{n, number}` / `{d, date}`.
 * Les branches peuvent contenir d'autres expressions.
 */
import type { Params } from "./types.js";

const pluralRules = new Map<string, Intl.PluralRules>();
const numberFormats = new Map<string, Intl.NumberFormat>();

const rulesFor = (locale: string): Intl.PluralRules => {
  let r = pluralRules.get(locale);
  if (!r) {
    r = new Intl.PluralRules(locale);
    pluralRules.set(locale, r);
  }
  return r;
};
const numberFor = (locale: string): Intl.NumberFormat => {
  let f = numberFormats.get(locale);
  if (!f) {
    f = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    numberFormats.set(locale, f);
  }
  return f;
};

/** Index de l'accolade fermante correspondant à celle ouverte en `open`, ou -1. */
function matchBrace(s: string, open: number): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** `=0{…} one{…} other{…}` → { "=0": "…", one: "…", other: "…" } */
function parseBranches(s: string): Map<string, string> {
  const out = new Map<string, string>();
  let i = 0;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i] ?? "")) i++;
    const open = s.indexOf("{", i);
    if (open === -1) break;
    const key = s.slice(i, open).trim();
    const close = matchBrace(s, open);
    if (close === -1) break;
    out.set(key, s.slice(open + 1, close));
    i = close + 1;
  }
  return out;
}

function formatValue(value: unknown, locale: string): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return numberFor(locale).format(value);
  if (value instanceof Date)
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(value);
  return String(value);
}

function resolve(expr: string, params: Params, locale: string): string {
  const firstComma = expr.indexOf(",");
  if (firstComma === -1) {
    const name = expr.trim();
    return name in params ? formatValue(params[name], locale) : `{${name}}`;
  }
  const name = expr.slice(0, firstComma).trim();
  const rest = expr.slice(firstComma + 1);
  const secondComma = rest.indexOf(",");
  const type = (secondComma === -1 ? rest : rest.slice(0, secondComma)).trim();
  const options = secondComma === -1 ? "" : rest.slice(secondComma + 1);
  const value = params[name];

  switch (type) {
    case "plural": {
      const n = typeof value === "number" ? value : Number(value ?? 0);
      const branches = parseBranches(options);
      const chosen =
        branches.get(`=${n}`) ??
        branches.get(rulesFor(locale).select(n)) ??
        branches.get("other") ??
        "";
      return interpolate(chosen.replace(/#/g, numberFor(locale).format(n)), params, locale);
    }
    case "select": {
      const branches = parseBranches(options);
      const chosen = branches.get(String(value)) ?? branches.get("other") ?? "";
      return interpolate(chosen, params, locale);
    }
    case "number":
      return formatValue(typeof value === "number" ? value : Number(value ?? 0), locale);
    case "date":
      return formatValue(value instanceof Date ? value : new Date(String(value)), locale);
    default:
      return formatValue(value, locale);
  }
}

export function interpolate(template: string, params: Params | undefined, locale: string): string {
  if (!params || !template.includes("{")) return template;
  let out = "";
  let i = 0;
  while (i < template.length) {
    const open = template.indexOf("{", i);
    if (open === -1) {
      out += template.slice(i);
      break;
    }
    out += template.slice(i, open);
    const close = matchBrace(template, open);
    if (close === -1) {
      out += template.slice(open);
      break;
    }
    out += resolve(template.slice(open + 1, close), params, locale);
    i = close + 1;
  }
  return out;
}
