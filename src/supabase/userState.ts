import type { AppState } from "../core/types";
import { createInitialState } from "../core/storage";
import { supabase } from "./client";

const TABLE = "user_state";

function isAppStateLike(v: unknown): v is AppState {
  if (!v || typeof v !== "object") return false;
  const any = v as any;
  return any.schemaVersion === 1 && typeof any.months === "object" && typeof any.savings === "object";
}

export async function loadUserState(userId: string): Promise<AppState> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to load user_state", error);
    return createInitialState();
  }

  if (data && isAppStateLike(data.state)) {
    return data.state;
  }

  return createInitialState();
}

export async function saveUserState(userId: string, state: AppState): Promise<void> {
  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to save user_state", error);
  }
}

