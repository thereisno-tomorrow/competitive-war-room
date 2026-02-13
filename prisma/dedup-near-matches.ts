/**
 * Second-pass dedup: merge near-duplicate fingerprints that Haiku generated
 * with slightly different wording for the same real-world event.
 *
 * This maps known variants → canonical fingerprint, updates the DB, then
 * removes duplicates (keeping earliest per competitorId + fingerprint).
 *
 * Run: npx tsx -r dotenv/config prisma/dedup-near-matches.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const dbAdapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: dbAdapter });

// Map near-duplicate fingerprints → canonical form
const MERGE_MAP: Record<string, string> = {
  // Nium/Visa stablecoin pilot (all same event)
  "visa-nium-stablecoin-pilot": "nium-visa-stablecoin-settlement-pilot",
  "nium-visa-stablecoin-settlement-partnership": "nium-visa-stablecoin-settlement-pilot",

  // Nium/Digit9 partnership
  "nium-digit9-partnership-cross-border-payouts": "nium-digit9-cross-border-payouts-partnership",

  // Nium/iPiD VoP partnership
  "nium-ipid-vop-compliance-partnership": "nium-ipid-verification-payee-collaboration",

  // Nium Australia expansion
  "nium-australia-instant-payment-expansion": "nium-australia-realtime-payout-expansion",

  // Nium/Emirates NBD expansion
  "nium-emirates-nbd-cross-border-payments-expansion": "nium-emirates-nbd-realtime-payments-expansion",

  // Ripple/GTreasury acquisition announcement (Oct 2025 — all same event)
  "ripple-gtreasury-acquisition-billion": "ripple-gtreasury-acquisition",
  "ripple-gtreasury-acquisition-1-billion": "ripple-gtreasury-acquisition",
  "ripple-gtreasury-billion-acquisition": "ripple-gtreasury-acquisition",

  // GTreasury/Ripple treasury platform launch (Jan 2026 — same product launch)
  "gtreasury-ripple-treasury-launch": "gtreasury-ripple-treasury-product-launch",
  "ripple-gtreasury-acquisition-treasury-platform": "ripple-treasury-platform-launch",
  "ripple-gtreasury-acquisition-treasury-platform-launch": "ripple-treasury-platform-launch",
};

async function main() {
  // Step 1: Normalize fingerprints using the merge map
  console.log("--- Step 1: Normalizing near-duplicate fingerprints ---");
  let normalized = 0;

  for (const [variant, canonical] of Object.entries(MERGE_MAP)) {
    const result = await prisma.intelligenceItem.updateMany({
      where: { eventFingerprint: variant },
      data: { eventFingerprint: canonical },
    });
    if (result.count > 0) {
      console.log(`  ${variant} → ${canonical} (${result.count} items)`);
      normalized += result.count;
    }
  }

  console.log(`\nNormalized ${normalized} items\n`);

  // Step 2: Find and remove duplicates (same logic as dedup-existing.ts)
  console.log("--- Step 2: Removing duplicates ---");
  const items = await prisma.intelligenceItem.findMany({
    include: { competitor: { select: { name: true } } },
    orderBy: { detectedAt: "asc" },
  });

  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const key = `${item.competitorId}::${item.eventFingerprint}`;
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
  console.log(`\nDone: ${deleted} more duplicates removed, ${remaining} items remaining`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
