/**
 * CSV « Excel France » : séparateur `;`, BOM UTF-8, fins de ligne CRLF, montants en décimales
 * avec virgule. Une seule fonction, pas de dépendance.
 */
export type CsvCell = string | number | boolean | null | undefined;

const quote = (v: CsvCell): string => {
  if (v === null || v === undefined) return "";
  const s = typeof v === "boolean" ? (v ? "oui" : "non") : String(v);
  // Neutralise les formules (=, +, -, @) qu'un tableur exécuterait à l'ouverture.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[";\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function toCsv(headers: readonly string[], rows: readonly (readonly CsvCell[])[]): string {
  const lines = [headers, ...rows].map((r) => r.map(quote).join(";"));
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

/** 2050 → « 20,50 » (deux décimales, virgule française). */
export const decimal = (minor: number): string => (minor / 100).toFixed(2).replace(".", ",");

export function csvResponse(filename: string, body: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
