/**
 * 🧪 CSV EXPORT TESTS
 *
 * Tests pour les utilitaires d'export CSV
 * - escapeCSV: échappement RFC 4180
 * - csvRow: construction de lignes
 * - formatDate: formatage des dates
 *
 * Note: exportDataToCSV n'est pas testé ici (dépendances natives: expo-file-system, expo-sharing)
 * On teste uniquement les fonctions pures internes via leur comportement indirect.
 */

// Les fonctions internes (escapeCSV, csvRow, formatDate) ne sont pas exportées.
// On les teste via un module de test dédié qui reproduit la logique.

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 REIMPLEMENTATION DES FONCTIONS PURES POUR TEST
// (identiques à celles dans export.ts — on vérifie la logique RFC 4180)
// ═══════════════════════════════════════════════════════════════════════════════

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(values: unknown[]): string {
  return values.map(escapeCSV).join(",");
}

function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    return d.toISOString().split("T")[0];
  } catch {
    return isoDate;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧪 TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("escapeCSV (RFC 4180)", () => {
  it("retourne un string simple inchangé", () => {
    expect(escapeCSV("hello")).toBe("hello");
  });

  it("échappe les virgules avec des guillemets", () => {
    expect(escapeCSV("hello, world")).toBe('"hello, world"');
  });

  it("échappe les guillemets doubles", () => {
    expect(escapeCSV('say "hi"')).toBe('"say ""hi"""');
  });

  it("échappe les retours à la ligne", () => {
    expect(escapeCSV("line1\nline2")).toBe('"line1\nline2"');
  });

  it("gère null → string vide", () => {
    expect(escapeCSV(null)).toBe("");
  });

  it("gère undefined → string vide", () => {
    expect(escapeCSV(undefined)).toBe("");
  });

  it("convertit les nombres en string", () => {
    expect(escapeCSV(42)).toBe("42");
    expect(escapeCSV(3.14)).toBe("3.14");
  });

  it("convertit les booléens en string", () => {
    expect(escapeCSV(true)).toBe("true");
    expect(escapeCSV(false)).toBe("false");
  });

  it("gère un string vide", () => {
    expect(escapeCSV("")).toBe("");
  });

  it("ne suréchappe pas un string sans caractères spéciaux", () => {
    expect(escapeCSV("Levi's 501")).toBe("Levi's 501");
  });

  it("gère la combinaison virgule + guillemets", () => {
    expect(escapeCSV('"Grand, Luxe"')).toBe('"""Grand, Luxe"""');
  });
});

describe("csvRow", () => {
  it("joint les valeurs par des virgules", () => {
    expect(csvRow([1, "test", "value"])).toBe("1,test,value");
  });

  it("échappe les valeurs qui contiennent des virgules", () => {
    expect(csvRow(["a", "b, c", "d"])).toBe('a,"b, c",d');
  });

  it("gère un tableau vide", () => {
    expect(csvRow([])).toBe("");
  });

  it("gère les null dans le tableau", () => {
    expect(csvRow([1, null, "test"])).toBe("1,,test");
  });

  it("reproduit une ligne de données réelle", () => {
    const row = csvRow([
      1,
      "Lot Eureka",
      "eureka",
      "2025-01-15",
      "BULK",
      "150.00",
      "10.00",
      20,
      "EUR",
      "2025-01-15",
    ]);

    expect(row).toBe(
      "1,Lot Eureka,eureka,2025-01-15,BULK,150.00,10.00,20,EUR,2025-01-15",
    );
  });

  it("échappe un nom de fournisseur avec virgule", () => {
    const row = csvRow([1, "Lot Paris, France"]);
    expect(row).toBe('1,"Lot Paris, France"');
  });
});

describe("formatDate", () => {
  it("formate une date ISO en YYYY-MM-DD", () => {
    expect(formatDate("2025-01-15T10:00:00Z")).toBe("2025-01-15");
  });

  it("retourne string vide pour null", () => {
    expect(formatDate(null)).toBe("");
  });

  it("retourne string vide pour undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("retourne string vide pour chaîne vide", () => {
    expect(formatDate("")).toBe("");
  });

  it("gère une date sans time", () => {
    expect(formatDate("2025-06-30")).toBe("2025-06-30");
  });

  it("gère une date avec timezone", () => {
    const result = formatDate("2025-03-15T23:59:59+02:00");
    expect(result).toMatch(/2025-03-1[5-6]/); // Peut être le 15 ou 16 selon la timezone
  });
});
