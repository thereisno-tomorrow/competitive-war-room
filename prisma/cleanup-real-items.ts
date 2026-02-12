import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Delete all non-simulated intel items (from previous ingestion runs with bad URLs/dates)
  const deleted = await prisma.intelligenceItem.deleteMany({
    where: { simulated: false },
  });
  console.log(`Deleted ${deleted.count} real intel items`);

  // Reset content hashes so all sources are re-ingested fresh
  const reset = await prisma.dataSource.updateMany({
    data: { lastContentHash: null },
  });
  console.log(`Reset content hashes on ${reset.count} sources`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
