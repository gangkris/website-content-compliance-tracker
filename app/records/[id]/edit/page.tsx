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

  if (loading) return <main className="max-w-4xl mx-auto p-8">Loading…</main>;
  if (!record) return <main className="max-w-4xl mx-auto p-8">Record not found.</main>;

  return (
    <main className="max-w-4xl mx-auto p-8 w-full">
      <h1 className="text-2xl font-semibold mb-6">Update compliance record</h1>
      <RecordForm record={record} />
    </main>
  );
}
