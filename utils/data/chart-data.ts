/**
 * 📊 CHART DATA TRANSFORMATIONS
 *
 * Transforms raw sales/lots data into chart-ready formats
 * for Victory Native components.
 */

import type { Sale } from "@/db/repositories/api";

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RevenueDataPoint {
  date: string; // ISO date string
  label: string; // Display label (e.g., "Jan 15")
  revenue: number;
  profit: number;
}

export interface MonthlyBarData {
  month: string; // "Jan", "Feb", etc.
  monthKey: string; // "2026-01"
  revenue: number;
}

export interface PlatformData {
  platform: string;
  label: string;
  count: number;
  revenue: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📈 REVENUE OVER TIME (Line Chart)
// ═══════════════════════════════════════════════════════════════════════════════

export function groupSalesByDate(
  sales: Sale[],
  daysBack: number | null,
): RevenueDataPoint[] {
  const now = new Date();
  const cutoff = daysBack
    ? new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
    : null;

  const filtered = sales.filter((s) => {
    if (s.status === "CANCELLED") return false;
    if (!cutoff) return true;
    return new Date(s.saleDate) >= cutoff;
  });

  // Group by date
  const byDate = new Map<string, { revenue: number; cost: number }>();

  for (const sale of filtered) {
    const dateKey = sale.saleDate.split("T")[0];
    const existing = byDate.get(dateKey) || { revenue: 0, cost: 0 };
    existing.revenue += Number(sale.priceNet) || 0;
    byDate.set(dateKey, existing);
  }

  // Sort by date and format
  const sorted = Array.from(byDate.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  // Cumulative tracking for profit calculation
  return sorted.map(([dateStr, data]) => {
    const d = new Date(dateStr);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    return {
      date: dateStr,
      label,
      revenue: Math.round(data.revenue * 100) / 100,
      profit: Math.round(data.revenue * 100) / 100, // Simplified — real profit would need cost data
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 MONTHLY BAR CHART
// ═══════════════════════════════════════════════════════════════════════════════

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function groupSalesByMonth(
  sales: Sale[],
  monthsBack = 6,
): MonthlyBarData[] {
  const now = new Date();
  const result: MonthlyBarData[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    result.push({
      month: MONTH_LABELS[d.getMonth()],
      monthKey,
      revenue: 0,
    });
  }

  for (const sale of sales) {
    if (sale.status === "CANCELLED") continue;
    const d = new Date(sale.saleDate);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = result.find((r) => r.monthKey === monthKey);
    if (entry) {
      entry.revenue += Number(sale.priceNet) || 0;
    }
  }

  return result.map((r) => ({
    ...r,
    revenue: Math.round(r.revenue * 100) / 100,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🍩 PLATFORM DISTRIBUTION (Pie Chart)
// ═══════════════════════════════════════════════════════════════════════════════

export function groupSalesByPlatform(sales: Sale[]): PlatformData[] {
  const byPlatform = new Map<string, { count: number; revenue: number }>();

  for (const sale of sales) {
    if (sale.status === "CANCELLED") continue;
    const platform = sale.platform || "Other";
    const existing = byPlatform.get(platform) || { count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += Number(sale.priceNet) || 0;
    byPlatform.set(platform, existing);
  }

  return Array.from(byPlatform.entries())
    .map(([platform, data]) => ({
      platform,
      label: platform,
      count: data.count,
      revenue: Math.round(data.revenue * 100) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 PERIOD TO DAYS MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

export function periodToDays(
  period: "7d" | "30d" | "3m" | "1y" | "all",
): number | null {
  switch (period) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "3m":
      return 90;
    case "1y":
      return 365;
    case "all":
      return null;
  }
}
