import type { IntelligenceItem, PositioningClaim, Competitor } from "@/generated/prisma/client";
import { FINMO_STRATEGIC_CONTEXT, FINMO_EXTENDED_CONTEXT, getAllCompetitorProfiles, SYNTHESIS_RUBRIC } from "@/lib/llm/context";

interface MonthlyPulsePromptContext {
  claims: PositioningClaim[];
  items: (IntelligenceItem & { competitor: Competitor })[];
  monthStart: string;
  monthEnd: string;
}

export function buildMonthlyPulsePrompt(ctx: MonthlyPulsePromptContext): string {
  const claimsList = ctx.claims
    .map((c, i) => `${i + 1}. [${c.id}] "${c.claimText}" — Current status: ${c.currentStatus}`)
    .join("\n");

  const tier1Items = ctx.items.filter((item) => item.competitor.tier === "TIER_1");
  const tier2Items = ctx.items.filter((item) => item.competitor.tier === "TIER_2");

  const formatItem = (item: IntelligenceItem & { competitor: Competitor }): string =>
    `- [${item.competitor.name}] ${item.summary} (${item.evidenceTier}, ${item.type})${item.simulated ? " [SIMULATED]" : ""}`;

  const tier1Section = tier1Items.length === 0
    ? "No Tier 1 competitor activity this month."
    : tier1Items.map(formatItem).join("\n");

  const tier2Section = tier2Items.length === 0
    ? "No Tier 2 competitor activity this month."
    : tier2Items.map(formatItem).join("\n");

  return `You are Finmo's competitive intelligence analyst, writing the CMO's monthly strategic briefing. This is the most important CI output — it shapes positioning decisions, content strategy, and board-level narratives.

${FINMO_STRATEGIC_CONTEXT}

COMPETITIVE LANDSCAPE (threat models for all tracked competitors):
${getAllCompetitorProfiles()}

${SYNTHESIS_RUBRIC}

${FINMO_EXTENDED_CONTEXT}

FINMO'S THREE POSITIONING CLAIMS (current status):
${claimsList}

TIER 1 COMPETITOR INTELLIGENCE (${ctx.monthStart} to ${ctx.monthEnd}):
${tier1Section}

TIER 2 COMPETITOR INTELLIGENCE (${ctx.monthStart} to ${ctx.monthEnd}):
${tier2Section}

TOTAL ITEMS: ${ctx.items.length} (Tier 1: ${tier1Items.length}, Tier 2: ${tier2Items.length})

TASK: Generate a Monthly Pulse briefing for the CMO.

RULES:
- Max 1000 words total
- Category health: Is "Treasury Operating System" gaining traction? Are competitors converging on Finmo's quadrant or staying in their lanes?
- For Tier 1 competitors: identify narrative shifts — are they changing positioning, messaging, or strategy? Use the competitor profiles above to assess what these shifts mean for Finmo specifically.
- For Tier 2 competitors: flag watch items only — brief signals worth monitoring
- For each positioning claim: assess confidence with evidence counts (for and against). Use the threat models above to determine whether evidence supports or undermines each claim.
- Include 2-3 actionable content implications — specific enough for a Head of Content Strategy to act on this week. BAD: "Create competitive content." GOOD: "Publish a 'payments platform vs. treasury operating system' comparison piece before Airwallex announces treasury features."
- Every signal must carry its evidence tier (CONFIRMED, INFERRED, or UNKNOWN)
- Focus on "so what" — why it matters for Finmo specifically, not just what happened
- Items marked [SIMULATED] should still be analyzed but noted as simulated
- If a quiet month: say so clearly. Do NOT generate filler analysis. Stability is a finding.
- Be opinionated. Strategic clarity over comprehensive coverage. The CMO asks "how do we know?" — answer that question.

OUTPUT FORMAT: Respond with ONLY valid JSON matching this exact schema:
{
  "sections": {
    "categoryHealth": string,
    "tier1Shifts": [{ "competitor": string, "narrative": string, "evidenceTier": "CONFIRMED"|"INFERRED"|"UNKNOWN" }],
    "tier2Watch": [{ "competitor": string, "signal": string }],
    "positioningConfidence": [{ "claimId": string, "claimText": string, "status": "HOLDING"|"UNDER_PRESSURE"|"CONTESTED", "evidenceForCount": number, "evidenceAgainstCount": number, "assessment": string }],
    "contentImplications": string[]
  }
}`;
}
