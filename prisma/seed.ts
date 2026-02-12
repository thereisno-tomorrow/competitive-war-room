import {
  PrismaClient,
  CompetitorTier,
  SourceType,
  SourceCadence,
  IntelType,
  EvidenceTier,
  ClaimStatus,
} from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.generatedOutput.deleteMany();
  await prisma.battlecardReframe.deleteMany();
  await prisma.battlecard.deleteMany();
  await prisma.intelligenceItem.deleteMany();
  await prisma.dataSource.deleteMany();
  await prisma.positioningClaim.deleteMany();
  await prisma.competitor.deleteMany();

  // === Positioning Claims ===
  const claim1 = await prisma.positioningClaim.create({
    data: {
      claimText:
        "Only mid-market accessible platform combining full treasury + payments",
      currentStatus: ClaimStatus.HOLDING,
    },
  });
  const claim2 = await prisma.positioningClaim.create({
    data: {
      claimText:
        "AI-native treasury intelligence (MO AI) vs. bolt-on AI from legacy players",
      currentStatus: ClaimStatus.HOLDING,
    },
  });
  const claim3 = await prisma.positioningClaim.create({
    data: {
      claimText: "Multi-jurisdiction licensing as compliance moat",
      currentStatus: ClaimStatus.HOLDING,
    },
  });

  // === Competitors ===
  const kyriba = await prisma.competitor.create({
    data: {
      name: "Kyriba",
      tier: CompetitorTier.TIER_1,
      threatenedClaims: { connect: [{ id: claim1.id }, { id: claim2.id }] },
    },
  });
  const airwallex = await prisma.competitor.create({
    data: {
      name: "Airwallex",
      tier: CompetitorTier.TIER_1,
      threatenedClaims: { connect: [{ id: claim1.id }, { id: claim3.id }] },
    },
  });
  const trovata = await prisma.competitor.create({
    data: {
      name: "Trovata",
      tier: CompetitorTier.TIER_2,
      threatenedClaims: { connect: [{ id: claim1.id }] },
    },
  });
  const nium = await prisma.competitor.create({
    data: {
      name: "Nium",
      tier: CompetitorTier.TIER_2,
      threatenedClaims: { connect: [{ id: claim3.id }] },
    },
  });
  const highradius = await prisma.competitor.create({
    data: {
      name: "HighRadius",
      tier: CompetitorTier.TIER_2,
      threatenedClaims: { connect: [{ id: claim2.id }] },
    },
  });
  const gtreasury = await prisma.competitor.create({
    data: {
      name: "GTreasury",
      tier: CompetitorTier.TIER_2,
      threatenedClaims: { connect: [{ id: claim1.id }] },
    },
  });

  // === Data Sources ===
  const sources = [
    // Kyriba - Tier 1 full monitoring
    {
      competitorId: kyriba.id,
      type: SourceType.WEBSITE,
      url: "https://www.kyriba.com/solutions/treasury/",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: kyriba.id,
      type: SourceType.CHANGELOG,
      url: "https://developer.kyriba.com/site/global/change_log/api-changelog.gsp",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: kyriba.id,
      type: SourceType.WEBSITE,
      url: "https://www.kyriba.com/resources/",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: kyriba.id,
      type: SourceType.WEBSITE,
      url: "https://www.kyriba.com/blog/",
      cadence: SourceCadence.DAILY,
    },
    // Airwallex - Tier 1 full monitoring
    {
      competitorId: airwallex.id,
      type: SourceType.WEBSITE,
      url: "https://www.airwallex.com/us",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: airwallex.id,
      type: SourceType.WEBSITE,
      url: "https://www.airwallex.com/us/pricing",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: airwallex.id,
      type: SourceType.WEBSITE,
      url: "https://www.airwallex.com/newsroom",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: airwallex.id,
      type: SourceType.CHANGELOG,
      url: "https://www.airwallex.com/us/blog/",
      cadence: SourceCadence.DAILY,
    },
    // Trovata - Tier 2
    {
      competitorId: trovata.id,
      type: SourceType.WEBSITE,
      url: "https://trovata.io/ds/treasury-platform/",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: trovata.id,
      type: SourceType.WEBSITE,
      url: "https://trovata.io/pricing/",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: trovata.id,
      type: SourceType.PRESS_RSS,
      url: "https://trovata.io/feed/",
      cadence: SourceCadence.DAILY,
    },
    // Nium - Tier 2
    {
      competitorId: nium.id,
      type: SourceType.WEBSITE,
      url: "https://www.nium.com/products",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: nium.id,
      type: SourceType.CHANGELOG,
      url: "https://docs.nium.com/changelog",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: nium.id,
      type: SourceType.STATUS_PAGE,
      url: "https://status.nium.com/",
      cadence: SourceCadence.DAILY,
    },
    // HighRadius - Tier 2
    {
      competitorId: highradius.id,
      type: SourceType.WEBSITE,
      url: "https://www.highradius.com/product/",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: highradius.id,
      type: SourceType.CHANGELOG,
      url: "https://www.highradius.com/whats-new/",
      cadence: SourceCadence.DAILY,
    },
    // GTreasury - Tier 2
    {
      competitorId: gtreasury.id,
      type: SourceType.WEBSITE,
      url: "https://www.gtreasury.com/solutions/tms/treasury-management-system",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: gtreasury.id,
      type: SourceType.WEBSITE,
      url: "https://www.gtreasury.com/company/press",
      cadence: SourceCadence.DAILY,
    },
  ];

  for (const source of sources) {
    await prisma.dataSource.create({ data: source });
  }

  // === Simulated Intelligence Items (17 items) ===
  const simulatedItems = [
    {
      competitorId: kyriba.id,
      type: IntelType.PRODUCT_CHANGE,
      rawContent:
        "Kyriba launches AI-powered cash flow forecasting module leveraging machine learning for treasury teams.",
      summary: "Kyriba adds AI cash forecasting to treasury suite",
      finmoImplication:
        "Direct challenge to MO AI positioning — Kyriba's bolt-on AI narrative weakens if their ML forecasting gains traction with mid-market prospects.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://www.kyriba.com/blog/ai-cash-forecasting",
      simulated: true,
      claimIds: [claim2.id],
    },
    {
      competitorId: kyriba.id,
      type: IntelType.MESSAGING_SHIFT,
      rawContent:
        "Kyriba website now features 'mid-market treasury solutions' section, previously enterprise-only positioning.",
      summary:
        "Kyriba signals mid-market expansion with new website section",
      finmoImplication:
        "Kyriba moving downmarket directly threatens Claim 1. Their enterprise pricing may still be a barrier, but the messaging shift signals intent.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://www.kyriba.com/solutions/mid-market/",
      simulated: true,
      claimIds: [claim1.id],
    },
    {
      competitorId: kyriba.id,
      type: IntelType.HIRING_SIGNAL,
      rawContent:
        "Kyriba posting for 5 ML engineers and a VP of AI Product in San Diego. JDs reference 'treasury intelligence' and 'predictive analytics'.",
      summary: "Kyriba hiring aggressively for AI/ML team",
      finmoImplication:
        "Validates Kyriba is serious about AI investment. Timeline: 6-12 months before new hires ship product. MO AI advantage window narrowing.",
      evidenceTier: EvidenceTier.INFERRED,
      sourceUrl: "https://linkedin.com/company/kyriba/jobs",
      simulated: true,
      claimIds: [claim2.id],
    },
    {
      competitorId: airwallex.id,
      type: IntelType.PRICING_CHANGE,
      rawContent:
        "Airwallex updates pricing page: introduces 'Treasury' tier at $499/mo with multi-currency accounts and cash visibility.",
      summary: "Airwallex launches dedicated treasury pricing tier",
      finmoImplication:
        "Airwallex bundling treasury with payments at aggressive pricing. Direct threat to Claim 1 — they're building the same combined offering.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://www.airwallex.com/us/pricing",
      simulated: true,
      alertTriggered: true,
      claimIds: [claim1.id],
    },
    {
      competitorId: airwallex.id,
      type: IntelType.PARTNERSHIP,
      rawContent:
        "Airwallex announces strategic partnership with SAP for treasury integration, enabling direct ERP connectivity.",
      summary:
        "Airwallex partners with SAP for treasury-ERP integration",
      finmoImplication:
        "SAP partnership gives Airwallex enterprise credibility in treasury. Mid-market companies using SAP B1 may see Airwallex as the easier integration path.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://www.airwallex.com/newsroom/sap-partnership",
      simulated: true,
      claimIds: [claim1.id],
    },
    {
      competitorId: airwallex.id,
      type: IntelType.REGULATORY,
      rawContent:
        "Airwallex receives MAS Major Payment Institution license upgrade, adding stored value facility to existing remittance license.",
      summary: "Airwallex expands MAS licensing in Singapore",
      finmoImplication:
        "Strengthens Airwallex's multi-jurisdiction position. They now hold licenses in AU, HK, SG, UK, EU — directly challenging Claim 3.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://www.mas.gov.sg/regulation/payments",
      simulated: true,
      claimIds: [claim3.id],
    },
    {
      competitorId: trovata.id,
      type: IntelType.PRODUCT_CHANGE,
      rawContent:
        "Trovata releases payments module, adding ACH and wire initiation to their treasury platform. Previously cash visibility only.",
      summary: "Trovata adds payments to treasury platform",
      finmoImplication:
        "Trovata evolving from treasury-only to treasury+payments — exactly Finmo's combined value prop. At $24k/year base, they're the closest mid-market threat.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://trovata.io/press/payments-launch",
      simulated: true,
      claimIds: [claim1.id],
    },
    {
      competitorId: trovata.id,
      type: IntelType.REVIEW,
      rawContent:
        "G2 review: 'Trovata is great for cash visibility but payments feel bolted on. Integration was painful. Support is responsive though.'",
      summary: "G2 review: Trovata payments module feels immature",
      finmoImplication:
        "Validates Finmo's native integration advantage — Trovata's bolt-on payments create the same UX friction Finmo avoids by building both together.",
      evidenceTier: EvidenceTier.INFERRED,
      sourceUrl: "https://www.g2.com/products/trovata/reviews",
      simulated: true,
      claimIds: [claim1.id],
    },
    {
      competitorId: nium.id,
      type: IntelType.REGULATORY,
      rawContent:
        "Nium obtains DFSA license for Dubai operations, expanding to 40+ country coverage with local payment rails.",
      summary: "Nium expands licensing to DFSA (Dubai)",
      finmoImplication:
        "Nium's licensing breadth continues to grow. At 40+ jurisdictions they have the widest coverage. Claim 3 needs to emphasize depth (treasury+payments in each) vs. Nium's breadth (payments only).",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://www.nium.com/newsroom/dfsa-license",
      simulated: true,
      claimIds: [claim3.id],
    },
    {
      competitorId: nium.id,
      type: IntelType.OUTAGE,
      rawContent:
        "Nium status page reports 4-hour degraded performance on APAC payment rails. Third incident this quarter.",
      summary:
        "Nium APAC payment rails outage — 4 hours, third this quarter",
      finmoImplication:
        "Reliability narrative opportunity. Three outages in a quarter is significant for payment infrastructure. Use in battlecard for enterprise reliability concerns.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://status.nium.com/incidents/apac-2026-01",
      simulated: true,
      alertTriggered: true,
      claimIds: [],
    },
    {
      competitorId: highradius.id,
      type: IntelType.PRODUCT_CHANGE,
      rawContent:
        "HighRadius announces 'Autonomous Treasury' — AI-driven cash positioning and investment recommendations. Claims 95% forecast accuracy.",
      summary:
        "HighRadius launches Autonomous Treasury with AI cash positioning",
      finmoImplication:
        "HighRadius making aggressive AI claims in treasury. '95% forecast accuracy' claim needs evidence tier assessment. If validated, directly challenges MO AI positioning.",
      evidenceTier: EvidenceTier.INFERRED,
      sourceUrl:
        "https://www.highradius.com/whats-new/autonomous-treasury",
      simulated: true,
      claimIds: [claim2.id],
    },
    {
      competitorId: highradius.id,
      type: IntelType.PRESS,
      rawContent:
        "HighRadius featured in Gartner Magic Quadrant for Treasury Management, positioned as 'Visionary' — up from 'Niche Player'.",
      summary:
        "HighRadius elevated to Visionary in Gartner Treasury MQ",
      finmoImplication:
        "Analyst validation strengthens HighRadius treasury credibility. Their AR/AP installed base gives them cross-sell advantage. Monitor for mid-market pricing moves.",
      evidenceTier: EvidenceTier.INFERRED,
      sourceUrl:
        "https://www.gartner.com/reviews/market/treasury-management",
      simulated: true,
      claimIds: [claim2.id],
    },
    {
      competitorId: highradius.id,
      type: IntelType.SEO_CHANGE,
      rawContent:
        "HighRadius now ranking #2 for 'AI treasury management' keywords, up from #8 last month. New content hub targeting treasury decision-makers.",
      summary: "HighRadius surging in AI treasury SEO rankings",
      finmoImplication:
        "Content strategy threat — HighRadius investing in thought leadership around AI treasury. Finmo's content team should monitor and ensure MO AI content ranks.",
      evidenceTier: EvidenceTier.INFERRED,
      sourceUrl: "https://www.semrush.com",
      simulated: true,
      claimIds: [claim2.id],
    },
    {
      competitorId: gtreasury.id,
      type: IntelType.PRODUCT_CHANGE,
      rawContent:
        "GTreasury launches 'GTreasury Essentials' — streamlined TMS for companies with $50M-$500M revenue. First explicit mid-market product.",
      summary: "GTreasury enters mid-market with Essentials tier",
      finmoImplication:
        "GTreasury explicitly targeting Finmo's segment. However, Essentials is treasury-only (no payments), preserving Claim 1 differentiation. Watch for payments additions.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl:
        "https://www.gtreasury.com/company/press/essentials-launch",
      simulated: true,
      claimIds: [claim1.id],
    },
    {
      competitorId: gtreasury.id,
      type: IntelType.PARTNERSHIP,
      rawContent:
        "GTreasury partners with Visa B2B Connect for cross-border payment capabilities integrated into TMS.",
      summary:
        "GTreasury adds cross-border payments via Visa partnership",
      finmoImplication:
        "GTreasury closing the payments gap through partnership rather than building. Integration quality will determine if this threatens Claim 1's native integration advantage.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl:
        "https://www.gtreasury.com/company/press/visa-b2b-connect",
      simulated: true,
      claimIds: [claim1.id],
    },
    {
      competitorId: kyriba.id,
      type: IntelType.PRESS,
      rawContent:
        "Kyriba announces $160M annual recurring revenue milestone. CEO quotes: 'We are the treasury operating system for the enterprise.'",
      summary:
        "Kyriba hits $160M ARR, uses 'treasury operating system' language",
      finmoImplication:
        "ALERT: Kyriba using 'treasury operating system' language — directly mirrors Finmo's category creation. At $160M ARR they have resources to own this narrative.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl:
        "https://www.kyriba.com/company/newsroom/arr-milestone",
      simulated: true,
      alertTriggered: true,
      claimIds: [claim1.id, claim2.id],
    },
    {
      competitorId: airwallex.id,
      type: IntelType.HIRING_SIGNAL,
      rawContent:
        "Airwallex posting for Head of Treasury Product and 3 treasury engineers in Singapore. JDs mention 'multi-currency cash management' and 'treasury automation'.",
      summary:
        "Airwallex hiring treasury-specific roles in Singapore",
      finmoImplication:
        "Airwallex building dedicated treasury capability in Finmo's home market. Combined with SAP partnership, indicates serious treasury push. 6-12 month product timeline.",
      evidenceTier: EvidenceTier.INFERRED,
      sourceUrl: "https://linkedin.com/company/airwallex/jobs",
      simulated: true,
      claimIds: [claim1.id],
    },
  ];

  for (const item of simulatedItems) {
    const { claimIds, ...itemData } = item;
    await prisma.intelligenceItem.create({
      data: {
        ...itemData,
        claimsAffected:
          claimIds.length > 0
            ? { connect: claimIds.map((id) => ({ id })) }
            : undefined,
      },
    });
  }

  // === Battlecards for Tier 1 ===
  await prisma.battlecard.create({
    data: {
      competitorId: kyriba.id,
      whenTheyComeUp:
        "Enterprise treasury deals where the prospect is evaluating 'safe' legacy options. Common in companies with $1B+ revenue doing RFPs. They'll mention Kyriba because every treasury consultant recommends them.",
      theirPitch: [
        "Market leader in cloud treasury management",
        "25+ years of treasury expertise",
        "Connected to 1000+ banks globally",
        "Enterprise-grade security and compliance",
      ],
      weaknesses: [
        {
          text: "Enterprise pricing ($150K+ ACV) locks out mid-market completely",
          evidenceTier: "CONFIRMED",
          sourceUrl: "https://www.kyriba.com/solutions/treasury/",
        },
        {
          text: "12-18 month implementation timelines reported by customers",
          evidenceTier: "CONFIRMED",
          sourceUrl: "https://www.g2.com/products/kyriba/reviews",
        },
        {
          text: "AI features are bolt-on acquisitions, not native to platform",
          evidenceTier: "INFERRED",
          sourceUrl: "https://www.kyriba.com/blog/",
        },
        {
          text: "No unified payments — treasury and payments are separate modules",
          evidenceTier: "CONFIRMED",
          sourceUrl: "https://www.kyriba.com/solutions/",
        },
      ],
      openQuestions: [
        "What is their actual mid-market pricing for the new segment push?",
        "How integrated is the AI cash forecasting with core treasury workflows?",
        "Are they losing deals to Trovata on implementation speed?",
      ],
    },
  });

  await prisma.battlecard.create({
    data: {
      competitorId: airwallex.id,
      whenTheyComeUp:
        "Cross-border payment deals where treasury visibility is a secondary need. Common in e-commerce, marketplaces, and SaaS companies with international operations. They'll mention Airwallex because of brand recognition in APAC payments.",
      theirPitch: [
        "Global payment infrastructure in 150+ countries",
        "Multi-currency accounts and FX at interbank rates",
        "Modern API-first platform",
        "Strong APAC presence and licensing",
      ],
      weaknesses: [
        {
          text: "Treasury features are shallow — cash visibility added recently, no forecasting or risk management",
          evidenceTier: "CONFIRMED",
          sourceUrl: "https://www.airwallex.com/us",
        },
        {
          text: "Built for payments first — treasury is an afterthought to retain customers asking for it",
          evidenceTier: "INFERRED",
          sourceUrl: "https://www.airwallex.com/us/pricing",
        },
        {
          text: "Enterprise treasury teams find the reporting inadequate for board-level visibility",
          evidenceTier: "INFERRED",
          sourceUrl: "https://www.g2.com/products/airwallex/reviews",
        },
        {
          text: "No AI/ML treasury intelligence — purely operational platform",
          evidenceTier: "CONFIRMED",
          sourceUrl: "https://www.airwallex.com/us",
        },
      ],
      openQuestions: [
        "How is the new Treasury pricing tier ($499/mo) performing?",
        "Are they building or buying treasury analytics capability?",
        "What's the actual SAP integration depth — API or just file export?",
      ],
    },
  });

  // === Battlecard Reframes for Tier 1 ===
  const kyribaReframes = [
    {
      competitorId: kyriba.id,
      weakness: "Enterprise pricing excludes mid-market",
      reframe:
        "Ask: 'What's your all-in cost including implementation?' Kyriba deals typically run $150K+ ACV with 12-18 month implementations. For a mid-market treasury team, that's 3-4x what you'd invest with Finmo for comparable functionality — and you'd be live in weeks, not months.",
      antiReframe:
        "Don't say 'they're too expensive' — the prospect may have budget. Instead, reframe around time-to-value: 'The question isn't just cost, it's when you start getting value.'",
      evidenceTier: EvidenceTier.CONFIRMED,
    },
    {
      competitorId: kyriba.id,
      weakness: "AI is bolt-on, not native",
      reframe:
        "Ask: 'How does their AI work with your existing treasury data?' Kyriba's AI is acquired technology layered on top of a 25-year-old platform. Finmo's MO AI was built into the platform from day one — it understands treasury context because it was designed for treasury, not retrofitted.",
      antiReframe:
        "Don't dismiss their AI entirely — they have ML capabilities. Focus on integration depth and time-to-insight instead.",
      evidenceTier: EvidenceTier.INFERRED,
    },
    {
      competitorId: kyriba.id,
      weakness: "Treasury and payments are separate modules",
      reframe:
        "Ask: 'Can you initiate a payment directly from your cash position view?' With Kyriba, treasury sees cash positions in one module and payments happen in another. Finmo unifies both — see your position, decide, and execute in one workflow.",
      antiReframe:
        "Don't claim Kyriba can't do payments — they can. The weakness is the seam between modules, not the absence of capability.",
      evidenceTier: EvidenceTier.CONFIRMED,
    },
  ];

  const airwallexReframes = [
    {
      competitorId: airwallex.id,
      weakness: "Treasury features are shallow",
      reframe:
        "Ask: 'What treasury analytics and forecasting do you get out of the box?' Airwallex gives you multi-currency accounts and basic cash visibility. Finmo gives you that plus forecasting, risk assessment, and AI-driven insights — because treasury intelligence is our core product, not an add-on.",
      antiReframe:
        "Don't underestimate their payments capability — it's genuinely strong. Focus the conversation on treasury depth, not payment breadth.",
      evidenceTier: EvidenceTier.CONFIRMED,
    },
    {
      competitorId: airwallex.id,
      weakness: "Payments-first architecture limits treasury depth",
      reframe:
        "Ask: 'Was this built for treasury teams or for payment operations?' Airwallex was built to move money. Finmo was built to manage money. When your CFO asks 'what's our 90-day cash forecast across 12 currencies?' — you need a treasury platform, not a payment platform with a dashboard.",
      antiReframe:
        "Don't say 'they're just a payments company' — they're expanding. Focus on where they are today versus where Finmo is today.",
      evidenceTier: EvidenceTier.INFERRED,
    },
    {
      competitorId: airwallex.id,
      weakness: "No AI treasury intelligence",
      reframe:
        "Ask: 'How does the platform help you make better treasury decisions — beyond showing you data?' Airwallex shows you balances and transactions. Finmo's MO AI actively identifies anomalies, forecasts cash needs, and recommends actions. It's the difference between a dashboard and an analyst.",
      antiReframe:
        "Don't claim their platform is dumb — it has good UX. The gap is in intelligence and proactive recommendations.",
      evidenceTier: EvidenceTier.CONFIRMED,
    },
    {
      competitorId: airwallex.id,
      weakness: "Licensing breadth vs depth",
      reframe:
        "Ask: 'In how many of those 150 countries can you do full treasury operations, not just payments?' Airwallex is licensed for payments in many jurisdictions. Finmo is licensed for treasury AND payments in our target markets — that's a higher regulatory bar and a deeper operational capability.",
      antiReframe:
        "Don't dismiss their licensing — 150 countries for payments is impressive. Differentiate on what the license covers (payments vs. treasury+payments).",
      evidenceTier: EvidenceTier.INFERRED,
    },
  ];

  for (const reframe of [...kyribaReframes, ...airwallexReframes]) {
    await prisma.battlecardReframe.create({ data: reframe });
  }

  console.log("Seed complete:");
  console.log(`  - ${6} competitors`);
  console.log(`  - ${3} positioning claims`);
  console.log(`  - ${sources.length} data sources`);
  console.log(`  - ${simulatedItems.length} simulated intelligence items`);
  console.log(
    `  - ${kyribaReframes.length + airwallexReframes.length} battlecard reframes`,
  );
  console.log(`  - ${2} battlecards`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
