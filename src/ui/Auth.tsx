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
      <div className="card auth-card">
        <div className="cardHeader">
          <h2>Вход в трекер</h2>
        </div>
        <p className="hint">
          Авторизация нужна, чтобы ваши данные хранились в Supabase и были доступны с любого устройства.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
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
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
          {error ? <div className="hint" style={{ color: "#fca5a5" }}>{error}</div> : null}
          <div className="auth-actions">
            <button type="submit" className="btn btnPrimary" disabled={loading}>
              {mode === "signin" ? "Войти" : "Создать аккаунт"}
            </button>
            <button
              type="button"
              className="btn"
              disabled={loading}
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Новый пользователь" : "У меня уже есть аккаунт"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

