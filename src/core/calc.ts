import type { AppState, MonthKey } from "./types";

export function sum(n: number[]) {
  return n.reduce((a, b) => a + b, 0);
}

export function monthIncomeTotal(state: AppState, monthKey: MonthKey) {
  const m = state.months[monthKey];
  if (!m) return 0;
  return sum(m.incomes.map((x) => x.amount));
}

export function monthExpenseTotal(state: AppState, monthKey: MonthKey) {
  const m = state.months[monthKey];
  if (!m) return 0;
  return sum(m.expenses.map((x) => x.amount));
}

export function monthSavingsNet(state: AppState, monthKey: MonthKey) {
  const txns = state.savings.transactions.filter((t) => t.monthKey === monthKey);
  // deposit: money leaves month; withdraw: money returns to month
  return sum(
    txns.map((t) => (t.type === "deposit" ? -t.amount : t.amount)),
  );
}

export function monthBalance(state: AppState, monthKey: MonthKey) {
  const m = state.months[monthKey];
  if (!m) return 0;
  return m.budgetPlan + monthIncomeTotal(state, monthKey) - monthExpenseTotal(state, monthKey) + monthSavingsNet(state, monthKey);
}

export function totalSavingsBalance(state: AppState) {
  return sum(state.savings.categories.map((c) => c.balance));
}

export function categorySpent(state: AppState, monthKey: MonthKey, categoryId: string) {
  const m = state.months[monthKey];
  if (!m) return 0;
  return sum(m.expenses.filter((e) => e.categoryId === categoryId).map((e) => e.amount));
}

