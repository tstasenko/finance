import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL as string)?.trim() || "";
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string)?.trim() || "";

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn("Supabase: задайте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в файле .env");
}

export const supabase: SupabaseClient = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder",
);

