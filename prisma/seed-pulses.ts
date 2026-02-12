import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const claims = await prisma.positioningClaim.findMany();
  const items = await prisma.intelligenceItem.findMany({
    take: 5,
    include: { competitor: true },
  });

  // Weekly Pulse
  const weeklyContent = {
    sections: {
      topSignals: [
        {
          competitor: "Kyriba",
          summary:
            "Launched AI cash forecasting module targeting mid-market",
          implication:
            "Directly challenges MO AI positioning — bolt-on narrative weakens if their ML forecasting gains traction",
          evidenceTier: "CONFIRMED",
          sourceUrl: "https://www.kyriba.com/blog/ai-cash-forecasting",
        },
        {
          competitor: "Airwallex",
          summary:
            "New Treasury pricing tier at $499/mo with multi-currency accounts",
          implication:
            "Aggressive treasury+payments bundling at mid-market price point. Direct threat to Claim 1.",
          evidenceTier: "CONFIRMED",
          sourceUrl: "https://www.airwallex.com/us/pricing",
        },
        {
          competitor: "Kyriba",
          summary:
            "Kyriba hits $160M ARR, uses treasury operating system language",
          implication:
            "ALERT: Kyriba mirroring Finmo category language. At $160M ARR they can own this narrative.",
          evidenceTier: "CONFIRMED",
          sourceUrl:
            "https://www.kyriba.com/company/newsroom/arr-milestone",
        },
      ],
      claimStatuses: claims.map((c, i) => ({
        claimId: c.id,
        claimText: c.claimText,
        status: i === 1 ? "UNDER_PRESSURE" : "HOLDING",
        changeFromLastWeek: i === 1 ? "degraded" : "unchanged",
      })),
      actionRequired:
        "Review MO AI messaging in light of Kyriba AI launch. Prepare counter-narrative for treasury operating system language overlap.",
      outlook:
        "AI positioning under increasing pressure from both Kyriba and HighRadius. Treasury+payments claim remains stable — competitors adding payments through partnerships rather than native builds. Compliance moat holding but Airwallex licensing expansion narrows the gap.",
    },
  };

  const weekly = await prisma.generatedOutput.create({
    data: {
      type: "WEEKLY_PULSE",
      headline:
        "Kyriba mirrors treasury OS language at $160M ARR — AI claims under pressure from two fronts",
      content: weeklyContent,
      wordCount: 247,
      validationStatus: "PASSED",
      publishedAt: new Date(),
      intelligenceItems: {
        connect: items.slice(0, 3).map((i) => ({ id: i.id })),
      },
    },
  });

  // Signal Alert 1
  const alert1 = await prisma.generatedOutput.create({
    data: {
      type: "SIGNAL_ALERT",
      headline:
        "Kyriba adopts treasury operating system language — direct narrative collision",
      content: {
        sections: {
          whatHappened:
            "Kyriba CEO used the phrase 'treasury operating system' in their $160M ARR announcement, directly mirroring Finmo's category language.",
          whyItMatters:
            "Category creation is only defensible if you own the language. Kyriba at $160M ARR has the marketing spend to saturate this positioning. Every month without response increases the risk of Kyriba owning the treasury OS narrative.",
          evidenceTier: "CONFIRMED",
          claimsAffected: [claims[0].claimText, claims[1].claimText],
          recommendedResponse:
            "Convene messaging working group this week. Draft differentiated positioning that acknowledges the category while emphasizing what Kyriba cannot claim: native payments integration and AI-first architecture.",
          actionItems: [
            "Audit all Finmo marketing materials for treasury OS references",
            "Draft comparison one-pager: Finmo treasury OS vs. Kyriba treasury OS",
            "Brief sales team on counter-positioning by Friday",
            "Schedule SEO content sprint for treasury operating system keywords",
          ],
          sourceUrls: [
            "https://www.kyriba.com/company/newsroom/arr-milestone",
          ],
        },
      },
      wordCount: 165,
      validationStatus: "PASSED",
      publishedAt: new Date(Date.now() - 2 * 86400000),
      intelligenceItems: { connect: [{ id: items[0].id }] },
    },
  });

  // Signal Alert 2
  const alert2 = await prisma.generatedOutput.create({
    data: {
      type: "SIGNAL_ALERT",
      headline:
        "Airwallex launches treasury tier — payments giant enters mid-market treasury",
      content: {
        sections: {
          whatHappened:
            "Airwallex introduced a dedicated Treasury pricing tier at $499/month, bundling multi-currency accounts, cash visibility, and payment initiation in a single package aimed squarely at mid-market companies.",
          whyItMatters:
            "This is the most direct competitive move against Claim 1 this quarter. Airwallex is building the exact combined treasury+payments offering that Finmo claims as unique. At $499/mo, they are price-competitive with Finmo for smaller treasury teams.",
          evidenceTier: "CONFIRMED",
          claimsAffected: [claims[0].claimText],
          recommendedResponse:
            "Emphasize depth over breadth. Airwallex treasury features are shallow — no forecasting, no risk management, no AI intelligence. Position as: they give you a dashboard, we give you an analyst.",
          actionItems: [
            "Update Airwallex battlecard with new pricing tier details",
            "Create feature comparison matrix: Finmo vs Airwallex Treasury tier",
            "Prepare objection handling for price-sensitive prospects",
          ],
          sourceUrls: ["https://www.airwallex.com/us/pricing"],
        },
      },
      wordCount: 142,
      validationStatus: "PASSED",
      publishedAt: new Date(Date.now() - 4 * 86400000),
      intelligenceItems: { connect: [{ id: items[1].id }] },
    },
  });

  console.log("Mock pulse data inserted:");
  console.log("  Weekly pulse:", weekly.id);
  console.log("  Signal alert 1:", alert1.id);
  console.log("  Signal alert 2:", alert2.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
