import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const globalForSupabase = globalThis as typeof globalThis & {
  __playzoneSupabaseClient?: ReturnType<typeof createClient>;
};

export const supabase =
  globalForSupabase.__playzoneSupabaseClient ??
  createClient(supabaseUrl, supabaseKey);

if (!globalForSupabase.__playzoneSupabaseClient) {
  globalForSupabase.__playzoneSupabaseClient = supabase;
}
