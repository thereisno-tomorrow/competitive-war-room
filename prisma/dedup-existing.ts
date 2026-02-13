/**
 * Migration: Remove duplicate intelligence items based on event fingerprints.
 *
 * Groups items by (competitorId, eventFingerprint), keeps the oldest item
 * in each group, and deletes the rest. Also cleans up related signal alerts
 * that reference deleted items.
 *
 * Run: npx tsx -r dotenv/config prisma/dedup-existing.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find duplicate groups: same fingerprint + competitor
  const groups = await prisma.$queryRawUnsafe<
    { competitor_id: string; event_fingerprint: string; count: bigint }[]
  >(
    `SELECT competitor_id, event_fingerprint, COUNT(*) as count
     FROM intelligence_items
     WHERE event_fingerprint IS NOT NULL
     GROUP BY competitor_id, event_fingerprint
     HAVING COUNT(*) > 1
     ORDER BY count DESC`,
  );

  console.log(`Found ${groups.length} duplicate groups`);

  let totalDeleted = 0;

  for (const group of groups) {
    // Get all items in this group, oldest first
    const items = await prisma.intelligenceItem.findMany({
      where: {
        competitorId: group.competitor_id,
        eventFingerprint: group.event_fingerprint,
      },
      orderBy: { detectedAt: "asc" },
      select: { id: true, summary: true, sourceUrl: true, detectedAt: true },
    });

    const keep = items[0]!;
    const dupes = items.slice(1);

    console.log(
      `\n  Group: "${keep.summary.slice(0, 70)}…" (${items.length} items)`,
    );
    console.log(`    Keeping: ${keep.id} (${keep.detectedAt.toISOString()})`);

    for (const dupe of dupes) {
      // Disconnect from many-to-many relations before deleting
      await prisma.intelligenceItem.update({
        where: { id: dupe.id },
        data: {
          claimsAffected: { set: [] },
          reframes: { set: [] },
          outputs: { set: [] },
        },
      });

      await prisma.intelligenceItem.delete({ where: { id: dupe.id } });
      totalDeleted++;
      console.log(`    Deleted: ${dupe.id} (${dupe.sourceUrl.slice(0, 60)})`);
    }
  }

  // Final count
  const remaining = await prisma.intelligenceItem.count();
  console.log(
    `\nDone: ${totalDeleted} duplicates deleted, ${remaining} items remaining`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
