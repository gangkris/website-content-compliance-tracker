'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ComplianceRecord } from '@/lib/types';

type Props = {
  record?: ComplianceRecord;
};

export default function RecordForm({ record }: Props) {
  const router = useRouter();
  const isUpdate = Boolean(record);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(record?.title ?? '');
  const [owner, setOwner] = useState(record?.owner ?? '');
  const [approvalNumber, setApprovalNumber] = useState(record?.approval_number ?? '');
  const [approvalDate, setApprovalDate] = useState(record?.approval_date ?? '');
  const [expirationDate, setExpirationDate] = useState(record?.expiration_date ?? '');
  const [approvedContent, setApprovedContent] = useState(record?.approved_content ?? '');
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = Boolean(title && owner && approvalNumber && approvalDate && expirationDate && approvedContent);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setApprovedContent(String(reader.result ?? ''));
      setFileName(file.name);
    };
    reader.readAsText(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isUpdate && record!.status === 'Needs reapproval') {
      if (!expirationDate || record!.expiration_date === null || expirationDate <= record!.expiration_date) {
        setError(
          'This record needs reapproval because it expired or is expiring soon. ' +
            'Enter a new expiration date later than the current one to confirm it was actually reapproved.'
        );
        return;
      }
    }

    setSaving(true);

    const payload = {
      title,
      owner,
      approval_number: approvalNumber || null,
      approval_date: approvalDate || null,
      expiration_date: expirationDate || null,
      approved_content: approvedContent || null,
      status: 'Pending review' as const,
    };

    const result = isUpdate
      ? await supabase.from('compliance_records').update(payload).eq('id', record!.id).select().single()
      : await supabase.from('compliance_records').insert(payload).select().single();

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    router.push(`/records/${result.data.id}`);
  }

  function handleCancel() {
    if (isUpdate && record) {
      router.push(`/records/${record.id}`);
    } else {
      router.push('/');
    }
  }

  return (
    <>
      <h1 style={{ margin: '0 0 4px' }}>{isUpdate ? 'Update compliance record' : 'New compliance record'}</h1>
      <p className="text-muted" style={{ margin: '0 0 16px', fontSize: 14 }}>
        {isUpdate
          ? 'Update this record with a new approval, dates, or content.'
          : 'Log a newly approved piece of content.'}
      </p>
      <hr className="hr" style={{ margin: '0 0 24px' }} />

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 800 }}>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Homepage hero banner"
            />
          </div>

          <div className="field">
            <label>Owner</label>
            <input className="input" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Name" />
          </div>

          <div className="field">
            <label>Approval number</label>
            <input
              className="input"
              value={approvalNumber}
              onChange={(e) => setApprovalNumber(e.target.value)}
              placeholder="e.g. CMP-2026-0142"
            />
          </div>

          <div className="field">
            <label>Approval date</label>
            <input
              type="date"
              className="input"
              value={approvalDate}
              onChange={(e) => setApprovalDate(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Expiration date</label>
            <input
              type="date"
              className="input"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
          </div>

          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Approved content</label>
            <textarea
              className="input"
              style={{ minHeight: 160 }}
              value={approvedContent}
              onChange={(e) => setApprovedContent(e.target.value)}
              placeholder="Paste the full text of the approved version…"
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload .txt or .md
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              {fileName && (
                <span className="text-muted" style={{ fontSize: 12 }}>
                  {fileName}
                </span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p style={{ color: 'var(--color-danger)', fontSize: 14, marginTop: 16 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          <button type="submit" className="btn btn-primary" disabled={!canSave || saving}>
            {saving ? 'Saving…' : 'Save record'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
