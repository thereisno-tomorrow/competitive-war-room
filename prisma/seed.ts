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
      url: "https://news.google.com/rss/search?q=%22Kyriba%22+treasury",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: airwallex.id,
      type: SourceType.PRESS_RSS,
      url: "https://news.google.com/rss/search?q=%22Airwallex%22+fintech+payments",
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
      url: "https://news.google.com/rss/search?q=%22HighRadius%22+treasury+finance",
      cadence: SourceCadence.DAILY,
    },
    {
      competitorId: gtreasury.id,
      type: SourceType.PRESS_RSS,
      url: "https://news.google.com/rss/search?q=%22GTreasury%22+treasury",
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

    // --- LinkedIn phantoms (PhantomBuster) ---
    // Placeholder agent IDs — replace with real PB phantom IDs after setup.
    // Format: pb://{phantomAgentId}/posts|jobs|company
    // Each competitor gets 3 LinkedIn sources for posts, jobs, and company info.
    ...[
      { competitor: kyriba, label: "KYRIBA" },
      { competitor: airwallex, label: "AIRWALLEX" },
      { competitor: trovata, label: "TROVATA" },
      { competitor: nium, label: "NIUM" },
      { competitor: highradius, label: "HIGHRADIUS" },
      { competitor: gtreasury, label: "GTREASURY" },
    ].flatMap(({ competitor, label }) => [
      {
        competitorId: competitor.id,
        type: SourceType.LINKEDIN,
        url: `pb://SETUP_REQUIRED_${label}_POSTS/posts`,
        cadence: SourceCadence.DAILY,
      },
      {
        competitorId: competitor.id,
        type: SourceType.LINKEDIN,
        url: `pb://SETUP_REQUIRED_${label}_JOBS/jobs`,
        cadence: SourceCadence.DAILY,
      },
      {
        competitorId: competitor.id,
        type: SourceType.LINKEDIN,
        url: `pb://SETUP_REQUIRED_${label}_COMPANY/company`,
        cadence: SourceCadence.WEEKLY,
      },
    ]),
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
      overview:
        "Kyriba is the incumbent enterprise treasury management system — 25+ years in market, $150K+ ACV, 1000+ bank connections. Dominant in enterprise RFPs ($1B+ revenue companies). Their TAI (AI product) launched recently, positioning as 'trust-first AI' for treasury. They are Finmo's most common named competitor in mid-market deals, but their enterprise DNA — long implementations, high cost, module complexity — creates structural disadvantages when selling downmarket.",
      quickDismiss: {
        keyDismissals: [
          "Kyriba's $150K+ price tag and 12-month rollout are built for enterprises, not your team.",
          "Their treasury and payments live in separate modules — you'd still need to context-switch.",
          "Their AI is acquired technology bolted onto a 25-year-old platform, not built in.",
        ],
        talkTrack:
          "Prospects typically choose Finmo over Kyriba for three reasons: faster time-to-value measured in weeks not months, a unified treasury and payments experience in one workflow, and AI that was purpose-built for treasury from day one. Which of those matters most to your team right now?",
      },
      whyWeWin: [
        {
          point: "Unified treasury + payments vs. Kyriba's separate modules",
          context:
            "Kyriba's treasury and payments are distinct modules with separate workflows. CFOs managing cash positions in one view and executing payments in another lose time and context. Finmo's integrated platform lets you see your position, decide, and execute in a single workflow — reducing operational friction that compounds across entities.",
          action:
            "Ask: 'Can you initiate a payment directly from your cash position view today? Or do you have to switch systems?' This exposes the module seam that Kyriba can't hide.",
          evidenceTier: "CONFIRMED",
        },
        {
          point: "Weeks to go-live vs. Kyriba's 12-18 month implementations",
          context:
            "G2 reviewers consistently cite Kyriba's implementation timeline as a major pain point. For mid-market teams with 3-5 person finance departments, a 12-month project with dedicated IT resources is a non-starter. Finmo's onboarding is designed for mid-market velocity — smaller scope, faster configuration, guided setup.",
          action:
            "Ask: 'What's your timeline for having this running in production? If the answer is this quarter, let's talk about what go-live in weeks looks like.'",
          evidenceTier: "CONFIRMED",
        },
        {
          point: "Mid-market accessible pricing vs. Kyriba's $150K+ ACV floor",
          context:
            "Kyriba's total cost of ownership approaches $230K+ in year one when including implementation services. For a mid-market company managing $500M in cash, that's 3-4x what comparable Finmo functionality costs — and the Finmo investment starts delivering value immediately, not after a year of configuration.",
          action:
            "Ask: 'What's your all-in budget including implementation services and timeline costs? Let's compare total cost of ownership, not just license fees.'",
          evidenceTier: "CONFIRMED",
        },
        {
          point: "AI-native intelligence vs. Kyriba's bolt-on TAI acquisition",
          context:
            "Kyriba's TAI was acquired and layered on top of their legacy platform. Finmo's MO AI was built into the platform architecture from the start — it understands treasury context because it was designed for treasury workflows, not retrofitted onto a 25-year-old data model.",
          action:
            "Ask: 'How does their AI connect to your existing treasury data and workflows? Is it a separate interface, or embedded in the daily workflow?' This highlights integration depth vs. surface-level AI.",
          evidenceTier: "INFERRED",
        },
      ],
      whyWeLose: [
        {
          point: "Kyriba's 25-year track record and enterprise brand credibility",
          context:
            "When a CFO is presenting to the board, 'we chose Kyriba' is a safe sentence. Finmo is Series A. In risk-averse enterprise cultures, brand recognition and longevity carry weight independent of product capability. This is real, not irrational — treasury systems touch critical cash flows.",
          action:
            "Don't fight the credibility gap directly. Reframe around fit: 'Kyriba is excellent for enterprises managing $10B+ with dedicated treasury teams of 20+. For your team of 5 managing $500M, the question is whether you need that scale — or whether you need something purpose-built for how you actually operate.'",
          evidenceTier: "CONFIRMED",
        },
        {
          point: "1000+ bank connections vs. Finmo's growing bank network",
          context:
            "Kyriba's bank connectivity is genuinely deep — 25 years of SWIFT, host-to-host, and API integrations. If a prospect's primary evaluation criterion is breadth of bank connections, Kyriba wins on volume. Finmo's network is growing but cannot match this today.",
          action:
            "Shift from breadth to relevance: 'Which banks do you actually use? Let's confirm connectivity for your specific banking relationships rather than comparing total numbers.' Most mid-market companies use 5-15 banks, not 1000.",
          evidenceTier: "CONFIRMED",
        },
        {
          point: "Gartner MQ 'Leader' positioning influences shortlists",
          context:
            "Kyriba is a Gartner Magic Quadrant Leader for Treasury and Risk Management. This directly shapes enterprise shortlists and consultant recommendations. Finmo is too early-stage for MQ inclusion. Prospects who start from analyst reports will have Kyriba on the list by default.",
          action:
            "Acknowledge the analyst recognition, then redirect: 'Gartner evaluates the enterprise TMS market. We're building a different category — a Treasury Operating System designed for mid-market speed and integration. The question isn't who leads the enterprise quadrant, it's which approach fits your operating model.'",
          evidenceTier: "CONFIRMED",
        },
      ],
      trapQuestions: [
        {
          question:
            "How many people on your finance team would be dedicated to the implementation over the next 12 months?",
          whyItWorks:
            "Mid-market finance teams are 3-5 people. Kyriba implementations require dedicated project resources for 12-18 months. This question forces the prospect to confront the resource reality — they likely can't afford to have 1-2 people pulled off daily operations for a year.",
          followUp:
            "We hear that a lot. Most mid-market teams can't absorb a year-long implementation. That's why Finmo was designed for weeks-to-value, not months — your team keeps running day-to-day while we get you live.",
        },
        {
          question:
            "When you see your cash position right now, can you also see pending payments and initiate new ones from the same view?",
          whyItWorks:
            "Kyriba separates treasury visibility from payment execution. This question highlights the workflow gap without naming the competitor — the prospect realizes on their own that seeing and acting should be one step, not two.",
          followUp:
            "Finmo was built with the principle that visibility without action is incomplete. You should be able to see your position, forecast the impact, and execute — all in one workflow.",
        },
        {
          question:
            "What happens when your AI flags an anomaly — does your team get a conversational explanation, or a dashboard alert they need to interpret?",
          whyItWorks:
            "Kyriba's TAI and most enterprise AI tools surface alerts and dashboards. Finmo's MO AI is conversational — it explains what it found and why it matters in context. This question makes the prospect think about the difference between 'AI that shows data' and 'AI that tells you what to do.'",
          followUp:
            "MO AI doesn't just flag anomalies — it explains them in treasury context, suggests next steps, and learns from how your team responds. It's the difference between a dashboard and an analyst.",
        },
        {
          question:
            "What percentage of your total cost of ownership will be implementation services vs. the software license itself?",
          whyItWorks:
            "Kyriba's implementation services often equal or exceed the software cost. Most mid-market buyers haven't modeled this. The question reveals hidden costs and shifts the conversation from license price to total investment — where Finmo's advantage is largest.",
          followUp:
            "With legacy TMS platforms, implementation can run 50-100% of the license cost. Finmo's pricing is all-in — no hidden services fees, no 12-month consulting engagement to get started.",
        },
      ],
      proofPoints: [],
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
      overview:
        "Airwallex is a payments infrastructure company — $902M raised, 150+ countries, strong APAC brand, competitive FX rates. Their core value is moving money cross-border efficiently. They are Finmo's highest-consequence competitive threat not because of what they do today but because of what they could build next: with their funding and infrastructure, adding treasury capabilities is strategically logical. Currently confirmed: no treasury module, no cash forecasting, no consolidated multi-bank visibility. This is an early-warning competitor.",
      quickDismiss: {
        keyDismissals: [
          "Airwallex moves money — Finmo manages money. Treasury intelligence isn't in their product.",
          "No cash forecasting, no multi-bank visibility, no FX risk management built in.",
          "150 countries for payments, but ask how many offer full treasury operations.",
        ],
        talkTrack:
          "Prospects typically choose Finmo over Airwallex when they realize they need more than payment rails. Moving money is half the problem — seeing it, forecasting it, managing risk across entities and currencies is the other half. Airwallex solves the first. Finmo solves both. Which half is creating more friction for your team today?",
      },
      whyWeWin: [
        {
          point: "Full treasury intelligence vs. Airwallex's payment-only visibility",
          context:
            "Airwallex shows you balances and transactions. It doesn't forecast cash needs, assess FX risk, consolidate multi-bank positions, or surface anomalies. When your CFO asks 'What's our 90-day cash forecast across 12 currencies?' — Airwallex has no answer. Finmo's treasury intelligence was built for exactly that question.",
          action:
            "Ask: 'What treasury analytics and forecasting do you get out of the box today?' This exposes the gap between payment visibility and treasury intelligence.",
          evidenceTier: "CONFIRMED",
        },
        {
          point: "Integrated treasury + payments vs. payments-only with a dashboard",
          context:
            "Airwallex was architected as payment infrastructure. Their 'treasury' features were added later to retain customers who outgrew payments-only. Finmo was built from the ground up to combine treasury intelligence with payment execution — see your position, forecast the impact, and execute in one workflow.",
          action:
            "Ask: 'Was this platform built for your treasury team or for payment operations? When your CFO needs a consolidated view across all entities and banks, does the tool deliver that natively?'",
          evidenceTier: "INFERRED",
        },
        {
          point: "AI-driven treasury insights vs. no intelligence layer",
          context:
            "Airwallex has no AI or ML treasury capabilities — it's a transactional platform. Finmo's MO AI actively identifies anomalies, forecasts cash needs, and recommends actions. The difference is between a platform that shows you data and one that tells you what the data means.",
          action:
            "Ask: 'How does the platform help you make better treasury decisions — beyond showing you balances?' This highlights the gap between operational data and strategic intelligence.",
          evidenceTier: "CONFIRMED",
        },
        {
          point: "Multi-jurisdiction treasury + payments licensing vs. payments-only licenses",
          context:
            "Airwallex is licensed for payments in many jurisdictions — genuinely impressive reach. But Finmo is licensed for treasury AND payments in target markets (MAS, ASIC, FCA, DFSA pending). That's a higher regulatory bar and deeper operational capability. When compliance teams evaluate, the licensing scope matters.",
          action:
            "Ask: 'In how many of those 150 countries can you do full treasury operations — not just send and receive payments?' This distinguishes payments licensing from comprehensive financial operations licensing.",
          evidenceTier: "INFERRED",
        },
      ],
      whyWeLose: [
        {
          point: "Airwallex's 150+ country payment network dwarfs Finmo's coverage",
          context:
            "For companies whose primary need is moving money to 150+ countries with competitive FX, Airwallex's payment infrastructure is genuinely best-in-class. If the prospect's problem is primarily cross-border payments volume and their treasury needs are secondary, Airwallex's network advantage is real and hard to match.",
          action:
            "Don't compete on payment country coverage — you'll lose. Redirect: 'Airwallex is excellent at moving money. The question is whether moving money is your whole problem, or whether you also need to see, forecast, and manage that money across entities. If it's both, let's talk about what an integrated approach looks like.'",
          evidenceTier: "CONFIRMED",
        },
        {
          point: "Stronger APAC brand recognition in fintech and payments",
          context:
            "Airwallex has significant brand momentum in APAC — $902M raised, major press coverage, well-known among fintech-native companies. In APAC-headquartered deals, the Airwallex name carries weight that Finmo's Series A brand hasn't yet matched. This affects shortlist formation before you even get to a demo.",
          action:
            "Acknowledge the brand: 'Airwallex has built an impressive payments business. We respect what they've done in cross-border infrastructure. Our focus is different — we're building the treasury operating system that companies graduate to when payments alone isn't enough.'",
          evidenceTier: "CONFIRMED",
        },
        {
          point: "Modern API-first developer experience attracts technical buyers",
          context:
            "Airwallex's API documentation and developer experience are strong — purpose-built for engineering teams to integrate payment flows programmatically. If the buying decision is driven by engineering or product teams (common in marketplaces and e-commerce), Airwallex's developer experience can tip the evaluation before treasury needs enter the conversation.",
          action:
            "If the technical buyer is driving the decision, shift the conversation to the CFO: 'The engineering team will love the API. But who's managing the treasury view across all those payment flows? Let's make sure the CFO's requirements are on the evaluation criteria too.'",
          evidenceTier: "INFERRED",
        },
      ],
      trapQuestions: [
        {
          question:
            "When your CFO asks for a 90-day cash forecast across all entities and currencies, how do you generate that today?",
          whyItWorks:
            "Airwallex has no forecasting capability. This question forces the prospect to confront the gap between payment data and treasury intelligence — they're probably doing this in spreadsheets alongside Airwallex, which proves the need for a treasury platform.",
          followUp:
            "Most teams using payment platforms end up building treasury views in spreadsheets. That works until you have 10 entities across 5 currencies — then the spreadsheet becomes a risk. Finmo gives your CFO that forecast natively.",
        },
        {
          question:
            "How do you consolidate your cash position across all banks — not just the ones connected to your payment platform?",
          whyItWorks:
            "Airwallex only shows balances within Airwallex accounts. Most mid-market companies have cash across multiple banks, not all routed through one payment provider. This question exposes the visibility gap — Airwallex shows you a slice, not the full picture.",
          followUp:
            "A treasury platform should give you a consolidated view across all your banking relationships — not just the ones flowing through one provider. Finmo connects to your banks directly for a complete cash position.",
        },
        {
          question:
            "If you needed to assess your FX exposure across all entities right now, could you pull that from your current system?",
          whyItWorks:
            "Airwallex offers competitive FX rates for transactions but doesn't provide FX risk management, exposure analysis, or hedging strategy tools. This question highlights the difference between getting a good rate on a payment and actually managing currency risk at the treasury level.",
          followUp:
            "Competitive FX rates are table stakes. The real question is whether you have visibility into your total exposure and a strategy for managing it. Finmo gives treasury teams the intelligence to make FX decisions, not just execute them.",
        },
        {
          question:
            "When something unusual happens in your cash flows — a missed payment, an unexpected spike — how quickly does your team find out?",
          whyItWorks:
            "Airwallex has no anomaly detection or proactive alerting for treasury patterns. This question makes the prospect think about reactive vs. proactive treasury management — finding out about problems from a spreadsheet review vs. being alerted in real time.",
          followUp:
            "MO AI monitors your cash flows continuously and surfaces anomalies before they become problems. It's the difference between firefighting and forecasting.",
        },
      ],
      proofPoints: [],
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
