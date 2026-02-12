import { prisma } from "@/lib/db";
import type { LLMProvider } from "@/lib/llm/provider";
import { validateBattlecardReframe } from "@/lib/synthesis/validators";
import type { EvidenceTier } from "@/generated/prisma/client";

interface BattlecardWeakness {
  text: string;
  evidenceTier: string;
  sourceUrl: string;
}

interface UpdateResult {
  id: string;
  competitorId: string;
  weaknesses: BattlecardWeakness[];
  updated: boolean;
}

export async function updateBattlecard(
  llm: LLMProvider,
  competitorId: string,
): Promise<UpdateResult> {
  // Fetch the existing battlecard
  const battlecard = await prisma.battlecard.findUnique({
    where: { competitorId },
    include: { competitor: true },
  });

  if (!battlecard) {
    throw new Error(`Battlecard not found for competitor: ${competitorId}`);
  }

  // Query only CONFIRMED-tier intelligence items for this competitor
  const confirmedItems = await prisma.intelligenceItem.findMany({
    where: {
      competitorId,
      evidenceTier: "CONFIRMED",
    },
    include: { competitor: true },
    orderBy: { detectedAt: "desc" },
  });

  const existingWeaknesses = battlecard.weaknesses as unknown as BattlecardWeakness[];

  // If no confirmed items, keep existing weaknesses unchanged
  if (confirmedItems.length === 0) {
    return {
      id: battlecard.id,
      competitorId,
      weaknesses: existingWeaknesses,
      updated: false,
    };
  }

  // Use LLM to synthesize weaknesses from confirmed evidence
  const itemsSummary = confirmedItems
    .map(
      (item) =>
        `- ${item.summary} (${item.type}, source: ${item.sourceUrl})`,
    )
    .join("\n");

  const prompt = `You are analyzing confirmed competitive intelligence about ${battlecard.competitor.name} for Finmo's battlecard.

EXISTING WEAKNESSES:
${existingWeaknesses.map((w) => `- ${w.text} (${w.evidenceTier})`).join("\n") || "None"}

CONFIRMED INTELLIGENCE ITEMS:
${itemsSummary}

TASK: Generate an updated list of weaknesses based on confirmed evidence only.
Each weakness must be backed by specific confirmed evidence from the items above.
Keep existing weaknesses that are still valid. Add new ones from new evidence.
Remove any that are no longer supported by evidence.

RULES:
- Every weakness must be CONFIRMED tier — no inferences
- Each must include a source URL from the evidence
- Be specific and actionable — sales reps will use these in conversations
- Focus on weaknesses relative to Finmo's positioning

OUTPUT FORMAT: Respond with ONLY valid JSON:
{
  "weaknesses": [{ "text": string, "evidenceTier": "CONFIRMED", "sourceUrl": string }]
}`;

  const result = await llm.generateStructured<{
    weaknesses: BattlecardWeakness[];
  }>(prompt, {});

  // Enforce CONFIRMED-tier only — filter out any non-CONFIRMED weaknesses
  const validatedWeaknesses = result.weaknesses.filter((w) => {
    const validation = validateBattlecardReframe(
      w.evidenceTier as EvidenceTier,
    );
    return validation.valid;
  });

  // Update the battlecard — only weaknesses, NOT reframes (human-curated)
  await prisma.battlecard.update({
    where: { competitorId },
    data: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Prisma Json field accepts parsed JSON
      weaknesses: JSON.parse(JSON.stringify(validatedWeaknesses)),
    },
  });

  return {
    id: battlecard.id,
    competitorId,
    weaknesses: validatedWeaknesses,
    updated: true,
  };
}
