import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../supabase/client";

type Props = {
  session: Session | null;
  onSessionChange(session: Session | null): void;
};

export function AuthGate({ session, onSessionChange }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        onSessionChange(data.session ?? null);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSessionChange(data.session ?? null);
      }
    } catch (e: any) {
      setError(e.message ?? "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  }

  if (session) {
    return null;
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: "80px auto" }}>
        <div className="cardHeader">
          <h2>Вход в трекер</h2>
        </div>
        <p className="hint">
          Авторизация нужна, чтобы ваши данные хранились в Supabase и были доступны с любого устройства.
        </p>
        <div className="field">
          <label>Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="field">
          <label>Пароль</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 6 символов"
          />
        </div>
        {error ? <div className="hint" style={{ color: "#fca5a5" }}>{error}</div> : null}
        <div style={{ height: 10 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btnPrimary" disabled={loading} onClick={handleSubmit}>
            {mode === "signin" ? "Войти" : "Создать аккаунт"}
          </button>
          <button
            className="btn"
            type="button"
            disabled={loading}
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Новый пользователь" : "У меня уже есть аккаунт"}
          </button>
        </div>
      </div>
    </div>
  );
}

