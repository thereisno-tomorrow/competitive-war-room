import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const items = await prisma.intelligenceItem.findMany({
    where: { simulated: false },
    include: { source: { select: { type: true, url: true } } },
    orderBy: { detectedAt: "desc" },
  });

  for (const item of items) {
    console.log("---");
    console.log("sourceType:", item.source?.type, "|", item.source?.url);
    console.log("intelType:", item.type, "| tier:", item.evidenceTier);
    console.log("summary:", (item.summary || "").slice(0, 140));
    console.log("sourceUrl:", item.sourceUrl);
  }
  console.log("---");
  console.log("Total real items:", items.length);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
