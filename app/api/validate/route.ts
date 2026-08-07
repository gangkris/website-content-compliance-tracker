import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

// Default function timeout (10s) is too short for an LLM call that can run
// long on a slow response. Vercel Hobby allows up to 60s — raise to the max.
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { approvedContent, cmsDraft } = await req.json();

  if (typeof approvedContent !== 'string' || typeof cmsDraft !== 'string') {
    return NextResponse.json({ error: 'approvedContent and cmsDraft are required' }, { status: 400 });
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1024,
    system:
      'You compare an approved compliance version of website content against a draft pulled from a CMS. ' +
      'Identify meaningful differences that could affect regulatory compliance — wording changes, removed ' +
      'disclosures, altered claims, changed numbers or dates. Ignore purely cosmetic differences like ' +
      'whitespace or formatting. Be concise.',
    messages: [
      {
        role: 'user',
        content:
          `Approved content:\n"""\n${approvedContent}\n"""\n\n` +
          `CMS draft:\n"""\n${cmsDraft}\n"""`,
      },
    ],
    tools: [
      {
        name: 'report_comparison',
        description: 'Report the result of comparing the CMS draft against the approved content.',
        input_schema: {
          type: 'object',
          properties: {
            hasMeaningfulDifferences: {
              type: 'boolean',
              description:
                'true if there are differences that could affect regulatory compliance (wording, claims, ' +
                'disclosures, numbers, dates). false if the draft matches the approved content, ignoring ' +
                'purely cosmetic differences like whitespace or formatting.',
            },
            findings: {
              type: 'string',
              description: 'Concise explanation of what was compared and what, if anything, differs.',
            },
          },
          required: ['hasMeaningfulDifferences', 'findings'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'report_comparison' },
  });

  const toolUse = message.content.find((block) => block.type === 'tool_use');

  if (!toolUse || toolUse.type !== 'tool_use') {
    return NextResponse.json({ error: 'Claude did not return a comparison result' }, { status: 502 });
  }

  const { hasMeaningfulDifferences, findings } = toolUse.input as {
    hasMeaningfulDifferences: boolean;
    findings: string;
  };

  return NextResponse.json({ findings, hasMeaningfulDifferences });
}
