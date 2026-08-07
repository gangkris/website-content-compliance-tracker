import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Service-role client. Bypasses RLS entirely — only ever import this from
// server-only code (Route Handlers), never from a 'use client' component.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
