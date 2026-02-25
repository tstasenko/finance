import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./ui/App";
import "./ui/styles.css";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div style={{
      padding: 24,
      maxWidth: 560,
      margin: "40px auto",
      background: "#1e293b",
      color: "#f1f5f9",
      borderRadius: 12,
      fontFamily: "system-ui, sans-serif",
    }}>
      <h2 style={{ margin: "0 0 12px" }}>Ошибка загрузки</h2>
      <pre style={{ margin: 0, fontSize: 13, overflow: "auto" }}>{error.message}</pre>
      <p style={{ margin: "12px 0 0", fontSize: 13, color: "#94a3b8" }}>
        Открой консоль браузера (F12 → Console), скопируй красные сообщения и пришли.
      </p>
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

const root = document.getElementById("root");
if (!root) throw new Error("No #root element");
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

