/**
 * Migration: Re-generate fingerprints with LLM eventKeys, then remove duplicates.
 *
 * Existing items have old hex fingerprints that miss cross-publisher duplicates.
 * This script:
 * 1. Uses Haiku to generate an eventKey from each item's summary (~$0.01 total)
 * 2. Updates fingerprints using the new eventKey-based algorithm
 * 3. Removes duplicates: for items sharing (competitorId, fingerprint), keeps earliest
 *
 * Run: npx tsx -r dotenv/config prisma/dedup-existing.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { generateEventFingerprint } from "../src/lib/ingestion/event-fingerprint";

const dbAdapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: dbAdapter });
const anthropic = new Anthropic();

async function getEventKey(summary: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: `Generate a canonical event key for this intelligence summary. Format: lowercase-hyphenated, 3-6 segments. No dates. Just the company and what happened.

Examples:
- "Nium announces three new C-suite hires" → "nium-c-suite-hires"
- "Ripple acquired GTreasury for $1 billion" → "ripple-gtreasury-acquisition"
- "Kyriba launches AI cash forecasting" → "kyriba-ai-cash-forecasting-launch"
- "Nium secured a payment license in Brazil" → "nium-brazil-payment-license"

Summary: "${summary}"

Respond with ONLY the event key, nothing else.`,
    }],
  });

  const block = response.content[0];
  if (block && block.type === "text") {
    return block.text.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  }
  return "";
}

async function main() {
  const items = await prisma.intelligenceItem.findMany({
    include: { competitor: { select: { name: true } } },
    orderBy: { detectedAt: "asc" },
  });

  console.log(`Found ${items.length} intelligence items\n`);

  // Step 1: Generate eventKeys and update fingerprints
  console.log("--- Step 1: Generating eventKeys via Haiku ---");
  type ItemWithMeta = typeof items[number] & { newFingerprint: string };
  const updated: ItemWithMeta[] = [];

  for (const item of items) {
    const eventKey = await getEventKey(item.summary);
    const fingerprint = generateEventFingerprint(eventKey, item.summary);

    console.log(`  ${item.competitor.name.padEnd(12)} | ${fingerprint.padEnd(40)} | ${item.summary.slice(0, 50)}`);

    if (item.eventFingerprint !== fingerprint) {
      await prisma.intelligenceItem.update({
        where: { id: item.id },
        data: { eventFingerprint: fingerprint },
      });
    }

    updated.push({ ...item, newFingerprint: fingerprint });
  }

  // Step 2: Group by (competitorId, fingerprint) and remove duplicates
  console.log("\n--- Step 2: Removing duplicates ---");
  const groups = new Map<string, ItemWithMeta[]>();

  for (const item of updated) {
    const key = `${item.competitorId}::${item.newFingerprint}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  let deleted = 0;

  for (const [key, group] of groups) {
    if (group.length <= 1) continue;

    const [keep, ...dupes] = group;
    const fpLabel = key.split("::")[1];
    console.log(`\n  "${fpLabel}" (${group.length} items → keeping 1)`);
    console.log(`    KEEP: ${keep!.summary.slice(0, 80)}`);

    for (const dupe of dupes) {
      console.log(`    DEL:  ${dupe.summary.slice(0, 80)}`);

      // Disconnect many-to-many relations before deleting
      await prisma.intelligenceItem.update({
        where: { id: dupe.id },
        data: {
          claimsAffected: { set: [] },
          reframes: { set: [] },
          outputs: { set: [] },
        },
      });

      await prisma.intelligenceItem.delete({ where: { id: dupe.id } });
      deleted++;
    }
  }

  const remaining = await prisma.intelligenceItem.count();
  console.log(`\nDone: ${deleted} duplicates removed, ${remaining} items remaining`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
