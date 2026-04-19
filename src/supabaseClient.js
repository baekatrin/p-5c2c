// WHY THIS FILE EXISTS:
// If every component called createClient() you have multiple separate connections to Supabase (wasteful, source of bugs)
// We create the client once here and export it. Any file that needs
// to read/write the database or handle auth imports `supabase` from here.

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      detectSessionInUrl: true,  // Required for OAuth redirect handling
      persistSession: true,
    }
  }
)