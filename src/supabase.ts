import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Отсутствуют переменные VITE_SUPABASE_URL или VITE_SUPABASE_ANON_KEY. " +
      "Добавьте их в Secrets GitHub Actions: " +
      "VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co " +
      "VITE_SUPABASE_ANON_KEY=your_anon_key"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
