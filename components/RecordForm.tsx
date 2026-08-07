'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ComplianceRecord } from '@/lib/types';

type Props = {
  record?: ComplianceRecord;
};

export default function RecordForm({ record }: Props) {
  const router = useRouter();
  const isUpdate = Boolean(record);

  const [title, setTitle] = useState(record?.title ?? '');
  const [owner, setOwner] = useState(record?.owner ?? '');
  const [approvalNumber, setApprovalNumber] = useState(record?.approval_number ?? '');
  const [approvalDate, setApprovalDate] = useState(record?.approval_date ?? '');
  const [expirationDate, setExpirationDate] = useState(record?.expiration_date ?? '');
  const [approvedContent, setApprovedContent] = useState(record?.approved_content ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Title</span>
        <input
          className="border rounded px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Owner</span>
        <input
          className="border rounded px-3 py-2"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Approval number</span>
        <input
          className="border rounded px-3 py-2"
          value={approvalNumber}
          onChange={(e) => setApprovalNumber(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Approval date</span>
        <input
          type="date"
          className="border rounded px-3 py-2"
          value={approvalDate}
          onChange={(e) => setApprovalDate(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Expiration date</span>
        <input
          type="date"
          className="border rounded px-3 py-2"
          value={expirationDate}
          onChange={(e) => setExpirationDate(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Approved content</span>
        <textarea
          className="border rounded px-3 py-2 min-h-40"
          value={approvedContent}
          onChange={(e) => setApprovedContent(e.target.value)}
        />
      </label>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded border"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save record'}
        </button>
      </div>
    </form>
  );
}
