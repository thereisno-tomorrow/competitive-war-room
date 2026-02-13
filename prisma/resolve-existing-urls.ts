/**
 * Migration: Resolve Google News URLs for existing intelligence items.
 *
 * Iterates all items with news.google.com sourceUrls and resolves them
 * to real publisher URLs. Sequential with 200ms delay to avoid rate limiting.
 *
 * Run: npx tsx -r dotenv/config prisma/resolve-existing-urls.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { resolveGoogleNewsUrl } from "../src/lib/ingestion/google-news-url";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const items = await prisma.intelligenceItem.findMany({
    where: {
      sourceUrl: { contains: "news.google.com" },
    },
    select: { id: true, sourceUrl: true },
  });

  console.log(`Found ${items.length} items with Google News URLs`);

  let resolved = 0;
  let failed = 0;
  let unchanged = 0;

  for (const item of items) {
    try {
      const newUrl = await resolveGoogleNewsUrl(item.sourceUrl);

      if (newUrl !== item.sourceUrl && !newUrl.includes("news.google.com")) {
        await prisma.intelligenceItem.update({
          where: { id: item.id },
          data: { sourceUrl: newUrl },
        });
        resolved++;
        console.log(`  ✓ ${item.sourceUrl.slice(0, 60)}…`);
        console.log(`    → ${newUrl.slice(0, 80)}`);
      } else {
        unchanged++;
      }
    } catch (err) {
      failed++;
      console.log(
        `  ✗ ${item.id}: ${err instanceof Error ? err.message : err}`,
      );
    }

    await delay(200);
  }

  console.log(
    `\nDone: ${resolved} resolved, ${unchanged} unchanged, ${failed} failed`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
