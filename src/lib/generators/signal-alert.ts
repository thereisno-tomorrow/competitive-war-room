import { prisma } from "@/lib/db";
import type { LLMProvider } from "@/lib/llm/provider";
import { buildSignalAlertPrompt } from "@/lib/llm/prompts/signal-alert";
import { validateSignalAlert } from "@/lib/synthesis/validators";
import { OUTPUT_LIMITS } from "@/lib/config/thresholds";
import type { SignalAlertContent } from "@/types";

interface GenerationResult {
  id: string;
  headline: string;
  content: SignalAlertContent;
  wordCount: number;
  validationStatus: "PASSED" | "REJECTED" | "REGENERATED" | "FLAGGED";
  deduplicated: boolean;
}

export async function generateSignalAlert(
  llm: LLMProvider,
  itemId: string,
  alertReasons: string[],
): Promise<GenerationResult> {
  // Fetch the triggering intelligence item
  const item = await prisma.intelligenceItem.findUnique({
    where: { id: itemId },
    include: { competitor: true },
  });

  if (!item) {
    throw new Error(`Intelligence item not found: ${itemId}`);
  }

  // Deduplication: check if an alert already exists for this item
  const existingAlerts = await prisma.generatedOutput.findMany({
    where: {
      type: "SIGNAL_ALERT",
      intelligenceItems: { some: { id: itemId } },
    },
  });

  if (existingAlerts.length > 0) {
    const existing = existingAlerts[0];
    // TypeScript strict index guard — length > 0 guarantees this exists
    if (!existing) throw new Error("Unexpected empty existing alerts array");
    return {
      id: existing.id,
      headline: existing.headline,
      // Prisma Json field → typed content; structure validated at generation time
      content: existing.content as unknown as SignalAlertContent,
      wordCount: existing.wordCount,
      // Prisma ValidationStatus enum is structurally compatible with our union
      validationStatus: existing.validationStatus as GenerationResult["validationStatus"],
      deduplicated: true,
    };
  }

  // Fetch positioning claims for context
  const claims = await prisma.positioningClaim.findMany();

  const prompt = buildSignalAlertPrompt({
    item,
    claims,
    alertReasons,
  });

  let content: SignalAlertContent | null = null;
  let validationStatus: GenerationResult["validationStatus"] = "PASSED";
  let attempts = 0;

  while (attempts < OUTPUT_LIMITS.MAX_REGENERATION_ATTEMPTS) {
    attempts++;
    content = await llm.generateStructured<SignalAlertContent>(prompt, {});

    const validation = validateSignalAlert(
      content,
      OUTPUT_LIMITS.SIGNAL_ALERT_MAX_WORDS,
    );
    if (validation.valid) {
      validationStatus = attempts > 1 ? "REGENERATED" : "PASSED";
      break;
    }

    if (attempts >= OUTPUT_LIMITS.MAX_REGENERATION_ATTEMPTS) {
      validationStatus = "REJECTED";
      console.error(
        `Signal alert rejected after ${attempts} attempts:`,
        validation.errors,
      );
    }
  }

  if (!content) throw new Error("Failed to generate signal alert content");

  const headline = `${item.competitor.name}: ${content.sections.whatHappened.slice(0, 80)}`;

  const wordCount = JSON.stringify(content).split(/\s+/).length;

  const now = new Date();

  const output = await prisma.generatedOutput.create({
    data: {
      type: "SIGNAL_ALERT",
      headline,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Prisma Json field accepts parsed JSON
      content: JSON.parse(JSON.stringify(content)),
      wordCount,
      validationStatus,
      generationMetadata: {
        attempts,
        generatedAt: now.toISOString(),
        alertReasons,
        triggeringItemId: itemId,
      },
      intelligenceItems: {
        connect: [{ id: itemId }],
      },
    },
  });

  return {
    id: output.id,
    headline,
    content,
    wordCount,
    validationStatus,
    deduplicated: false,
  };
}
