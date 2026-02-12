import type { IntelligenceItem, PositioningClaim, Competitor } from "@/generated/prisma/client";

interface ClaimAssessmentPromptContext {
  claim: PositioningClaim;
  evidenceItems: (IntelligenceItem & { competitor: Competitor })[];
}

export function buildClaimAssessmentPrompt(ctx: ClaimAssessmentPromptContext): string {
  const { claim } = ctx;

  const evidenceList = ctx.evidenceItems.length === 0
    ? "No evidence items available for assessment."
    : ctx.evidenceItems
        .map((item) =>
          `- [${item.competitor.name}] ${item.summary} (${item.evidenceTier}, ${item.type}, ${item.detectedAt.toISOString()})${item.simulated ? " [SIMULATED]" : ""}`
        )
        .join("\n");

  return `You are a competitive intelligence analyst for Finmo, a Series A treasury and payments platform.

POSITIONING CLAIM UNDER ASSESSMENT:
- Claim ID: ${claim.id}
- Claim: "${claim.claimText}"
- Current Status: ${claim.currentStatus}
- Last Assessed: ${claim.lastAssessed?.toISOString() ?? "Never"}

ACCUMULATED EVIDENCE (${ctx.evidenceItems.length} items):
${evidenceList}

TASK: Assess whether this positioning claim is still defensible given the accumulated evidence.

RULES:
- Evaluate each evidence item for whether it supports or undermines the claim
- Only count CONFIRMED evidence tier items as strong evidence; INFERRED items are supporting but weaker
- UNKNOWN tier items should be flagged for follow-up but not weighted heavily
- Consider the competitive landscape holistically — one strong signal can outweigh many weak ones
- Be honest: if the claim is under pressure, say so clearly. Do not default to "HOLDING" without justification.
- Simulated items should be noted but still factored into analysis
- Provide a clear rationale that the CMO can act on

STATUS DEFINITIONS:
- HOLDING: Claim remains defensible. Competitors are not materially challenging this position.
- UNDER_PRESSURE: Emerging evidence suggests competitors are beginning to challenge this claim. Monitor closely and consider proactive content.
- CONTESTED: Clear evidence that one or more competitors are directly challenging this claim. Requires strategic response.

OUTPUT FORMAT: Respond with ONLY valid JSON matching this exact schema:
{
  "claimId": string,
  "claimText": string,
  "previousStatus": "HOLDING"|"UNDER_PRESSURE"|"CONTESTED",
  "newStatus": "HOLDING"|"UNDER_PRESSURE"|"CONTESTED",
  "confidence": "HIGH"|"MEDIUM"|"LOW",
  "evidenceForCount": number,
  "evidenceAgainstCount": number,
  "rationale": string,
  "keyEvidence": [{ "competitor": string, "summary": string, "direction": "supports"|"undermines", "evidenceTier": "CONFIRMED"|"INFERRED"|"UNKNOWN" }],
  "recommendedActions": string[]
}`;
}
