import RecordForm from '@/components/RecordForm';

export default function NewRecordPage() {
  return (
    <main className="max-w-4xl mx-auto p-8 w-full">
      <h1 className="text-2xl font-semibold mb-6">New compliance record</h1>
      <RecordForm />
    </main>
  );
}
