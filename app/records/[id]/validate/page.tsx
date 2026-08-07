'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ComplianceRecord } from '@/lib/types';

export default function ValidateChangesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [record, setRecord] = useState<ComplianceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [cmsDraft, setCmsDraft] = useState('');
  const [findings, setFindings] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function runValidation() {
    if (!record) return;
    setRunning(true);
    setError(null);
    setFindings(null);

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedContent: record.approved_content ?? '',
          cmsDraft,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Validation failed');
      setFindings(data.findings);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Validation failed');
    } finally {
      setRunning(false);
    }
  }

  async function saveAndPublish() {
    if (!record || findings === null) return;
    setPublishing(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('compliance_records')
      .update({
        status: 'Published',
        last_published_date: new Date().toISOString().slice(0, 10),
        last_validated_at: new Date().toISOString(),
        last_validation_outcome: findings,
      })
      .eq('id', record.id);

    setPublishing(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push(`/records/${record.id}`);
  }

  if (loading) return <main className="max-w-4xl mx-auto p-8">Loading…</main>;
  if (!record) return <main className="max-w-4xl mx-auto p-8">Record not found.</main>;

  return (
    <main className="max-w-4xl mx-auto p-8 w-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{record.title}</h1>
        <p className="text-gray-500 text-sm">
          Current approval number: {record.approval_number ?? '—'}
        </p>
      </div>

      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-2">Approved content (reference)</h2>
        <pre className="whitespace-pre-wrap border rounded p-4 bg-gray-50 text-sm">
          {record.approved_content || '—'}
        </pre>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">CMS draft</span>
        <textarea
          className="border rounded px-3 py-2 min-h-40"
          value={cmsDraft}
          onChange={(e) => setCmsDraft(e.target.value)}
          placeholder="Paste the current CMS draft content here"
        />
      </label>

      <div>
        <button
          onClick={runValidation}
          disabled={running || !cmsDraft}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {running ? 'Running validation…' : 'Run validation'}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {findings !== null && (
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-2">Claude&apos;s findings</h2>
          <div className="border rounded p-4 text-sm whitespace-pre-wrap">{findings}</div>
        </div>
      )}

      <div className="flex gap-3">
        <Link href={`/records/${record.id}`} className="px-4 py-2 rounded border">
          Back to record
        </Link>
        <button
          onClick={saveAndPublish}
          disabled={findings === null || publishing}
          className="px-4 py-2 rounded bg-green-700 text-white disabled:opacity-50"
        >
          {publishing ? 'Publishing…' : 'Save and publish'}
        </button>
      </div>
    </main>
  );
}
