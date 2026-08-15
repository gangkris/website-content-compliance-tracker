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

## Scheduled vs. on-demand

Every piece of the app falls into one of two buckets: things that happen on their own,
and things a person has to actually do.

- **Scheduled** (runs on its own, once a day, nobody has to remember): the app checks
  every record's expiration date, and if one is coming up within 30 days — or has
  already passed — it automatically marks that record as needing reapproval, and sends
  the owner a reminder email (more on that below).
- **On-demand** (a person has to click something): everything else. Logging a newly
  approved piece of content, updating a record once it's been reapproved, and running
  a check on a draft before publishing are all things a person deliberately triggers,
  not things that happen in the background.

Publishing itself is also on-demand, but it's not allowed to go through if the record
still needs reapproval, or if the last check found a real difference — the app won't
let something get published if it hasn't actually been checked and cleared first.

## The agentic piece: how the comparison actually works

Most of the on-demand actions above — adding a record, updating one, publishing — are
just straightforward data entry: what you type in is what gets saved, no judgment
involved. The one exception, and the one place in the app where a real judgment call is
handed off to AI rather than decided by a fixed rule, is "Run validation" on the
Validate Changes screen.

Instead of a simple find-the-differences trick, that step sends both the approved text
and the current draft to Claude (Anthropic's AI) and asks it to judge whether anything
meaningfully changed — things like a different price, a missing disclaimer, or an
altered claim — while ignoring things that don't matter, like extra spacing. Claude then
explains what it found in plain language.

This was built this way on purpose: deciding whether a wording change actually matters
for compliance isn't something a fixed rule can do well — it takes actual judgment,
which is exactly what was handed off to Claude here.

## Automated reminder emails

When the scheduled check flags a record as needing reapproval, it also sends a reminder
email to one shared compliance inbox (`TEAM_LEAD_EMAIL`) — fully on its own, with no
person reviewing or approving the email before it goes out. Records still track an
individual owner and owner email (shown on Record Details), but reminders route to the
one central inbox rather than pinging each content owner directly — one person owns the
reapproval queue, and the email names the record's owner so they know who to follow up
with. Since nobody's checking each one before it sends, the email is deliberately kept
narrow in two ways:

- **What Claude sees**: only compliance facts — the title, approval number, expiration
  date, and the result of the last check. It never sees who the owner is, so nothing
  about the person can influence what gets written. Claude's only job is to draft one
  short, plain-language sentence explaining why the record needs attention; the rest of
  the email is a fixed template — including the owner's name — with that sentence
  dropped in.
- **What the email can do**: nothing. It states what's true and links to the record so
  the owner can look at it, but there's no "click here to reapprove" link or anything
  else that would change the record's status from inside the email. Any real action —
  updating the record, publishing it — still has to happen by actually opening the app,
  against whatever the record's real status is at that moment. That's what keeps sending
  an email automatically, without a human checking each one first, a reasonable thing to
  do here: the email can inform, but it can't act.

## What's stored

Each tracked piece of content has: a title, an owner (name and email), an approval
number, an approval date, an expiration date, the approved text itself, a status
(awaiting review, published, or needs reapproval), the result of the most recent check,
and the text and timestamp of the most recent reminder email sent for it. All of this
lives in a real database (Supabase), not hardcoded anywhere in the app — every screen
reads and writes to it directly.

## Running it locally

```bash
npm install
cp .env.example .env.local   # fill in your own keys
npm run dev
```

You'll need your own Supabase project, Anthropic API key, and Resend API key (for the
reminder emails) — see `.env.example` for which values go where. None of these keys are
ever written directly into the code; the app always reads them from environment
variables, and the more sensitive ones (the database's admin key, the Anthropic key, and
the Resend key) are only ever used on the server side, never sent to anyone's browser.

## Built with

Next.js, Supabase (database), the Anthropic API, and Resend (email), deployed on
Vercel.
