import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Override prisma singleton for this script
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Patch the db module so generators use our prisma instance
import * as dbModule from "../src/lib/db";
(dbModule as { prisma: typeof prisma }).prisma = prisma;

import { ClaudeProvider } from "../src/lib/llm/claude";
import { generateWeeklyPulse } from "../src/lib/generators/weekly-pulse";

async function main() {
  const llm = new ClaudeProvider();
  console.log("Generating weekly pulse from real intel data...");
  const result = await generateWeeklyPulse(llm);
  console.log(`Done! Pulse ID: ${result.id}`);
  console.log(`Headline: ${result.headline}`);
  console.log(`Word count: ${result.wordCount}`);
  console.log(`Validation: ${result.validationStatus}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
