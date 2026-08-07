create extension if not exists pgcrypto;

create table compliance_records (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner text not null,
  approval_number text,
  approval_date date,
  expiration_date date,
  approved_content text,
  status text not null default 'Pending review'
    check (status in ('Pending review', 'Published', 'Needs reapproval')),
  last_published_date date,
  last_validated_at timestamptz,
  last_validation_outcome text
);
