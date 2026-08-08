'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ComplianceRecord } from '@/lib/types';
import RecordForm from '@/components/RecordForm';

export default function EditRecordPage() {
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

  const mainStyle = { maxWidth: 1120, width: '100%', margin: '0 auto', padding: '32px 24px', flex: 1 } as const;

  if (loading) return <main style={mainStyle}>Loading…</main>;
  if (!record) return <main style={mainStyle}>Record not found.</main>;

  return (
    <main style={mainStyle}>
      <RecordForm record={record} />
    </main>
  );
}
