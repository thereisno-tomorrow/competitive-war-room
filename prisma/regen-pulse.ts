import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Mark all items as alertTriggered so the generate endpoint skips signal alerts
  // and goes straight to pulse generation
  const result = await prisma.intelligenceItem.updateMany({
    where: { alertTriggered: false },
    data: { alertTriggered: true },
  });
  console.log(`Marked ${result.count} items as alertTriggered`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
