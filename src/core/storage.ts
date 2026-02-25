import type { AppState, Category, MonthKey, MonthlyState } from "./types";
import { monthKeyFromDate, shiftMonth } from "./date";

const STORAGE_KEY = "expense-tracker:v1";

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyMonth(monthKey: MonthKey): MonthlyState {
  return {
    monthKey,
    budgetPlan: 0,
    categories: [],
    incomes: [],
    expenses: [],
  };
}

function copyCategoriesWithNewIds(categories: Category[]): Category[] {
  return categories.map((c) => ({
    ...c,
    id: newId(),
    createdAt: Date.now(),
  }));
}

export function ensureMonth(state: AppState, monthKey: MonthKey): AppState {
  const current = state.months[monthKey];
  const prevKey = shiftMonth(monthKey, -1);
  const prev = state.months[prevKey];

  if (current && current.categories.length > 0) {
    return state;
  }
  if (current && current.categories.length === 0 && prev && prev.categories.length > 0) {
    const newMonth: MonthlyState = {
      ...current,
      budgetPlan: prev.budgetPlan,
      categories: copyCategoriesWithNewIds(prev.categories),
      incomes: [],
      expenses: [],
    };
    return {
      ...state,
      months: { ...state.months, [monthKey]: newMonth },
    };
  }
  if (current) return state;

  const newMonth: MonthlyState = prev
    ? {
        monthKey,
        budgetPlan: prev.budgetPlan,
        categories: copyCategoriesWithNewIds(prev.categories),
        incomes: [],
        expenses: [],
      }
    : emptyMonth(monthKey);
  return {
    ...state,
    months: { ...state.months, [monthKey]: newMonth },
  };
}

export function createInitialState(): AppState {
  const current = monthKeyFromDate(new Date());
  return {
    schemaVersion: 1,
    months: {
      [current]: emptyMonth(current),
    },
    savings: {
      categories: [],
      transactions: [],
    },
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed as any).schemaVersion === 1 &&
      typeof (parsed as any).months === "object" &&
      (parsed as any).months !== null &&
      typeof (parsed as any).savings === "object" &&
      (parsed as any).savings !== null
    ) {
      return parsed as AppState;
    }
    return createInitialState();
  } catch {
    return createInitialState();
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** True if state has no meaningful data (like createInitialState with no user input). */
export function isStateEmpty(state: AppState): boolean {
  const monthKeys = Object.keys(state.months);
  if (monthKeys.length === 0) return true;
  const hasDataInMonths = monthKeys.some((k) => {
    const m = state.months[k as MonthKey];
    return (
      m &&
      (m.budgetPlan > 0 || m.categories.length > 0 || m.incomes.length > 0 || m.expenses.length > 0)
    );
  });
  if (hasDataInMonths) return false;
  if (state.savings.categories.length > 0 || state.savings.transactions.length > 0) return false;
  return true;
}

export const ids = { newId };

