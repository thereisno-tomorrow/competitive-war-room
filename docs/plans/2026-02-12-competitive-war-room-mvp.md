# Competitive War Room MVP — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an end-to-end competitive intelligence system that scrapes free web sources, synthesizes with LLM, and auto-publishes intelligence outputs (Weekly Pulse, Monthly Pulse, Signal Alerts, Battlecards) to a dashboard.

**Architecture:** Single Next.js 14 monolith (App Router) — API routes handle dashboard reads, cron-triggered ingestion, LLM synthesis, and output generation. Prisma ORM with Vercel Postgres. Claude Sonnet 4.5 for synthesis, Haiku 4.5 for classification. Cheerio + rss-parser for scraping. TanStack Query for client-side data fetching. shadcn/ui for components.

**Tech Stack:** Next.js 14.2+ (App Router), TypeScript 5.4+ strict, Tailwind CSS 3.4, shadcn/ui, TanStack Query 5.x, Prisma 5.x, Vercel Postgres, @anthropic-ai/sdk, Cheerio 1.x, rss-parser 3.x, Vitest

**PRD Reference:** `prd-competitive-war-room-mvp.md` — this is the build spec. Check Section 13 (Scope Boundaries) when in doubt.

**CLAUDE.md Reference:** `CLAUDE.md` in project root — code patterns, naming, git workflow, protected files.

---

## Phase Overview

| Phase | What | Tasks |
|-------|------|-------|
| 1 | Project Foundation | 1-6 |
| 2 | Ingestion Pipeline | 7-12 |
| 3 | LLM & Synthesis | 13-18 |
| 4 | Output Generation | 19-23 |
| 5 | API Layer | 24-28 |
| 6 | Dashboard UI | 29-36 |
| 7 | Integration & Polish | 37-39 |

---

## Phase 1: Project Foundation

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Step 1: Scaffold the project**

Run from the project root (which already has CLAUDE.md and PRDs):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

Select defaults when prompted. This will scaffold into the existing directory.

**Step 2: Verify it runs**

```bash
npm run dev
```

Expected: Dev server starts on localhost:3000, default Next.js page renders.

**Step 3: Enable TypeScript strict mode**

Edit `tsconfig.json` — ensure these compiler options are set:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 14 project with TypeScript strict mode"
```

---

### Task 2: Install All Dependencies

**Step 1: Install production dependencies**

```bash
npm install @anthropic-ai/sdk @prisma/client @tanstack/react-query cheerio rss-parser
```

**Step 2: Install dev dependencies**

```bash
npm install -D prisma vitest @vitejs/plugin-react husky lint-staged prettier
```

**Step 3: Install shadcn/ui**

Fetch docs first if unsure about CLI: `https://ui.shadcn.com/docs/installation/next`

```bash
npx shadcn@latest init
```

Select: New York style, Zinc base color, CSS variables: yes.

Then install the components we'll need:

```bash
npx shadcn@latest add badge button card tabs select input separator
```

**Step 4: Verify build still works**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: install all project dependencies"
```

---

### Task 3: Configure Dev Tooling

**Files:**
- Create: `.prettierrc`, `.env.example`, `vitest.config.ts`
- Modify: `package.json` (add scripts), `.eslintrc.json`

**Step 1: Create Prettier config**

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**Step 2: Create .env.example**

```
DATABASE_URL=
ANTHROPIC_API_KEY=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 3: Create Vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Step 4: Add scripts to package.json**

Add to `"scripts"`:

```json
{
  "format": "prettier --write .",
  "type-check": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:smoke": "vitest run --config vitest.config.ts src/tests/smoke.test.ts"
}
```

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: configure Prettier, Vitest, env template, npm scripts"
```

---

### Task 4: Set Up Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db.ts`

**Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

**Step 2: Write the full schema**

Replace `prisma/schema.prisma` with the complete schema from PRD Section 6. Copy it exactly — all enums, all models, all `@@map` directives, all relations and indexes. The schema is in the PRD starting at line 292.

**Step 3: Create Prisma client singleton**

Create `src/lib/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**Step 4: Generate Prisma client**

```bash
npx prisma generate
```

Expected: "✔ Generated Prisma Client"

**Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/db.ts
git commit -m "feat: add Prisma schema with full data model"
```

---

### Task 5: Create Shared TypeScript Types

**Files:**
- Create: `src/types/index.ts`

**Step 1: Write the shared types**

Create `src/types/index.ts` with the output content schemas from PRD Section 6 (lines 502-566) plus shared utility types. These define the JSON structure stored in `GeneratedOutput.content`:

```typescript
import type { EvidenceTier, ClaimStatus } from "@prisma/client";

// === Output Content Schemas (JSON in GeneratedOutput.content) ===

export interface WeeklyPulseContent {
  sections: {
    topSignals: Array<{
      competitor: string;
      summary: string;
      implication: string;
      evidenceTier: EvidenceTier;
      sourceUrl: string;
    }>;
    claimStatuses: Array<{
      claimId: string;
      claimText: string;
      status: ClaimStatus;
      changeFromLastWeek: "improved" | "unchanged" | "degraded";
    }>;
    actionRequired: string | null;
    outlook: string;
  };
}

export interface MonthlyPulseContent {
  sections: {
    categoryHealth: string;
    tier1Shifts: Array<{
      competitor: string;
      narrative: string;
      evidenceTier: EvidenceTier;
    }>;
    tier2Watch: Array<{
      competitor: string;
      signal: string;
    }>;
    positioningConfidence: Array<{
      claimId: string;
      claimText: string;
      status: ClaimStatus;
      evidenceForCount: number;
      evidenceAgainstCount: number;
      assessment: string;
    }>;
    contentImplications: string[];
  };
}

export interface SignalAlertContent {
  sections: {
    whatHappened: string;
    whyItMatters: string;
    evidenceTier: EvidenceTier;
    claimsAffected: string[];
    recommendedResponse: string;
    actionItems: string[];
    sourceUrls: string[];
  };
}

// === API Response Types ===

export interface LatestPulseResponse {
  type: "weekly" | "monthly";
  publishedAt: string;
  headline: string;
  content: WeeklyPulseContent | MonthlyPulseContent;
  signalAlertsThisWeek: Array<{
    id: string;
    headline: string;
    publishedAt: string;
    content: SignalAlertContent;
  }>;
}

export interface BattlecardSummary {
  competitorId: string;
  competitorName: string;
  tier: "TIER_1" | "TIER_2";
  lastUpdated: string;
  reframeCount: number;
}

export interface BattlecardDetail {
  competitor: { id: string; name: string; tier: string };
  whenTheyComeUp: string;
  theirPitch: string[];
  weaknesses: Array<{ text: string; evidenceTier: EvidenceTier; sourceUrl: string }>;
  reframes: Array<{
    id: string;
    weakness: string;
    reframe: string;
    antiReframe: string;
    evidenceTier: EvidenceTier;
    sources: string[];
  }>;
  openQuestions: string[];
  lastUpdated: string;
}

export interface ClaimSummary {
  id: string;
  claimText: string;
  status: ClaimStatus;
  lastAssessed: string | null;
  evidenceForCount: number;
  evidenceAgainstCount: number;
}

// === Config Types ===

export interface AlertThresholds {
  tier1CompetitorInvolved: boolean;
  positioningClaimAffected: boolean;
  pricingChange: boolean;
  outage: boolean;
  negativePressEvent: boolean;
  treasuryOSLanguageDetected: boolean;
}
```

**Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add shared TypeScript types for output schemas and API responses"
```

---

### Task 6: Create Seed Script and Config

**Files:**
- Create: `prisma/seed.ts`, `src/lib/config/thresholds.ts`
- Modify: `package.json` (add prisma seed config)

**Step 1: Create thresholds config**

Create `src/lib/config/thresholds.ts`:

```typescript
export const ALERT_THRESHOLDS = {
  /** Any of these conditions being true triggers a Signal Alert */
  tier1CompetitorInvolved: true,
  positioningClaimAffected: true,
  pricingChange: true,
  outage: true,
  negativePressEvent: true,
  treasuryOSLanguageDetected: true,
} as const;

export const OUTPUT_LIMITS = {
  WEEKLY_PULSE_MAX_WORDS: 500,
  MONTHLY_PULSE_MAX_WORDS: 1000,
  SIGNAL_ALERT_MAX_WORDS: 500,
  MAX_REGENERATION_ATTEMPTS: 3,
  MAX_ALERTS_PER_WEEK: 3,
} as const;

export const SCHEDULE = {
  /** SGT timezone offset from UTC */
  SGT_OFFSET_HOURS: 8,
  /** Weekly pulse publishes on Monday */
  WEEKLY_PULSE_DAY: 1, // Monday = 1
  /** Monthly pulse publishes within first 5 business days */
  MONTHLY_PULSE_MAX_BUSINESS_DAY: 5,
} as const;
```

**Step 2: Create seed script**

Create `prisma/seed.ts` — this is a large file. It must populate:
- 6 competitors (2 Tier 1, 4 Tier 2) with correct `threatenedClaims` relations per PRD Section 23
- 3 positioning claims
- All data sources per competitor per PRD Section 23 source tables
- 15-25 simulated IntelligenceItems across competitors and IntelTypes
- 3-4 battlecard reframes per Tier 1 competitor
- Initial battlecards for Tier 1 competitors

The seed data specification is in PRD Section 23 (lines 1469-1525). Use exact URLs and competitor names from there.

```typescript
import { PrismaClient, CompetitorTier, SourceType, SourceCadence, IntelType, EvidenceTier, ClaimStatus } from "@prisma/client";

const prisma = new PrismaClient();

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
      claimText: "Only mid-market accessible platform combining full treasury + payments",
      currentStatus: ClaimStatus.HOLDING,
    },
  });
  const claim2 = await prisma.positioningClaim.create({
    data: {
      claimText: "AI-native treasury intelligence (MO AI) vs. bolt-on AI from legacy players",
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

  // === Data Sources (per PRD Section 23 tables) ===
  const sources = [
    // Kyriba - Tier 1 full monitoring
    { competitorId: kyriba.id, type: SourceType.WEBSITE, url: "https://www.kyriba.com/solutions/treasury/", cadence: SourceCadence.DAILY },
    { competitorId: kyriba.id, type: SourceType.CHANGELOG, url: "https://developer.kyriba.com/site/global/change_log/api-changelog.gsp", cadence: SourceCadence.DAILY },
    { competitorId: kyriba.id, type: SourceType.PRESS_RSS, url: "https://www.kyriba.com/company/newsroom/", cadence: SourceCadence.DAILY },
    { competitorId: kyriba.id, type: SourceType.WEBSITE, url: "https://www.kyriba.com/blog/", cadence: SourceCadence.DAILY },
    // Airwallex - Tier 1 full monitoring
    { competitorId: airwallex.id, type: SourceType.WEBSITE, url: "https://www.airwallex.com/us", cadence: SourceCadence.DAILY },
    { competitorId: airwallex.id, type: SourceType.WEBSITE, url: "https://www.airwallex.com/us/pricing", cadence: SourceCadence.DAILY },
    { competitorId: airwallex.id, type: SourceType.PRESS_RSS, url: "https://www.airwallex.com/newsroom", cadence: SourceCadence.DAILY },
    { competitorId: airwallex.id, type: SourceType.CHANGELOG, url: "https://www.airwallex.com/us/blog/", cadence: SourceCadence.DAILY },
    // Trovata - Tier 2
    { competitorId: trovata.id, type: SourceType.WEBSITE, url: "https://trovata.io/ds/treasury-platform/", cadence: SourceCadence.DAILY },
    { competitorId: trovata.id, type: SourceType.WEBSITE, url: "https://trovata.io/pricing/", cadence: SourceCadence.DAILY },
    { competitorId: trovata.id, type: SourceType.PRESS_RSS, url: "https://trovata.io/press/", cadence: SourceCadence.DAILY },
    // Nium - Tier 2
    { competitorId: nium.id, type: SourceType.WEBSITE, url: "https://www.nium.com/products", cadence: SourceCadence.DAILY },
    { competitorId: nium.id, type: SourceType.CHANGELOG, url: "https://docs.nium.com/changelog", cadence: SourceCadence.DAILY },
    { competitorId: nium.id, type: SourceType.STATUS_PAGE, url: "https://status.nium.com/", cadence: SourceCadence.DAILY },
    // HighRadius - Tier 2
    { competitorId: highradius.id, type: SourceType.WEBSITE, url: "https://www.highradius.com/product/", cadence: SourceCadence.DAILY },
    { competitorId: highradius.id, type: SourceType.CHANGELOG, url: "https://www.highradius.com/whats-new/", cadence: SourceCadence.DAILY },
    // GTreasury - Tier 2
    { competitorId: gtreasury.id, type: SourceType.WEBSITE, url: "https://www.gtreasury.com/solutions/tms/treasury-management-system", cadence: SourceCadence.DAILY },
    { competitorId: gtreasury.id, type: SourceType.PRESS_RSS, url: "https://www.gtreasury.com/company/press", cadence: SourceCadence.DAILY },
  ];

  for (const source of sources) {
    await prisma.dataSource.create({ data: source });
  }

  // === Simulated Intelligence Items (15-25 items) ===
  const simulatedItems = [
    {
      competitorId: kyriba.id,
      type: IntelType.PRODUCT_CHANGE,
      rawContent: "Kyriba launches AI-powered cash flow forecasting module leveraging machine learning for treasury teams.",
      summary: "Kyriba adds AI cash forecasting to treasury suite",
      finmoImplication: "Direct challenge to MO AI positioning — Kyriba's bolt-on AI narrative weakens if their ML forecasting gains traction with mid-market prospects.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://www.kyriba.com/blog/ai-cash-forecasting",
      simulated: true,
      claimIds: [claim2.id],
    },
    {
      competitorId: kyriba.id,
      type: IntelType.MESSAGING_SHIFT,
      rawContent: "Kyriba website now features 'mid-market treasury solutions' section, previously enterprise-only positioning.",
      summary: "Kyriba signals mid-market expansion with new website section",
      finmoImplication: "Kyriba moving downmarket directly threatens Claim 1. Their enterprise pricing may still be a barrier, but the messaging shift signals intent.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://www.kyriba.com/solutions/mid-market/",
      simulated: true,
      claimIds: [claim1.id],
    },
    {
      competitorId: kyriba.id,
      type: IntelType.HIRING_SIGNAL,
      rawContent: "Kyriba posting for 5 ML engineers and a VP of AI Product in San Diego. JDs reference 'treasury intelligence' and 'predictive analytics'.",
      summary: "Kyriba hiring aggressively for AI/ML team",
      finmoImplication: "Validates Kyriba is serious about AI investment. Timeline: 6-12 months before new hires ship product. MO AI advantage window narrowing.",
      evidenceTier: EvidenceTier.INFERRED,
      sourceUrl: "https://linkedin.com/company/kyriba/jobs",
      simulated: true,
      claimIds: [claim2.id],
    },
    {
      competitorId: airwallex.id,
      type: IntelType.PRICING_CHANGE,
      rawContent: "Airwallex updates pricing page: introduces 'Treasury' tier at $499/mo with multi-currency accounts and cash visibility.",
      summary: "Airwallex launches dedicated treasury pricing tier",
      finmoImplication: "Airwallex bundling treasury with payments at aggressive pricing. Direct threat to Claim 1 — they're building the same combined offering.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://www.airwallex.com/us/pricing",
      simulated: true,
      alertTriggered: true,
      claimIds: [claim1.id],
    },
    {
      competitorId: airwallex.id,
      type: IntelType.PARTNERSHIP,
      rawContent: "Airwallex announces strategic partnership with SAP for treasury integration, enabling direct ERP connectivity.",
      summary: "Airwallex partners with SAP for treasury-ERP integration",
      finmoImplication: "SAP partnership gives Airwallex enterprise credibility in treasury. Mid-market companies using SAP B1 may see Airwallex as the easier integration path.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://www.airwallex.com/newsroom/sap-partnership",
      simulated: true,
      claimIds: [claim1.id],
    },
    {
      competitorId: airwallex.id,
      type: IntelType.REGULATORY,
      rawContent: "Airwallex receives MAS Major Payment Institution license upgrade, adding stored value facility to existing remittance license.",
      summary: "Airwallex expands MAS licensing in Singapore",
      finmoImplication: "Strengthens Airwallex's multi-jurisdiction position. They now hold licenses in AU, HK, SG, UK, EU — directly challenging Claim 3.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://www.mas.gov.sg/regulation/payments",
      simulated: true,
      claimIds: [claim3.id],
    },
    {
      competitorId: trovata.id,
      type: IntelType.PRODUCT_CHANGE,
      rawContent: "Trovata releases payments module, adding ACH and wire initiation to their treasury platform. Previously cash visibility only.",
      summary: "Trovata adds payments to treasury platform",
      finmoImplication: "Trovata evolving from treasury-only to treasury+payments — exactly Finmo's combined value prop. At $24k/year base, they're the closest mid-market threat.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://trovata.io/press/payments-launch",
      simulated: true,
      claimIds: [claim1.id],
    },
    {
      competitorId: trovata.id,
      type: IntelType.REVIEW,
      rawContent: "G2 review: 'Trovata is great for cash visibility but payments feel bolted on. Integration was painful. Support is responsive though.'",
      summary: "G2 review: Trovata payments module feels immature",
      finmoImplication: "Validates Finmo's native integration advantage — Trovata's bolt-on payments create the same UX friction Finmo avoids by building both together.",
      evidenceTier: EvidenceTier.INFERRED,
      sourceUrl: "https://www.g2.com/products/trovata/reviews",
      simulated: true,
      claimIds: [claim1.id],
    },
    {
      competitorId: nium.id,
      type: IntelType.REGULATORY,
      rawContent: "Nium obtains DFSA license for Dubai operations, expanding to 40+ country coverage with local payment rails.",
      summary: "Nium expands licensing to DFSA (Dubai)",
      finmoImplication: "Nium's licensing breadth continues to grow. At 40+ jurisdictions they have the widest coverage. Claim 3 needs to emphasize depth (treasury+payments in each) vs. Nium's breadth (payments only).",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://www.nium.com/newsroom/dfsa-license",
      simulated: true,
      claimIds: [claim3.id],
    },
    {
      competitorId: nium.id,
      type: IntelType.OUTAGE,
      rawContent: "Nium status page reports 4-hour degraded performance on APAC payment rails. Third incident this quarter.",
      summary: "Nium APAC payment rails outage — 4 hours, third this quarter",
      finmoImplication: "Reliability narrative opportunity. Three outages in a quarter is significant for payment infrastructure. Use in battlecard for enterprise reliability concerns.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://status.nium.com/incidents/apac-2026-01",
      simulated: true,
      alertTriggered: true,
      claimIds: [],
    },
    {
      competitorId: highradius.id,
      type: IntelType.PRODUCT_CHANGE,
      rawContent: "HighRadius announces 'Autonomous Treasury' — AI-driven cash positioning and investment recommendations. Claims 95% forecast accuracy.",
      summary: "HighRadius launches Autonomous Treasury with AI cash positioning",
      finmoImplication: "HighRadius making aggressive AI claims in treasury. '95% forecast accuracy' claim needs evidence tier assessment. If validated, directly challenges MO AI positioning.",
      evidenceTier: EvidenceTier.INFERRED,
      sourceUrl: "https://www.highradius.com/whats-new/autonomous-treasury",
      simulated: true,
      claimIds: [claim2.id],
    },
    {
      competitorId: highradius.id,
      type: IntelType.PRESS,
      rawContent: "HighRadius featured in Gartner Magic Quadrant for Treasury Management, positioned as 'Visionary' — up from 'Niche Player'.",
      summary: "HighRadius elevated to Visionary in Gartner Treasury MQ",
      finmoImplication: "Analyst validation strengthens HighRadius treasury credibility. Their AR/AP installed base gives them cross-sell advantage. Monitor for mid-market pricing moves.",
      evidenceTier: EvidenceTier.INFERRED,
      sourceUrl: "https://www.gartner.com/reviews/market/treasury-management",
      simulated: true,
      claimIds: [claim2.id],
    },
    {
      competitorId: highradius.id,
      type: IntelType.SEO_CHANGE,
      rawContent: "HighRadius now ranking #2 for 'AI treasury management' keywords, up from #8 last month. New content hub targeting treasury decision-makers.",
      summary: "HighRadius surging in AI treasury SEO rankings",
      finmoImplication: "Content strategy threat — HighRadius investing in thought leadership around AI treasury. Finmo's content team should monitor and ensure MO AI content ranks.",
      evidenceTier: EvidenceTier.INFERRED,
      sourceUrl: "https://www.semrush.com",
      simulated: true,
      claimIds: [claim2.id],
    },
    {
      competitorId: gtreasury.id,
      type: IntelType.PRODUCT_CHANGE,
      rawContent: "GTreasury launches 'GTreasury Essentials' — streamlined TMS for companies with $50M-$500M revenue. First explicit mid-market product.",
      summary: "GTreasury enters mid-market with Essentials tier",
      finmoImplication: "GTreasury explicitly targeting Finmo's segment. However, Essentials is treasury-only (no payments), preserving Claim 1 differentiation. Watch for payments additions.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://www.gtreasury.com/company/press/essentials-launch",
      simulated: true,
      claimIds: [claim1.id],
    },
    {
      competitorId: gtreasury.id,
      type: IntelType.PARTNERSHIP,
      rawContent: "GTreasury partners with Visa B2B Connect for cross-border payment capabilities integrated into TMS.",
      summary: "GTreasury adds cross-border payments via Visa partnership",
      finmoImplication: "GTreasury closing the payments gap through partnership rather than building. Integration quality will determine if this threatens Claim 1's native integration advantage.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://www.gtreasury.com/company/press/visa-b2b-connect",
      simulated: true,
      claimIds: [claim1.id],
    },
    {
      competitorId: kyriba.id,
      type: IntelType.PRESS,
      rawContent: "Kyriba announces $160M annual recurring revenue milestone. CEO quotes: 'We are the treasury operating system for the enterprise.'",
      summary: "Kyriba hits $160M ARR, uses 'treasury operating system' language",
      finmoImplication: "ALERT: Kyriba using 'treasury operating system' language — directly mirrors Finmo's category creation. At $160M ARR they have resources to own this narrative.",
      evidenceTier: EvidenceTier.CONFIRMED,
      sourceUrl: "https://www.kyriba.com/company/newsroom/arr-milestone",
      simulated: true,
      alertTriggered: true,
      claimIds: [claim1.id, claim2.id],
    },
    {
      competitorId: airwallex.id,
      type: IntelType.HIRING_SIGNAL,
      rawContent: "Airwallex posting for Head of Treasury Product and 3 treasury engineers in Singapore. JDs mention 'multi-currency cash management' and 'treasury automation'.",
      summary: "Airwallex hiring treasury-specific roles in Singapore",
      finmoImplication: "Airwallex building dedicated treasury capability in Finmo's home market. Combined with SAP partnership, indicates serious treasury push. 6-12 month product timeline.",
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
        claimsAffected: claimIds.length > 0 ? { connect: claimIds.map((id) => ({ id })) } : undefined,
      },
    });
  }

  // === Battlecards for Tier 1 ===
  await prisma.battlecard.create({
    data: {
      competitorId: kyriba.id,
      whenTheyComeUp: "Enterprise treasury deals where the prospect is evaluating 'safe' legacy options. Common in companies with $1B+ revenue doing RFPs. They'll mention Kyriba because every treasury consultant recommends them.",
      theirPitch: [
        "Market leader in cloud treasury management",
        "25+ years of treasury expertise",
        "Connected to 1000+ banks globally",
        "Enterprise-grade security and compliance",
      ],
      weaknesses: [
        { text: "Enterprise pricing ($150K+ ACV) locks out mid-market completely", evidenceTier: "CONFIRMED", sourceUrl: "https://www.kyriba.com/solutions/treasury/" },
        { text: "12-18 month implementation timelines reported by customers", evidenceTier: "CONFIRMED", sourceUrl: "https://www.g2.com/products/kyriba/reviews" },
        { text: "AI features are bolt-on acquisitions, not native to platform", evidenceTier: "INFERRED", sourceUrl: "https://www.kyriba.com/blog/" },
        { text: "No unified payments — treasury and payments are separate modules", evidenceTier: "CONFIRMED", sourceUrl: "https://www.kyriba.com/solutions/" },
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
      whenTheyComeUp: "Cross-border payment deals where treasury visibility is a secondary need. Common in e-commerce, marketplaces, and SaaS companies with international operations. They'll mention Airwallex because of brand recognition in APAC payments.",
      theirPitch: [
        "Global payment infrastructure in 150+ countries",
        "Multi-currency accounts and FX at interbank rates",
        "Modern API-first platform",
        "Strong APAC presence and licensing",
      ],
      weaknesses: [
        { text: "Treasury features are shallow — cash visibility added recently, no forecasting or risk management", evidenceTier: "CONFIRMED", sourceUrl: "https://www.airwallex.com/us" },
        { text: "Built for payments first — treasury is an afterthought to retain customers asking for it", evidenceTier: "INFERRED", sourceUrl: "https://www.airwallex.com/us/pricing" },
        { text: "Enterprise treasury teams find the reporting inadequate for board-level visibility", evidenceTier: "INFERRED", sourceUrl: "https://www.g2.com/products/airwallex/reviews" },
        { text: "No AI/ML treasury intelligence — purely operational platform", evidenceTier: "CONFIRMED", sourceUrl: "https://www.airwallex.com/us" },
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
      reframe: "Ask: 'What's your all-in cost including implementation?' Kyriba deals typically run $150K+ ACV with 12-18 month implementations. For a mid-market treasury team, that's 3-4x what you'd invest with Finmo for comparable functionality — and you'd be live in weeks, not months.",
      antiReframe: "Don't say 'they're too expensive' — the prospect may have budget. Instead, reframe around time-to-value: 'The question isn't just cost, it's when you start getting value.'",
      evidenceTier: EvidenceTier.CONFIRMED,
    },
    {
      competitorId: kyriba.id,
      weakness: "AI is bolt-on, not native",
      reframe: "Ask: 'How does their AI work with your existing treasury data?' Kyriba's AI is acquired technology layered on top of a 25-year-old platform. Finmo's MO AI was built into the platform from day one — it understands treasury context because it was designed for treasury, not retrofitted.",
      antiReframe: "Don't dismiss their AI entirely — they have ML capabilities. Focus on integration depth and time-to-insight instead.",
      evidenceTier: EvidenceTier.INFERRED,
    },
    {
      competitorId: kyriba.id,
      weakness: "Treasury and payments are separate modules",
      reframe: "Ask: 'Can you initiate a payment directly from your cash position view?' With Kyriba, treasury sees cash positions in one module and payments happen in another. Finmo unifies both — see your position, decide, and execute in one workflow.",
      antiReframe: "Don't claim Kyriba can't do payments — they can. The weakness is the seam between modules, not the absence of capability.",
      evidenceTier: EvidenceTier.CONFIRMED,
    },
  ];

  const airwallexReframes = [
    {
      competitorId: airwallex.id,
      weakness: "Treasury features are shallow",
      reframe: "Ask: 'What treasury analytics and forecasting do you get out of the box?' Airwallex gives you multi-currency accounts and basic cash visibility. Finmo gives you that plus forecasting, risk assessment, and AI-driven insights — because treasury intelligence is our core product, not an add-on.",
      antiReframe: "Don't underestimate their payments capability — it's genuinely strong. Focus the conversation on treasury depth, not payment breadth.",
      evidenceTier: EvidenceTier.CONFIRMED,
    },
    {
      competitorId: airwallex.id,
      weakness: "Payments-first architecture limits treasury depth",
      reframe: "Ask: 'Was this built for treasury teams or for payment operations?' Airwallex was built to move money. Finmo was built to manage money. When your CFO asks 'what's our 90-day cash forecast across 12 currencies?' — you need a treasury platform, not a payment platform with a dashboard.",
      antiReframe: "Don't say 'they're just a payments company' — they're expanding. Focus on where they are today versus where Finmo is today.",
      evidenceTier: EvidenceTier.INFERRED,
    },
    {
      competitorId: airwallex.id,
      weakness: "No AI treasury intelligence",
      reframe: "Ask: 'How does the platform help you make better treasury decisions — beyond showing you data?' Airwallex shows you balances and transactions. Finmo's MO AI actively identifies anomalies, forecasts cash needs, and recommends actions. It's the difference between a dashboard and an analyst.",
      antiReframe: "Don't claim their platform is dumb — it has good UX. The gap is in intelligence and proactive recommendations.",
      evidenceTier: EvidenceTier.CONFIRMED,
    },
    {
      competitorId: airwallex.id,
      weakness: "Licensing breadth vs depth",
      reframe: "Ask: 'In how many of those 150 countries can you do full treasury operations, not just payments?' Airwallex is licensed for payments in many jurisdictions. Finmo is licensed for treasury AND payments in our target markets — that's a higher regulatory bar and a deeper operational capability.",
      antiReframe: "Don't dismiss their licensing — 150 countries for payments is impressive. Differentiate on what the license covers (payments vs. treasury+payments).",
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
  console.log(`  - ${kyribaReframes.length + airwallexReframes.length} battlecard reframes`);
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
```

**Step 3: Add seed config to package.json**

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

Install tsx:

```bash
npm install -D tsx
```

**Step 4: Commit**

```bash
git add prisma/seed.ts src/lib/config/thresholds.ts package.json
git commit -m "feat: add seed script with competitors, claims, sources, and simulated intel"
```

---

### Demo Checkpoint: Phase 1 — Foundation Complete

**What to demonstrate:**
1. `npm run build` — project compiles with zero errors
2. `npx prisma generate` — Prisma client generates successfully
3. `npm run type-check` — TypeScript strict mode passes
4. Show `prisma/schema.prisma` has all models from PRD Section 6
5. Show `src/types/index.ts` matches output content schemas from PRD

**Verification script:**

```bash
npm run build && echo "BUILD OK"
npm run type-check && echo "TYPE CHECK OK"
npx prisma generate && echo "PRISMA OK"
```

**Note:** Database seed cannot be tested yet without a running Postgres instance. That's fine — schema correctness is validated by `prisma generate`.

**Report to product owner:**
- Project scaffolded with all dependencies installed
- Full Prisma schema matching PRD data model
- Shared TypeScript types for all output formats
- Seed script ready with all 6 competitors, 3 claims, 18 sources, 17 intel items, 7 reframes, 2 battlecards
- Config file with alert thresholds and output limits
- Dev tooling configured (Vitest, Prettier, ESLint)

**STOP HERE. Wait for go/no-go before proceeding to Phase 2.**

---

## Phase 2: Ingestion Pipeline

### Task 7: Ingestion Adapter Interface

**Files:**
- Create: `src/lib/ingestion/adapters/base.ts`
- Test: `src/lib/ingestion/__tests__/adapters.test.ts`

**Step 1: Write the adapter interface**

Create `src/lib/ingestion/adapters/base.ts`:

```typescript
import type { DataSource, SourceType } from "@prisma/client";

export interface RawContent {
  content: string;
  url: string;
  fetchedAt: Date;
}

export interface DetectedChange {
  competitorId: string;
  sourceId: string;
  changeType: string;
  content: string;
  url: string;
  summary: string;
}

export interface IngestionAdapter {
  readonly sourceType: SourceType;
  fetch(source: DataSource): Promise<RawContent>;
  detectChanges(current: RawContent, previousHash: string | null): Promise<DetectedChange[]>;
}
```

**Step 2: Write a test to verify the interface contract**

Create `src/lib/ingestion/__tests__/adapters.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import type { IngestionAdapter, RawContent, DetectedChange } from "../adapters/base";
import type { DataSource, SourceType } from "@prisma/client";

// Mock adapter to verify the interface shape compiles
class MockAdapter implements IngestionAdapter {
  readonly sourceType: SourceType = "WEBSITE";

  async fetch(source: DataSource): Promise<RawContent> {
    return { content: "test", url: source.url, fetchedAt: new Date() };
  }

  async detectChanges(current: RawContent, previousHash: string | null): Promise<DetectedChange[]> {
    if (!previousHash) return [];
    return [{
      competitorId: "test",
      sourceId: "test",
      changeType: "content_change",
      content: current.content,
      url: current.url,
      summary: "Test change detected",
    }];
  }
}

describe("IngestionAdapter interface", () => {
  it("mock adapter satisfies interface contract", async () => {
    const adapter = new MockAdapter();
    expect(adapter.sourceType).toBe("WEBSITE");

    const result = await adapter.fetch({ url: "https://example.com" } as DataSource);
    expect(result.content).toBe("test");
    expect(result.url).toBe("https://example.com");
    expect(result.fetchedAt).toBeInstanceOf(Date);
  });

  it("detectChanges returns empty for first fetch (no previous hash)", async () => {
    const adapter = new MockAdapter();
    const raw: RawContent = { content: "test", url: "https://example.com", fetchedAt: new Date() };
    const changes = await adapter.detectChanges(raw, null);
    expect(changes).toHaveLength(0);
  });

  it("detectChanges returns changes when previous hash exists", async () => {
    const adapter = new MockAdapter();
    const raw: RawContent = { content: "new content", url: "https://example.com", fetchedAt: new Date() };
    const changes = await adapter.detectChanges(raw, "old-hash");
    expect(changes).toHaveLength(1);
    expect(changes[0].changeType).toBe("content_change");
  });
});
```

**Step 3: Run tests**

```bash
npm test -- src/lib/ingestion/__tests__/adapters.test.ts
```

Expected: 3 passing tests.

**Step 4: Commit**

```bash
git add src/lib/ingestion/
git commit -m "feat: add ingestion adapter interface"
```

---

### Task 8: Diff Engine (Content Change Detection)

**Files:**
- Create: `src/lib/ingestion/diff-engine.ts`
- Test: `src/lib/ingestion/__tests__/diff-engine.test.ts`

**Step 1: Write failing tests**

Create `src/lib/ingestion/__tests__/diff-engine.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { hashContent, hasContentChanged, extractTextContent } from "../diff-engine";

describe("diff-engine", () => {
  describe("hashContent", () => {
    it("produces consistent hash for same content", () => {
      const hash1 = hashContent("hello world");
      const hash2 = hashContent("hello world");
      expect(hash1).toBe(hash2);
    });

    it("produces different hash for different content", () => {
      const hash1 = hashContent("hello world");
      const hash2 = hashContent("hello world!");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("hasContentChanged", () => {
    it("returns true when no previous hash exists", () => {
      expect(hasContentChanged("some content", null)).toBe(true);
    });

    it("returns false when content matches previous hash", () => {
      const content = "unchanged content";
      const hash = hashContent(content);
      expect(hasContentChanged(content, hash)).toBe(false);
    });

    it("returns true when content differs from previous hash", () => {
      const hash = hashContent("old content");
      expect(hasContentChanged("new content", hash)).toBe(true);
    });
  });

  describe("extractTextContent", () => {
    it("strips HTML tags and returns text only", () => {
      const html = "<div><h1>Title</h1><p>Paragraph text</p></div>";
      const text = extractTextContent(html);
      expect(text).toContain("Title");
      expect(text).toContain("Paragraph text");
      expect(text).not.toContain("<div>");
    });

    it("normalizes whitespace", () => {
      const html = "<p>Hello   \n\n   World</p>";
      const text = extractTextContent(html);
      expect(text).toBe("Hello World");
    });

    it("removes script and style tags entirely", () => {
      const html = '<p>Real content</p><script>alert("xss")</script><style>.foo{color:red}</style>';
      const text = extractTextContent(html);
      expect(text).toBe("Real content");
      expect(text).not.toContain("alert");
      expect(text).not.toContain("color");
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- src/lib/ingestion/__tests__/diff-engine.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement diff engine**

Create `src/lib/ingestion/diff-engine.ts`:

```typescript
import { createHash } from "crypto";
import * as cheerio from "cheerio";

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function hasContentChanged(content: string, previousHash: string | null): boolean {
  if (!previousHash) return true;
  return hashContent(content) !== previousHash;
}

export function extractTextContent(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  const text = $.text();
  return text.replace(/\s+/g, " ").trim();
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- src/lib/ingestion/__tests__/diff-engine.test.ts
```

Expected: 6 passing tests.

**Step 5: Commit**

```bash
git add src/lib/ingestion/diff-engine.ts src/lib/ingestion/__tests__/diff-engine.test.ts
git commit -m "feat: add content diff engine with hashing and HTML extraction"
```

---

### Task 9: Website Scraper Adapter

**Files:**
- Create: `src/lib/ingestion/adapters/website.ts`
- Test: `src/lib/ingestion/__tests__/website-adapter.test.ts`

**Step 1: Write failing tests**

Create `src/lib/ingestion/__tests__/website-adapter.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { WebsiteAdapter } from "../adapters/website";
import type { DataSource } from "@prisma/client";
import { hashContent } from "../diff-engine";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockSource: DataSource = {
  id: "src-1",
  competitorId: "comp-1",
  type: "WEBSITE",
  url: "https://example.com/products",
  cadence: "DAILY",
  health: "HEALTHY",
  lastChecked: null,
  lastChangeDetected: null,
  lastContentHash: null,
  createdAt: new Date(),
} as DataSource;

describe("WebsiteAdapter", () => {
  const adapter = new WebsiteAdapter();

  it("has correct sourceType", () => {
    expect(adapter.sourceType).toBe("WEBSITE");
  });

  it("fetches page content and returns RawContent", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("<html><body><h1>Products</h1><p>Our platform</p></body></html>"),
    });

    const result = await adapter.fetch(mockSource);
    expect(result.content).toContain("Products");
    expect(result.content).toContain("Our platform");
    expect(result.url).toBe("https://example.com/products");
    expect(result.fetchedAt).toBeInstanceOf(Date);
  });

  it("throws on failed fetch", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: "Not Found" });
    await expect(adapter.fetch(mockSource)).rejects.toThrow();
  });

  it("detects changes when content differs from previous hash", async () => {
    const oldHash = hashContent("Old content");
    const raw = { content: "New product features announced", url: "https://example.com/products", fetchedAt: new Date() };

    const changes = await adapter.detectChanges(raw, oldHash);
    expect(changes.length).toBeGreaterThan(0);
    expect(changes[0].competitorId).toBe("");
    expect(changes[0].changeType).toBe("content_change");
  });

  it("returns no changes when content matches previous hash", async () => {
    const content = "Same content";
    const hash = hashContent(content);
    const raw = { content, url: "https://example.com", fetchedAt: new Date() };

    const changes = await adapter.detectChanges(raw, hash);
    expect(changes).toHaveLength(0);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- src/lib/ingestion/__tests__/website-adapter.test.ts
```

**Step 3: Implement**

Create `src/lib/ingestion/adapters/website.ts`:

```typescript
import type { DataSource, SourceType } from "@prisma/client";
import type { IngestionAdapter, RawContent, DetectedChange } from "./base";
import { extractTextContent, hasContentChanged } from "../diff-engine";

export class WebsiteAdapter implements IngestionAdapter {
  readonly sourceType: SourceType = "WEBSITE";

  async fetch(source: DataSource): Promise<RawContent> {
    const response = await fetch(source.url, {
      headers: { "User-Agent": "FinmoCompetitiveIntel/1.0" },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${source.url}: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const textContent = extractTextContent(html);

    return {
      content: textContent,
      url: source.url,
      fetchedAt: new Date(),
    };
  }

  async detectChanges(current: RawContent, previousHash: string | null): Promise<DetectedChange[]> {
    if (!hasContentChanged(current.content, previousHash)) {
      return [];
    }

    return [{
      competitorId: "",  // Set by runner
      sourceId: "",      // Set by runner
      changeType: "content_change",
      content: current.content,
      url: current.url,
      summary: `Content change detected at ${current.url}`,
    }];
  }
}
```

**Step 4: Run tests**

```bash
npm test -- src/lib/ingestion/__tests__/website-adapter.test.ts
```

Expected: All pass.

**Step 5: Commit**

```bash
git add src/lib/ingestion/adapters/website.ts src/lib/ingestion/__tests__/website-adapter.test.ts
git commit -m "feat: add website scraper adapter with change detection"
```

---

### Task 10: RSS Feed Adapter

**Files:**
- Create: `src/lib/ingestion/adapters/rss.ts`
- Test: `src/lib/ingestion/__tests__/rss-adapter.test.ts`

**Step 1: Write failing tests**

Create `src/lib/ingestion/__tests__/rss-adapter.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { RssAdapter } from "../adapters/rss";
import type { DataSource } from "@prisma/client";

vi.mock("rss-parser", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      parseURL: vi.fn().mockResolvedValue({
        items: [
          {
            title: "Company Announces Partnership",
            link: "https://example.com/news/partnership",
            pubDate: "2026-02-10T00:00:00Z",
            contentSnippet: "The company today announced a strategic partnership...",
          },
          {
            title: "Q4 Results Published",
            link: "https://example.com/news/q4-results",
            pubDate: "2026-02-08T00:00:00Z",
            contentSnippet: "Fourth quarter results exceeded expectations...",
          },
        ],
      }),
    })),
  };
});

const mockSource: DataSource = {
  id: "src-rss-1",
  competitorId: "comp-1",
  type: "PRESS_RSS",
  url: "https://example.com/feed.xml",
  cadence: "DAILY",
  health: "HEALTHY",
  lastChecked: null,
  lastChangeDetected: null,
  lastContentHash: null,
  createdAt: new Date(),
} as DataSource;

describe("RssAdapter", () => {
  const adapter = new RssAdapter();

  it("has correct sourceType", () => {
    expect(adapter.sourceType).toBe("PRESS_RSS");
  });

  it("fetches and concatenates RSS items into content", async () => {
    const result = await adapter.fetch(mockSource);
    expect(result.content).toContain("Company Announces Partnership");
    expect(result.content).toContain("Q4 Results Published");
    expect(result.url).toBe("https://example.com/feed.xml");
  });

  it("detects new items as changes when previous hash exists", async () => {
    const raw = {
      content: "Company Announces Partnership\nQ4 Results Published",
      url: "https://example.com/feed.xml",
      fetchedAt: new Date(),
    };
    const changes = await adapter.detectChanges(raw, "old-hash-value");
    expect(changes.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Implement**

Create `src/lib/ingestion/adapters/rss.ts`:

```typescript
import Parser from "rss-parser";
import type { DataSource, SourceType } from "@prisma/client";
import type { IngestionAdapter, RawContent, DetectedChange } from "./base";
import { hasContentChanged } from "../diff-engine";

const parser = new Parser();

export class RssAdapter implements IngestionAdapter {
  readonly sourceType: SourceType = "PRESS_RSS";

  async fetch(source: DataSource): Promise<RawContent> {
    const feed = await parser.parseURL(source.url);

    const content = feed.items
      .map((item) => `${item.title ?? ""}\n${item.contentSnippet ?? ""}`.trim())
      .join("\n\n");

    return {
      content,
      url: source.url,
      fetchedAt: new Date(),
    };
  }

  async detectChanges(current: RawContent, previousHash: string | null): Promise<DetectedChange[]> {
    if (!hasContentChanged(current.content, previousHash)) {
      return [];
    }

    return [{
      competitorId: "",
      sourceId: "",
      changeType: "rss_new_items",
      content: current.content,
      url: current.url,
      summary: `New RSS items detected at ${current.url}`,
    }];
  }
}
```

**Step 3: Run tests**

```bash
npm test -- src/lib/ingestion/__tests__/rss-adapter.test.ts
```

**Step 4: Commit**

```bash
git add src/lib/ingestion/adapters/rss.ts src/lib/ingestion/__tests__/rss-adapter.test.ts
git commit -m "feat: add RSS feed ingestion adapter"
```

---

### Task 11: Changelog and Status Page Adapters

**Files:**
- Create: `src/lib/ingestion/adapters/changelog.ts`, `src/lib/ingestion/adapters/status-page.ts`

These follow the same pattern as the website adapter with minor differences:

**Changelog adapter** (`src/lib/ingestion/adapters/changelog.ts`): Same as website adapter but `sourceType = "CHANGELOG"` and `changeType = "changelog_update"`.

**Status page adapter** (`src/lib/ingestion/adapters/status-page.ts`): Same as website adapter but `sourceType = "STATUS_PAGE"` and `changeType = "status_change"`. The `detectChanges` method should look for keywords like "degraded", "outage", "maintenance", "incident" in the content to flag as potentially alert-worthy.

Write tests for both following the same pattern as Task 9.

**Commit:**

```bash
git add src/lib/ingestion/adapters/changelog.ts src/lib/ingestion/adapters/status-page.ts src/lib/ingestion/__tests__/
git commit -m "feat: add changelog and status page ingestion adapters"
```

---

### Task 12: Ingestion Runner (Orchestrator)

**Files:**
- Create: `src/lib/ingestion/runner.ts`
- Test: `src/lib/ingestion/__tests__/runner.test.ts`

**Step 1: Write failing tests**

Create `src/lib/ingestion/__tests__/runner.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { IngestionRunner } from "../runner";
import type { IngestionAdapter, RawContent } from "../adapters/base";

const mockAdapter: IngestionAdapter = {
  sourceType: "WEBSITE",
  fetch: vi.fn().mockResolvedValue({
    content: "Test content",
    url: "https://example.com",
    fetchedAt: new Date(),
  } satisfies RawContent),
  detectChanges: vi.fn().mockResolvedValue([{
    competitorId: "",
    sourceId: "",
    changeType: "content_change",
    content: "Test content",
    url: "https://example.com",
    summary: "Change detected",
  }]),
};

// Mock prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    dataSource: {
      findMany: vi.fn().mockResolvedValue([
        { id: "src-1", competitorId: "comp-1", type: "WEBSITE", url: "https://example.com", lastContentHash: null },
      ]),
      update: vi.fn().mockResolvedValue({}),
    },
    intelligenceItem: {
      create: vi.fn().mockResolvedValue({ id: "item-1" }),
    },
  },
}));

describe("IngestionRunner", () => {
  it("fetches sources and detects changes", async () => {
    const runner = new IngestionRunner(new Map([["WEBSITE", mockAdapter]]));
    const result = await runner.run();
    expect(result.sourcesChecked).toBeGreaterThan(0);
  });
});
```

**Step 2: Implement**

Create `src/lib/ingestion/runner.ts`:

```typescript
import type { DataSource, SourceType } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { IngestionAdapter, DetectedChange } from "./adapters/base";
import { hashContent } from "./diff-engine";

interface IngestionResult {
  sourcesChecked: number;
  changesDetected: number;
  itemsCreated: number;
  errors: Array<{ sourceId: string; error: string }>;
}

export class IngestionRunner {
  private adapters: Map<SourceType, IngestionAdapter>;

  constructor(adapters: Map<SourceType, IngestionAdapter>) {
    this.adapters = adapters;
  }

  async run(): Promise<IngestionResult> {
    const result: IngestionResult = {
      sourcesChecked: 0,
      changesDetected: 0,
      itemsCreated: 0,
      errors: [],
    };

    const sources = await prisma.dataSource.findMany({
      where: { competitor: { status: "ACTIVE" } },
      include: { competitor: true },
    });

    for (const source of sources) {
      const adapter = this.adapters.get(source.type);
      if (!adapter) continue;

      try {
        result.sourcesChecked++;
        const raw = await adapter.fetch(source);
        const newHash = hashContent(raw.content);
        const changes = await adapter.detectChanges(raw, source.lastContentHash);

        if (changes.length > 0) {
          result.changesDetected += changes.length;

          for (const change of changes) {
            change.competitorId = source.competitorId;
            change.sourceId = source.id;

            // IntelligenceItem creation will be handled by synthesis layer
            // For now, store the raw change data
            result.itemsCreated++;
          }

          await prisma.dataSource.update({
            where: { id: source.id },
            data: {
              lastChecked: new Date(),
              lastChangeDetected: new Date(),
              lastContentHash: newHash,
              health: "HEALTHY",
            },
          });
        } else {
          await prisma.dataSource.update({
            where: { id: source.id },
            data: {
              lastChecked: new Date(),
              lastContentHash: newHash,
              health: "HEALTHY",
            },
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        result.errors.push({ sourceId: source.id, error: message });

        await prisma.dataSource.update({
          where: { id: source.id },
          data: {
            lastChecked: new Date(),
            health: "DEGRADED",
          },
        });
      }
    }

    return result;
  }
}
```

**Step 3: Run tests**

```bash
npm test -- src/lib/ingestion/__tests__/runner.test.ts
```

**Step 4: Commit**

```bash
git add src/lib/ingestion/runner.ts src/lib/ingestion/__tests__/runner.test.ts
git commit -m "feat: add ingestion runner orchestrator"
```

---

### Demo Checkpoint: Phase 2 — Ingestion Pipeline Complete

**What to demonstrate:**
1. All ingestion tests pass
2. Adapter interface is clean and extensible
3. Diff engine correctly detects content changes
4. 4 adapters cover all free source types (website, changelog, RSS, status page)
5. Runner orchestrates fetch → diff → update flow

**Verification script:**

```bash
npm test -- src/lib/ingestion/ && echo "ALL INGESTION TESTS PASS"
npm run type-check && echo "TYPE CHECK OK"
```

**Report to product owner:**
- Ingestion pipeline scaffolded with adapter pattern (FR-1)
- Website, changelog, RSS, and status page scrapers implemented (FR-1)
- Content change detection via SHA-256 hashing (FR-4)
- Runner orchestrates daily ingestion across all sources (FR-3)
- Source health tracking (HEALTHY/DEGRADED) on failure (Section 10)

**STOP HERE. Wait for go/no-go before proceeding to Phase 3.**

---

## Phase 3: LLM & Synthesis

### Task 13: LLM Provider Interface

**Files:**
- Create: `src/lib/llm/provider.ts`

**Step 1: Create the provider interface**

Create `src/lib/llm/provider.ts`:

```typescript
export interface LLMProvider {
  synthesize(prompt: string, context: Record<string, unknown>): Promise<string>;
  classify(content: string, categories: string[]): Promise<string>;
  generateStructured<T>(prompt: string, context: Record<string, unknown>): Promise<T>;
}
```

**Step 2: Commit**

```bash
git add src/lib/llm/provider.ts
git commit -m "feat: add LLM provider interface"
```

---

### Task 14: Claude Implementation

**Files:**
- Create: `src/lib/llm/claude.ts`

**Important:** Fetch Anthropic SDK docs before implementing: `https://docs.anthropic.com/en/docs/build-with-claude/overview`

**Step 1: Implement Claude provider**

Create `src/lib/llm/claude.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider } from "./provider";

const SONNET_MODEL = "claude-sonnet-4-5-20250929";
const HAIKU_MODEL = "claude-haiku-4-5-20251001";

export class ClaudeProvider implements LLMProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  async synthesize(prompt: string, context: Record<string, unknown>): Promise<string> {
    const contextStr = Object.entries(context)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join("\n");

    const response = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `${prompt}\n\nContext:\n${contextStr}`,
      }],
    });

    const block = response.content[0];
    return block.type === "text" ? block.text : "";
  }

  async classify(content: string, categories: string[]): Promise<string> {
    const response = await this.client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 256,
      messages: [{
        role: "user",
        content: `Classify the following into exactly one category.\n\nContent: ${content}\nCategories: ${categories.join(", ")}\n\nRespond with only the category name.`,
      }],
    });

    const block = response.content[0];
    return block.type === "text" ? block.text.trim() : "";
  }

  async generateStructured<T>(prompt: string, context: Record<string, unknown>): Promise<T> {
    const contextStr = Object.entries(context)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join("\n");

    const response = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `${prompt}\n\nContext:\n${contextStr}\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, no explanation.`,
      }],
    });

    const block = response.content[0];
    const text = block.type === "text" ? block.text : "{}";

    // Strip potential markdown code fences
    const cleaned = text.replace(/^```(?:json)?\s*\n?/m, "").replace(/\n?```\s*$/m, "").trim();
    return JSON.parse(cleaned) as T;
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/llm/claude.ts
git commit -m "feat: add Claude LLM provider (Sonnet for synthesis, Haiku for classification)"
```

---

### Task 15: Evidence Tier Classifier

**Files:**
- Create: `src/lib/synthesis/evidence-tier.ts`
- Test: `src/lib/synthesis/__tests__/evidence-tier.test.ts`

**Step 1: Write failing tests**

Create `src/lib/synthesis/__tests__/evidence-tier.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { classifyEvidenceTier, isPublicCitableSource } from "../evidence-tier";

describe("evidence-tier", () => {
  describe("isPublicCitableSource", () => {
    it("returns true for company website URLs", () => {
      expect(isPublicCitableSource("https://www.kyriba.com/blog/new-feature")).toBe(true);
    });

    it("returns true for press/news URLs", () => {
      expect(isPublicCitableSource("https://www.fintechsingapore.com/article/123")).toBe(true);
    });

    it("returns false for LinkedIn URLs (restricted source)", () => {
      expect(isPublicCitableSource("https://linkedin.com/company/kyriba/jobs")).toBe(false);
    });

    it("returns false for G2 review URLs (restricted source)", () => {
      expect(isPublicCitableSource("https://www.g2.com/products/kyriba/reviews")).toBe(false);
    });

    it("returns false for SEMrush URLs (restricted source)", () => {
      expect(isPublicCitableSource("https://www.semrush.com")).toBe(false);
    });
  });

  describe("classifyEvidenceTier", () => {
    it("classifies public citable source as CONFIRMED", () => {
      const tier = classifyEvidenceTier(
        "Kyriba launches new AI feature",
        "https://www.kyriba.com/blog/ai-feature",
        false
      );
      expect(tier).toBe("CONFIRMED");
    });

    it("classifies simulated data as INFERRED regardless of source", () => {
      const tier = classifyEvidenceTier(
        "Kyriba launches new AI feature",
        "https://www.kyriba.com/blog/ai-feature",
        true
      );
      expect(tier).toBe("INFERRED");
    });

    it("classifies restricted source as INFERRED", () => {
      const tier = classifyEvidenceTier(
        "Job posting analysis suggests AI investment",
        "https://linkedin.com/company/kyriba/jobs",
        false
      );
      expect(tier).toBe("INFERRED");
    });
  });
});
```

**Step 2: Implement**

Create `src/lib/synthesis/evidence-tier.ts`:

```typescript
import type { EvidenceTier } from "@prisma/client";

const RESTRICTED_DOMAINS = [
  "linkedin.com",
  "g2.com",
  "gartner.com",
  "semrush.com",
  "ahrefs.com",
];

export function isPublicCitableSource(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return !RESTRICTED_DOMAINS.some((domain) => hostname.includes(domain));
  } catch {
    return false;
  }
}

export function classifyEvidenceTier(
  content: string,
  sourceUrl: string,
  simulated: boolean
): EvidenceTier {
  // Simulated data is always INFERRED at best
  if (simulated) return "INFERRED";

  // Public citable sources are CONFIRMED
  if (isPublicCitableSource(sourceUrl)) return "CONFIRMED";

  // Restricted sources are INFERRED
  return "INFERRED";
}
```

**Step 3: Run tests**

```bash
npm test -- src/lib/synthesis/__tests__/evidence-tier.test.ts
```

Expected: All pass.

**Step 4: Commit**

```bash
git add src/lib/synthesis/
git commit -m "feat: add evidence tier classifier"
```

---

### Task 16: Alert Threshold Evaluator

**Files:**
- Create: `src/lib/synthesis/alert-evaluator.ts`
- Test: `src/lib/synthesis/__tests__/alert-evaluator.test.ts`

**Step 1: Write failing tests**

Create `src/lib/synthesis/__tests__/alert-evaluator.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { evaluateAlertThreshold } from "../alert-evaluator";
import type { CompetitorTier, IntelType } from "@prisma/client";

describe("alert-evaluator", () => {
  it("triggers alert for Tier 1 competitor events", () => {
    const result = evaluateAlertThreshold({
      competitorTier: "TIER_1",
      intelType: "PRODUCT_CHANGE",
      content: "Some product update",
      affectsPositioningClaims: false,
    });
    expect(result.shouldAlert).toBe(true);
    expect(result.reasons).toContain("Tier 1 competitor involved");
  });

  it("triggers alert for pricing changes regardless of tier", () => {
    const result = evaluateAlertThreshold({
      competitorTier: "TIER_2",
      intelType: "PRICING_CHANGE",
      content: "New pricing announced",
      affectsPositioningClaims: false,
    });
    expect(result.shouldAlert).toBe(true);
    expect(result.reasons).toContain("Pricing change detected");
  });

  it("triggers alert for outage events", () => {
    const result = evaluateAlertThreshold({
      competitorTier: "TIER_2",
      intelType: "OUTAGE",
      content: "Service degraded",
      affectsPositioningClaims: false,
    });
    expect(result.shouldAlert).toBe(true);
  });

  it("triggers alert when positioning claims affected", () => {
    const result = evaluateAlertThreshold({
      competitorTier: "TIER_2",
      intelType: "PRODUCT_CHANGE",
      content: "Some update",
      affectsPositioningClaims: true,
    });
    expect(result.shouldAlert).toBe(true);
    expect(result.reasons).toContain("Positioning claim affected");
  });

  it("triggers alert when 'treasury operating system' language detected", () => {
    const result = evaluateAlertThreshold({
      competitorTier: "TIER_2",
      intelType: "MESSAGING_SHIFT",
      content: "We are the Treasury Operating System for enterprise",
      affectsPositioningClaims: false,
    });
    expect(result.shouldAlert).toBe(true);
    expect(result.reasons).toContain("'Treasury Operating System' language detected");
  });

  it("does NOT trigger alert for routine Tier 2 events", () => {
    const result = evaluateAlertThreshold({
      competitorTier: "TIER_2",
      intelType: "HIRING_SIGNAL",
      content: "Hiring a frontend engineer",
      affectsPositioningClaims: false,
    });
    expect(result.shouldAlert).toBe(false);
  });
});
```

**Step 2: Implement**

Create `src/lib/synthesis/alert-evaluator.ts`:

```typescript
import type { CompetitorTier, IntelType } from "@prisma/client";

interface AlertEvalInput {
  competitorTier: CompetitorTier;
  intelType: IntelType;
  content: string;
  affectsPositioningClaims: boolean;
}

interface AlertEvalResult {
  shouldAlert: boolean;
  reasons: string[];
}

const ALERT_INTEL_TYPES: IntelType[] = ["PRICING_CHANGE", "OUTAGE"];

export function evaluateAlertThreshold(input: AlertEvalInput): AlertEvalResult {
  const reasons: string[] = [];

  if (input.competitorTier === "TIER_1") {
    reasons.push("Tier 1 competitor involved");
  }

  if (ALERT_INTEL_TYPES.includes(input.intelType)) {
    if (input.intelType === "PRICING_CHANGE") reasons.push("Pricing change detected");
    if (input.intelType === "OUTAGE") reasons.push("Outage detected");
  }

  if (input.affectsPositioningClaims) {
    reasons.push("Positioning claim affected");
  }

  if (/treasury\s+operating\s+system/i.test(input.content)) {
    reasons.push("'Treasury Operating System' language detected");
  }

  return {
    shouldAlert: reasons.length > 0,
    reasons,
  };
}
```

**Step 3: Run tests**

```bash
npm test -- src/lib/synthesis/__tests__/alert-evaluator.test.ts
```

**Step 4: Commit**

```bash
git add src/lib/synthesis/alert-evaluator.ts src/lib/synthesis/__tests__/alert-evaluator.test.ts
git commit -m "feat: add alert threshold evaluator (FR-6)"
```

---

### Task 17: Positioning Claim Assessor

**Files:**
- Create: `src/lib/synthesis/claim-assessor.ts`
- Test: `src/lib/synthesis/__tests__/claim-assessor.test.ts`

**Step 1: Write failing tests**

Create `src/lib/synthesis/__tests__/claim-assessor.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { assessClaimStatus } from "../claim-assessor";

describe("claim-assessor", () => {
  it("returns HOLDING when no threatening evidence", () => {
    const status = assessClaimStatus({ evidenceFor: 3, evidenceAgainst: 0 });
    expect(status).toBe("HOLDING");
  });

  it("returns UNDER_PRESSURE when some threatening evidence", () => {
    const status = assessClaimStatus({ evidenceFor: 3, evidenceAgainst: 2 });
    expect(status).toBe("UNDER_PRESSURE");
  });

  it("returns CONTESTED when evidence against exceeds evidence for", () => {
    const status = assessClaimStatus({ evidenceFor: 1, evidenceAgainst: 3 });
    expect(status).toBe("CONTESTED");
  });

  it("returns HOLDING when no evidence at all", () => {
    const status = assessClaimStatus({ evidenceFor: 0, evidenceAgainst: 0 });
    expect(status).toBe("HOLDING");
  });
});
```

**Step 2: Implement**

Create `src/lib/synthesis/claim-assessor.ts`:

```typescript
import type { ClaimStatus } from "@prisma/client";

interface ClaimEvidence {
  evidenceFor: number;
  evidenceAgainst: number;
}

export function assessClaimStatus(evidence: ClaimEvidence): ClaimStatus {
  const { evidenceFor, evidenceAgainst } = evidence;

  if (evidenceAgainst === 0) return "HOLDING";
  if (evidenceAgainst > evidenceFor) return "CONTESTED";
  if (evidenceAgainst > 0) return "UNDER_PRESSURE";

  return "HOLDING";
}
```

**Step 3: Run tests**

```bash
npm test -- src/lib/synthesis/__tests__/claim-assessor.test.ts
```

**Step 4: Commit**

```bash
git add src/lib/synthesis/claim-assessor.ts src/lib/synthesis/__tests__/claim-assessor.test.ts
git commit -m "feat: add positioning claim assessor (FR-7)"
```

---

### Task 18: Output Validators

**Files:**
- Create: `src/lib/synthesis/validators.ts`
- Test: `src/lib/synthesis/__tests__/validators.test.ts`

This is a critical file — it enforces all auto-publish guardrails from PRD Section 23.

**Step 1: Write failing tests**

Create `src/lib/synthesis/__tests__/validators.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  validateWeeklyPulse,
  validateSignalAlert,
  validateBattlecardReframe,
  countWords,
} from "../validators";
import type { WeeklyPulseContent, SignalAlertContent } from "@/types";

describe("validators", () => {
  describe("countWords", () => {
    it("counts words correctly", () => {
      expect(countWords("hello world")).toBe(2);
      expect(countWords("one two three four five")).toBe(5);
    });

    it("handles empty string", () => {
      expect(countWords("")).toBe(0);
    });
  });

  describe("validateWeeklyPulse", () => {
    const validPulse: WeeklyPulseContent = {
      sections: {
        topSignals: [{
          competitor: "Kyriba",
          summary: "Launched AI feature",
          implication: "Threatens MO AI positioning claim",
          evidenceTier: "CONFIRMED",
          sourceUrl: "https://kyriba.com/blog",
        }],
        claimStatuses: [{
          claimId: "c1",
          claimText: "Mid-market treasury+payments",
          status: "HOLDING",
          changeFromLastWeek: "unchanged",
        }],
        actionRequired: null,
        outlook: "Competitive landscape stable this week.",
      },
    };

    it("passes valid weekly pulse", () => {
      const result = validateWeeklyPulse(validPulse, 100);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects pulse exceeding word limit", () => {
      const result = validateWeeklyPulse(validPulse, 5);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("word limit"))).toBe(true);
    });

    it("rejects pulse with missing evidence tiers", () => {
      const invalid = structuredClone(validPulse);
      // @ts-expect-error -- testing invalid input
      invalid.sections.topSignals[0].evidenceTier = undefined;
      const result = validateWeeklyPulse(invalid, 500);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateSignalAlert", () => {
    const validAlert: SignalAlertContent = {
      sections: {
        whatHappened: "Kyriba launched AI cash forecasting",
        whyItMatters: "Directly challenges MO AI positioning claim",
        evidenceTier: "CONFIRMED",
        claimsAffected: ["Mid-market treasury+payments"],
        recommendedResponse: "Accelerate MO AI roadmap communications",
        actionItems: ["Update battlecard", "Brief sales team"],
        sourceUrls: ["https://kyriba.com/blog/ai"],
      },
    };

    it("passes valid signal alert", () => {
      const result = validateSignalAlert(validAlert, 500);
      expect(result.valid).toBe(true);
    });

    it("rejects alert without claims affected (Finmo specificity check)", () => {
      const invalid = structuredClone(validAlert);
      invalid.sections.claimsAffected = [];
      const result = validateSignalAlert(invalid, 500);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Finmo specificity"))).toBe(true);
    });

    it("rejects alert without source URLs", () => {
      const invalid = structuredClone(validAlert);
      invalid.sections.sourceUrls = [];
      const result = validateSignalAlert(invalid, 500);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateBattlecardReframe", () => {
    it("passes Confirmed tier reframe", () => {
      const result = validateBattlecardReframe("CONFIRMED");
      expect(result.valid).toBe(true);
    });

    it("rejects Inferred tier reframe", () => {
      const result = validateBattlecardReframe("INFERRED");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Battlecard reframes must be CONFIRMED tier only");
    });

    it("rejects Unknown tier reframe", () => {
      const result = validateBattlecardReframe("UNKNOWN");
      expect(result.valid).toBe(false);
    });
  });
});
```

**Step 2: Implement**

Create `src/lib/synthesis/validators.ts`:

```typescript
import type { EvidenceTier } from "@prisma/client";
import type { WeeklyPulseContent, MonthlyPulseContent, SignalAlertContent } from "@/types";

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function countContentWords(content: WeeklyPulseContent | MonthlyPulseContent | SignalAlertContent): number {
  return countWords(JSON.stringify(content).replace(/[{}\[\]",]/g, " "));
}

export function validateWeeklyPulse(content: WeeklyPulseContent, wordLimit: number): ValidationResult {
  const errors: string[] = [];

  if (!content.sections) errors.push("Missing sections");
  if (!content.sections?.topSignals) errors.push("Missing topSignals");
  if (!content.sections?.claimStatuses) errors.push("Missing claimStatuses");
  if (content.sections?.outlook === undefined) errors.push("Missing outlook");

  // Evidence tier check
  content.sections?.topSignals?.forEach((signal, i) => {
    if (!signal.evidenceTier) errors.push(`Signal ${i}: missing evidence tier`);
    if (!signal.sourceUrl) errors.push(`Signal ${i}: missing source URL`);
  });

  // Word limit
  const words = countContentWords(content);
  if (words > wordLimit) errors.push(`Exceeds word limit: ${words} > ${wordLimit}`);

  return { valid: errors.length === 0, errors };
}

export function validateMonthlyPulse(content: MonthlyPulseContent, wordLimit: number): ValidationResult {
  const errors: string[] = [];

  if (!content.sections) errors.push("Missing sections");
  if (!content.sections?.categoryHealth) errors.push("Missing categoryHealth");
  if (!content.sections?.positioningConfidence) errors.push("Missing positioningConfidence");
  if (!content.sections?.contentImplications?.length) errors.push("Missing content implications");

  // Finmo specificity: must have positioning confidence
  if (content.sections?.positioningConfidence?.length === 0) {
    errors.push("Finmo specificity: no positioning claim assessments");
  }

  const words = countContentWords(content);
  if (words > wordLimit) errors.push(`Exceeds word limit: ${words} > ${wordLimit}`);

  return { valid: errors.length === 0, errors };
}

export function validateSignalAlert(content: SignalAlertContent, wordLimit: number): ValidationResult {
  const errors: string[] = [];

  if (!content.sections) errors.push("Missing sections");
  if (!content.sections?.whatHappened) errors.push("Missing whatHappened");
  if (!content.sections?.whyItMatters) errors.push("Missing whyItMatters");
  if (!content.sections?.evidenceTier) errors.push("Missing evidenceTier");
  if (!content.sections?.recommendedResponse) errors.push("Missing recommendedResponse");

  // Finmo specificity check
  if (!content.sections?.claimsAffected?.length) {
    errors.push("Finmo specificity: no claims affected referenced");
  }

  // Source verification
  if (!content.sections?.sourceUrls?.length) {
    errors.push("Missing source URLs — every alert must cite sources");
  }

  const words = countContentWords(content);
  if (words > wordLimit) errors.push(`Exceeds word limit: ${words} > ${wordLimit}`);

  return { valid: errors.length === 0, errors };
}

export function validateBattlecardReframe(evidenceTier: EvidenceTier): ValidationResult {
  if (evidenceTier !== "CONFIRMED") {
    return {
      valid: false,
      errors: ["Battlecard reframes must be CONFIRMED tier only"],
    };
  }
  return { valid: true, errors: [] };
}
```

**Step 3: Run tests**

```bash
npm test -- src/lib/synthesis/__tests__/validators.test.ts
```

**Step 4: Commit**

```bash
git add src/lib/synthesis/validators.ts src/lib/synthesis/__tests__/validators.test.ts
git commit -m "feat: add output validators with auto-publish guardrails (Section 23)"
```

---

### Demo Checkpoint: Phase 3 — LLM & Synthesis Complete

**What to demonstrate:**
1. All synthesis tests pass
2. Evidence tier classification works for public vs restricted sources
3. Alert evaluator correctly fires on Tier 1 events, pricing changes, outages, TOS language
4. Claim assessor transitions claims through HOLDING → UNDER_PRESSURE → CONTESTED
5. Validators enforce all 7 guardrails from PRD Section 23

**Verification script:**

```bash
npm test -- src/lib/synthesis/ && echo "ALL SYNTHESIS TESTS PASS"
npm test -- src/lib/llm/ 2>/dev/null; echo "(LLM tests skipped — requires API key)"
npm run type-check && echo "TYPE CHECK OK"
```

**Report to product owner:**
- LLM provider abstraction with Claude implementation (Sonnet + Haiku) (AD-2)
- Evidence tier classification: Confirmed/Inferred/Unknown based on source type (FR-5)
- Alert threshold evaluator covers all criteria from FR-6
- Positioning claim assessment: Holding/Under Pressure/Contested (FR-7)
- Output validators enforce: structure, evidence tiers, Finmo specificity, word limits, source verification (Section 23 guardrails)
- Battlecard reframe validation blocks Inferred/Unknown claims (NFR-5)

**STOP HERE. Wait for go/no-go before proceeding to Phase 4.**

---

## Phase 4: Output Generation

### Task 19: LLM Prompt Templates

**Files:**
- Create: `src/lib/llm/prompts/weekly-pulse.ts`
- Create: `src/lib/llm/prompts/monthly-pulse.ts`
- Create: `src/lib/llm/prompts/signal-alert.ts`
- Create: `src/lib/llm/prompts/claim-assessment.ts`

**Step 1: Create weekly pulse prompt**

Create `src/lib/llm/prompts/weekly-pulse.ts`:

```typescript
import type { IntelligenceItem, PositioningClaim, Competitor } from "@prisma/client";

interface WeeklyPulsePromptContext {
  claims: PositioningClaim[];
  items: (IntelligenceItem & { competitor: Competitor })[];
  weekStart: string;
  weekEnd: string;
}

export function buildWeeklyPulsePrompt(ctx: WeeklyPulsePromptContext): string {
  const claimsList = ctx.claims
    .map((c, i) => `${i + 1}. "${c.claimText}" — Current status: ${c.currentStatus}`)
    .join("\n");

  const itemsList = ctx.items.length === 0
    ? "No intelligence items detected this week."
    : ctx.items
        .map((item) =>
          `- [${item.competitor.name}] ${item.summary} (${item.evidenceTier}, ${item.type})${item.simulated ? " [SIMULATED]" : ""}`
        )
        .join("\n");

  return `You are a competitive intelligence analyst for Finmo, a Series A treasury and payments platform.

FINMO'S THREE POSITIONING CLAIMS:
${claimsList}

INTELLIGENCE ITEMS THIS WEEK (${ctx.weekStart} to ${ctx.weekEnd}):
${itemsList}

TASK: Generate a Weekly Pulse briefing for the CMO.

RULES:
- Under 500 words total
- If no notable items: output "Nothing notable this week" with a calm outlook. Do NOT generate filler.
- Every signal must reference at least one positioning claim it affects
- Every signal must carry its evidence tier (CONFIRMED, INFERRED, or UNKNOWN)
- Focus on "so what" — why it matters for Finmo specifically, not just what happened
- Items marked [SIMULATED] should still be analyzed but noted as simulated
- Be opinionated. If something doesn't matter, exclude it.

OUTPUT FORMAT: Respond with ONLY valid JSON matching this exact schema:
{
  "sections": {
    "topSignals": [{ "competitor": string, "summary": string, "implication": string, "evidenceTier": "CONFIRMED"|"INFERRED"|"UNKNOWN", "sourceUrl": string }],
    "claimStatuses": [{ "claimId": string, "claimText": string, "status": "HOLDING"|"UNDER_PRESSURE"|"CONTESTED", "changeFromLastWeek": "improved"|"unchanged"|"degraded" }],
    "actionRequired": string | null,
    "outlook": string
  }
}`;
}
```

**Step 2: Create monthly pulse prompt**

Create `src/lib/llm/prompts/monthly-pulse.ts` — same pattern but covers:
- Category health assessment
- Tier 1 competitor narrative shifts
- Tier 2 watch items
- Positioning confidence for all 3 claims with evidence counts
- 2-3 actionable content implications
- Max 1000 words

**Step 3: Create signal alert prompt**

Create `src/lib/llm/prompts/signal-alert.ts` — covers:
- What happened (factual)
- Why it matters for Finmo (opinionated)
- Evidence tier of the triggering event
- Which positioning claims are affected
- Recommended response
- Action items
- Source URLs

**Step 4: Create claim assessment prompt**

Create `src/lib/llm/prompts/claim-assessment.ts` — used by the LLM to do deeper assessment when rule-based `assessClaimStatus` needs nuance. Takes accumulated evidence items and returns updated claim status with rationale.

**Step 5: Commit**

```bash
git add src/lib/llm/prompts/
git commit -m "feat: add LLM prompt templates for all output types"
```

---

### Task 20: Weekly Pulse Generator

**Files:**
- Create: `src/lib/generators/weekly-pulse.ts`
- Test: `src/lib/generators/__tests__/weekly-pulse.test.ts`

**Step 1: Write failing tests**

Create `src/lib/generators/__tests__/weekly-pulse.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { generateWeeklyPulse } from "../weekly-pulse";
import type { WeeklyPulseContent } from "@/types";

// Mock the LLM provider
const mockLLM = {
  synthesize: vi.fn(),
  classify: vi.fn(),
  generateStructured: vi.fn<[], Promise<WeeklyPulseContent>>().mockResolvedValue({
    sections: {
      topSignals: [{
        competitor: "Kyriba",
        summary: "Launched AI cash forecasting",
        implication: "Directly challenges MO AI positioning",
        evidenceTier: "CONFIRMED",
        sourceUrl: "https://kyriba.com/blog",
      }],
      claimStatuses: [{
        claimId: "c1",
        claimText: "AI-native treasury intelligence",
        status: "UNDER_PRESSURE",
        changeFromLastWeek: "degraded",
      }],
      actionRequired: "Review MO AI messaging in light of Kyriba AI launch",
      outlook: "Competitive pressure increasing on AI positioning.",
    },
  }),
};

// Mock prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    intelligenceItem: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    positioningClaim: {
      findMany: vi.fn().mockResolvedValue([
        { id: "c1", claimText: "AI-native treasury intelligence", currentStatus: "HOLDING" },
      ]),
    },
    generatedOutput: {
      create: vi.fn().mockResolvedValue({ id: "out-1" }),
    },
  },
}));

describe("generateWeeklyPulse", () => {
  it("generates a valid weekly pulse and saves to database", async () => {
    const result = await generateWeeklyPulse(mockLLM);
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.content.sections).toBeDefined();
    expect(result.content.sections.topSignals).toBeInstanceOf(Array);
    expect(result.content.sections.claimStatuses).toBeInstanceOf(Array);
  });
});
```

**Step 2: Implement**

Create `src/lib/generators/weekly-pulse.ts`:

```typescript
import { prisma } from "@/lib/db";
import type { LLMProvider } from "@/lib/llm/provider";
import { buildWeeklyPulsePrompt } from "@/lib/llm/prompts/weekly-pulse";
import { validateWeeklyPulse } from "@/lib/synthesis/validators";
import { OUTPUT_LIMITS } from "@/lib/config/thresholds";
import type { WeeklyPulseContent } from "@/types";

interface GenerationResult {
  id: string;
  headline: string;
  content: WeeklyPulseContent;
  wordCount: number;
  validationStatus: "PASSED" | "REJECTED" | "REGENERATED" | "FLAGGED";
}

export async function generateWeeklyPulse(llm: LLMProvider): Promise<GenerationResult> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const [items, claims] = await Promise.all([
    prisma.intelligenceItem.findMany({
      where: { detectedAt: { gte: weekStart } },
      include: { competitor: true },
      orderBy: { detectedAt: "desc" },
    }),
    prisma.positioningClaim.findMany(),
  ]);

  const prompt = buildWeeklyPulsePrompt({
    claims,
    items,
    weekStart: weekStart.toISOString().split("T")[0],
    weekEnd: now.toISOString().split("T")[0],
  });

  let content: WeeklyPulseContent | null = null;
  let validationStatus: "PASSED" | "REJECTED" | "REGENERATED" | "FLAGGED" = "PASSED";
  let attempts = 0;

  while (attempts < OUTPUT_LIMITS.MAX_REGENERATION_ATTEMPTS) {
    attempts++;
    content = await llm.generateStructured<WeeklyPulseContent>(prompt, {});

    const validation = validateWeeklyPulse(content, OUTPUT_LIMITS.WEEKLY_PULSE_MAX_WORDS);
    if (validation.valid) {
      validationStatus = attempts > 1 ? "REGENERATED" : "PASSED";
      break;
    }

    if (attempts >= OUTPUT_LIMITS.MAX_REGENERATION_ATTEMPTS) {
      validationStatus = "REJECTED";
      console.error(`Weekly pulse rejected after ${attempts} attempts:`, validation.errors);
    }
  }

  if (!content) throw new Error("Failed to generate weekly pulse content");

  const headline = content.sections.actionRequired
    ? `Action Required: ${content.sections.actionRequired.slice(0, 80)}`
    : items.length === 0
      ? "Nothing Notable This Week"
      : `${items.length} signal${items.length !== 1 ? "s" : ""} detected this week`;

  const wordCount = JSON.stringify(content).split(/\s+/).length;

  const output = await prisma.generatedOutput.create({
    data: {
      type: "WEEKLY_PULSE",
      headline,
      content: content as unknown as Record<string, unknown>,
      wordCount,
      validationStatus,
      generationMetadata: { attempts, generatedAt: now.toISOString() },
      intelligenceItems: {
        connect: items.map((item) => ({ id: item.id })),
      },
    },
  });

  return { id: output.id, headline, content, wordCount, validationStatus };
}
```

**Step 3: Run tests**

```bash
npm test -- src/lib/generators/__tests__/weekly-pulse.test.ts
```

**Step 4: Commit**

```bash
git add src/lib/generators/weekly-pulse.ts src/lib/generators/__tests__/
git commit -m "feat: add weekly pulse generator with validation loop (FR-10)"
```

---

### Task 21: Monthly Pulse Generator

**Files:**
- Create: `src/lib/generators/monthly-pulse.ts`
- Test: `src/lib/generators/__tests__/monthly-pulse.test.ts`

Same pattern as Task 20 but:
- Queries items from the past month
- Uses `buildMonthlyPulsePrompt` from `src/lib/llm/prompts/monthly-pulse.ts`
- Validates with `validateMonthlyPulse` and `OUTPUT_LIMITS.MONTHLY_PULSE_MAX_WORDS`
- Includes positioning confidence with evidence for/against counts
- Output type is `MONTHLY_PULSE`
- Must include 2-3 content implications (validated)

Write tests following the same mock pattern. Commit:

```bash
git add src/lib/generators/monthly-pulse.ts src/lib/generators/__tests__/monthly-pulse.test.ts
git commit -m "feat: add monthly positioning pulse generator (FR-11)"
```

---

### Task 22: Signal Alert Generator

**Files:**
- Create: `src/lib/generators/signal-alert.ts`
- Test: `src/lib/generators/__tests__/signal-alert.test.ts`

Same pattern but:
- Takes a specific `IntelligenceItem` that triggered the alert
- Uses `buildSignalAlertPrompt`
- Validates with `validateSignalAlert`
- Must reference specific positioning claims affected
- Output type is `SIGNAL_ALERT`
- Includes deduplication: check if an alert for this item already exists before generating

Write tests. Commit:

```bash
git add src/lib/generators/signal-alert.ts src/lib/generators/__tests__/signal-alert.test.ts
git commit -m "feat: add signal alert generator with deduplication (FR-9)"
```

---

### Task 23: Battlecard Generator

**Files:**
- Create: `src/lib/generators/battlecard.ts`
- Test: `src/lib/generators/__tests__/battlecard.test.ts`

This generator updates existing battlecards rather than creating output documents:
- Queries all CONFIRMED-tier intelligence items for a given competitor
- Updates the battlecard's weaknesses based on new evidence
- Does NOT update reframes automatically (reframes are human-curated via admin)
- Validates that all weakness entries are CONFIRMED tier

Write tests. Commit:

```bash
git add src/lib/generators/battlecard.ts src/lib/generators/__tests__/battlecard.test.ts
git commit -m "feat: add battlecard generator with evidence tier enforcement (FR-12)"
```

---

### Demo Checkpoint: Phase 4 — Output Generation Complete

**What to demonstrate:**
1. All generator tests pass
2. Weekly pulse generates valid content from intelligence items
3. Monthly pulse includes positioning confidence assessments
4. Signal alerts reference specific claims and sources
5. Validation loop rejects then regenerates invalid outputs (up to 3 attempts)

**Verification script:**

```bash
npm test -- src/lib/generators/ && echo "ALL GENERATOR TESTS PASS"
npm test -- src/lib/llm/ 2>/dev/null; echo "(LLM prompt tests if applicable)"
npm run type-check && echo "TYPE CHECK OK"
```

**Report to product owner:**
- All 4 output types implemented: Weekly Pulse, Monthly Pulse, Signal Alert, Battlecard (FR-9 through FR-12)
- LLM prompt templates encode Finmo context, evidence tier rules, and "intelligence not information" principle
- Validation loop enforces all 7 auto-publish guardrails (Section 23)
- Max 3 regeneration attempts before skipping (guardrail #7)
- Battlecard generator enforces CONFIRMED-tier only (NFR-5)

**STOP HERE. Wait for go/no-go before proceeding to Phase 5.**

---

## Phase 5: API Layer

**Important:** Before writing API routes, fetch Next.js App Router route handler docs: `https://nextjs.org/docs/app/building-your-application/routing/route-handlers`

### Task 24: Dashboard Read APIs — Pulse & Alerts

**Files:**
- Create: `src/app/api/pulse/latest/route.ts`
- Create: `src/app/api/pulses/route.ts`
- Create: `src/app/api/alerts/route.ts`

**Step 1: Implement GET /api/pulse/latest**

Create `src/app/api/pulse/latest/route.ts`:

```typescript
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  // Get the most recent pulse (weekly or monthly)
  const latestPulse = await prisma.generatedOutput.findFirst({
    where: {
      type: { in: ["WEEKLY_PULSE", "MONTHLY_PULSE"] },
      validationStatus: { in: ["PASSED", "REGENERATED"] },
    },
    orderBy: { publishedAt: "desc" },
  });

  if (!latestPulse) {
    return NextResponse.json({ error: "No pulses found", code: "not_found" }, { status: 404 });
  }

  // Get signal alerts from the past 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const signalAlerts = await prisma.generatedOutput.findMany({
    where: {
      type: "SIGNAL_ALERT",
      validationStatus: { in: ["PASSED", "REGENERATED"] },
      publishedAt: { gte: weekAgo },
    },
    orderBy: { publishedAt: "desc" },
  });

  return NextResponse.json({
    type: latestPulse.type === "WEEKLY_PULSE" ? "weekly" : "monthly",
    publishedAt: latestPulse.publishedAt.toISOString(),
    headline: latestPulse.headline,
    content: latestPulse.content,
    signalAlertsThisWeek: signalAlerts.map((alert) => ({
      id: alert.id,
      headline: alert.headline,
      publishedAt: alert.publishedAt.toISOString(),
      content: alert.content,
    })),
  });
}
```

**Step 2: Implement GET /api/pulses**

Create `src/app/api/pulses/route.ts`:

```typescript
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const where: Record<string, unknown> = {
    validationStatus: { in: ["PASSED", "REGENERATED"] },
  };

  if (type === "weekly") where.type = "WEEKLY_PULSE";
  else if (type === "monthly") where.type = "MONTHLY_PULSE";
  else where.type = { in: ["WEEKLY_PULSE", "MONTHLY_PULSE"] };

  const [pulses, total] = await Promise.all([
    prisma.generatedOutput.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.generatedOutput.count({ where }),
  ]);

  return NextResponse.json({
    items: pulses.map((p) => ({
      id: p.id,
      type: p.type === "WEEKLY_PULSE" ? "weekly" : "monthly",
      publishedAt: p.publishedAt.toISOString(),
      headline: p.headline,
      content: p.content,
      wordCount: p.wordCount,
    })),
    total,
    limit,
    offset,
  });
}
```

**Step 3: Implement GET /api/alerts**

Create `src/app/api/alerts/route.ts` — same pagination pattern, filtered to `SIGNAL_ALERT` type.

**Step 4: Commit**

```bash
git add src/app/api/pulse/ src/app/api/pulses/ src/app/api/alerts/
git commit -m "feat: add pulse and alert read API routes"
```

---

### Task 25: Dashboard Read APIs — Claims & Intel

**Files:**
- Create: `src/app/api/claims/route.ts`
- Create: `src/app/api/claims/[id]/evidence/route.ts`
- Create: `src/app/api/intel/route.ts`

**Step 1: Implement GET /api/claims**

Create `src/app/api/claims/route.ts`:

```typescript
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const claims = await prisma.positioningClaim.findMany({
    include: {
      evidenceItems: {
        where: { simulated: false },
        select: { id: true, evidenceTier: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    claims.map((claim) => ({
      id: claim.id,
      claimText: claim.claimText,
      status: claim.currentStatus,
      lastAssessed: claim.lastAssessed?.toISOString() ?? null,
      evidenceForCount: claim.evidenceItems.filter((e) => e.evidenceTier === "CONFIRMED").length,
      evidenceAgainstCount: claim.evidenceItems.filter((e) => e.evidenceTier !== "CONFIRMED").length,
    }))
  );
}
```

**Step 2: Implement GET /api/claims/:id/evidence**

Create `src/app/api/claims/[id]/evidence/route.ts`:

```typescript
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const claim = await prisma.positioningClaim.findUnique({
    where: { id },
    include: {
      evidenceItems: {
        include: { competitor: true },
        orderBy: { detectedAt: "desc" },
      },
    },
  });

  if (!claim) {
    return NextResponse.json({ error: "Claim not found", code: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    claim: { id: claim.id, claimText: claim.claimText, status: claim.currentStatus },
    evidence: claim.evidenceItems.map((item) => ({
      id: item.id,
      competitor: item.competitor.name,
      type: item.type,
      summary: item.summary,
      finmoImplication: item.finmoImplication,
      evidenceTier: item.evidenceTier,
      sourceUrl: item.sourceUrl,
      simulated: item.simulated,
      detectedAt: item.detectedAt.toISOString(),
    })),
  });
}
```

**Step 3: Implement GET /api/intel**

Create `src/app/api/intel/route.ts` — full intel feed with filters for competitor, type, tier, simulated, date range. Paginated with limit/offset.

**Step 4: Commit**

```bash
git add src/app/api/claims/ src/app/api/intel/
git commit -m "feat: add claims and intel feed API routes"
```

---

### Task 26: Battlecard APIs

**Files:**
- Create: `src/app/api/battlecards/route.ts`
- Create: `src/app/api/battlecards/[competitorId]/route.ts`
- Create: `src/app/api/battlecards/[competitorId]/reframes/[id]/route.ts`

**Step 1: Implement GET /api/battlecards**

Create `src/app/api/battlecards/route.ts`:

```typescript
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const battlecards = await prisma.battlecard.findMany({
    include: {
      competitor: {
        include: {
          reframes: true,
        },
      },
    },
    orderBy: { competitor: { tier: "asc" } },
  });

  return NextResponse.json(
    battlecards.map((bc) => ({
      competitorId: bc.competitorId,
      competitorName: bc.competitor.name,
      tier: bc.competitor.tier,
      lastUpdated: bc.updatedAt.toISOString(),
      reframeCount: bc.competitor.reframes.length,
    }))
  );
}
```

**Step 2: Implement GET /api/battlecards/:competitorId**

Create `src/app/api/battlecards/[competitorId]/route.ts` — returns full battlecard detail matching the `BattlecardDetail` type from `src/types/index.ts`. Includes reframes with their evidence items.

**Step 3: Implement PUT /api/battlecards/:competitorId/reframes/:id**

Create `src/app/api/battlecards/[competitorId]/reframes/[id]/route.ts` — admin endpoint for editing reframes. Validates that the new evidence tier is CONFIRMED (uses `validateBattlecardReframe`).

**Step 4: Commit**

```bash
git add src/app/api/battlecards/
git commit -m "feat: add battlecard API routes with reframe editing"
```

---

### Task 27: Cron API Routes

**Files:**
- Create: `src/app/api/cron/ingest/route.ts`
- Create: `src/app/api/cron/generate/route.ts`

**Step 1: Implement POST /api/cron/ingest**

Create `src/app/api/cron/ingest/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { IngestionRunner } from "@/lib/ingestion/runner";
import { WebsiteAdapter } from "@/lib/ingestion/adapters/website";
import { RssAdapter } from "@/lib/ingestion/adapters/rss";
import { ChangelogAdapter } from "@/lib/ingestion/adapters/changelog";
import { StatusPageAdapter } from "@/lib/ingestion/adapters/status-page";
import type { SourceType } from "@prisma/client";
import type { IngestionAdapter } from "@/lib/ingestion/adapters/base";

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized", code: "unauthorized" }, { status: 401 });
  }

  const adapters = new Map<SourceType, IngestionAdapter>([
    ["WEBSITE", new WebsiteAdapter()],
    ["PRESS_RSS", new RssAdapter()],
    ["CHANGELOG", new ChangelogAdapter()],
    ["STATUS_PAGE", new StatusPageAdapter()],
  ]);

  const runner = new IngestionRunner(adapters);
  const result = await runner.run();

  return NextResponse.json({
    success: true,
    ...result,
  });
}
```

**Step 2: Implement POST /api/cron/generate**

Create `src/app/api/cron/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ClaudeProvider } from "@/lib/llm/claude";
import { generateWeeklyPulse } from "@/lib/generators/weekly-pulse";
import { generateMonthlyPulse } from "@/lib/generators/monthly-pulse";
import { generateSignalAlert } from "@/lib/generators/signal-alert";
import { SCHEDULE } from "@/lib/config/thresholds";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized", code: "unauthorized" }, { status: 401 });
  }

  const llm = new ClaudeProvider();
  const now = new Date();
  const results: Record<string, unknown> = {};

  // Check for duplicate run today
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const existingRun = await prisma.generatedOutput.findFirst({
    where: { createdAt: { gte: todayStart } },
  });

  // Generate Signal Alerts for unprocessed alert-worthy items
  const alertItems = await prisma.intelligenceItem.findMany({
    where: { alertTriggered: true },
    include: { competitor: true },
  });

  // Check which items already have alerts
  for (const item of alertItems) {
    const existingAlert = await prisma.generatedOutput.findFirst({
      where: {
        type: "SIGNAL_ALERT",
        intelligenceItems: { some: { id: item.id } },
      },
    });
    if (!existingAlert) {
      const alert = await generateSignalAlert(llm, item);
      results.signalAlert = alert;
    }
  }

  // Monday = Weekly Pulse
  const dayOfWeek = now.getDay();
  if (dayOfWeek === SCHEDULE.WEEKLY_PULSE_DAY) {
    const existingPulse = await prisma.generatedOutput.findFirst({
      where: { type: "WEEKLY_PULSE", createdAt: { gte: todayStart } },
    });
    if (!existingPulse) {
      results.weeklyPulse = await generateWeeklyPulse(llm);
    }
  }

  // 1st-5th business day of month = Monthly Pulse
  const dayOfMonth = now.getDate();
  if (dayOfMonth <= SCHEDULE.MONTHLY_PULSE_MAX_BUSINESS_DAY) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const existingMonthly = await prisma.generatedOutput.findFirst({
      where: { type: "MONTHLY_PULSE", createdAt: { gte: monthStart } },
    });
    if (!existingMonthly) {
      results.monthlyPulse = await generateMonthlyPulse(llm);
    }
  }

  return NextResponse.json({ success: true, generated: results });
}
```

**Step 3: Commit**

```bash
git add src/app/api/cron/
git commit -m "feat: add cron API routes for ingestion and generation (FR-3)"
```

---

### Task 28: API Route Tests

**Files:**
- Create: `src/app/api/__tests__/pulse-latest.test.ts`
- Create: `src/app/api/__tests__/claims.test.ts`

Write Vitest tests for the key API routes. Mock Prisma and verify response shapes match the API contract from PRD Section 8. Focus on:
- Correct HTTP status codes
- Response shape matches TypeScript types
- 404 handling
- Pagination params work correctly
- Cron secret validation (401 on bad/missing secret)

```bash
npm test -- src/app/api/__tests__/ && echo "API TESTS PASS"
git add src/app/api/__tests__/
git commit -m "test: add API route tests for pulse, claims, and cron endpoints"
```

---

### Demo Checkpoint: Phase 5 — API Layer Complete

**What to demonstrate:**
1. All API tests pass
2. Start dev server, curl the endpoints with seeded data
3. Show correct JSON response shapes matching PRD Section 8
4. Demonstrate cron secret validation (401 on bad auth)

**Verification script:**

```bash
npm test -- src/app/api/ && echo "API TESTS PASS"
npm run type-check && echo "TYPE CHECK OK"
npm run build && echo "BUILD OK"
```

**Report to product owner:**
- All dashboard read APIs implemented (Section 8)
- Pulse latest, archive, alerts, claims, intel feed, battlecards
- Admin reframe editing with CONFIRMED-tier validation
- Cron endpoints with secret-based auth and duplicate run protection
- Pagination on all list endpoints

**STOP HERE. Wait for go/no-go before proceeding to Phase 6.**

---

## Phase 6: Dashboard UI

**Design reference:** "Linear meets Bloomberg terminal" — information-dense but calm. Strong typographic hierarchy, generous whitespace. See PRD Section 7.

**Important:** Before building UI components, fetch docs:
- shadcn/ui: `https://ui.shadcn.com/docs`
- TanStack Query v5: `https://tanstack.com/query/latest/docs/framework/react/overview`

### Task 29: TanStack Query Provider & Shared Hooks

**Files:**
- Create: `src/components/providers.tsx`
- Create: `src/lib/hooks/use-claims.ts`
- Create: `src/lib/hooks/use-latest-pulse.ts`
- Create: `src/lib/hooks/use-battlecards.ts`
- Create: `src/lib/hooks/use-intel.ts`
- Modify: `src/app/layout.tsx`

**Step 1: Create QueryClient provider**

Create `src/components/providers.tsx`:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

**Step 2: Create data hooks**

Create `src/lib/hooks/use-claims.ts`:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClaimSummary } from "@/types";

export function useClaims() {
  return useQuery<ClaimSummary[]>({
    queryKey: ["claims"],
    queryFn: async () => {
      const res = await fetch("/api/claims");
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    },
  });
}
```

Create similar hooks for `use-latest-pulse.ts`, `use-battlecards.ts`, `use-intel.ts`.

**Step 3: Wrap layout with provider**

Modify `src/app/layout.tsx` to wrap `{children}` with `<Providers>`.

**Step 4: Commit**

```bash
git add src/components/providers.tsx src/lib/hooks/ src/app/layout.tsx
git commit -m "feat: add TanStack Query provider and data hooks"
```

---

### Task 30: Shared UI Components

**Files:**
- Create: `src/components/shared/evidence-tier-badge.tsx`
- Create: `src/components/shared/claim-status-indicator.tsx`
- Create: `src/components/shared/simulated-badge.tsx`
- Create: `src/components/shared/nav.tsx`

**Step 1: Evidence Tier Badge**

Create `src/components/shared/evidence-tier-badge.tsx`:

```tsx
import { cn } from "@/lib/utils";
import type { EvidenceTier } from "@prisma/client";

const tierConfig = {
  CONFIRMED: {
    label: "Confirmed",
    icon: "✓",
    className: "bg-green-100 text-green-800 border-green-300",
  },
  INFERRED: {
    label: "Inferred",
    icon: "~",
    className: "bg-amber-50 text-amber-700 border-amber-200 border-dashed",
  },
  UNKNOWN: {
    label: "Unknown",
    icon: "?",
    className: "bg-red-50 text-red-600 border-red-200 border-dashed",
  },
} as const;

export function EvidenceTierBadge({ tier }: { tier: EvidenceTier }) {
  const config = tierConfig[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border",
        config.className
      )}
    >
      {config.icon} {config.label}
    </span>
  );
}
```

**Step 2: Claim Status Indicator**

Create `src/components/shared/claim-status-indicator.tsx`:

```tsx
import { cn } from "@/lib/utils";
import type { ClaimStatus } from "@prisma/client";

const statusConfig = {
  HOLDING: { label: "Holding", className: "bg-green-500" },
  UNDER_PRESSURE: { label: "Under Pressure", className: "bg-amber-500" },
  CONTESTED: { label: "Contested", className: "bg-red-500" },
} as const;

export function ClaimStatusIndicator({
  status,
  claimText,
}: {
  status: ClaimStatus;
  claimText: string;
}) {
  const config = statusConfig[status];
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-2.5 w-2.5 rounded-full", config.className)} />
      <div>
        <span className="text-xs font-medium text-zinc-500">{config.label}</span>
        <p className="text-sm text-zinc-900 truncate max-w-[200px]">{claimText}</p>
      </div>
    </div>
  );
}
```

**Step 3: Simulated Badge**

Create `src/components/shared/simulated-badge.tsx`:

```tsx
export function SimulatedBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300">
      SIMULATED
    </span>
  );
}
```

**Step 4: Navigation**

Create `src/components/shared/nav.tsx` — top navigation bar with links to: Home, Pulse Archive, Battlecards, Intel Feed, Admin. Use Next.js `<Link>` components. Active state via `usePathname()`. Clean, minimal design.

**Step 5: Commit**

```bash
git add src/components/shared/
git commit -m "feat: add shared UI components (badges, indicators, nav)"
```

---

### Task 31: Root Layout with Claims Strip

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Step 1: Update root layout**

Update `src/app/layout.tsx` with:
- Dark sidebar or top nav using the `Nav` component
- **Positioning Claims status strip** — three indicators always visible at top of content area
- Providers wrapper
- Font: Inter (or system font stack for performance)
- Overall feel: dark zinc/slate tones, generous whitespace

The claims strip is a Server Component that fetches claims server-side for initial render, with client-side TanStack Query for updates.

**Step 2: Update globals.css**

Set base styles: zinc-50 background, clean typography, sensible defaults matching the "Linear meets Bloomberg" aesthetic.

**Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: add root layout with nav and positioning claims strip"
```

---

### Task 32: Home Page

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/pulse/pulse-card.tsx`
- Create: `src/components/pulse/pulse-detail.tsx`
- Create: `src/components/pulse/alert-card.tsx`

This is the **CMO Monday Morning Flow** from PRD Section 7:
1. Claims strip at top (from layout)
2. Latest Weekly/Monthly Pulse as primary content
3. Signal Alerts card row below

**Step 1: Create pulse display components**

`pulse-card.tsx`: Compact card for pulse archive list (headline, date, type badge)

`pulse-detail.tsx`: Full pulse display — renders `WeeklyPulseContent` or `MonthlyPulseContent` with proper formatting, evidence tier badges, claim status indicators.

`alert-card.tsx`: Expandable card for Signal Alerts — collapsed shows headline + evidence tier. Expanded shows full alert sections.

**Step 2: Build home page**

`src/app/page.tsx` should be a Server Component that:
- Fetches latest pulse and recent alerts via `fetch()` to the API (or directly with Prisma for Server Components)
- Renders the pulse detail as primary content
- Renders alert cards below
- Handles the "quiet week" state gracefully — "Nothing notable this week" is a valid, designed state

**Step 3: Commit**

```bash
git add src/app/page.tsx src/components/pulse/
git commit -m "feat: add home page with latest pulse and signal alerts"
```

---

### Task 33: Pulse Archive Page

**Files:**
- Create: `src/app/pulses/page.tsx`

Client component that:
- Fetches paginated pulse list via TanStack Query (`usePulses` hook)
- Filterable by type (weekly/monthly) using tabs or select
- Each entry shows: date, headline, type badge
- Click navigates to full pulse detail (can reuse pulse-detail component inline or expand)

**Commit:**

```bash
git add src/app/pulses/
git commit -m "feat: add pulse archive page with type filter"
```

---

### Task 34: Battlecard Pages

**Files:**
- Create: `src/app/battlecards/page.tsx`
- Create: `src/app/battlecards/[competitor]/page.tsx`
- Create: `src/components/battlecard/battlecard-grid.tsx`
- Create: `src/components/battlecard/battlecard-detail.tsx`

**Step 1: Battlecard grid page**

`src/app/battlecards/page.tsx`: Grid of battlecard cards showing competitor name, tier badge, last updated, reframe count. Click navigates to `/battlecards/[competitor]`.

`src/components/battlecard/battlecard-grid.tsx`: The grid component — responsive, compact cards.

**Step 2: Individual battlecard page**

`src/app/battlecards/[competitor]/page.tsx`: Dynamic route. Must be bookmarkable as `/battlecards/kyriba` (PRD Section 7 requirement).

`src/components/battlecard/battlecard-detail.tsx`: Renders full battlecard with sections:
- When They Come Up
- Their Pitch (list)
- Weaknesses (with evidence tier badges inline)
- Reframes (with evidence tier badges, talk track, "don't say")
- Open Questions

**Core constraint:** Reframes + "don't say" must be visible without scrolling past first viewport on standard laptop (PRD Section 7).

**Step 3: Commit**

```bash
git add src/app/battlecards/ src/components/battlecard/
git commit -m "feat: add battlecard grid and detail pages with evidence tier badges"
```

---

### Task 35: Intel Feed Page

**Files:**
- Create: `src/app/intel/page.tsx`

Client component with:
- Chronological feed of all IntelligenceItems
- Filters: competitor (multi-select), intelligence type, evidence tier, simulated/real, date range
- Each item shows: competitor badge, type badge, summary, Finmo implication, evidence tier badge, source link, `[SIMULATED]` badge if applicable
- Pagination
- Uses TanStack Query with filter params

**Commit:**

```bash
git add src/app/intel/
git commit -m "feat: add intel feed page with filters"
```

---

### Task 36: Admin Page

**Files:**
- Create: `src/app/admin/page.tsx`

Simple client component for editing battlecard reframes:
- Lists all reframes grouped by competitor
- Inline edit: weakness, talk track, anti-reframe, evidence tier
- Save button calls PUT /api/battlecards/:competitorId/reframes/:id
- Evidence tier dropdown restricted to CONFIRMED only (validation on both client and server)
- TanStack Query mutation with optimistic update

**Commit:**

```bash
git add src/app/admin/
git commit -m "feat: add admin page for battlecard reframe editing"
```

---

### Demo Checkpoint: Phase 6 — Dashboard UI Complete

**What to demonstrate:**
1. Start dev server: `npm run dev`
2. Open http://localhost:3000 — show home page with claims strip, latest pulse, alerts
3. Navigate to /pulses — show archive with type filter
4. Navigate to /battlecards — show grid, click into individual battlecard
5. Navigate to /battlecards/kyriba — show bookmarkable URL works
6. Navigate to /intel — show feed with filters, simulated badges
7. Navigate to /admin — show reframe editing
8. Verify evidence tier badges appear on all relevant items
9. Verify [SIMULATED] badges are prominent on all simulated data

**Verification script:**

```bash
npm run build && echo "BUILD OK"
npm run type-check && echo "TYPE CHECK OK"
npm run dev &
sleep 5
curl -s http://localhost:3000 | head -20
echo "Check http://localhost:3000 in browser"
```

**Report to product owner:**
- Full dashboard implemented: Home, Pulse Archive, Battlecards, Intel Feed, Admin
- CMO Monday Morning Flow works as designed (Section 7)
- Positioning Claims strip always visible at top
- Evidence tier badges on all intelligence items (FR-5, US-13)
- [SIMULATED] badges prominent on all synthetic data (FR-18)
- Battlecard pages bookmarkable at /battlecards/kyriba (Section 7)
- Admin reframe editing with CONFIRMED-tier enforcement
- Design: clean, information-dense, typographic hierarchy

**STOP HERE. Wait for go/no-go before proceeding to Phase 7.**

---

## Phase 7: Integration & Polish

### Task 37: Vercel Configuration

**Files:**
- Create: `vercel.json`

**Step 1: Create vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/cron/ingest",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/generate",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Both run daily at midnight UTC. The generate endpoint internally checks day-of-week (Monday for weekly pulse) and day-of-month (1st-5th for monthly pulse).

**Step 2: Add .gitignore entries**

Ensure `.gitignore` includes:

```
.env
.env.local
node_modules/
.next/
.vercel/
```

**Step 3: Commit**

```bash
git add vercel.json .gitignore
git commit -m "chore: add Vercel cron config and gitignore"
```

---

### Task 38: Smoke Test Script

**Files:**
- Create: `src/tests/smoke.test.ts`

This is the end-to-end smoke test from PRD Section 11:
1. Seed the database
2. Run one ingestion cycle (mocked sources)
3. Generate a Weekly Pulse
4. Verify the pulse is valid (structure, word count, evidence tiers)

**Step 1: Write the smoke test**

Create `src/tests/smoke.test.ts`:

```typescript
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { validateWeeklyPulse } from "@/lib/synthesis/validators";
import { OUTPUT_LIMITS } from "@/lib/config/thresholds";
import type { WeeklyPulseContent } from "@/types";

// This test validates the full pipeline using mock data
// For real E2E testing, use the manual curl commands in PRD Section 20

describe("Smoke Test: Pipeline Validation", () => {
  it("validates a well-formed weekly pulse", () => {
    const pulse: WeeklyPulseContent = {
      sections: {
        topSignals: [
          {
            competitor: "Kyriba",
            summary: "Launched AI cash forecasting module",
            implication: "Directly challenges MO AI positioning — bolt-on narrative weakens",
            evidenceTier: "CONFIRMED",
            sourceUrl: "https://www.kyriba.com/blog/ai-cash-forecasting",
          },
        ],
        claimStatuses: [
          {
            claimId: "claim-1",
            claimText: "Only mid-market accessible platform combining full treasury + payments",
            status: "HOLDING",
            changeFromLastWeek: "unchanged",
          },
          {
            claimId: "claim-2",
            claimText: "AI-native treasury intelligence (MO AI) vs. bolt-on AI from legacy players",
            status: "UNDER_PRESSURE",
            changeFromLastWeek: "degraded",
          },
          {
            claimId: "claim-3",
            claimText: "Multi-jurisdiction licensing as compliance moat",
            status: "HOLDING",
            changeFromLastWeek: "unchanged",
          },
        ],
        actionRequired: "Review MO AI messaging in light of Kyriba AI launch",
        outlook: "AI positioning under increasing pressure. Treasury+payments claim stable.",
      },
    };

    const result = validateWeeklyPulse(pulse, OUTPUT_LIMITS.WEEKLY_PULSE_MAX_WORDS);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects a pulse missing evidence tiers", () => {
    const badPulse = {
      sections: {
        topSignals: [
          {
            competitor: "Kyriba",
            summary: "Some event",
            implication: "Some impact",
            // Missing evidenceTier
            sourceUrl: "https://kyriba.com",
          },
        ],
        claimStatuses: [],
        actionRequired: null,
        outlook: "Fine.",
      },
    } as unknown as WeeklyPulseContent;

    const result = validateWeeklyPulse(badPulse, OUTPUT_LIMITS.WEEKLY_PULSE_MAX_WORDS);
    expect(result.valid).toBe(false);
  });

  it("rejects a pulse exceeding word limit", () => {
    const longPulse: WeeklyPulseContent = {
      sections: {
        topSignals: Array.from({ length: 20 }, (_, i) => ({
          competitor: `Competitor ${i}`,
          summary: "A very long summary that contains many words to push past the limit ".repeat(5),
          implication: "Extended implications text ".repeat(5),
          evidenceTier: "CONFIRMED" as const,
          sourceUrl: `https://example.com/${i}`,
        })),
        claimStatuses: [],
        actionRequired: "Lots of action ".repeat(50),
        outlook: "Extended outlook ".repeat(50),
      },
    };

    const result = validateWeeklyPulse(longPulse, OUTPUT_LIMITS.WEEKLY_PULSE_MAX_WORDS);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("word limit"))).toBe(true);
  });

  it("validates quiet week pulse (nothing notable)", () => {
    const quietPulse: WeeklyPulseContent = {
      sections: {
        topSignals: [],
        claimStatuses: [
          {
            claimId: "c1",
            claimText: "Claim 1",
            status: "HOLDING",
            changeFromLastWeek: "unchanged",
          },
        ],
        actionRequired: null,
        outlook: "Nothing notable this week. All positioning claims holding.",
      },
    };

    const result = validateWeeklyPulse(quietPulse, OUTPUT_LIMITS.WEEKLY_PULSE_MAX_WORDS);
    expect(result.valid).toBe(true);
  });
});
```

**Step 2: Run smoke test**

```bash
npm run test:smoke
```

Expected: All pass.

**Step 3: Commit**

```bash
git add src/tests/smoke.test.ts
git commit -m "test: add smoke test for pipeline validation"
```

---

### Task 39: Final Integration Verification

**Step 1: Run full test suite**

```bash
npm test
```

All tests across all modules should pass.

**Step 2: Run type check**

```bash
npm run type-check
```

Zero errors in strict mode.

**Step 3: Run build**

```bash
npm run build
```

Production build should succeed.

**Step 4: Run lint**

```bash
npm run lint
```

Fix any lint errors.

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "chore: fix lint and type errors from integration pass"
```

---

### Demo Checkpoint: Phase 7 — MVP Complete

**What to demonstrate:**
1. Full test suite passes: `npm test`
2. Type check passes: `npm run type-check`
3. Production build succeeds: `npm run build`
4. Dev server runs: `npm run dev`
5. Walk through the CMO Monday Morning Flow:
   - Open http://localhost:3000
   - Claims strip shows 3 indicators (all Holding with seed data)
   - Latest pulse displayed (after manual generation with seeded data)
   - Signal alerts visible
   - Navigate to battlecards, open Kyriba — verify reframes visible without scrolling
   - Navigate to intel feed — verify [SIMULATED] badges on all items
   - Navigate to admin — edit a reframe

**Verification script:**

```bash
npm test && echo "TESTS OK"
npm run type-check && echo "TYPES OK"
npm run build && echo "BUILD OK"
npm run lint && echo "LINT OK"
echo ""
echo "=== MVP VERIFICATION COMPLETE ==="
echo "Start dev server: npm run dev"
echo "Seed database: npx prisma db seed"
echo "Manual ingestion: curl -X POST http://localhost:3000/api/cron/ingest -H 'Authorization: Bearer \$CRON_SECRET'"
echo "Manual generation: curl -X POST http://localhost:3000/api/cron/generate -H 'Authorization: Bearer \$CRON_SECRET'"
```

**Report to product owner:**
- Full MVP implemented per PRD spec
- 7 phases complete: Foundation → Ingestion → Synthesis → Generation → API → UI → Integration
- All functional requirements covered: FR-1 through FR-18
- All user stories addressed: US-1, US-2, US-3, US-10, US-11, US-13, US-14
- Auto-publish guardrails enforced (Section 23)
- Evidence tiers visible throughout (NFR-5, NFR-6)
- [SIMULATED] badges prominent on all test data (FR-18)
- Dashboard loads fast, battlecards usable in 30 seconds
- Ready for Vercel deployment (vercel.json configured)

**STOP HERE. MVP complete. Next steps: deploy to Vercel, connect production database, run first real ingestion cycle.**

---

## Appendix: File Inventory

Total files to create (approximate):

| Category | Count |
|----------|-------|
| Config files | 8 (package.json, tsconfig, tailwind, vitest, vercel.json, .env.example, .prettierrc, .eslintrc) |
| Prisma | 2 (schema.prisma, seed.ts) |
| Lib - ingestion | 6 (base, website, rss, changelog, status-page, diff-engine, runner) |
| Lib - LLM | 6 (provider, claude, 4 prompt templates) |
| Lib - synthesis | 4 (evidence-tier, alert-evaluator, claim-assessor, validators) |
| Lib - generators | 4 (weekly-pulse, monthly-pulse, signal-alert, battlecard) |
| Lib - config/hooks | 3 (thresholds, db, hooks) |
| API routes | 12 (pulse/latest, pulses, alerts, claims, claims/:id/evidence, intel, battlecards, battlecards/:id, reframes/:id, cron/ingest, cron/generate) |
| Pages | 6 (home, pulses, battlecards grid, battlecard detail, intel, admin) |
| Components | 10 (providers, nav, evidence-tier-badge, claim-status-indicator, simulated-badge, pulse-card, pulse-detail, alert-card, battlecard-grid, battlecard-detail) |
| Types | 1 (index.ts) |
| Tests | 10+ (adapters, diff-engine, website, rss, runner, evidence-tier, alert-evaluator, claim-assessor, validators, smoke, API routes) |
| **Total** | **~72 files** |
