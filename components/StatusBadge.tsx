import { ComplianceStatus } from '@/lib/types';

const STYLES: Record<ComplianceStatus, string> = {
  'Pending review': 'bg-amber-100 text-amber-800',
  Published: 'bg-green-100 text-green-800',
  'Needs reapproval': 'bg-red-100 text-red-800',
};

export default function StatusBadge({ status }: { status: ComplianceStatus }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${STYLES[status]}`}>
      {status}
    </span>
  );
}
