import { useRef } from "react";
import type { AppState } from "../core/types";
import { exportBackup, backupFilename, parseBackup } from "../core/backup";

type Props = {
  state: AppState;
  onReplace: (next: AppState) => void;
};

export function Backup({ state, onReplace }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDownload() {
    const json = exportBackup(state);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = backupFilename();
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsed = parseBackup(text);
      if (!parsed) {
        alert("Неверный формат файла. Выберите резервную копию трекера (.json).");
        return;
      }
      if (!confirm("Восстановить данные из файла? Текущие данные будут полностью заменены.")) return;
      onReplace(parsed);
    };
    reader.readAsText(file, "UTF-8");
  }

  return (
    <div className="backup-wrap">
      <button type="button" className="btnIcon" onClick={handleDownload} title="Скачать резервную копию">
        <svg viewBox="0 0 24 24" aria-hidden><path d="M19 9h-4V3H9v6H5l7 7 7-7zm-7 10v-2h2v2h-2z"/></svg>
      </button>
      <button type="button" className="btnIcon" onClick={() => inputRef.current?.click()} title="Восстановить из файла">
        <svg viewBox="0 0 24 24" aria-hidden><path d="M9 16h6v-6h4l-7-8-7 8h4v6z"/></svg>
      </button>
      <input ref={inputRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}
