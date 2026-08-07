import 'server-only';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// This route is the SCHEDULED piece (see vercel.json "crons"), invoked once
// a day by Vercel. It is not meant to be clicked by a user — it's the
// automated counterpart to the on-demand Validate Changes route.
export async function GET() {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const cutoff = thirtyDaysFromNow.toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from('compliance_records')
    .update({ status: 'Needs reapproval' })
    .lte('expiration_date', cutoff)
    .neq('status', 'Needs reapproval')
    .select('id, title, expiration_date');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ updated: data?.length ?? 0, records: data });
}
