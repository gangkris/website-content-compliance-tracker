import { ComplianceStatus } from '@/lib/types';

const CLASS: Record<ComplianceStatus, string> = {
  'Pending review': 'tag-neutral',
  Published: 'tag-published',
  'Needs reapproval': 'tag-danger',
};

export default function StatusBadge({ status }: { status: ComplianceStatus }) {
  return <span className={`tag ${CLASS[status]}`}>{status}</span>;
}
