import {
  PrismaClient,
  CompetitorTier,
  SourceType,
  SourceCadence,
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
    // --- Google News RSS feeds (per-competitor) ---
    // Aggregates all press coverage about each competitor from industry press,
    // business news, competitor newsrooms, etc. into individual articles.
    {
      competitorId: kyriba.id,
      type: SourceType.PRESS_RSS,
      url: "https://news.google.com/rss/search?q=Kyriba+fintech",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: airwallex.id,
      type: SourceType.PRESS_RSS,
      url: "https://news.google.com/rss/search?q=Airwallex",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: trovata.id,
      type: SourceType.PRESS_RSS,
      url: "https://news.google.com/rss/search?q=Trovata+treasury",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: nium.id,
      type: SourceType.PRESS_RSS,
      url: "https://news.google.com/rss/search?q=Nium+payments",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: highradius.id,
      type: SourceType.PRESS_RSS,
      url: "https://news.google.com/rss/search?q=HighRadius",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: gtreasury.id,
      type: SourceType.PRESS_RSS,
      url: "https://news.google.com/rss/search?q=GTreasury",
      cadence: SourceCadence.DAILY,
    },

    // --- Competitor direct RSS ---
    {
      competitorId: trovata.id,
      type: SourceType.PRESS_RSS,
      url: "https://trovata.io/feed/",
      cadence: SourceCadence.DAILY,
    },

    // --- High-value STATE sources (pricing, status) ---
    {
      competitorId: airwallex.id,
      type: SourceType.WEBSITE,
      url: "https://www.airwallex.com/us/pricing",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: trovata.id,
      type: SourceType.WEBSITE,
      url: "https://trovata.io/pricing/",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: nium.id,
      type: SourceType.STATUS_PAGE,
      url: "https://status.nium.com/",
      cadence: SourceCadence.DAILY,
    },
  ];

  for (const source of sources) {
    await prisma.dataSource.create({ data: source });
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
