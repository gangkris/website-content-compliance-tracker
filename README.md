# Content Compliance Tracker

A small internal tool for tracking website content that's gone through compliance
approval: log what was approved and when, check a CMS draft against the approved
version before publishing, and get flagged automatically before an approval expires.

Live app: https://website-content-compliance-tracker.vercel.app

## What it replaces

Previously this was a manual process: a spreadsheet tracker updated by hand, content
compared against the approved version by eye, and expirations caught only if someone
remembered to check. This app keeps the same underlying record-keeping but moves the
error-prone parts — comparing text, catching expirations — off a person and onto the
app.

## The four screens

1. **Dashboard** (`/`) — every compliance record, status, and expiration date at a glance.
2. **New / Update record** (`/records/new`, `/records/[id]/edit`) — the same form logs a
   brand-new approval or a reapproval. Saving always resets status to `Pending review`,
   since anything that changed needs to go through validation again before it counts as
   published.
3. **Validate changes** (`/records/[id]/validate`) — paste in the current CMS draft and
   compare it against the approved content before publishing.
4. **Record details** (`/records/[id]`) — read-only hub for one record: metadata,
   approved content, latest validation result, and the actions to validate or update it.

## Scheduled vs. on-demand

The app has exactly one piece that runs on a timer and one piece a person has to
trigger — everything else is plain CRUD against Supabase.

| Piece | Type | What it does |
|---|---|---|
| `app/api/cron/expiration-check/route.ts` | **Scheduled** — daily via `vercel.json`'s cron config | Finds records expiring within 30 days that aren't already flagged, and sets their status to `Needs reapproval`. No user involved. |
| `app/api/validate/route.ts` | **On-demand** — the "Run validation" button on the Validate Changes screen | Sends the approved content and the pasted CMS draft to Claude for a real comparison (see below), and returns whether they meaningfully differ plus an explanation. |

`Save and publish` on that same screen is a third, ordinary on-demand action — it just
writes the new status/timestamp to Supabase — but it's gated by both of the above: it's
disabled if the record is still `Needs reapproval`, or if the last validation run found
a meaningful difference.

## The agentic step

`app/api/validate/route.ts` is the one place in the app where a judgment call is handed
to Claude instead of decided by fixed logic. There's no local diffing or keyword
matching — the approved content and the CMS draft are sent to Claude (`claude-sonnet-5`)
with a forced tool call, and Claude decides:

- `hasMeaningfulDifferences` — whether anything changed that could affect compliance
  (wording, claims, disclosures, numbers, dates), ignoring purely cosmetic differences
  like whitespace
- `findings` — a plain-language explanation of what it found

This was chosen specifically because it's a judgment call a fixed rule can't make well —
"is this difference compliance-relevant or just a rewording" requires understanding
meaning, not just detecting that two strings differ.

## Data model

One Supabase table, `compliance_records` (see `supabase/migrations/`):

`title`, `owner`, `approval_number`, `approval_date`, `expiration_date`,
`approved_content`, `status` (`Pending review` / `Published` / `Needs reapproval`),
`last_published_date`, `last_validated_at`, `last_validation_outcome`.

Row Level Security is enabled with a permissive policy — there's no user authentication
in this MVP, so the anon key can read/write freely. The service-role key is used only in
the two server-only routes above (the cron job and, indirectly, nothing else needs it —
`validate` uses the Anthropic key, not Supabase).

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in your own Supabase + Anthropic keys
npm run dev
```

Required environment variables (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — used client-side for
  ordinary reads/writes
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, used by the cron route
- `ANTHROPIC_API_KEY` — server-only, used by the validate route

None of these are ever hardcoded; all are read via `process.env` and the service-role /
Anthropic keys never leave server-only code.

## Stack

Next.js (App Router) + Supabase (Postgres) + the Anthropic API, deployed on Vercel.
