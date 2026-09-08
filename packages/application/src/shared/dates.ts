import { type IsoDate, toIsoDate } from "@chine/domain";

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
export function addDays(d: Date, days: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + days);
  return c;
}
/** Date locale à minuit depuis une date calendaire ISO. */
export function fromIsoDate(iso: IsoDate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}
export function shiftIsoDate(iso: IsoDate, days: number): IsoDate {
  return toIsoDate(addDays(fromIsoDate(iso), days));
}
export function daysInclusive(from: IsoDate, to: IsoDate): number {
  return Math.round((fromIsoDate(to).getTime() - fromIsoDate(from).getTime()) / 86_400_000) + 1;
}
export function isCalendarMonth(from: IsoDate, to: IsoDate): boolean {
  const f = fromIsoDate(from);
  return f.getDate() === 1 && toIsoDate(endOfMonth(f)) === to;
}
/** Période précédente de même longueur (ou le mois civil précédent si la période est un mois civil). */
export function previousPeriod(from: IsoDate, to: IsoDate): { from: IsoDate; to: IsoDate } {
  if (isCalendarMonth(from, to)) {
    const prev = addDays(fromIsoDate(from), -1);
    return { from: toIsoDate(startOfMonth(prev)), to: toIsoDate(endOfMonth(prev)) };
  }
  const len = daysInclusive(from, to);
  const prevTo = shiftIsoDate(from, -1);
  return { from: shiftIsoDate(prevTo, -(len - 1)), to: prevTo };
}
