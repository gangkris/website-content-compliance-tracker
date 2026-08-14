alter table compliance_records
  add column owner_email text,
  add column last_reminder_text text,
  add column reminder_sent_at timestamptz;
