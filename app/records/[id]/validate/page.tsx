'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ComplianceRecord } from '@/lib/types';

const mainStyle = { maxWidth: 1120, width: '100%', margin: '0 auto', padding: '32px 24px', flex: 1 } as const;

export default function ValidateChangesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [record, setRecord] = useState<ComplianceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [cmsDraft, setCmsDraft] = useState('');
  const [findings, setFindings] = useState<string | null>(null);
  const [hasMeaningfulDifferences, setHasMeaningfulDifferences] = useState<boolean | null>(null);
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
    setHasMeaningfulDifferences(null);

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
      setHasMeaningfulDifferences(data.hasMeaningfulDifferences);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Validation failed');
    } finally {
      setRunning(false);
    }
  }

  async function saveAndPublish() {
    if (!record || findings === null) return;

    if (record.status === 'Needs reapproval') {
      setError(
        'This record still needs reapproval and cannot be published as-is. ' +
          'Use Update record to enter the new approval number and an extended expiration date first.'
      );
      return;
    }

    if (hasMeaningfulDifferences) {
      setError(
        'The CMS draft does not match the approved content. Fix the draft in the CMS and run validation ' +
          'again before publishing.'
      );
      return;
    }

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

  if (loading) return <main style={mainStyle}>Loading…</main>;
  if (!record) return <main style={mainStyle}>Record not found.</main>;

  const hasRun = findings !== null;

  return (
    <main style={mainStyle}>
      <h1 style={{ margin: 0 }}>{record.title}</h1>
      <p className="text-muted" style={{ margin: '4px 0 16px', fontSize: 14 }}>
        Approval {record.approval_number ?? '—'} · Validate changes before publishing
      </p>
      <hr className="hr" style={{ margin: '0 0 24px' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <h5 style={{ margin: '0 0 8px' }}>
            Approved content <span className="text-muted" style={{ textTransform: 'none', letterSpacing: 0 }}>(read-only)</span>
          </h5>
          <div className="card elev-sm" style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6, maxHeight: 320, overflow: 'auto' }}>
            {record.approved_content || '—'}
          </div>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label style={{ fontSize: 16, fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
            CMS draft
          </label>
          <textarea
            className="input"
            style={{ minHeight: 280, fontSize: 13 }}
            value={cmsDraft}
            onChange={(e) => setCmsDraft(e.target.value)}
            placeholder="Paste the current CMS draft here…"
          />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          onClick={runValidation}
          disabled={running || !cmsDraft}
          className="btn btn-primary"
          style={{ whiteSpace: 'nowrap' }}
        >
          {running ? 'Running validation…' : 'Run validation'}
        </button>
      </div>

      {error && <p style={{ color: 'var(--color-danger)', fontSize: 14, marginTop: 16 }}>{error}</p>}

      {record.status === 'Needs reapproval' && (
        <p style={{ color: 'var(--color-accent-700)', fontSize: 14, marginTop: 16 }}>
          This record needs reapproval. Use{' '}
          <Link href={`/records/${record.id}/edit`}>Update record</Link>{' '}
          to enter a new approval number and an extended expiration date before publishing.
        </p>
      )}

      {hasRun && (
        <div style={{ marginTop: 24 }}>
          <div
            className={`tag ${hasMeaningfulDifferences ? 'tag-accent' : 'tag-neutral'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, marginBottom: 16 }}
          >
            {hasMeaningfulDifferences ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L14.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {hasMeaningfulDifferences ? 'Differences found' : 'Matches approved content'}
          </div>
          <div>
            <h6 style={{ margin: '0 0 8px' }}>Claude&apos;s findings</h6>
            <div className="card" style={{ display: 'block', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {findings}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        <button
          onClick={saveAndPublish}
          disabled={
            findings === null || publishing || record.status === 'Needs reapproval' || hasMeaningfulDifferences === true
          }
          className="btn btn-primary"
          style={{ whiteSpace: 'nowrap' }}
        >
          {publishing ? 'Publishing…' : 'Save and publish'}
        </button>
        <Link href={`/records/${record.id}`} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
          Back to record
        </Link>
      </div>
    </main>
  );
}
