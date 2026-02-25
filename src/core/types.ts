export type ID = string;

export type MonthKey = `${number}-${"01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "11" | "12"}`;

export type ISODate = `${number}-${string}-${string}`;

export type Money = number;

export type Category = {
  id: ID;
  name: string;
  planned: Money;
  createdAt: number;
};

export type Expense = {
  id: ID;
  date: ISODate;
  categoryId: ID;
  amount: Money;
  comment?: string;
  createdAt: number;
};

export type IncomeAdjustment = {
  id: ID;
  date: ISODate;
  amount: Money;
  comment?: string;
  createdAt: number;
};

export type SavingsCategory = {
  id: ID;
  name: string;
  balance: Money;
  createdAt: number;
};

export type SavingsTxnType = "deposit" | "withdraw";

export type SavingsTransaction = {
  id: ID;
  type: SavingsTxnType;
  date: ISODate;
  savingsCategoryId: ID;
  amount: Money;
  comment?: string;
  monthKey: MonthKey;
  createdAt: number;
};

export type MonthlyState = {
  monthKey: MonthKey;
  budgetPlan: Money;
  categories: Category[];
  incomes: IncomeAdjustment[];
  expenses: Expense[];
};

export type AppState = {
  schemaVersion: 1;
  months: Record<MonthKey, MonthlyState>;
  savings: {
    categories: SavingsCategory[];
    transactions: SavingsTransaction[];
  };
};

