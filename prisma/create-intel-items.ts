import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const competitors = await prisma.competitor.findMany({ take: 2 });
  const sources = await prisma.dataSource.findMany({ take: 2 });
  if (competitors.length < 2 || sources.length < 2) {
    console.log("Not enough competitors/sources. Run seed first.");
    return;
  }

  const item1 = await prisma.intelligenceItem.create({
    data: {
      competitorId: competitors[0]!.id,
      sourceId: sources[0]!.id,
      type: "MESSAGING_SHIFT",
      rawContent: "Kyriba hits $160M ARR milestone, uses treasury operating system language in press release",
      summary: "Kyriba hits $160M ARR, uses treasury operating system language",
      evidenceTier: "CONFIRMED",
      sourceUrl:
        "https://news.google.com/articles/CBMikAFBVV95cUxNUlZ5UnJDRjFiTEVZamd2VE1FWmVpZC1jdlpYRkFaRDhqNzAzSDdlNWs3WVA1N0ZVb3Q2QzBkUUhDOVNvZEl1SFg2R0VCMnkxQVpScW9saTZVLVFxN2VJMHhKWnFVOWcxTG41RmlxdXd3RDBjbGQwRmxxSjAzdGt0TlV6Rm1vaEFJb2lwVk1va0o",
      detectedAt: new Date(Date.now() - 2 * 86400000),
      simulated: true,
      finmoImplication: "Kyriba mirroring Finmo category language at $160M ARR scale",
    },
  });

  const item2 = await prisma.intelligenceItem.create({
    data: {
      competitorId: competitors[1]!.id,
      sourceId: sources[1]!.id,
      type: "PRICING_CHANGE",
      rawContent: "Airwallex introduces Treasury pricing tier at $499/mo with multi-currency accounts",
      summary: "Airwallex launches treasury tier at $499/mo",
      evidenceTier: "CONFIRMED",
      sourceUrl: "https://www.airwallex.com/us/pricing",
      detectedAt: new Date(Date.now() - 4 * 86400000),
      simulated: true,
      finmoImplication: "Direct threat to Claim 1 — combined treasury+payments at mid-market price",
    },
  });

  console.log("Created intel items:", item1.id, item2.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
