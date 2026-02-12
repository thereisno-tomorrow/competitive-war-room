import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const updated = await prisma.dataSource.updateMany({
    where: { url: "https://www.kyriba.com/company/newsroom/" },
    data: { url: "https://www.kyriba.com/resources/" },
  });
  console.log(`Updated ${updated.count} Kyriba source URL(s)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
