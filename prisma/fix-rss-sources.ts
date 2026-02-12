import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Switch Kyriba, Airwallex, GTreasury PRESS_RSS → WEBSITE (no real RSS feeds)
  const switched = await prisma.dataSource.updateMany({
    where: {
      type: "PRESS_RSS",
      url: {
        in: [
          "https://www.kyriba.com/company/newsroom/",
          "https://www.airwallex.com/newsroom",
          "https://www.gtreasury.com/company/press",
        ],
      },
    },
    data: { type: "WEBSITE" },
  });
  console.log(`Switched ${switched.count} sources from PRESS_RSS → WEBSITE`);

  // Fix Trovata: point to real RSS feed URL
  const trovata = await prisma.dataSource.updateMany({
    where: {
      type: "PRESS_RSS",
      url: "https://trovata.io/press/",
    },
    data: { url: "https://trovata.io/feed/" },
  });
  console.log(`Updated ${trovata.count} Trovata source to real feed URL`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
