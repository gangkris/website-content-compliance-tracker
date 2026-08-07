'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ComplianceRecord } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';

export default function RecordDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<ComplianceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('compliance_records')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setRecord(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <main className="max-w-4xl mx-auto p-8">Loading…</main>;
  if (!record) return <main className="max-w-4xl mx-auto p-8">Record not found.</main>;

  return (
    <main className="max-w-4xl mx-auto p-8 w-full flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">{record.title}</h1>
        <StatusBadge status={record.status} />
      </div>

      <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <dt className="text-gray-500">Owner</dt>
        <dd>{record.owner}</dd>
        <dt className="text-gray-500">Approval number</dt>
        <dd>{record.approval_number ?? '—'}</dd>
        <dt className="text-gray-500">Approval date</dt>
        <dd>{record.approval_date ?? '—'}</dd>
        <dt className="text-gray-500">Expiration date</dt>
        <dd>{record.expiration_date ?? '—'}</dd>
      </dl>

      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-2">Approved content</h2>
        <pre className="whitespace-pre-wrap border rounded p-4 bg-gray-50 text-sm">
          {record.approved_content || '—'}
        </pre>
      </div>

      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-2">Latest validation</h2>
        {record.last_validated_at ? (
          <div className="border rounded p-4 text-sm flex flex-col gap-1">
            <p className="text-gray-500">
              {new Date(record.last_validated_at).toLocaleString()}
            </p>
            <p className="whitespace-pre-wrap">{record.last_validation_outcome}</p>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No validation run yet.</p>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          href={`/records/${record.id}/validate`}
          className="px-4 py-2 rounded bg-black text-white"
        >
          Validate changes
        </Link>
        {record.status === 'Needs reapproval' && (
          <Link
            href={`/records/${record.id}/edit`}
            className="px-4 py-2 rounded border"
          >
            Update record
          </Link>
        )}
      </div>
    </main>
  );
}
