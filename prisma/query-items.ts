import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const items = await prisma.intelligenceItem.findMany({
    include: { competitor: { select: { name: true } } },
    orderBy: { detectedAt: "desc" },
  });
  console.log(`Total items: ${items.length}\n`);
  for (const i of items) {
    console.log("---");
    console.log(`Competitor: ${i.competitor.name}`);
    console.log(`Type: ${i.type}`);
    console.log(`Summary: ${i.summary}`);
    console.log(`Date: ${i.detectedAt.toISOString().slice(0, 10)}`);
    console.log(`URL: ${i.sourceUrl.slice(0, 100)}`);
    console.log(`Fingerprint: ${i.eventFingerprint}`);
    console.log(`Evidence: ${i.evidenceTier}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
