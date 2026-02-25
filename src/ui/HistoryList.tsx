import { useState } from "react";
import type { AppState, MonthKey } from "../core/types";
import { formatMoney, parseMoney } from "../core/money";

type Props = {
  monthKey: MonthKey;
  m: AppState["months"][MonthKey];
  state: AppState;
  dispatch: (action: any) => void;
  formatMoney: (n: number) => string;
};

type EditState =
  | { kind: "income"; id: string; amount: string; comment: string; date: string }
  | { kind: "expense"; id: string; categoryId: string; amount: string; comment: string; date: string }
  | { kind: "savings"; id: string; type: "deposit" | "withdraw"; savingsCategoryId: string; amount: string; comment: string; date: string }
  | null;

export function HistoryList({ monthKey, m, state, dispatch, formatMoney }: Props) {
  const [edit, setEdit] = useState<EditState>(null);

  const items: { date: string; createdAt: number; key: string; kind: "income" | "expense" | "savings"; data: any }[] = [];
  m.incomes.forEach((x) => items.push({ date: x.date, createdAt: x.createdAt, key: `i:${x.id}`, kind: "income", data: x }));
  m.expenses.forEach((x) => items.push({ date: x.date, createdAt: x.createdAt, key: `e:${x.id}`, kind: "expense", data: x }));
  state.savings.transactions
    .filter((t) => t.monthKey === monthKey)
    .forEach((t) => items.push({ date: t.date, createdAt: t.createdAt, key: `s:${t.id}`, kind: "savings", data: t }));
  items.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt - a.createdAt;
  });

  if (!items.length) return <div className="hint">Пока нет операций за этот месяц.</div>;

  return (
    <>
      {items.map((item) => {
        const isEditing = edit && edit.kind === item.kind && edit.id === item.data.id;
        if (isEditing && edit) {
          const onSave = () => {
            if (edit.kind === "income") {
              const n = parseMoney(edit.amount);
              if (n === null || n <= 0) return;
              dispatch({ type: "income/update", monthKey, id: edit.id, amount: n, comment: edit.comment, date: edit.date });
            } else if (edit.kind === "expense") {
              const n = parseMoney(edit.amount);
              if (n === null || n <= 0) return;
              dispatch({ type: "expense/update", monthKey, id: edit.id, categoryId: edit.categoryId, amount: n, comment: edit.comment, date: edit.date });
            } else {
              const n = parseMoney(edit.amount);
              if (n === null || n <= 0) return;
              dispatch({
                type: "savings/txnUpdate",
                id: edit.id,
                operationType: edit.type,
                amount: n,
                comment: edit.comment,
                date: edit.date,
                savingsCategoryId: edit.savingsCategoryId,
                monthKey,
              });
            }
            setEdit(null);
          };
          return (
            <div className="listItem history-edit" key={item.key}>
              <div className="row" style={{ flex: 1, flexWrap: "wrap", gap: 8 }}>
                {edit.kind === "income" && (
                  <>
                    <div className="field" style={{ minWidth: 100 }}>
                      <label>Сумма</label>
                      <input
                        className="input"
                        value={edit.amount}
                        inputMode="decimal"
                        onChange={(e) => setEdit({ ...edit, amount: e.target.value })}
                      />
                    </div>
                    <div className="field" style={{ minWidth: 120 }}>
                      <label>Дата</label>
                      <input className="input" type="date" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} />
                    </div>
                    <div className="field" style={{ flex: 1, minWidth: 140 }}>
                      <label>Комментарий</label>
                      <input className="input" value={edit.comment} onChange={(e) => setEdit({ ...edit, comment: e.target.value })} />
                    </div>
                  </>
                )}
                {edit.kind === "expense" && (
                  <>
                    <div className="field" style={{ minWidth: 140 }}>
                      <label>Категория</label>
                      <select
                        className="select"
                        value={edit.categoryId}
                        onChange={(e) => setEdit({ ...edit, categoryId: e.target.value })}
                      >
                        {m.categories.map((c) => (
                          <option value={c.id} key={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field" style={{ minWidth: 90 }}>
                      <label>Сумма</label>
                      <input
                        className="input"
                        value={edit.amount}
                        inputMode="decimal"
                        onChange={(e) => setEdit({ ...edit, amount: e.target.value })}
                      />
                    </div>
                    <div className="field" style={{ minWidth: 120 }}>
                      <label>Дата</label>
                      <input className="input" type="date" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} />
                    </div>
                    <div className="field" style={{ flex: 1, minWidth: 100 }}>
                      <label>Комментарий</label>
                      <input className="input" value={edit.comment} onChange={(e) => setEdit({ ...edit, comment: e.target.value })} />
                    </div>
                  </>
                )}
                {edit.kind === "savings" && (
                  <>
                    <div className="field" style={{ minWidth: 140 }}>
                      <label>Категория</label>
                      <select
                        className="select"
                        value={edit.savingsCategoryId}
                        onChange={(e) => setEdit({ ...edit, savingsCategoryId: e.target.value })}
                      >
                        {state.savings.categories.map((c) => (
                          <option value={c.id} key={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field" style={{ minWidth: 100 }}>
                      <label>Операция</label>
                      <select className="select" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as "deposit" | "withdraw" })}>
                        <option value="deposit">Пополнить</option>
                        <option value="withdraw">Забрать</option>
                      </select>
                    </div>
                    <div className="field" style={{ minWidth: 90 }}>
                      <label>Сумма</label>
                      <input
                        className="input"
                        value={edit.amount}
                        inputMode="decimal"
                        onChange={(e) => setEdit({ ...edit, amount: e.target.value })}
                      />
                    </div>
                    <div className="field" style={{ minWidth: 120 }}>
                      <label>Дата</label>
                      <input className="input" type="date" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} />
                    </div>
                    <div className="field" style={{ flex: 1, minWidth: 100 }}>
                      <label>Комментарий</label>
                      <input className="input" value={edit.comment} onChange={(e) => setEdit({ ...edit, comment: e.target.value })} />
                    </div>
                  </>
                )}
              </div>
              <div className="row-btns">
                <button type="button" className="btn btnPrimary" onClick={onSave}>Сохранить</button>
                <button type="button" className="btn" onClick={() => setEdit(null)}>Отмена</button>
              </div>
            </div>
          );
        }

        if (item.kind === "income") {
          const x = item.data;
          return (
            <div className="listItem" key={item.key}>
              <div>
                <strong className="pos">+ {formatMoney(x.amount)}</strong>
                <div className="meta">{x.date}{x.comment ? ` • ${x.comment}` : ""}</div>
              </div>
              <div className="row-btns">
                <button type="button" className="btn" onClick={() => setEdit({ kind: "income", id: x.id, amount: String(x.amount), comment: x.comment ?? "", date: x.date })}>Изменить</button>
                <button type="button" className="btn btnDanger" onClick={() => dispatch({ type: "income/delete", monthKey, id: x.id })}>Удалить</button>
              </div>
            </div>
          );
        }
        if (item.kind === "expense") {
          const x = item.data;
          const cat = m.categories.find((c) => c.id === x.categoryId);
          return (
            <div className="listItem" key={item.key}>
              <div>
                <strong className="neg">- {formatMoney(x.amount)}</strong>
                <div className="meta">{x.date} • {cat?.name ?? "Категория удалена"}{x.comment ? ` • ${x.comment}` : ""}</div>
              </div>
              <div className="row-btns">
                <button type="button" className="btn" onClick={() => setEdit({ kind: "expense", id: x.id, categoryId: x.categoryId, amount: String(x.amount), comment: x.comment ?? "", date: x.date })}>Изменить</button>
                <button type="button" className="btn btnDanger" onClick={() => dispatch({ type: "expense/delete", monthKey, id: x.id })}>Удалить</button>
              </div>
            </div>
          );
        }
        const t = item.data;
        const cat = state.savings.categories.find((c) => c.id === t.savingsCategoryId);
        const isDep = t.type === "deposit";
        return (
          <div className="listItem" key={item.key}>
            <div>
              <strong className={isDep ? "neg" : "pos"}>{isDep ? "- " : "+ "}{formatMoney(t.amount)}</strong>
              <div className="meta">{t.date} • Накопления: {cat?.name ?? "Категория удалена"}{t.comment ? ` • ${t.comment}` : ""}</div>
            </div>
            <div className="row-btns">
              <button type="button" className="btn" onClick={() => setEdit({ kind: "savings", id: t.id, type: t.type, savingsCategoryId: t.savingsCategoryId, amount: String(t.amount), comment: t.comment ?? "", date: t.date })}>Изменить</button>
              <button type="button" className="btn btnDanger" onClick={() => dispatch({ type: "savings/txnDelete", id: t.id })}>Удалить</button>
            </div>
          </div>
        );
      })}
    </>
  );
}
