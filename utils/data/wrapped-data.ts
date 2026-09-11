/**
 * 🎁 RESELL WRAPPED — Monthly Performance Data
 *
 * Computes all metrics for the monthly Wrapped report.
 */

import type { Lot, Sale } from "@/db/repositories/api";

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface WrappedData {
  month: string; // "2026-02"
  monthLabel: string; // "February 2026"
  totalRevenue: number;
  totalProfit: number;
  itemsSold: number;
  bestDay: { date: string; revenue: number } | null;
  topItem: { brand: string; revenue: number; platform: string } | null;
  topPlatform: { name: string; count: number; revenue: number } | null;
  platformBreakdown: { platform: string; count: number; revenue: number }[];
  roiChange: number | null; // percentage change vs previous month
  previousMonthRevenue: number;
  hasData: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧮 COMPUTE WRAPPED DATA
// ═══════════════════════════════════════════════════════════════════════════════

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function computeMonthlyWrapped(
  _lots: Lot[],
  sales: Sale[],
  targetMonth?: Date,
): WrappedData {
  const target = targetMonth || getPreviousMonth();
  const year = target.getFullYear();
  const month = target.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthLabel = `${MONTH_NAMES[month]} ${year}`;

  // Filter sales for target month
  const monthSales = sales.filter((s) => {
    if (s.status === "CANCELLED") return false;
    const d = new Date(s.saleDate);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  // Filter sales for previous month (for comparison)
  const prevMonth = new Date(year, month - 1, 1);
  const prevSales = sales.filter((s) => {
    if (s.status === "CANCELLED") return false;
    const d = new Date(s.saleDate);
    return (
      d.getFullYear() === prevMonth.getFullYear() &&
      d.getMonth() === prevMonth.getMonth()
    );
  });

  if (monthSales.length === 0) {
    return {
      month: monthKey,
      monthLabel,
      totalRevenue: 0,
      totalProfit: 0,
      itemsSold: 0,
      bestDay: null,
      topItem: null,
      topPlatform: null,
      platformBreakdown: [],
      roiChange: null,
      previousMonthRevenue: 0,
      hasData: false,
    };
  }

  // Total revenue
  const totalRevenue = monthSales.reduce(
    (sum, s) => sum + (Number(s.priceNet) || 0),
    0,
  );

  // Previous month revenue
  const previousMonthRevenue = prevSales.reduce(
    (sum, s) => sum + (Number(s.priceNet) || 0),
    0,
  );

  // ROI change
  const roiChange =
    previousMonthRevenue > 0
      ? ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : null;

  // Best day
  const byDay = new Map<string, number>();
  for (const sale of monthSales) {
    const dateKey = sale.saleDate.split("T")[0];
    byDay.set(dateKey, (byDay.get(dateKey) || 0) + (Number(sale.priceNet) || 0));
  }
  let bestDay: { date: string; revenue: number } | null = null;
  for (const [date, revenue] of byDay) {
    if (!bestDay || revenue > bestDay.revenue) {
      bestDay = { date, revenue: Math.round(revenue * 100) / 100 };
    }
  }

  // Top item (by gross price)
  const topSale = monthSales.reduce<Sale | null>((best, s) => {
    if (!best || Number(s.priceGross) > Number(best.priceGross)) return s;
    return best;
  }, null);
  const topItem = topSale
    ? {
        brand: `Item #${topSale.itemId}`,
        revenue: Math.round((Number(topSale.priceNet) || 0) * 100) / 100,
        platform: topSale.platform || "Other",
      }
    : null;

  // Platform breakdown
  const byPlatform = new Map<string, { count: number; revenue: number }>();
  for (const sale of monthSales) {
    const p = sale.platform || "Other";
    const existing = byPlatform.get(p) || { count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += Number(sale.priceNet) || 0;
    byPlatform.set(p, existing);
  }
  const platformBreakdown = Array.from(byPlatform.entries())
    .map(([platform, data]) => ({
      platform,
      count: data.count,
      revenue: Math.round(data.revenue * 100) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const topPlatform = platformBreakdown[0]
    ? {
        name: platformBreakdown[0].platform,
        count: platformBreakdown[0].count,
        revenue: platformBreakdown[0].revenue,
      }
    : null;

  return {
    month: monthKey,
    monthLabel,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalProfit: Math.round(totalRevenue * 100) / 100, // Simplified
    itemsSold: monthSales.length,
    bestDay,
    topItem,
    topPlatform,
    platformBreakdown,
    roiChange: roiChange !== null ? Math.round(roiChange * 10) / 10 : null,
    previousMonthRevenue: Math.round(previousMonthRevenue * 100) / 100,
    hasData: true,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getPreviousMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
}

export function getCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function formatMonthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}
