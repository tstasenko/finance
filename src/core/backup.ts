import type { AppState } from "./types";

function isAppStateLike(v: unknown): v is AppState {
  if (!v || typeof v !== "object") return false;
  const any = v as Record<string, unknown>;
  return (
    any.schemaVersion === 1 &&
    typeof any.months === "object" &&
    any.months !== null &&
    typeof any.savings === "object" &&
    any.savings !== null
  );
}

export function exportBackup(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function parseBackup(json: string): AppState | null {
  try {
    const parsed = JSON.parse(json) as unknown;
    return isAppStateLike(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function backupFilename(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `expense-tracker-backup-${y}-${m}-${day}.json`;
}
