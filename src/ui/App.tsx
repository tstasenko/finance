import { useEffect, useMemo, useState } from "react";
import type { MonthKey } from "../core/types";
import { formatMonthTitle, shiftMonth, toISODate } from "../core/date";
import { formatMoney, parseMoney } from "../core/money";
import { categorySpent, monthBalance, monthExpenseTotal, monthIncomeTotal, totalSavingsBalance } from "../core/calc";
import { useAppStore } from "./state";
import { supabase } from "../supabase/client";
import type { Session } from "@supabase/supabase-js";
import { AuthGate } from "./Auth";
import { Backup } from "./Backup";

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="cardHeader">
      <h2>{title}</h2>
      {hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setAuthReady(true);
    })();
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;
  const { state, dispatch, currentMonthKey } = useAppStore(userId);
  const [monthKey, setMonthKey] = useState<MonthKey>(currentMonthKey);

  const month = state.months[monthKey];
  if (!month) {
    dispatch({ type: "month/ensure", monthKey });
  }

  const m = state.months[monthKey]!;
  const incomeTotal = useMemo(() => monthIncomeTotal(state, monthKey), [state, monthKey]);
  const expenseTotal = useMemo(() => monthExpenseTotal(state, monthKey), [state, monthKey]);
  const balance = useMemo(() => monthBalance(state, monthKey), [state, monthKey]);
  const savingsTotal = useMemo(() => totalSavingsBalance(state), [state]);
  const balanceWithSavings = useMemo(() => balance + savingsTotal, [balance, savingsTotal]);

  const [budgetInput, setBudgetInput] = useState(String(m.budgetPlan || ""));
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeComment, setIncomeComment] = useState("");

  const [catName, setCatName] = useState("");
  const [catPlanned, setCatPlanned] = useState("");

  const [expCategoryId, setExpCategoryId] = useState(m.categories[0]?.id ?? "");
  const [expAmount, setExpAmount] = useState("");
  const [expComment, setExpComment] = useState("");
  const [expDate, setExpDate] = useState(toISODate(new Date()));

  const [savingsCatName, setSavingsCatName] = useState("");
  const [savingsTxnCategoryId, setSavingsTxnCategoryId] = useState(state.savings.categories[0]?.id ?? "");
  const [savingsTxnType, setSavingsTxnType] = useState<"deposit" | "withdraw">("deposit");
  const [savingsTxnAmount, setSavingsTxnAmount] = useState("");
  const [savingsTxnComment, setSavingsTxnComment] = useState("");

  useEffect(() => {
    const ids = state.savings.categories.map((c) => c.id);
    if (ids.length && (!savingsTxnCategoryId || !ids.includes(savingsTxnCategoryId))) {
      setSavingsTxnCategoryId(ids[0]);
    }
  }, [state.savings.categories, savingsTxnCategoryId]);

  const monthTitle = formatMonthTitle(monthKey);

  if (!authReady) {
    return (
      <div className="container">
        <div className="card" style={{ margin: "80px auto", maxWidth: 360, textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 18 }}>Загрузка…</div>
          <div className="hint" style={{ marginTop: 8 }}>Проверка входа в аккаунт</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthGate session={session} onSessionChange={setSession} />;
  }

  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          <strong>Трекер личных финансов</strong>
          <span>Данные хранятся в Supabase под вашим аккаунтом</span>
        </div>
        <div className="monthNav">
          <button
            className="btn"
            onClick={() => {
              const next = shiftMonth(monthKey, -1);
              dispatch({ type: "month/ensure", monthKey: next });
              setMonthKey(next);
            }}
          >
            ←
          </button>
          <div style={{ minWidth: 220, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>Месяц</div>
            <div style={{ fontSize: 16 }}>{monthTitle}</div>
          </div>
          <button
            className="btn"
            onClick={() => {
              const next = shiftMonth(monthKey, +1);
              dispatch({ type: "month/ensure", monthKey: next });
              setMonthKey(next);
            }}
          >
            →
          </button>
          <button
            className="btn btnPrimary"
            onClick={() => {
              dispatch({ type: "month/ensure", monthKey: currentMonthKey });
              setMonthKey(currentMonthKey);
            }}
            disabled={monthKey === currentMonthKey}
          >
            Текущий
          </button>
          <Backup state={state} onReplace={(next) => dispatch({ type: "state/replace", next })} />
          <button
            type="button"
            className="btnIcon"
            onClick={() => void supabase.auth.signOut()}
            title="Выйти"
          >
            <svg viewBox="0 0 24 24" aria-hidden><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
          </button>
        </div>
      </div>

      <main className="main-content">
      <div className="grid2">
        <div className="card">
          <SectionTitle title="Бюджет месяца" hint="Прогноз + добавления денег в течение месяца" />

          <div className="row">
            <div className="field" style={{ maxWidth: 260 }}>
              <label>Прогноз бюджета на месяц</label>
              <input
                className="input"
                value={budgetInput}
                inputMode="decimal"
                placeholder="например 60000"
                onChange={(e) => setBudgetInput(e.target.value)}
                onBlur={() => {
                  const n = parseMoney(budgetInput);
                  if (n === null) return;
                  dispatch({ type: "month/setBudgetPlan", monthKey, budgetPlan: n });
                }}
              />
              <div className="hint">Сохраняется при потере фокуса</div>
            </div>

            <div className="kpi" style={{ flex: 2 }}>
              <div className="kpiItem">
                <div className="label">Добавлено денег</div>
                <div className="value">{formatMoney(incomeTotal)}</div>
              </div>
              <div className="kpiItem">
                <div className="label">Потрачено</div>
                <div className="value">{formatMoney(expenseTotal)}</div>
              </div>
              <div className="kpiItem">
                <div className="label">Прогноз</div>
                <div className="value">{formatMoney(m.budgetPlan)}</div>
              </div>
              <div className="kpiItem">
                <div className="label">Остаток без накоплений</div>
                <div className={`value ${balance < 0 ? "neg" : ""}`}>{formatMoney(balance)}</div>
              </div>
              <div className="kpiItem">
                <div className="label">Всего с накоплениями</div>
                <div className={`value ${balanceWithSavings < 0 ? "neg" : ""}`}>{formatMoney(balanceWithSavings)}</div>
              </div>
            </div>
          </div>

          <div style={{ height: 10 }} />

          <div className="row">
            <div className="field">
              <label>Добавить деньги</label>
              <input
                className="input"
                value={incomeAmount}
                inputMode="decimal"
                placeholder="сумма"
                onChange={(e) => setIncomeAmount(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Комментарий</label>
              <input
                className="input"
                value={incomeComment}
                placeholder="например: зарплата, возврат"
                onChange={(e) => setIncomeComment(e.target.value)}
              />
            </div>
            <div className="row-btns">
              <button
                className="btn btnPrimary"
                onClick={() => {
                  const n = parseMoney(incomeAmount);
                  if (n === null || n <= 0) return;
                  dispatch({ type: "income/add", monthKey, amount: n, comment: incomeComment });
                  setIncomeAmount("");
                  setIncomeComment("");
                }}
              >
                Добавить
              </button>
            </div>
          </div>

          {m.incomes.length ? (
            <div className="list">
              {m.incomes.slice(0, 8).map((x) => (
                <div className="listItem" key={x.id}>
                  <div>
                    <strong>{formatMoney(x.amount)}</strong>
                    <div className="meta">
                      {x.date}
                      {x.comment ? ` • ${x.comment}` : ""}
                    </div>
                  </div>
                  <button className="btn btnDanger" onClick={() => dispatch({ type: "income/delete", monthKey, id: x.id })}>
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="hint">Пока нет добавлений денег.</div>
          )}
        </div>

        <div className="card">
          <SectionTitle title="Долгосрочные накопления" hint="Категории не зависят от месяца" />

          <div className="row">
            <div className="field">
              <label>Новая категория накоплений</label>
              <input className="input" value={savingsCatName} placeholder="например: отпуск" onChange={(e) => setSavingsCatName(e.target.value)} />
            </div>
            <div className="row-btns">
              <button
                className="btn btnPrimary"
                onClick={() => {
                  const name = savingsCatName.trim();
                  if (!name) return;
                  dispatch({ type: "savingsCategory/add", name });
                  setSavingsCatName("");
                }}
              >
                Добавить
              </button>
            </div>
          </div>

          <div style={{ height: 10 }} />

          <div className="row">
            <div className="field">
              <label>Категория</label>
              <select
                className="select"
                value={savingsTxnCategoryId}
                onChange={(e) => setSavingsTxnCategoryId(e.target.value)}
                disabled={!state.savings.categories.length}
              >
                {state.savings.categories.length ? null : <option value="">Сначала добавьте категорию</option>}
                {state.savings.categories.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ maxWidth: 220 }}>
              <label>Операция</label>
              <select className="select" value={savingsTxnType} onChange={(e) => setSavingsTxnType(e.target.value as any)}>
                <option value="deposit">Пополнить (списать с бюджета)</option>
                <option value="withdraw">Забрать (вернуть в бюджет)</option>
              </select>
            </div>
            <div className="field">
              <label>Сумма</label>
              <input className="input" value={savingsTxnAmount} inputMode="decimal" placeholder="например 5000" onChange={(e) => setSavingsTxnAmount(e.target.value)} />
            </div>
            <div className="field">
              <label>Комментарий</label>
              <input className="input" value={savingsTxnComment} placeholder="например: на ремонт" onChange={(e) => setSavingsTxnComment(e.target.value)} />
            </div>
            <div className="row-btns">
              <button
                className="btn btnPrimary"
                disabled={!state.savings.categories.length}
                onClick={() => {
                  const n = parseMoney(savingsTxnAmount);
                  if (!savingsTxnCategoryId) return;
                  if (n === null || n <= 0) return;
                  dispatch({
                    type: "savings/txn",
                    txn: {
                      type: savingsTxnType,
                      date: toISODate(new Date()),
                      monthKey,
                      savingsCategoryId: savingsTxnCategoryId,
                      amount: n,
                      comment: savingsTxnComment.trim() || undefined,
                    },
                  });
                  setSavingsTxnAmount("");
                  setSavingsTxnComment("");
                }}
              >
                Провести
              </button>
            </div>
          </div>

          <div className="list">
            {state.savings.categories.map((c) => (
              <div className="listItem" key={c.id}>
                <div>
                  <strong>{c.name}</strong> <span className="pill">Баланс: {formatMoney(c.balance)}</span>
                </div>
                <button className="btn btnDanger" onClick={() => dispatch({ type: "savingsCategory/delete", id: c.id })}>
                  Удалить
                </button>
              </div>
            ))}
            {!state.savings.categories.length ? <div className="hint">Пока нет категорий накоплений.</div> : null}
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <SectionTitle title="Категории и расходы" hint="План по категории + списание расходов" />

          <div className="row">
            <div className="field">
              <label>Новая категория</label>
              <input className="input" value={catName} placeholder="например: продукты" onChange={(e) => setCatName(e.target.value)} />
            </div>
            <div className="field">
              <label>План (прогноз расходов)</label>
              <input
                className="input"
                value={catPlanned}
                inputMode="decimal"
                placeholder="например 15000"
                onChange={(e) => setCatPlanned(e.target.value)}
              />
            </div>
            <div className="row-btns">
              <button
                className="btn btnPrimary"
                onClick={() => {
                  const name = catName.trim();
                  const planned = parseMoney(catPlanned) ?? 0;
                  if (!name) return;
                  dispatch({ type: "category/add", monthKey, name, planned });
                  setCatName("");
                  setCatPlanned("");
                  const maybe = state.months[monthKey]?.categories[0]?.id;
                  if (maybe) setExpCategoryId(maybe);
                }}
              >
                Добавить
              </button>
            </div>
          </div>

          <div style={{ height: 10 }} />

          <div className="row">
            <div className="field">
              <label>Категория</label>
              <select
                className="select"
                value={expCategoryId}
                onChange={(e) => setExpCategoryId(e.target.value)}
                disabled={!m.categories.length}
              >
                {m.categories.length ? null : <option value="">Сначала добавьте категорию</option>}
                {m.categories.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Сумма расхода</label>
              <input className="input" value={expAmount} inputMode="decimal" placeholder="например 799" onChange={(e) => setExpAmount(e.target.value)} />
            </div>
            <div className="field">
              <label>Дата</label>
              <input className="input" type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Комментарий</label>
              <input className="input" value={expComment} placeholder="необязательно" onChange={(e) => setExpComment(e.target.value)} />
            </div>
            <div className="row-btns">
              <button
                className="btn btnPrimary"
                disabled={!m.categories.length}
                onClick={() => {
                  const n = parseMoney(expAmount);
                  if (!expCategoryId) return;
                  if (n === null || n <= 0) return;
                  dispatch({ type: "expense/add", monthKey, categoryId: expCategoryId, amount: n, comment: expComment, date: expDate });
                  setExpAmount("");
                  setExpComment("");
                }}
              >
                Списать
              </button>
            </div>
          </div>

          <div className="list">
            {m.categories.map((c) => {
              const spent = categorySpent(state, monthKey, c.id);
              const remaining = c.planned - spent;
              const isOver = remaining < 0;
              return (
                <div className="listItem" key={c.id}>
                  <div>
                    <strong>{c.name}</strong>{" "}
                    <span className={`pill ${isOver ? "pillDanger" : ""}`}>
                      Остаток: {formatMoney(remaining)}
                    </span>
                  <div className="meta metaSmall">
                    План: <strong>{formatMoney(c.planned)}</strong> • Потрачено: <strong>{formatMoney(spent)}</strong>
                  </div>
                  </div>
                  <button className="btn btnDanger" onClick={() => dispatch({ type: "category/delete", monthKey, id: c.id })}>
                    Удалить
                  </button>
                </div>
              );
            })}
            {!m.categories.length ? <div className="hint">Пока нет категорий.</div> : null}
          </div>
        </div>

        <div className="card">
          <SectionTitle title="История операций (месяц)" hint="Доходы / расходы / накопления" />

          <div className="list">
            {(() => {
              const items: { date: string; createdAt: number; key: string; el: React.ReactNode }[] = [];
              m.incomes.forEach((x) =>
                items.push({
                  date: x.date,
                  createdAt: x.createdAt,
                  key: `i:${x.id}`,
                  el: (
                    <div className="listItem" key={`i:${x.id}`}>
                      <div>
                        <strong className="pos">+ {formatMoney(x.amount)}</strong>
                        <div className="meta">{x.date}{x.comment ? ` • ${x.comment}` : ""}</div>
                      </div>
                      <span className="pill">Доход</span>
                    </div>
                  ),
                })
              );
              m.expenses.forEach((x) => {
                const cat = m.categories.find((c) => c.id === x.categoryId);
                items.push({
                  date: x.date,
                  createdAt: x.createdAt,
                  key: `e:${x.id}`,
                  el: (
                    <div className="listItem" key={`e:${x.id}`}>
                      <div>
                        <strong className="neg">- {formatMoney(x.amount)}</strong>
                        <div className="meta">
                          {x.date} • {cat?.name ?? "Категория удалена"}
                          {x.comment ? ` • ${x.comment}` : ""}
                        </div>
                      </div>
                      <span className="pill">Расход</span>
                    </div>
                  ),
                });
              });
              state.savings.transactions
                .filter((t) => t.monthKey === monthKey)
                .forEach((t) => {
                  const cat = state.savings.categories.find((c) => c.id === t.savingsCategoryId);
                  const isDep = t.type === "deposit";
                  items.push({
                    date: t.date,
                    createdAt: t.createdAt,
                    key: `s:${t.id}`,
                    el: (
                      <div className="listItem" key={`s:${t.id}`}>
                        <div>
                          <strong className={isDep ? "neg" : "pos"}>
                            {isDep ? "- " : "+ "}
                            {formatMoney(t.amount)}
                          </strong>
                          <div className="meta">
                            {t.date} • Накопления: {cat?.name ?? "Категория удалена"}
                            {t.comment ? ` • ${t.comment}` : ""}
                          </div>
                        </div>
                        <span className="pill">{isDep ? "В накопления" : "Из накоплений"}</span>
                      </div>
                    ),
                  });
                });
              items.sort((a, b) => {
                if (a.date !== b.date) return b.date.localeCompare(a.date);
                return b.createdAt - a.createdAt;
              });
              if (!items.length) return <div className="hint">Пока нет операций за этот месяц.</div>;
              return items.map((item) => <div key={item.key}>{item.el}</div>);
            })()}
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}

