import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * One-off cleanup: delete hallucinated IntelligenceItems from STATE sources.
 *
 * Root cause: the ingestion pipeline had no baseline handling — first scrape
 * of hash-based sources sent full page content to LLM, which invented
 * events from static content (e.g. "Trovata introduced tiered pricing").
 *
 * This script:
 *  1. Deletes non-simulated items linked to STATE source types
 *  2. Resets lastContentHash on those sources so next ingest stores a clean baseline
 *
 * STATE sources: WEBSITE, STATUS_PAGE, CHANGELOG (all use hash-based detection
 * on full page blobs — only PRESS_RSS with per-item parsing is truly EVENT).
 */

const STATE_SOURCE_TYPES = ["WEBSITE", "STATUS_PAGE", "CHANGELOG"] as const;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find all STATE data sources
  const stateSources = await prisma.dataSource.findMany({
    where: { type: { in: [...STATE_SOURCE_TYPES] } },
    select: { id: true, type: true, url: true },
  });

  const sourceIds = stateSources.map((s) => s.id);
  console.log(`Found ${stateSources.length} STATE sources:`);
  for (const s of stateSources) {
    console.log(`  [${s.type}] ${s.url}`);
  }

  // Delete non-simulated intel items from those sources
  const deleted = await prisma.intelligenceItem.deleteMany({
    where: {
      sourceId: { in: sourceIds },
      simulated: false,
    },
  });
  console.log(`\nDeleted ${deleted.count} hallucinated intel items from STATE sources`);

  // Reset content hashes so next ingest captures a clean baseline
  const reset = await prisma.dataSource.updateMany({
    where: { id: { in: sourceIds } },
    data: { lastContentHash: null },
  });
  console.log(`Reset content hashes on ${reset.count} STATE sources`);

  console.log("\nDone. Next ingest will store baselines for these sources (0 items created).");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
