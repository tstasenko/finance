import type { AppState, MonthKey, MonthlyState } from "./types";
import { monthKeyFromDate } from "./date";

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

export function ensureMonth(state: AppState, monthKey: MonthKey): AppState {
  if (state.months[monthKey]) return state;
  return {
    ...state,
    months: {
      ...state.months,
      [monthKey]: emptyMonth(monthKey),
    },
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

export const ids = { newId };

