import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Delete all signal alerts (test data from debugging session)
  const deleted = await prisma.generatedOutput.deleteMany({
    where: { type: "SIGNAL_ALERT" },
  });
  console.log(`Deleted ${deleted.count} signal alerts`);

  // 2. Also delete old weekly/monthly pulses, keep only the latest of each
  const latestMonthly = await prisma.generatedOutput.findFirst({
    where: { type: "MONTHLY_PULSE" },
    orderBy: { publishedAt: "desc" },
    select: { id: true },
  });
  const latestWeekly = await prisma.generatedOutput.findFirst({
    where: { type: "WEEKLY_PULSE" },
    orderBy: { publishedAt: "desc" },
    select: { id: true },
  });

  const keepIds = [latestMonthly?.id, latestWeekly?.id].filter(Boolean) as string[];
  if (keepIds.length > 0) {
    const oldPulses = await prisma.generatedOutput.deleteMany({
      where: {
        type: { in: ["WEEKLY_PULSE", "MONTHLY_PULSE"] },
        id: { notIn: keepIds },
      },
    });
    console.log(`Deleted ${oldPulses.count} old pulses (kept latest of each)`);
  }

  // 3. Reset alertTriggered so next generation run can pick fresh items
  const reset = await prisma.intelligenceItem.updateMany({
    where: { alertTriggered: true },
    data: { alertTriggered: false },
  });
  console.log(`Reset alertTriggered on ${reset.count} items`);

  // 4. Show what's left
  const remaining = await prisma.generatedOutput.findMany({
    select: { type: true, headline: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
  });
  console.log(`\nRemaining outputs: ${remaining.length}`);
  for (const r of remaining) {
    console.log(`  ${r.type} | ${r.headline.slice(0, 70)}...`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
