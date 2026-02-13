import type { IntelligenceItem, PositioningClaim, Competitor } from "@/generated/prisma/client";
import { FINMO_STRATEGIC_CONTEXT, SYNTHESIS_RUBRIC } from "@/lib/llm/context";

interface WeeklyPulsePromptContext {
  claims: PositioningClaim[];
  items: (IntelligenceItem & { competitor: Competitor })[];
  weekStart: string;
  weekEnd: string;
}

export function buildWeeklyPulsePrompt(ctx: WeeklyPulsePromptContext): string {
  const claimsList = ctx.claims
    .map((c, i) => `${i + 1}. "${c.claimText}" — Current status: ${c.currentStatus}`)
    .join("\n");

  const itemsList = ctx.items.length === 0
    ? "No intelligence items detected this week."
    : ctx.items
        .map((item) =>
          `- [${item.competitor.name}] ${item.summary} (${item.evidenceTier}, ${item.type})${item.simulated ? " [SIMULATED]" : ""}`
        )
        .join("\n");

  return `You are Finmo's competitive intelligence analyst, writing the CMO's Monday morning briefing.

${FINMO_STRATEGIC_CONTEXT}

${SYNTHESIS_RUBRIC}

FINMO'S THREE POSITIONING CLAIMS (current status):
${claimsList}

INTELLIGENCE ITEMS THIS WEEK (${ctx.weekStart} to ${ctx.weekEnd}):
${itemsList}

TASK: Generate a Weekly Pulse briefing for the CMO. This is her Monday morning check — 3 minutes, then she closes the tab. Make every word count.

RULES:
- Under 500 words total
- If no notable items: output "Nothing notable this week" with a calm outlook. Do NOT generate filler. Quiet is a signal — it means positioning is stable.
- Every signal must reference at least one positioning claim it affects
- Every signal must carry its evidence tier (CONFIRMED, INFERRED, or UNKNOWN)
- Focus on "so what" — why it matters for Finmo specifically, not just what happened
- Items marked [SIMULATED] should still be analyzed but noted as simulated
- Be opinionated. If something doesn't matter, exclude it. The CMO values editorial judgment about what to OMIT.
- Write as if briefing a CMO who asks "how do we know?" for every claim.

OUTPUT FORMAT: Respond with ONLY valid JSON matching this exact schema:
{
  "sections": {
    "topSignals": [{ "competitor": string, "summary": string, "implication": string, "evidenceTier": "CONFIRMED"|"INFERRED"|"UNKNOWN", "sourceUrl": string }],
    "claimStatuses": [{ "claimId": string, "claimText": string, "status": "HOLDING"|"UNDER_PRESSURE"|"CONTESTED", "changeFromLastWeek": "improved"|"unchanged"|"degraded" }],
    "actionRequired": string | null,
    "outlook": string
  }
}`;
}
