/**
 * Migration script: convert Google News RSS redirect URLs to browser-clickable URLs.
 *
 *   /rss/articles/CBMi…  →  /articles/CBMi…
 *
 * Fixes:
 *  1. IntelligenceItem.sourceUrl
 *  2. GeneratedOutput.content JSON (SIGNAL_ALERT sourceUrls[])
 *  3. GeneratedOutput.content JSON (WEEKLY_PULSE topSignals[].sourceUrl)
 *
 * Run BEFORE the next ingestion to avoid dedup mismatches.
 *
 *   npx tsx -r dotenv/config prisma/fix-google-news-urls.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function fixUrl(url: string): string {
  return url.replace(/\/rss\/articles\//, "/articles/");
}

const RSS_PATTERN = /\/rss\/articles\//;

async function main() {
  // ── Phase 1: IntelligenceItem.sourceUrl ──
  const items = await prisma.intelligenceItem.findMany({
    where: { sourceUrl: { contains: "/rss/articles/" } },
    select: { id: true, sourceUrl: true },
  });

  let fixedItems = 0;
  for (const item of items) {
    if (RSS_PATTERN.test(item.sourceUrl)) {
      await prisma.intelligenceItem.update({
        where: { id: item.id },
        data: { sourceUrl: fixUrl(item.sourceUrl) },
      });
      fixedItems++;
    }
  }
  console.log(`Phase 1: Fixed ${fixedItems}/${items.length} IntelligenceItem sourceUrls`);

  // ── Phase 2: SIGNAL_ALERT sourceUrls in content JSON ──
  const alerts = await prisma.generatedOutput.findMany({
    where: { type: "SIGNAL_ALERT" },
    select: { id: true, content: true },
  });

  let fixedAlerts = 0;
  for (const alert of alerts) {
    const content = alert.content as Record<string, unknown>;
    const sections = content?.sections as Record<string, unknown> | undefined;
    const sourceUrls = sections?.sourceUrls as string[] | undefined;

    if (!sourceUrls?.length) continue;

    const fixed = sourceUrls.map((url) => fixUrl(url));
    const changed = fixed.some((url, i) => url !== sourceUrls[i]);

    if (changed) {
      sections!.sourceUrls = fixed;
      await prisma.generatedOutput.update({
        where: { id: alert.id },
        data: { content: JSON.parse(JSON.stringify(content)) },
      });
      fixedAlerts++;
    }
  }
  console.log(`Phase 2: Fixed ${fixedAlerts}/${alerts.length} SIGNAL_ALERT sourceUrls`);

  // ── Phase 3: WEEKLY_PULSE topSignals[].sourceUrl ──
  const pulses = await prisma.generatedOutput.findMany({
    where: { type: "WEEKLY_PULSE" },
    select: { id: true, content: true },
  });

  let fixedPulses = 0;
  for (const pulse of pulses) {
    const content = pulse.content as Record<string, unknown>;
    const sections = content?.sections as Record<string, unknown> | undefined;
    const topSignals = sections?.topSignals as Array<Record<string, unknown>> | undefined;

    if (!topSignals?.length) continue;

    let changed = false;
    for (const signal of topSignals) {
      const url = signal.sourceUrl as string | undefined;
      if (url && RSS_PATTERN.test(url)) {
        signal.sourceUrl = fixUrl(url);
        changed = true;
      }
    }

    if (changed) {
      await prisma.generatedOutput.update({
        where: { id: pulse.id },
        data: { content: JSON.parse(JSON.stringify(content)) },
      });
      fixedPulses++;
    }
  }
  console.log(`Phase 3: Fixed ${fixedPulses}/${pulses.length} WEEKLY_PULSE topSignal sourceUrls`);

  console.log("\nDone.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
