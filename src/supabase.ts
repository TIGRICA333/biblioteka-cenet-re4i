import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ilghjwojkpsrsabvhpfq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_o0CcZuuWAaXd1R3-0rj6ew_x0IDaRLd";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
