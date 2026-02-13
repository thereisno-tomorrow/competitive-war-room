import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const items = await prisma.intelligenceItem.findMany({
    select: { id: true, sourceUrl: true, rawContent: true, sourceId: true },
  });
  for (const i of items) {
    console.log("ID:", i.id);
    console.log("URL:", i.sourceUrl);
    console.log("Content:", i.rawContent.slice(0, 300));
    console.log("---");
  }

  // Also check what the data source URL is
  if (items[0]?.sourceId) {
    const source = await prisma.dataSource.findUnique({
      where: { id: items[0].sourceId },
      select: { url: true, type: true },
    });
    console.log("Source feed:", source?.url);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
