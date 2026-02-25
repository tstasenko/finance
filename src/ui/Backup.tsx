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
      <button type="button" className="btn" onClick={handleDownload} title="Скачать резервную копию">
        Скачать копию
      </button>
      <button
        type="button"
        className="btn"
        onClick={() => inputRef.current?.click()}
        title="Восстановить из файла"
      >
        Восстановить
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={handleFile}
      />
    </div>
  );
}
