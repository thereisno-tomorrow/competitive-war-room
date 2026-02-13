import type { IntelligenceItem, PositioningClaim, Competitor } from "@/generated/prisma/client";
import { FINMO_STRATEGIC_CONTEXT, FINMO_EXTENDED_CONTEXT, getCompetitorProfile, SYNTHESIS_RUBRIC } from "@/lib/llm/context";

interface SignalAlertPromptContext {
  item: IntelligenceItem & { competitor: Competitor };
  claims: PositioningClaim[];
  alertReasons: string[];
}

export function buildSignalAlertPrompt(ctx: SignalAlertPromptContext): string {
  const { item } = ctx;

  const claimsList = ctx.claims
    .map((c, i) => `${i + 1}. [${c.id}] "${c.claimText}" — Current status: ${c.currentStatus}`)
    .join("\n");

  const alertReasonsList = ctx.alertReasons
    .map((r, i) => `${i + 1}. ${r}`)
    .join("\n");

  const competitorProfile = getCompetitorProfile(item.competitor.name);

  return `You are Finmo's competitive intelligence analyst, briefing the CMO on a significant competitive event.

${FINMO_STRATEGIC_CONTEXT}

COMPETITOR CONTEXT:
${competitorProfile}

${SYNTHESIS_RUBRIC}

${FINMO_EXTENDED_CONTEXT}

TRIGGERING EVENT:
- Competitor: ${item.competitor.name} (${item.competitor.tier})
- Type: ${item.type}
- Summary: ${item.summary}
- Evidence Tier: ${item.evidenceTier}
- Source URL: ${item.sourceUrl ?? "N/A"}
- Detected: ${item.detectedAt.toISOString()}
- Finmo Implication: ${item.finmoImplication ?? "Not yet assessed"}
${item.simulated ? "- STATUS: [SIMULATED DATA]\n" : ""}
RAW CONTENT:
${item.rawContent ?? "No raw content available."}

ALERT TRIGGERED BECAUSE:
${alertReasonsList}

FINMO'S THREE POSITIONING CLAIMS:
${claimsList}

TASK: Generate a Signal Alert for the CMO about this specific event.

RULES:
- Be factual about what happened, opinionated about why it matters
- Clearly state the evidence tier of the triggering event
- Identify which of Finmo's positioning claims are affected (by claim ID)
- Provide a specific recommended response — not generic advice
- Action items should be concrete and assignable
- Include source URLs where available
- If the item is simulated, note this clearly but still provide full analysis
- Focus on "so what" for Finmo — this is intelligence, not information

OUTPUT FORMAT: Respond with ONLY valid JSON matching this exact schema:
{
  "sections": {
    "whatHappened": string,
    "whyItMatters": string,
    "evidenceTier": "CONFIRMED"|"INFERRED"|"UNKNOWN",
    "claimsAffected": string[],
    "recommendedResponse": string,
    "actionItems": string[],
    "sourceUrls": string[]
  }
}`;
}
