# Content Compliance Tracker

A simple internal tool for tracking website content that's been approved by a
compliance team — what was approved, when it expires, and whether what's actually
published still matches what was approved.

Live app: https://website-content-compliance-tracker.vercel.app

## What problem this solves

Before this app, tracking compliance approvals was a manual process: a spreadsheet
updated by hand, someone eyeballing whether the live content still matched what was
approved, and expiring approvals only getting caught if a person happened to notice in
time. This app keeps the same basic idea — a record of what's approved and when it
expires — but takes over the two most error-prone, easy-to-forget parts: checking
whether content still matches what was approved, and watching for approvals about to
expire.

## The four screens

1. **Dashboard** — every tracked piece of content, its status, and when it expires, all
   in one list.
2. **New / update record** — the form used to log a newly approved piece of content, or
   to update a record once it's been reapproved.
3. **Validate changes** — paste in the current live/draft version of the content, and
   check it against what was actually approved before publishing.
4. **Record details** — everything about one piece of content: its approval info, the
   approved text, the result of the last check, and buttons to validate or update it.

## The two moving parts: one automatic, one you trigger

- **Automatic, runs on its own every day**: the app checks every record's expiration
  date, and if one is coming up within 30 days (or has already passed), it automatically
  marks that record as needing reapproval. Nobody has to remember to check — it just
  happens.
- **You trigger it yourself**: the "Run validation" button on the Validate Changes
  screen. You paste in the current draft, and the app compares it against the approved
  version and tells you whether they still match.

Publishing is also something you do yourself, but it's not allowed to go through if the
record still needs reapproval, or if the last check found a real difference — the app
won't let something get published if it hasn't actually been checked and cleared.

## How the comparison actually works

The "Run validation" step doesn't use a simple find-the-differences trick. It sends both
the approved text and the current draft to Claude (Anthropic's AI) and asks it to judge
whether anything meaningfully changed — things like a different price, a missing
disclaimer, or an altered claim — while ignoring things that don't matter, like extra
spacing. Claude then explains what it found in plain language.

This was built this way on purpose: deciding whether a wording change actually matters
for compliance isn't something a fixed rule can do well — it takes actual judgment,
which is exactly what was handed off to Claude here.

## What's stored

Each tracked piece of content has: a title, an owner, an approval number, an approval
date, an expiration date, the approved text itself, a status (awaiting review,
published, or needs reapproval), and the result of the most recent check. All of this
lives in a real database (Supabase), not hardcoded anywhere in the app — every screen
reads and writes to it directly.

## Running it locally

```bash
npm install
cp .env.example .env.local   # fill in your own keys
npm run dev
```

You'll need your own Supabase project and Anthropic API key — see `.env.example` for
which values go where. None of these keys are ever written directly into the code; the
app always reads them from environment variables, and the more sensitive ones (the
database's admin key and the Anthropic key) are only ever used on the server side, never
sent to anyone's browser.

## Built with

Next.js, Supabase (database), and the Anthropic API, deployed on Vercel.
