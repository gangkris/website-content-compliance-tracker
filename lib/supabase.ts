import { createClient } from '@supabase/supabase-js';

// Browser-safe client. Uses the anon key, which relies on the RLS policy
// on compliance_records to define what it can actually do.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
