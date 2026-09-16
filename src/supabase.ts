import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  "https://ilghjwojkpsrsabvhpfq.supabase.co";
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  "sb_publishable_o0CcZuuWAaXd1R3-0rj6ew_x0IDaRLd";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Отсутствуют VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
