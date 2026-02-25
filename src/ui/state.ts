import { useEffect, useMemo, useReducer } from "react";
import type {
  AppState,
  Category,
  Expense,
  IncomeAdjustment,
  MonthKey,
  SavingsCategory,
  SavingsTransaction,
} from "../core/types";
import { ensureMonth, ids, loadState, saveState } from "../core/storage";
import { loadUserState, saveUserState } from "../supabase/userState";
import { monthKeyFromDate, toISODate } from "../core/date";
import { roundMoney } from "../core/money";

type Action =
  | { type: "month/ensure"; monthKey: MonthKey }
  | { type: "month/setBudgetPlan"; monthKey: MonthKey; budgetPlan: number }
  | { type: "income/add"; monthKey: MonthKey; amount: number; comment?: string; date?: string }
  | { type: "income/delete"; monthKey: MonthKey; id: string }
  | { type: "category/add"; monthKey: MonthKey; name: string; planned: number }
  | { type: "category/update"; monthKey: MonthKey; id: string; name: string; planned: number }
  | { type: "category/delete"; monthKey: MonthKey; id: string }
  | { type: "expense/add"; monthKey: MonthKey; categoryId: string; amount: number; comment?: string; date?: string }
  | { type: "expense/delete"; monthKey: MonthKey; id: string }
  | { type: "savingsCategory/add"; name: string }
  | { type: "savingsCategory/delete"; id: string }
  | { type: "savings/txn"; txn: Omit<SavingsTransaction, "id" | "createdAt"> }
  | { type: "state/replace"; next: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "state/replace": {
      return action.next;
    }
    case "month/ensure": {
      return ensureMonth(state, action.monthKey);
    }
    case "month/setBudgetPlan": {
      const next = ensureMonth(state, action.monthKey);
      return {
        ...next,
        months: {
          ...next.months,
          [action.monthKey]: {
            ...next.months[action.monthKey],
            budgetPlan: roundMoney(action.budgetPlan),
          },
        },
      };
    }
    case "income/add": {
      const next = ensureMonth(state, action.monthKey);
      const now = Date.now();
      const income: IncomeAdjustment = {
        id: ids.newId(),
        date: (action.date ?? toISODate(new Date())) as any,
        amount: roundMoney(action.amount),
        comment: action.comment?.trim() || undefined,
        createdAt: now,
      };
      return {
        ...next,
        months: {
          ...next.months,
          [action.monthKey]: {
            ...next.months[action.monthKey],
            incomes: [income, ...next.months[action.monthKey].incomes],
          },
        },
      };
    }
    case "income/delete": {
      const m = state.months[action.monthKey];
      if (!m) return state;
      return {
        ...state,
        months: {
          ...state.months,
          [action.monthKey]: {
            ...m,
            incomes: m.incomes.filter((x) => x.id !== action.id),
          },
        },
      };
    }
    case "category/add": {
      const next = ensureMonth(state, action.monthKey);
      const now = Date.now();
      const category: Category = {
        id: ids.newId(),
        name: action.name.trim(),
        planned: roundMoney(action.planned),
        createdAt: now,
      };
      return {
        ...next,
        months: {
          ...next.months,
          [action.monthKey]: {
            ...next.months[action.monthKey],
            categories: [category, ...next.months[action.monthKey].categories],
          },
        },
      };
    }
    case "category/update": {
      const m = state.months[action.monthKey];
      if (!m) return state;
      return {
        ...state,
        months: {
          ...state.months,
          [action.monthKey]: {
            ...m,
            categories: m.categories.map((c) =>
              c.id === action.id
                ? { ...c, name: action.name.trim(), planned: roundMoney(action.planned) }
                : c,
            ),
          },
        },
      };
    }
    case "category/delete": {
      const m = state.months[action.monthKey];
      if (!m) return state;
      const hasExpenses = m.expenses.some((e) => e.categoryId === action.id);
      const categories = m.categories.filter((c) => c.id !== action.id);
      const expenses = hasExpenses ? m.expenses.filter((e) => e.categoryId !== action.id) : m.expenses;
      return {
        ...state,
        months: {
          ...state.months,
          [action.monthKey]: { ...m, categories, expenses },
        },
      };
    }
    case "expense/add": {
      const next = ensureMonth(state, action.monthKey);
      const now = Date.now();
      const exp: Expense = {
        id: ids.newId(),
        date: (action.date ?? toISODate(new Date())) as any,
        categoryId: action.categoryId,
        amount: roundMoney(action.amount),
        comment: action.comment?.trim() || undefined,
        createdAt: now,
      };
      return {
        ...next,
        months: {
          ...next.months,
          [action.monthKey]: {
            ...next.months[action.monthKey],
            expenses: [exp, ...next.months[action.monthKey].expenses],
          },
        },
      };
    }
    case "expense/delete": {
      const m = state.months[action.monthKey];
      if (!m) return state;
      return {
        ...state,
        months: {
          ...state.months,
          [action.monthKey]: {
            ...m,
            expenses: m.expenses.filter((x) => x.id !== action.id),
          },
        },
      };
    }
    case "savingsCategory/add": {
      const now = Date.now();
      const sc: SavingsCategory = { id: ids.newId(), name: action.name.trim(), balance: 0, createdAt: now };
      return {
        ...state,
        savings: {
          ...state.savings,
          categories: [sc, ...state.savings.categories],
        },
      };
    }
    case "savingsCategory/delete": {
      const categories = state.savings.categories.filter((c) => c.id !== action.id);
      const transactions = state.savings.transactions.filter((t) => t.savingsCategoryId !== action.id);
      return { ...state, savings: { categories, transactions } };
    }
    case "savings/txn": {
      const now = Date.now();
      const txn: SavingsTransaction = {
        ...action.txn,
        id: ids.newId(),
        createdAt: now,
      };
      const categories = state.savings.categories.map((c) => {
        if (c.id !== txn.savingsCategoryId) return c;
        const delta = txn.type === "deposit" ? txn.amount : -txn.amount;
        return { ...c, balance: roundMoney(c.balance + delta) };
      });
      return {
        ...state,
        savings: {
          categories,
          transactions: [txn, ...state.savings.transactions],
        },
      };
    }
    default:
      return state;
  }
}

export function useAppStore(userId?: string | null) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Load from Supabase when user logs in
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const remote = await loadUserState(userId);
      if (cancelled) return;
      dispatch({ type: "state/replace", next: remote });
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Save to Supabase (debounced) when state changes
  useEffect(() => {
    if (!userId) return;
    const timer = setTimeout(() => {
      void saveUserState(userId, state);
    }, 500);
    return () => clearTimeout(timer);
  }, [userId, state]);

  const currentMonthKey = useMemo(() => monthKeyFromDate(new Date()), []);

  return { state, dispatch, currentMonthKey };
}

