import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// This route is the SCHEDULED piece (see vercel.json "crons"), invoked once
// a day by Vercel. It is not meant to be clicked by a user — it's the
// automated counterpart to the on-demand Validate Changes route.
//
// It also sends a fully autonomous reminder email (no human approval before
// send) to a single compliance team-lead inbox for each record that
// transitions to Needs reapproval in this run — one central inbox owns the
// reapproval queue, rather than pinging each content owner individually.
// Two deliberate constraints keep the autonomy safe:
//   1. Claude only ever sees compliance metadata (title, approval number,
//      expiration date, last validation outcome) — never the record owner's
//      name or email — so nothing about who that person is can shape the
//      message. The owner's name is still included in the fixed template
//      (not AI-generated) so the team lead knows who to follow up with.
//   2. The email is strictly read-only: it states what's true and links to
//      the record for viewing, but contains no link or action that changes
//      anything. Any real action still has to happen inside the app, against
//      whatever the record's actual status is at that moment.
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type TransitionedRecord = {
  id: string;
  title: string;
  owner: string;
  approval_number: string | null;
  expiration_date: string | null;
  last_validation_outcome: string | null;
};

async function draftReminderSentence(record: TransitionedRecord): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 200,
    system:
      'You write a single short, plain-language sentence explaining why a piece of ' +
      'approved content needs compliance reapproval attention, based only on the ' +
      'metadata given. No greeting, no marketing language, no owner or personal ' +
      'references. Output only the sentence.',
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          title: record.title,
          approval_number: record.approval_number,
          expiration_date: record.expiration_date,
          last_validation_outcome: record.last_validation_outcome,
        }),
      },
    ],
  });

  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join(' ')
    .trim();
}

function buildReminderEmail(record: TransitionedRecord, sentence: string, appUrl: string) {
  const subject = `Reapproval needed: ${record.title}`;
  const text =
    `This is an automated reminder from Content Compliance Tracker.\n\n` +
    `"${record.title}" (approval ${record.approval_number ?? 'n/a'}, owned by ${record.owner}) now needs reapproval.\n\n` +
    `${sentence}\n\n` +
    `Expiration date: ${record.expiration_date ?? 'n/a'}\n\n` +
    `View this record: ${appUrl}/records/${record.id}\n\n` +
    `This message is informational only — no action can be taken from this email. ` +
    `Log in to the tracker directly to review and reapprove.`;
  return { subject, text };
}

async function sendReminderEmail(to: string, subject: string, text: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
      to,
      subject,
      text,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${await res.text()}`);
  }
}

export async function GET(request: NextRequest) {
  const appUrl = new URL(request.url).origin;
  const teamLeadEmail = process.env.TEAM_LEAD_EMAIL;

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const cutoff = thirtyDaysFromNow.toISOString().slice(0, 10);

  const { data: transitioned, error } = await supabaseAdmin
    .from('compliance_records')
    .update({ status: 'Needs reapproval' })
    .lte('expiration_date', cutoff)
    .neq('status', 'Needs reapproval')
    .select('id, title, owner, approval_number, expiration_date, last_validation_outcome');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reminders: { id: string; sent: boolean; reason?: string }[] = [];

  for (const record of (transitioned ?? []) as TransitionedRecord[]) {
    if (!teamLeadEmail) {
      reminders.push({ id: record.id, sent: false, reason: 'TEAM_LEAD_EMAIL not configured' });
      continue;
    }

    try {
      const sentence = await draftReminderSentence(record);
      const { subject, text } = buildReminderEmail(record, sentence, appUrl);
      await sendReminderEmail(teamLeadEmail, subject, text);

      await supabaseAdmin
        .from('compliance_records')
        .update({ last_reminder_text: text, reminder_sent_at: new Date().toISOString() })
        .eq('id', record.id);

      reminders.push({ id: record.id, sent: true });
    } catch (e) {
      reminders.push({ id: record.id, sent: false, reason: e instanceof Error ? e.message : 'unknown error' });
    }
  }

  return NextResponse.json({ updated: transitioned?.length ?? 0, records: transitioned, reminders });
}
