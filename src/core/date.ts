import type { MonthKey } from "./types";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` as const;
}

export function monthKeyFromDate(d: Date): MonthKey {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}` as MonthKey;
}

export function shiftMonth(monthKey: MonthKey, delta: number): MonthKey {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  d.setMonth(d.getMonth() + delta);
  return monthKeyFromDate(d);
}

export function formatMonthTitle(monthKey: MonthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  const fmt = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });
  const s = fmt.format(d);
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}

