'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ComplianceRecord } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import { fmtDate, fmtValidatedAt, fmtReminderSentAt, expirationStyle } from '@/lib/format';

const mainStyle = { maxWidth: 1120, width: '100%', margin: '0 auto', padding: '32px 24px', flex: 1 } as const;

export default function RecordDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<ComplianceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editedContent, setEditedContent] = useState('');
  const [savingContent, setSavingContent] = useState(false);
  const [contentSaved, setContentSaved] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('compliance_records')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setRecord(data);
        setEditedContent(data?.approved_content ?? '');
        setLoading(false);
      });
  }, [id]);

  async function saveApprovedContent() {
    if (!record) return;
    setSavingContent(true);
    setContentError(null);
    setContentSaved(false);

    const { error } = await supabase
      .from('compliance_records')
      .update({ approved_content: editedContent || null })
      .eq('id', record.id);

    setSavingContent(false);

    if (error) {
      setContentError(error.message);
      return;
    }

    setRecord({ ...record, approved_content: editedContent || null });
    setContentSaved(true);
  }

  if (loading) return <main style={mainStyle}>Loading…</main>;
  if (!record) return <main style={mainStyle}>Record not found.</main>;

  const isNeedsReapproval = record.status === 'Needs reapproval';

  return (
    <main style={mainStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <h1 style={{ margin: 0 }}>{record.title}</h1>
        <StatusBadge status={record.status} />
      </div>

      <div className="text-muted" style={{ fontSize: 13, display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <span>{record.owner}{record.owner_email ? ` (${record.owner_email})` : ''}</span>
        <span>·</span>
        <span>Approval {record.approval_number ?? '—'}</span>
        <span>·</span>
        <span>Approved {fmtDate(record.approval_date)}</span>
        <span>·</span>
        <span style={expirationStyle(record.expiration_date)}>Expires {fmtDate(record.expiration_date)}</span>
        {record.reminder_sent_at && (
          <>
            <span>·</span>
            <span>{fmtReminderSentAt(record.reminder_sent_at)}</span>
          </>
        )}
      </div>
      <hr className="hr" style={{ margin: '0 0 24px' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        <div>
          <h5 style={{ margin: '0 0 8px' }}>Approved content</h5>
          {isNeedsReapproval ? (
            <>
              <p className="text-muted" style={{ fontSize: 12, margin: '0 0 8px' }}>
                This record needs reapproval — capture the most recently approved text here. Saving this
                doesn&apos;t clear Needs reapproval on its own; use Update record for that once you also have
                the new approval number and expiration date.
              </p>
              <textarea
                className="input"
                style={{ minHeight: 200, fontSize: 13, lineHeight: 1.6 }}
                value={editedContent}
                onChange={(e) => {
                  setEditedContent(e.target.value);
                  setContentSaved(false);
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveApprovedContent}
                  disabled={savingContent}
                >
                  {savingContent ? 'Saving…' : 'Save content'}
                </button>
                {contentSaved && <span className="text-muted" style={{ fontSize: 12 }}>Saved.</span>}
              </div>
              {contentError && (
                <p style={{ color: 'var(--color-danger)', fontSize: 13, marginTop: 8 }}>{contentError}</p>
              )}
            </>
          ) : (
            <div className="card elev-sm" style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6 }}>
              {record.approved_content || '—'}
            </div>
          )}
        </div>

        <div>
          <h5 style={{ margin: '0 0 8px' }}>Latest validation</h5>
          {record.last_validated_at ? (
            <div className="card" style={{ fontSize: 13 }}>
              <p style={{ margin: 0, opacity: 0.85 }}>{record.last_validation_outcome}</p>
              <span className="text-muted" style={{ fontSize: 11 }}>{fmtValidatedAt(record.last_validated_at)}</span>
            </div>
          ) : (
            <p className="text-muted" style={{ fontSize: 13 }}>Not yet validated.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
            <Link href={`/records/${record.id}/validate`} className="btn btn-primary btn-block">
              Validate changes
            </Link>
            <Link href={`/records/${record.id}/edit`} className="btn btn-secondary btn-block">
              Update record
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
