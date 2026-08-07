export type ComplianceStatus = 'Pending review' | 'Published' | 'Needs reapproval';

export interface ComplianceRecord {
  id: string;
  title: string;
  owner: string;
  approval_number: string | null;
  approval_date: string | null;
  expiration_date: string | null;
  approved_content: string | null;
  status: ComplianceStatus;
  last_published_date: string | null;
  last_validated_at: string | null;
  last_validation_outcome: string | null;
}
