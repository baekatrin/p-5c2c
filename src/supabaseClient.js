// WHY THIS FILE EXISTS:
// If every component called createClient() you have multiple separate connections to Supabase (wasteful, source of bugs)
// We create the client once here and export it. Any file that needs
// to read/write the database or handle auth imports `supabase` from here.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
