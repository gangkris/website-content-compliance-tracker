'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ComplianceRecord } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';

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
    <main className="max-w-4xl mx-auto p-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Content Compliance Tracker</h1>
        <Link href="/records/new" className="px-4 py-2 rounded bg-black text-white">
          + New record
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : records.length === 0 ? (
        <p className="text-gray-500">No records yet.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b text-sm text-gray-500">
              <th className="py-2">Title</th>
              <th className="py-2">Owner</th>
              <th className="py-2">Status</th>
              <th className="py-2">Expires</th>
              <th className="py-2">Last validated</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="py-3">
                  <Link href={`/records/${r.id}`} className="font-medium hover:underline">
                    {r.title}
                  </Link>
                </td>
                <td className="py-3">{r.owner}</td>
                <td className="py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="py-3">{r.expiration_date ?? '—'}</td>
                <td className="py-3">
                  {r.last_validated_at ? new Date(r.last_validated_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
