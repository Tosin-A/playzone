import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://xwszubsrwrmzavpaovsv.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3c3p1YnNyd3JtemF2cGFvdnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQ3MzQsImV4cCI6MjA5NDEwMDczNH0.5VwS36-4g29O55V27_fJasXlQa8x_0MLGGnMMpO0WV8";

export const supabase = createClient(supabaseUrl, supabaseKey);
