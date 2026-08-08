'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ComplianceRecord } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import { fmtDate, fmtValidatedAt, expirationStyle } from '@/lib/format';

export default function DashboardPage() {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('compliance_records')
      .select('*')
      .order('expiration_date', { ascending: true })
      .then(({ data }) => {
        setRecords(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <main style={{ maxWidth: 1120, width: '100%', margin: '0 auto', padding: '32px 24px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Compliance records</h1>
        <span className="text-muted" style={{ fontSize: 13 }}>
          {loading ? '' : `${records.length} ${records.length === 1 ? 'record' : 'records'}`}
        </span>
      </div>
      <hr className="hr" style={{ margin: '0 0 24px' }} />

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : records.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 0' }}>
          <svg width="120" height="90" viewBox="0 0 120 90" style={{ opacity: 0.5 }}>
            <defs>
              <pattern id="stripes" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="var(--color-neutral-400)" strokeWidth="4" />
              </pattern>
            </defs>
            <rect x="1" y="1" width="118" height="88" fill="url(#stripes)" stroke="var(--color-neutral-400)" strokeWidth="2" />
          </svg>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 4px' }}>No compliance records yet</h3>
            <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
              Log your first approved piece of content to start tracking it.
            </p>
          </div>
          <Link href="/records/new" className="btn btn-primary">
            + New record
          </Link>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Last validated</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} style={{ cursor: 'pointer' }}>
                <td style={{ fontWeight: 600 }}>
                  <Link href={`/records/${r.id}`} style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
                    {r.title}
                  </Link>
                </td>
                <td>
                  <Link href={`/records/${r.id}`} style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
                    {r.owner}
                  </Link>
                </td>
                <td>
                  <Link href={`/records/${r.id}`} style={{ display: 'block' }}>
                    <StatusBadge status={r.status} />
                  </Link>
                </td>
                <td style={expirationStyle(r.expiration_date)}>
                  <Link href={`/records/${r.id}`} style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
                    {fmtDate(r.expiration_date)}
                  </Link>
                </td>
                <td className="text-muted">
                  <Link href={`/records/${r.id}`} style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
                    {fmtValidatedAt(r.last_validated_at)}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
