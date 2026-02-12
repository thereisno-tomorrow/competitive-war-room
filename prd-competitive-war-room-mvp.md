# PRD: Competitive War Room (MVP)

**Status:** Complete
**Created:** 2026-02-12
**Scope:** MVP / Functional Prototype
**Base PRD:** `prd-competitive-war-room.md` (full vision — this is the streamlined build spec)

---

## MVP Scope Summary

This MVP proves the Competitive War Room works end-to-end: real scraping of free sources, real LLM synthesis, real auto-published intelligence outputs on a live dashboard. Where data sources require paid APIs (G2, SEMrush, LinkedIn), the system uses realistic generated test data clearly marked `[SIMULATED]`.

**Architecture:** Next.js monolith (API routes + frontend + cron). No separate Python backend.

**What's in:** Weekly Pulse, Monthly Pulse, Signal Alerts, Battlecards, Evidence Tiers, Positioning Claims, Free-source scraping, LLM synthesis, Auto-publish.

**What's deferred to V2:** Win/loss data capture, Sales signal capture, Quarterly Evidence Gap Report, Feature Comparison Matrix, Evidence migration tracking, Monitoring/observability, Auth, Accessibility (WCAG).

---

## Section Progress

| # | Section | Status |
|---|---------|--------|
| 0 | Vision & Principles | ✅ |
| 1 | Problem Statement | ✅ |
| 2 | Target Users | ✅ |
| 3 | User Stories | ✅ |
| 4 | Functional Requirements | ✅ |
| 5 | Non-Functional Requirements | ✅ |
| 6 | Data Model | ✅ |
| 7 | UI/UX Specification | ✅ |
| 8 | API Contract | ✅ |
| 9 | Architecture Decisions | ✅ |
| 10 | Edge Cases & Errors | ✅ |
| 11 | Testing Strategy | ✅ |
| 12 | Success Metrics | ✅ |
| 13 | Scope Boundaries | ✅ |
| 14 | Risks & Mitigations | ✅ |
| 15 | Dependencies | ✅ |
| 16 | Technical Constraints | ✅ |
| 17 | Evolution Strategy | ✅ |
| 18 | Tech Stack | ✅ |
| 19 | Project Structure | ✅ |
| 20 | Commands | ✅ |
| 21 | Code Style & Examples | ✅ |
| 22 | Git Workflow | ✅ |
| 23 | AI Agent Boundaries | ✅ |

---

## 0. Vision & Principles

### Vision

The Competitive War Room is the intelligence foundation that every downstream GTM function depends on. It ingests raw competitor data — websites, changelogs, reviews, job postings, pricing pages, press releases — and produces opinionated, synthesized competitive intelligence. Without it, positioning, messaging, battlecards, and content are built on assumption instead of evidence.

The CMO has no competitive intel analyst. This system is that analyst.

### Core Principles

**1. Intelligence, not information.**
Every output must answer "so what?" with specificity. "Competitor X shipped AI reconciliation" is data. "This directly threatens 60% of our pipeline" is intelligence. If the CMO still has to connect the dots, the system has failed.

**2. Tiered trust, not uniform confidence.**
Alerts ship fast and rough. Battlecards ship slow and verified. Every output must signal its confidence level.

**3. Depth over breadth.**
Know the closest competitors deeply. Surface-level coverage of twenty competitors is worth less than real understanding of five.

**4. Urgency-aware, not calendar-driven.**
Cadence exists (weekly pulse, monthly deep-dives), but the system must break cadence when reality demands it. A major competitor outage on Tuesday cannot wait until Monday's weekly pulse.

**5. Signal over noise. Always.**
If alerts fire more than 2-3 times per week, the threshold is wrong. The system's editorial judgment — what to *exclude* — is the product.

**6. Disappear into the workflow.**
The CMO should not be "using a competitive intelligence tool." Information arrives in the right format, at the right time.

**7. Auto-publish. No human gate.**
Outputs publish automatically on cadence. This forces the accuracy and confidence frameworks to be bulletproof.

### Output Personas

| Output | Feels Like... |
|--------|--------------|
| Weekly Pulse | A sharp chief of staff briefing. 3 minutes. What changed, does it matter, do you need to act. |
| Battlecards | Your best sales rep's cheat sheet. Tactical, in sales language, not a research doc. |
| Alerts | A trusted colleague tapping your shoulder. Rare. When it comes, you pay attention. |
| Monthly Pulse | The CMO's own strategic read. Board-ready framing. |

### Design Reference

The dashboard should feel like **Linear meets a Bloomberg terminal's calm density** — information-rich but never overwhelming, with strong typographic hierarchy and generous whitespace. Quiet weeks feel intentionally calm, not empty. Active weeks feel urgent but organized, not noisy. If a page looks like a Jira dashboard or a generic admin panel, the design has failed.

---

## 1. Problem Statement

Finmo is a Series A treasury and payments platform competing against well-funded incumbents (Kyriba, HighRadius), well-capitalized horizontal players (Airwallex — $902M raised), and architecturally similar mid-market challengers (Trovata). The company is creating a new category ("Treasury Operating System") and positioning around three core claims:

1. Only mid-market accessible platform combining full treasury + payments
2. AI-native treasury intelligence (MO AI) vs. bolt-on AI from legacy players
3. Multi-jurisdiction licensing as compliance moat

**The CMO has no competitive intelligence infrastructure.** No CI analyst, no structured monitoring, no validated buyer evidence behind competitive claims. Positioning is built on inference, not evidence. Every downstream output — messaging, content strategy, sales enablement, board narratives — depends on competitive intelligence that currently doesn't exist in structured form.

---

## 2. Target Users

### Primary: CMO (Mansi Chopra)
- Primary consumer, does not operate the system
- Needs to know in 3 minutes whether anything requires her attention this week
- LinkedIn-first, hands-on, tests every claim against "how do we know?"

### Secondary: Head of Content Strategy (de facto PMM / Sales Enablement)
- Operator and maintainer. Translates CI outputs into content strategy and sales enablement
- Stretched across CI, PMM, and SE functions — the system must reduce workload, not add

### Tertiary: Sales Team (AEs)
- Consumers of battlecards only. Need competitive answers in 30 seconds before a call
- If battlecards feel academic or long, they won't use them

---

## 3. User Stories (MVP)

### MUST

**US-1 (CMO):** As the CMO, when a Tier 1 competitor makes a material move, I receive a Signal Alert within 24 hours so I can decide whether to respond before the market notices I'm behind.
- AC: Alert on dashboard home within 24 hours of qualifying event
- AC: Structure: What Happened → Why It Matters → Evidence Tier → Recommended Response
- AC: References at least one Finmo positioning claim affected

**US-2 (CMO):** As the CMO, every Monday I receive a Weekly Pulse that tells me in under 3 minutes what changed in the competitive landscape and whether anything requires action.
- AC: Published to dashboard by 8:00 AM SGT every Monday
- AC: Under 500 words
- AC: Quiet weeks produce "Nothing notable this week" — no filler

**US-3 (CMO):** As the CMO, monthly I receive a Positioning Pulse that tells me whether each of my three core competitive claims is holding, under pressure, or contested — with evidence.
- AC: Published within first 5 business days of each month
- AC: All three positioning claims assessed with current status and evidence count
- AC: Content Implications section contains 2-3 actionable bullets

**US-10 (AE):** As an AE, when a competitor comes up in a deal, I can pull up a one-page battlecard and know exactly what to say and what not to say — in 30 seconds.

**US-11 (AE):** As an AE, every reframe on the battlecard tells me its evidence tier (Confirmed/Inferred/Unknown) — so I don't make a claim that blows up in a live conversation.

**US-13 (System):** As the system, I distinguish between fast-and-rough signals and verified intelligence — and never present them with the same confidence level.
- AC: Every output item carries a visible evidence tier badge
- AC: Battlecards contain only Confirmed-tier claims
- AC: Validation layer rejects outputs with unlabeled assertions

**US-14 (System):** As the system, when a competitor event crosses the alert threshold, I break cadence and publish a Signal Alert immediately.
- AC: Alert published within 24 hours
- AC: Alert fires independently of weekly/monthly schedule
- AC: Alert volume averages ≤3/week

### SHOULD (MVP)

**US-6 (Content):** As the Head of Content Strategy, the Monthly Positioning Pulse gives me 2-3 specific, actionable content implications.

**US-7 (Content):** As the Head of Content Strategy, battlecard maintenance takes less than 2 hours/month because the system surfaces what changed and what needs updating.

---

## 4. Functional Requirements (MVP)

### 4.1 Data Ingestion

**FR-1 [MUST]: Multi-source competitor monitoring**
The system must ingest data from these free source types:
- Websites (product pages, pricing pages, about pages) — diff detection for changes
- Changelogs / release notes
- Press releases and newsroom pages (via RSS)
- Trade press (Fintech Singapore, Finextra, FF News via RSS)
- Status pages (for outage detection)

For paid/restricted sources, the system uses generated test data marked `[SIMULATED]`:
- G2 and Gartner Peer Insights reviews
- Job postings (LinkedIn)
- SEO/AEO keyword rankings (SEMrush/Ahrefs)
- Leadership LinkedIn activity
- Regulatory body announcements (MAS, ASIC, FCA, DFSA)

**FR-2 [MUST]: Competitor tiering**
Tier 1 (full monitoring): Kyriba, Airwallex.
Tier 2 (defined subset): Trovata, Nium, HighRadius, GTreasury.
Tiering stored as configuration, not code.

**FR-3 [MUST]: Scheduled ingestion**
Ingestion runs on a daily cron job. Each run:
- Checks all free sources for all active competitors
- Evaluates detected changes for alert-worthiness
- Generates Signal Alerts for qualifying events immediately
- Checks if it's Monday → triggers Weekly Pulse generation
- Checks if it's 1st business day of month → triggers Monthly Pulse generation

**FR-4 [MUST]: Change detection**
For web sources, the system must detect meaningful content changes — filtering out layout/cosmetic changes from substantive content changes. Uses content hashing and LLM-assisted relevance filtering.

### 4.2 Synthesis & Analysis

**FR-5 [MUST]: Evidence tier labeling**
Every piece of intelligence must be labeled:
- **Confirmed** — Public source, citable, factual
- **Inferred** — Reasonable conclusion from confirmed evidence
- **Unknown** — Requires buyer/primary validation

Inferred or Unknown claims must never appear with the same visual weight as Confirmed.

**FR-6 [MUST]: Alert threshold evaluation**
When a new data point arrives, evaluate against alert criteria:
- Does it involve a Tier 1 competitor?
- Does it directly affect one of Finmo's three core positioning claims?
- Is it a pricing change, outage, or negative press event?
- Does a competitor use "Treasury Operating System" language?

If yes to any → trigger Signal Alert. If no → queue for next scheduled output.

**FR-7 [MUST]: Positioning claim assessment**
Maintain Finmo's three core claims and continuously assess each as **Holding / Under Pressure / Contested** based on accumulated evidence.

**FR-8 [MUST]: "So what" synthesis**
Every output must include Finmo-specific interpretation — not just what happened, but why it matters for positioning, which segment is affected, and what action is recommended. Generic analysis is filtered out.

### 4.3 Output Generation

**FR-9 [MUST]: Competitive Signal Alert**
Auto-generated within 24 hours of a qualifying event. One page max. Structure: What Happened → Why It Matters for Finmo → Evidence Tier → Recommended Response → Action Items.

**FR-10 [MUST]: Weekly Pulse**
Auto-generated every Monday by 8 AM SGT. 3-minute read. Structure: what changed this week, does it matter, do you need to act.

**FR-11 [MUST]: Monthly Positioning Pulse**
Auto-generated first week of each month. Two pages max. Structure: Category Health → Tier 1 Competitor Shifts → Tier 2 Watch → Positioning Confidence (3 claims) → Content Implications (2-3 actionable bullets).

**FR-12 [MUST]: Competitive Battlecards**
One page per competitor. Updated monthly and ad hoc (triggered by Signal Alerts). Structure: When They Come Up → Their Pitch → Their Real Weaknesses → Our Reframe → What Not To Say → Open Questions. Every claim labeled with evidence tier.

### 4.4 Simulated Data

**FR-18 [MUST]: Simulated data distinction**
All data from paid/restricted sources must be:
- Generated to be realistic but clearly synthetic
- Flagged at the data level (`simulated: true` on IntelligenceItem)
- Visually distinct in all UI contexts with a bright `[SIMULATED]` badge
- Excluded from positioning claim assessments (only real data informs claim status)
- Distinguishable at a glance — the CMO should never mistake simulated data for real intelligence

---

## 5. Non-Functional Requirements (MVP)

### Timeliness
- **NFR-1:** Signal Alerts generated within 24 hours of qualifying event detection.
- **NFR-2:** Weekly Pulse delivered by 8:00 AM Monday SGT.
- **NFR-3:** Monthly Positioning Pulse delivered within first 5 business days of month.

### Accuracy & Trust
- **NFR-5:** Battlecard claims must be 100% Confirmed-tier. Zero tolerance for inferred data.
- **NFR-6:** Every claim in every output must carry a visible evidence tier label.

### Readability
- **NFR-8:** Weekly Pulse: max 500 words.
- **NFR-9:** Monthly Positioning Pulse: max ~1,000 words.
- **NFR-10:** Battlecards: one page per competitor.
- **NFR-11:** Signal Alerts: max one page.

### Noise Control
- **NFR-12:** Signal Alerts should average ≤3/week.
- **NFR-13:** Quiet weeks produce a quiet Weekly Pulse — no filler.

### Performance
- **NFR-15:** All dashboard pages must load in under 3 seconds on a standard connection.

### Delivery
- **NFR-14:** All outputs auto-publish to the dashboard without human approval.

### Security (MVP)
- **NFR-20:** CORS restricted to known frontend origins (Vercel deployment URL, localhost).
- No authentication required for MVP. Dashboard is open access. Admin pages exist but are unprotected.

---

## 6. Data Model

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
}

enum CompetitorTier {
  TIER_1
  TIER_2
}

enum CompetitorStatus {
  ACTIVE
  WATCHING
  ARCHIVED
}

enum SourceType {
  WEBSITE
  CHANGELOG
  PRESS_RSS
  STATUS_PAGE
  REVIEW        // Simulated in MVP
  JOB_POSTING   // Simulated in MVP
  SEO           // Simulated in MVP
  LINKEDIN      // Simulated in MVP
  REGULATORY    // Simulated in MVP
}

enum SourceCadence {
  DAILY
  WEEKLY
  MONTHLY
}

enum SourceHealth {
  HEALTHY
  DEGRADED
  STALE
}

enum IntelType {
  PRODUCT_CHANGE
  PRICING_CHANGE
  HIRING_SIGNAL
  PARTNERSHIP
  REVIEW
  PRESS
  OUTAGE
  MESSAGING_SHIFT
  SEO_CHANGE
  REGULATORY
}

enum EvidenceTier {
  CONFIRMED
  INFERRED
  UNKNOWN
}

enum ClaimStatus {
  HOLDING
  UNDER_PRESSURE
  CONTESTED
}

enum OutputType {
  WEEKLY_PULSE
  MONTHLY_PULSE
  SIGNAL_ALERT
}

enum ValidationStatus {
  PASSED
  REJECTED
  REGENERATED
  FLAGGED       // Requires human review before publishing (see ASK FIRST in Section 23)
}

model Competitor {
  id                String           @id @default(cuid())
  name              String           @unique
  tier              CompetitorTier
  status            CompetitorStatus @default(ACTIVE)
  createdAt         DateTime         @default(now()) @map("created_at")
  updatedAt         DateTime         @updatedAt @map("updated_at")

  sources           DataSource[]
  intelligenceItems IntelligenceItem[]
  battlecard        Battlecard?
  reframes          BattlecardReframe[]
  threatenedClaims  PositioningClaim[] @relation("CompetitorThreats")

  @@map("competitors")
}

model DataSource {
  id                 String        @id @default(cuid())
  competitorId       String        @map("competitor_id")
  type               SourceType
  url                String
  cadence            SourceCadence
  health             SourceHealth  @default(HEALTHY)
  lastChecked        DateTime?     @map("last_checked")
  lastChangeDetected DateTime?     @map("last_change_detected")
  lastContentHash    String?       @map("last_content_hash")
  createdAt          DateTime      @default(now()) @map("created_at")

  competitor         Competitor    @relation(fields: [competitorId], references: [id])
  intelligenceItems  IntelligenceItem[]

  @@map("data_sources")
}

model IntelligenceItem {
  id               String       @id @default(cuid())
  competitorId     String       @map("competitor_id")
  sourceId         String?      @map("source_id")
  detectedAt       DateTime     @default(now()) @map("detected_at")
  type             IntelType
  rawContent       String       @map("raw_content")
  summary          String
  finmoImplication String       @map("finmo_implication")
  evidenceTier     EvidenceTier @map("evidence_tier")
  sourceUrl        String       @map("source_url")
  alertTriggered   Boolean      @default(false) @map("alert_triggered")
  simulated        Boolean      @default(false)
  createdAt        DateTime     @default(now()) @map("created_at")

  competitor       Competitor   @relation(fields: [competitorId], references: [id])
  source           DataSource?  @relation(fields: [sourceId], references: [id])
  claimsAffected   PositioningClaim[] @relation("ClaimEvidence")
  reframes         BattlecardReframe[] @relation("ReframeEvidence")
  outputs          GeneratedOutput[] @relation("OutputIntelligence")

  @@index([competitorId, detectedAt])
  @@index([type])
  @@index([evidenceTier])
  @@index([simulated])
  @@map("intelligence_items")
}

model PositioningClaim {
  id              String      @id @default(cuid())
  claimText       String      @map("claim_text")
  currentStatus   ClaimStatus @default(HOLDING) @map("current_status")
  lastAssessed    DateTime?   @map("last_assessed")
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  evidenceItems   IntelligenceItem[] @relation("ClaimEvidence")
  threatenedBy    Competitor[] @relation("CompetitorThreats")

  @@map("positioning_claims")
}

model BattlecardReframe {
  id               String       @id @default(cuid())
  competitorId     String       @map("competitor_id")
  weakness         String
  reframe          String
  antiReframe      String       @map("anti_reframe")
  evidenceTier     EvidenceTier @map("evidence_tier")
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")

  competitor       Competitor   @relation(fields: [competitorId], references: [id])
  sourceItems      IntelligenceItem[] @relation("ReframeEvidence")

  @@map("battlecard_reframes")
}

model Battlecard {
  id               String       @id @default(cuid())
  competitorId     String       @unique @map("competitor_id")
  whenTheyComeUp   String       @map("when_they_come_up")
  theirPitch       Json         @map("their_pitch")       // string[]
  weaknesses       Json                                    // Array<{ text, evidenceTier, sourceUrl }>
  openQuestions    Json          @map("open_questions")    // string[]
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")

  competitor       Competitor   @relation(fields: [competitorId], references: [id])

  @@map("battlecards")
}

model GeneratedOutput {
  id                    String           @id @default(cuid())
  type                  OutputType
  publishedAt           DateTime         @default(now()) @map("published_at")
  headline              String
  content               Json
  wordCount             Int              @map("word_count")
  validationStatus      ValidationStatus @default(PASSED) @map("validation_status")
  generationMetadata    Json?            @map("generation_metadata")
  createdAt             DateTime         @default(now()) @map("created_at")

  intelligenceItems     IntelligenceItem[] @relation("OutputIntelligence")

  @@index([type, publishedAt])
  @@map("generated_outputs")
}
```

### Output Content Schemas (JSON structure for `GeneratedOutput.content`)

**Weekly Pulse:**
```typescript
{
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
    actionRequired: string | null; // null = quiet week
    outlook: string;
  }
}
```

**Monthly Pulse:**
```typescript
{
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
    contentImplications: string[]; // 2-3 actionable bullets
  }
}
```

**Signal Alert:**
```typescript
{
  sections: {
    whatHappened: string;
    whyItMatters: string;
    evidenceTier: EvidenceTier;
    claimsAffected: string[];
    recommendedResponse: string;
    actionItems: string[];
    sourceUrls: string[];
  }
}
```

---

## 7. UI/UX Specification

### Information Architecture (MVP)

```
WAR ROOM DASHBOARD
├── Home (Latest Output)
│   └── Most recent Weekly/Monthly Pulse, front and center
│   └── Active Signal Alerts (if any this week)
│   └── Positioning Claims status strip (3 indicators, always visible)
│
├── Pulse Archive
│   ├── Weekly Pulses (chronological)
│   └── Monthly Positioning Pulses
│
├── Battlecards
│   └── Card grid → click into full battlecard per competitor
│
├── Intel Feed
│   └── All IntelligenceItems (filterable by competitor, type, tier, simulated)
│
└── Admin
    └── Edit Battlecard Reframes (inline editing)
```

### CMO Monday Morning Flow

This is the primary use case — the experience the entire system optimizes for:

1. CMO opens dashboard (bookmarked, one click) → **Home page loads**
2. Eyes hit the **Positioning Claims strip** at top — three green/amber/red indicators. All green? Relaxed. Amber or red? Keep reading.
3. **Weekly Pulse** is front and center. Scans headline. Reads 500-word summary. Decides: anything need action? Most weeks: no.
4. Glances at **Signal Alerts card row** below the pulse. No alerts? Done. Alert present? Expands it, reads the "Why It Matters" and "Recommended Response."
5. **Total time: under 3 minutes.** CMO closes the tab. Intelligence consumed, no effort.

On months when a Monthly Pulse is current (first week), it replaces the Weekly Pulse as the primary content. The CMO gets the strategic view first.

### Key Design Requirements

**Evidence tiers are always visually distinct:**
- Confirmed: solid green badge, `✓ Confirmed`
- Inferred: outlined amber badge, `~ Inferred`
- Unknown: dashed red badge, `? Unknown`

**Positioning claim status is color-coded:**
- Holding: green
- Under Pressure: amber
- Contested: red

**Simulated data indicator:**
- Bright orange `[SIMULATED]` badge on any item where `simulated: true`
- Must be visible in intel feed, pulse detail views, and anywhere intelligence items surface
- Intentionally prominent — not subtle

**Quiet states are valued.** "Nothing notable this week" is a valid, well-designed state — not an empty state or error.

**Scannable first, detailed on demand.** Every page has a summary layer (cards, badges, status indicators). Detail is one click away, never forced.

**Battlecard one-page constraint.** Core content (reframes + don't say) must be visible without scrolling past the first viewport on a standard laptop screen.

**Direct URLs:** `/battlecards/kyriba` — bookmarkable, shareable for AE quick access.

### Pages

**Home**
- Latest Weekly Pulse as primary content (Monthly Pulse takes priority if it's first week of month)
- Card row for active Signal Alerts (expandable)
- Positioning Claims status strip — three indicators at top, always visible

**Pulse Archive**
- Chronological list of all pulses, filterable by type (weekly/monthly)
- Each entry shows: date, headline, type badge

**Battlecards**
- Card grid: competitor name, tier badge, last updated, reframe count
- Individual battlecard: expandable sections (When They Come Up, Their Pitch, Weaknesses, Reframes, Don't Say, Open Questions)
- Each reframe shows evidence tier badge inline

**Intel Feed**
- Chronological feed of all IntelligenceItems
- Filters: competitor (multi-select), intelligence type, evidence tier, simulated/real, date range
- Each item: competitor, type badge, summary, Finmo implication, evidence tier, source link, `[SIMULATED]` badge if applicable

**Admin**
- Edit battlecard reframes inline (update talk tracks, evidence tiers)
- Simple form interface — no complex workflows

---

## 8. API Contract

### Dashboard API

**GET /api/pulse/latest**
Returns the most recent pulse for the home page.
```typescript
Response: {
  type: "weekly" | "monthly";
  publishedAt: string;
  headline: string;
  content: WeeklyPulseContent | MonthlyPulseContent;
  signalAlertsThisWeek: GeneratedOutput[];
}
```

**GET /api/pulses?type={weekly|monthly}&limit={n}&offset={n}**
Paginated pulse archive.

**GET /api/alerts?limit={n}&offset={n}**
Signal Alerts, most recent first.

**GET /api/battlecards**
List all battlecards with summary stats.
```typescript
Response: Array<{
  competitorId: string;
  competitorName: string;
  tier: "TIER_1" | "TIER_2";
  lastUpdated: string;
  reframeCount: number;
}>
```

**GET /api/battlecards/:competitorId**
Full battlecard for a competitor.
```typescript
Response: {
  competitor: { id: string; name: string; tier: string };
  whenTheyComeUp: string;
  theirPitch: string[];
  weaknesses: Array<{ text: string; evidenceTier: EvidenceTier; sourceUrl: string }>;
  reframes: Array<{
    id: string;
    weakness: string;
    talkTrack: string;
    antiReframe: string;
    evidenceTier: EvidenceTier;
    sources: string[];
  }>;
  openQuestions: string[];
  lastUpdated: string;
}
```

**GET /api/claims**
Positioning claims with current status.
```typescript
Response: Array<{
  id: string;
  claimText: string;
  status: "HOLDING" | "UNDER_PRESSURE" | "CONTESTED";
  lastAssessed: string;
  evidenceForCount: number;
  evidenceAgainstCount: number;
}>
```

**GET /api/claims/:id/evidence**
All IntelligenceItems linked to a specific claim.

**GET /api/intel?competitor={id}&type={type}&tier={tier}&simulated={bool}&from={date}&to={date}&limit={n}&offset={n}**
Intel feed with filters. Paginated.

### Admin API

**PUT /api/battlecards/:competitorId/reframes/:id**
Update a battlecard reframe.
```typescript
Body: {
  weakness?: string;
  reframe?: string;
  antiReframe?: string;
  evidenceTier?: EvidenceTier;
}
```

### Cron API (called by Vercel Cron)

**POST /api/cron/ingest**
Trigger ingestion for all active sources. Protected by `CRON_SECRET` header.

**POST /api/cron/generate**
Trigger output generation (checks if Monday/1st of month). Protected by `CRON_SECRET` header.

### Error Responses

```typescript
{
  error: string;       // Human-readable message
  code: string;        // Machine-readable error code
}
```

| HTTP Status | Code | When |
|-------------|------|------|
| 400 | `invalid_request` | Malformed query params |
| 404 | `not_found` | Resource not found |
| 422 | `validation_error` | Submission fails validation |
| 500 | `internal_error` | Unhandled server error |

---

## 9. Architecture Decisions

### AD-1: Next.js Monolith

**Decision:** Single Next.js application handles frontend, API routes, ingestion, synthesis, and output generation.

**Rationale:** MVP doesn't need the complexity of a separate Python backend. Next.js API routes + Vercel Cron handle the scheduling. LLM calls work fine from TypeScript via the Anthropic SDK. Scraping works with Cheerio (static) and Puppeteer (JS-rendered if needed).

**Trade-off:** Loses Python ecosystem for scraping/ML. Acceptable for MVP — the scraping needs are straightforward (HTML parsing, RSS, HTTP polling).

### AD-2: LLM-Powered Synthesis

**Decision:** Use Claude (Sonnet for synthesis, Haiku for classification) for evidence tier assignment, "so what" analysis, alert evaluation, and output generation.

**Rationale:** The core value ("intelligence, not information") requires judgment that can't be rule-based. Abstracted behind a provider interface for potential switching.

**Guardrails:** Auto-publish requires validation — structured output formats, evidence tier constraints, template adherence checks. LLM generates within strict structural constraints.

### AD-3: Vercel Cron for Scheduling

**Decision:** Use Vercel Cron to trigger daily ingestion and output generation via API route endpoints.

**Rationale:** Eliminates Celery + Redis. Vercel Cron is simple, reliable, and free on Pro plan. Daily cadence is sufficient for MVP.

**Limitation:** Free tier allows 2 cron jobs max (daily). Pro plan allows more. For MVP, a single daily cron triggers both ingestion and conditional output generation.

### AD-4: Simulated Data as First-Class Concept

**Decision:** Simulated data is a data-level flag (`simulated: boolean`) with mandatory UI treatment, not a separate system.

**Rationale:** Simulated data flows through the same pipeline as real data — same storage, same display, same API responses. This means the full system is tested end-to-end even for paid sources. The flag ensures the CMO always knows what's real.

### AD-5: No Auth (MVP)

**Decision:** Dashboard is fully open. No login, no API keys for read endpoints. Admin editing is unprotected.

**Rationale:** Tiny user base. Auth adds complexity without value for a prototype. The API structure supports adding auth middleware later without restructuring routes.

### What's Configurable vs. Hardcoded

| Element | Storage | Change Mechanism |
|---------|---------|-----------------|
| Competitor list and tiers | Database (seeded) | Edit seed data, re-run seed or add via Prisma Studio |
| Positioning claims (3 claims) | Database (seeded) | Same as above |
| Source URLs per competitor | Database (seeded) | Same as above |
| Alert threshold criteria | `src/lib/config/thresholds.ts` | Code change (config file, not logic) |
| Output word limits | `src/lib/config/thresholds.ts` | Code change |
| Output templates/structure | `src/lib/llm/prompts/*.ts` | Code change |
| LLM model selection | `src/lib/llm/claude.ts` | Code change |
| Cron schedule | `vercel.json` | Code change (triggers redeploy) |
| Evidence tier definitions | Prisma enum | Schema migration (rare, shouldn't change) |

**Rule:** If an AI agent finds itself writing `if (competitor.name === "Kyriba")` or embedding a positioning claim string in logic, the architecture is wrong. Competitors and claims are data, not code.

---

## 10. Edge Cases & Errors

### Ingestion Failures

| Scenario | Behavior |
|----------|----------|
| Scraper breaks (website redesign) | Log failure, mark source as `DEGRADED`. Continue generating outputs from other sources. Flag in next Weekly Pulse: "Source X unavailable — coverage gap for [competitor]." |
| Source returns no changes for extended period | After 2x expected cadence without changes, mark as `STALE`. Not necessarily broken — could be genuinely unchanged. |
| Rate limiting | Backoff and retry on next cron cycle. Never skip a competitor entirely. |

### Synthesis Edge Cases

| Scenario | Behavior |
|----------|----------|
| LLM generates output violating evidence tier rules | Validation layer rejects. Regenerate with stricter constraints. If 3 consecutive failures, skip this output cycle and log error. |
| LLM generates generic "so what" | Validation: must reference at least one positioning claim or Finmo segment. If not, regenerate with explicit context. |
| Quiet week — no intelligence items | Weekly Pulse publishes "Nothing notable this week." Designed state, not error. |
| Quiet month — no material changes | Monthly Pulse publishes abbreviated: "No material positioning shifts. All three claims holding." |

### Alert Edge Cases

| Scenario | Behavior |
|----------|----------|
| Multiple alert-worthy events same day | Each gets its own Signal Alert. |
| Same event from multiple sources | Deduplicate. Single alert with multiple source citations. |
| Ambiguous event | Default to NOT alerting. Queue for Weekly Pulse. False negatives beat false positives. |

### Cron Edge Cases

| Scenario | Behavior |
|----------|----------|
| Cron fires twice (Vercel retry) | Use database lock — check if today's ingestion/generation already ran. Skip if yes. |
| Cron fails silently | Check `GeneratedOutput` table for expected outputs. If Monday pulse is missing by 9 AM, the system is broken. |
| LLM API is down during cron | Log error. Retry on next cron cycle. Ingestion still runs (data captured even if synthesis fails). |

---

## 11. Testing Strategy (MVP)

### Automated Tests

| Area | What to Test | Method |
|------|------------|--------|
| API routes | All endpoints return correct shapes | Vitest + supertest |
| Validation layer | Evidence tier enforcement, length limits, specificity check | Vitest unit tests |
| Prisma queries | Complex filters (intel feed, claim evidence) | Vitest with test DB |
| LLM output parsing | Structured output matches expected schema | Vitest with mocked LLM |

### Manual Testing

| Area | What to Check |
|------|--------------|
| Scraper health | Run ingestion, verify items created with correct types |
| Output quality | Read generated pulses — are they specific to Finmo? Do they answer "so what?" |
| Simulated badge | Verify `[SIMULATED]` appears prominently on all test data |
| Battlecard constraint | Can an AE find a reframe in 30 seconds? |
| Quiet week | Seed no changes, verify pulse says "nothing notable" |

### Integration Test Scenarios

| Scenario | Steps | Expected |
|----------|-------|----------|
| Ingestion → Alert pipeline | 1. Seed a Tier 1 competitor website source. 2. Mock a pricing page change. 3. Run ingestion. | IntelligenceItem created with `alertTriggered: true`. Signal Alert GeneratedOutput created. |
| Ingestion → Weekly Pulse inclusion | 1. Create 3 IntelligenceItems this week. 2. Trigger Weekly Pulse generation. | Pulse content references all 3 items. Word count ≤500. All evidence tiers labeled. |
| Claim status update | 1. Seed claim as HOLDING. 2. Add 3 IntelligenceItems challenging the claim. 3. Run claim assessment. | Claim status updated to UNDER_PRESSURE or CONTESTED. `lastAssessed` updated. |
| Validation rejection → regeneration | 1. Mock LLM returning output without positioning claim reference. 2. Run generation. | First attempt rejected. Second attempt includes explicit Finmo context. |

### Smoke Test Script

A single command that:
1. Seeds the database with competitors and sources
2. Runs one ingestion cycle
3. Generates a Weekly Pulse
4. Verifies the pulse is valid (structure, word count, evidence tiers)
5. Prints pass/fail

---

## 12. Success Metrics (MVP)

| Metric | Target | How to Measure |
|--------|--------|---------------|
| System generates Weekly Pulse on schedule | 100% of Mondays | Check `GeneratedOutput` table |
| Generated outputs pass validation | >90% first-attempt pass rate | `validationStatus` field |
| All real data items have evidence tiers | 100% | Query: items where `evidenceTier` is null |
| Simulated data is clearly marked | 100% of simulated items show badge | Visual inspection |
| Dashboard loads in <3 seconds | All pages | Browser dev tools |
| Battlecard usable in 30 seconds | Qualitative | User test with 1-2 people |

---

## 13. Scope Boundaries

### In Scope (MVP)
- Free-source scraping (websites, changelogs, RSS, status pages)
- LLM-powered synthesis and output generation
- Web dashboard (home, pulses, battlecards, intel feed, admin)
- Evidence tier framework throughout
- Positioning claim assessment
- Signal Alerts
- Simulated data for paid sources with clear visual distinction
- Battlecard reframe editing (admin)
- Auto-publish on cron schedule

### Out of Scope (MVP — Deferred to V2)
- Win/loss data capture and feedback loop
- Sales signal capture (AE debrief)
- Quarterly Evidence Gap Report
- Feature Comparison Matrix
- Evidence migration tracking
- Authentication / role-based access
- Email/Slack push delivery
- Accessibility (WCAG compliance)
- Monitoring/alerting for system failures
- Mobile optimization
- CRM integration

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scrapers break frequently | Coverage gaps | Adapter pattern isolates failures. `DEGRADED` flag. Simulated data fills gaps. |
| LLM produces inaccurate synthesis | Bad claims, trust erosion | Validation layer before auto-publish. Evidence tier constraints. |
| Vercel Cron limits (free tier = 2 jobs) | Can't run ingestion + generation separately | Single cron endpoint handles both. Upgrade to Pro if needed. |
| LLM costs unpredictable | Budget overrun | Use Haiku for classification, Sonnet only for final output generation. Batch where possible. |
| Generated test data looks too real | CMO acts on simulated intelligence | Prominent `[SIMULATED]` badge. Simulated data excluded from claim assessments. |
| Next.js API routes timeout | Ingestion/generation exceeds timeout | Vercel Pro required (300s). If individual ingestion runs exceed 300s, chunk by competitor. |

---

## 15. Dependencies

| Dependency | Type | Risk |
|-----------|------|------|
| Anthropic Claude API | External service | Provider outage blocks synthesis. Abstraction layer enables switching. |
| Vercel (hosting + cron) | Infrastructure | Platform dependency. Standard, reliable. |
| Vercel Postgres | Database | Managed service. Prisma abstracts provider. |
| Competitor websites | Public web | Redesigns break scrapers. Expected. |
| Cheerio / rss-parser | npm packages | Stable, widely used. |

---

## 16. Technical Constraints

- Vercel Pro plan required. Serverless function timeout: 300s (hobby's 10s is insufficient for ingestion + LLM calls).
- Vercel Cron: 2 jobs on hobby, more on Pro. Daily minimum cadence on hobby.
- LLM costs: Sonnet ~$3/1M input, $15/1M output tokens. Budget for ~$30-50/month at MVP scale.
- Dashboard must load in <3 seconds.
- Scraping must respect robots.txt and rate limits.
- All scheduled outputs based on SGT timezone.

---

## 17. Evolution Strategy

**MVP → V2 Path:**
1. Add win/loss data capture (form + feedback loop to battlecards)
2. Add sales signal capture (lightweight form for AEs)
3. Add evidence migration tracking + Quarterly Evidence Gap Report
4. Add Feature Comparison Matrix
5. Add auth (NextAuth.js — easy addition to Next.js)
6. Add Slack/email push delivery
7. Replace simulated data with real paid-source integrations as budget allows
8. Add monitoring/alerting for system health

**Architecture stays the same.** The Next.js monolith scales to V2. If ingestion complexity grows significantly (>10 real scrapers, sub-hourly cadence), consider extracting to a dedicated worker service.

---

## 18. Tech Stack

### Core
- **Next.js 14.2+** (App Router) with **TypeScript 5.4+** (strict mode)
- **Tailwind CSS 3.4** for styling
- **shadcn/ui** (latest) for component library
- **TanStack Query 5.x** for client-side data fetching and caching
- **Prisma 5.x** ORM with **Vercel Postgres** (PostgreSQL)

### Scraping & Ingestion
- **Cheerio 1.x** for HTML parsing (static pages)
- **rss-parser 3.x** for RSS feed ingestion
- **node-fetch** or built-in fetch for HTTP requests
- Content hashing (crypto built-in) for change detection

### LLM
- **@anthropic-ai/sdk** (latest) — Claude Sonnet 4.5 for synthesis, Haiku 4.5 for classification
- Abstracted behind a provider interface (can swap to OpenAI)

### Dev Tooling
- **ESLint** with Next.js config + strict TypeScript rules
- **Prettier** for formatting
- **Vitest** for testing
- **Husky + lint-staged** for pre-commit hooks

### Deployment
- **Vercel Pro plan** (frontend + API routes + cron) — **Pro is required, not optional.** Hobby plan's 10-second serverless timeout is insufficient for ingestion (scraping multiple sites) and LLM synthesis (Claude API calls). Pro provides 300-second timeout and more flexible cron scheduling.
- **Vercel Postgres** (database)
- **GitHub Actions** for CI (lint + test on PR)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Vercel Postgres connection string |
| `ANTHROPIC_API_KEY` | Yes | Claude API key for synthesis |
| `CRON_SECRET` | Yes | Shared secret for cron endpoint protection |
| `NEXT_PUBLIC_APP_URL` | Yes | Deployment URL (for CORS) |

---

## 19. Project Structure

```
competitive-war-room/
├── prisma/
│   ├── schema.prisma              # Database schema (see Section 6)
│   └── seed.ts                    # Seed script: competitors, sources, claims, test data
│
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (nav, positioning claims strip)
│   │   ├── page.tsx               # Home — latest pulse + alerts
│   │   ├── pulses/
│   │   │   └── page.tsx           # Pulse archive
│   │   ├── battlecards/
│   │   │   ├── page.tsx           # Battlecard grid
│   │   │   └── [competitor]/
│   │   │       └── page.tsx       # Individual battlecard
│   │   ├── intel/
│   │   │   └── page.tsx           # Intel feed
│   │   ├── admin/
│   │   │   └── page.tsx           # Battlecard reframe editing
│   │   └── api/
│   │       ├── pulse/
│   │       │   └── latest/route.ts
│   │       ├── pulses/route.ts
│   │       ├── alerts/route.ts
│   │       ├── battlecards/
│   │       │   ├── route.ts
│   │       │   └── [competitorId]/
│   │       │       ├── route.ts
│   │       │       └── reframes/
│   │       │           └── [id]/route.ts
│   │       ├── claims/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── evidence/route.ts
│   │       ├── intel/route.ts
│   │       └── cron/
│   │           ├── ingest/route.ts     # Daily ingestion cron
│   │           └── generate/route.ts   # Output generation cron
│   │
│   ├── lib/
│   │   ├── db.ts                       # Prisma client singleton
│   │   ├── llm/
│   │   │   ├── provider.ts             # Abstract LLM interface
│   │   │   ├── claude.ts               # Claude implementation
│   │   │   └── prompts/
│   │   │       ├── weekly-pulse.ts
│   │   │       ├── monthly-pulse.ts
│   │   │       ├── signal-alert.ts
│   │   │       └── claim-assessment.ts
│   │   ├── ingestion/
│   │   │   ├── adapters/
│   │   │   │   ├── base.ts             # Adapter interface
│   │   │   │   ├── website.ts          # Website diff scraper
│   │   │   │   ├── changelog.ts        # Changelog scraper
│   │   │   │   ├── rss.ts              # RSS feed reader
│   │   │   │   └── status-page.ts      # Status page poller
│   │   │   ├── diff-engine.ts          # Content change detection
│   │   │   └── runner.ts               # Orchestrates ingestion run
│   │   ├── synthesis/
│   │   │   ├── evidence-tier.ts        # Tier classification
│   │   │   ├── alert-evaluator.ts      # Alert threshold logic
│   │   │   ├── claim-assessor.ts       # Positioning claim assessment
│   │   │   └── validators.ts           # Output validation rules
│   │   └── generators/
│   │       ├── weekly-pulse.ts
│   │       ├── monthly-pulse.ts
│   │       ├── signal-alert.ts
│   │       └── battlecard.ts
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── pulse/
│   │   │   ├── pulse-card.tsx
│   │   │   └── pulse-detail.tsx
│   │   ├── battlecard/
│   │   │   ├── battlecard-grid.tsx
│   │   │   └── battlecard-detail.tsx
│   │   └── shared/
│   │       ├── evidence-tier-badge.tsx
│   │       ├── claim-status-indicator.tsx
│   │       ├── simulated-badge.tsx
│   │       └── nav.tsx
│   │
│   └── types/
│       └── index.ts                    # Shared TypeScript types
│
├── vercel.json                         # Cron configuration
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── vitest.config.ts
```

---

## 20. Commands

### Setup

```bash
git clone <repo>
cd competitive-war-room
cp .env.example .env                    # Add ANTHROPIC_API_KEY, DATABASE_URL, CRON_SECRET
npm install
npx prisma generate                     # Generate Prisma client
npx prisma db push                      # Push schema to database
npx prisma db seed                      # Seed competitors, sources, claims, test data
npm run dev                             # localhost:3000
```

### Development

```bash
npm run dev                             # Next.js dev server (localhost:3000)
npm run build                           # Production build
npm run lint                            # ESLint
npm run format                          # Prettier
npm run type-check                      # TypeScript strict check (tsc --noEmit)
```

### Testing

```bash
npm test                                # Run all Vitest tests
npm test -- --coverage                  # With coverage
npm run test:smoke                      # Smoke test: seed → ingest → generate → validate
```

### Database

```bash
npx prisma studio                       # Visual DB browser
npx prisma db push                      # Push schema changes
npx prisma db seed                      # Re-seed data
npx prisma migrate dev --name <name>    # Create migration
```

### Manual Operations

```bash
# Trigger ingestion manually (useful for testing)
curl -X POST http://localhost:3000/api/cron/ingest \
  -H "Authorization: Bearer $CRON_SECRET"

# Trigger output generation manually
curl -X POST http://localhost:3000/api/cron/generate \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Deployment

```bash
# Vercel deploys automatically on push to main
git push origin main

# Run database migration on Vercel
npx vercel env pull .env.local          # Pull production env
npx prisma db push                      # Push schema to production DB
```

---

## 21. Code Style & Examples

### General Rules

- **TypeScript strict mode.** No `any`. No `as` casts unless absolutely necessary with a comment explaining why.
- **Functional components only.** No class components.
- **Server Components by default.** Only add `"use client"` when the component needs interactivity.
- **TanStack Query for all client-side data fetching.** No raw `fetch` in components.
- **Prisma for all database access.** No raw SQL.
- **Let exceptions propagate.** Don't catch-and-swallow. Handle errors at API route boundaries.

### Naming Conventions

| Layer | Convention | Example |
|-------|-----------|---------|
| Files (components) | kebab-case | `evidence-tier-badge.tsx` |
| Files (lib/utils) | kebab-case | `alert-evaluator.ts` |
| React components | PascalCase | `EvidenceTierBadge` |
| TypeScript types/interfaces | PascalCase | `WeeklyPulseContent` |
| Functions/variables | camelCase | `evaluateAlert()`, `evidenceTier` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_PULSE_WORDS` |
| API routes | kebab-case URLs | `/api/pulse/latest` |
| Prisma models | PascalCase | `IntelligenceItem` |
| Database tables | snake_case (via @@map) | `intelligence_items` |
| Environment variables | SCREAMING_SNAKE_CASE | `ANTHROPIC_API_KEY` |
| CSS classes | Tailwind utilities | `bg-green-100 text-green-800` |

### GOOD: Evidence Tier Badge

```tsx
import { cn } from "@/lib/utils";

type EvidenceTier = "CONFIRMED" | "INFERRED" | "UNKNOWN";

const tierConfig = {
  CONFIRMED: { label: "Confirmed", icon: "✓", className: "bg-green-100 text-green-800 border-green-300" },
  INFERRED: { label: "Inferred", icon: "~", className: "bg-amber-50 text-amber-700 border-amber-200 border-dashed" },
  UNKNOWN: { label: "Unknown", icon: "?", className: "bg-red-50 text-red-600 border-red-200 border-dashed" },
} as const;

export function EvidenceTierBadge({ tier }: { tier: EvidenceTier }) {
  const config = tierConfig[tier];
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border",
      config.className
    )}>
      {config.icon} {config.label}
    </span>
  );
}
```

### GOOD: API Route with Validation

```typescript
// src/app/api/claims/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const claims = await prisma.positioningClaim.findMany({
    include: {
      _count: {
        select: { evidenceItems: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    claims.map((claim) => ({
      id: claim.id,
      claimText: claim.claimText,
      status: claim.currentStatus,
      lastAssessed: claim.lastAssessed,
      evidenceCount: claim._count.evidenceItems,
    }))
  );
}
```

### GOOD: LLM Provider Interface

```typescript
// src/lib/llm/provider.ts
export interface LLMProvider {
  synthesize(prompt: string, context: Record<string, unknown>): Promise<string>;
  classify(content: string, categories: string[]): Promise<string>;
}
```

```typescript
// src/lib/llm/claude.ts
import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider } from "./provider";

export class ClaudeProvider implements LLMProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  async synthesize(prompt: string, context: Record<string, unknown>): Promise<string> {
    const response = await this.client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  }

  async classify(content: string, categories: string[]): Promise<string> {
    const response = await this.client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{
        role: "user",
        content: `Classify the following into exactly one category.\n\nContent: ${content}\nCategories: ${categories.join(", ")}\n\nRespond with only the category name.`,
      }],
    });
    return response.content[0].type === "text" ? response.content[0].text.trim() : "";
  }
}
```

### GOOD: Ingestion Adapter Interface

```typescript
// src/lib/ingestion/adapters/base.ts
import type { DataSource } from "@prisma/client";

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
  fetch(source: DataSource): Promise<RawContent[]>;
  detectChanges(current: RawContent[], previousHash: string | null): Promise<DetectedChange[]>;
}
```

### BAD: Anti-Patterns to Avoid

```typescript
// BAD: Raw fetch in a component
function BadComponent() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/api/claims").then(r => r.json()).then(setData);  // Use TanStack Query instead
  }, []);
}

// BAD: Catching and swallowing errors
try {
  await generatePulse();
} catch (e) {
  console.log(e);  // Don't swallow — let it propagate to the API route error handler
}

// BAD: Using `any`
function processItem(item: any) {  // Type it properly
  return item.summary;
}

// BAD: Hardcoding competitor names
if (competitor.name === "Kyriba") {  // Use tier/config, not hardcoded names
  // special logic
}
```

---

## 22. Git Workflow

### Branching

- `main` — production. Deploys automatically via Vercel.
- `dev` — integration branch. PRs merge here first.
- Feature branches: `feat/website-scraper`, `feat/weekly-pulse-generator`
- Fix branches: `fix/rss-parser-timeout`

### Commit Convention

```
feat: add website scraping adapter
fix: handle empty changelog response
chore: update Anthropic SDK
```

### PR Process

- All PRs to `dev` first, then `dev` → `main` for releases
- PRs must include: what changed, which FR/US it addresses, how to test
- CI must pass (lint + type-check + tests)

### Protected Files (require careful review before modifying)

| File | Why |
|------|-----|
| `prisma/schema.prisma` | Schema changes require migration planning. Adding/removing fields affects all queries. |
| `prisma/seed.ts` | Changes affect demo state and all seeded data. Verify competitor data is accurate. |
| `vercel.json` | Cron schedule changes affect production. Incorrect config breaks auto-publish. |
| `.env` / `.env.example` | Never commit secrets. `.env.example` documents required variables. |
| `src/lib/llm/prompts/*.ts` | Prompt changes directly affect output quality. Test with dry runs before merging. |
| `src/lib/config/thresholds.ts` | Threshold changes affect alert volume and output behavior. |

---

## 23. AI Agent Boundaries

### What the AI Agent (LLM Synthesis) Can Do

- Generate output content (pulses, alerts, battlecard drafts) within structural templates
- Classify evidence tiers for ingested data
- Evaluate alert thresholds against defined criteria
- Assess positioning claims against accumulated evidence
- Generate "so what" synthesis tied to Finmo's specific context

### What the AI Agent Should Flag (ASK FIRST — auto-publish pauses)

These events are significant enough that the system should generate the output but flag it for human review before publishing:
- A positioning claim shifting from Holding to Contested (first time)
- An IntelligenceItem that contradicts an existing Confirmed-tier battlecard reframe
- A Signal Alert about a competitor entering Finmo's core category ("Treasury Operating System" language detected)
- Output generation failing validation 2+ times in a row (may indicate prompt drift or data quality issue)

Implementation: flagged outputs are saved with `validationStatus: "FLAGGED"` and surfaced in the Admin panel. They auto-publish after 24 hours if not manually reviewed.

### What the AI Agent Cannot Do

- Publish Inferred or Unknown claims in battlecards (validation layer blocks this)
- Override a manual evidence tier assignment
- Generate outputs that don't reference Finmo's positioning claims (validation rejects generic analysis)
- Add or remove competitors (config-only, requires human)
- Change alert thresholds (config-only)
- Fabricate source URLs or citations (every claim must link to a real IntelligenceItem)

### Guardrails for Auto-Publish

1. **Structural validation** — Every output must conform to its content schema. Missing fields = rejected.
2. **Evidence tier enforcement** — Battlecard reframes must be Confirmed. Inferred/Unknown = rejected.
3. **Finmo specificity check** — Every output must reference at least one positioning claim or Finmo segment. Generic = rejected and regenerated.
4. **Length limits** — Outputs exceeding word limits are rejected and regenerated.
5. **Source verification** — Every factual claim must reference an IntelligenceItem ID. No hallucinated citations.
6. **Confidence signaling** — Insufficient data = "Assessment deferred" rather than guessing.
7. **Max 3 regeneration attempts** — If validation fails 3 times, skip this output cycle and log error.

### Seed Data Specification

The seed script (`prisma/seed.ts`) must populate:

**Competitors:**

| Name | Tier | Threatens Claims (via `threatenedClaims` relation) |
|------|------|---------------------------------------------------|
| Kyriba | TIER_1 | Claim 1 (expanding to mid-market), Claim 2 (adding AI bolt-on) |
| Airwallex | TIER_1 | Claim 1 (adding treasury to payments), Claim 3 (multi-jurisdiction licensed) |
| Trovata | TIER_2 | Claim 1 (mid-market treasury positioning) |
| Nium | TIER_2 | Claim 3 (multi-jurisdiction payments infrastructure) |
| HighRadius | TIER_2 | Claim 2 (AI-powered AR/AP/Treasury) |
| GTreasury | TIER_2 | Claim 1 (treasury management, potential mid-market overlap) |

**Positioning Claims (3):**
1. "Only mid-market accessible platform combining full treasury + payments"
2. "AI-native treasury intelligence (MO AI) vs. bolt-on AI from legacy players"
3. "Multi-jurisdiction licensing as compliance moat"

**Data Sources per Competitor:**

*Tier 1 — Full monitoring:*

| Competitor | Source Type | URL | Notes |
|------------|-----------|-----|-------|
| Kyriba | WEBSITE | `https://www.kyriba.com/solutions/treasury/` | Main solutions page |
| Kyriba | CHANGELOG | `https://developer.kyriba.com/site/global/change_log/api-changelog.gsp` | API changelog |
| Kyriba | PRESS_RSS | `https://www.kyriba.com/company/newsroom/` | Newsroom page, scrape for RSS |
| Kyriba | WEBSITE | `https://www.kyriba.com/blog/` | Blog for messaging shifts |
| Airwallex | WEBSITE | `https://www.airwallex.com/us` | Main product page |
| Airwallex | WEBSITE | `https://www.airwallex.com/us/pricing` | Public pricing page — high-value diff target |
| Airwallex | PRESS_RSS | `https://www.airwallex.com/newsroom` | Newsroom |
| Airwallex | CHANGELOG | `https://www.airwallex.com/us/blog/` | Monthly release notes in blog format |

*Tier 2 — Defined subset:*

| Competitor | Source Type | URL | Notes |
|------------|-----------|-----|-------|
| Trovata | WEBSITE | `https://trovata.io/ds/treasury-platform/` | Main product page |
| Trovata | WEBSITE | `https://trovata.io/pricing/` | Public pricing ($24k/year base) |
| Trovata | PRESS_RSS | `https://trovata.io/press/` | Press page |
| Nium | WEBSITE | `https://www.nium.com/products` | Main product page |
| Nium | CHANGELOG | `https://docs.nium.com/changelog` | Comprehensive changelog |
| Nium | STATUS_PAGE | `https://status.nium.com/` | Only competitor with public status page |
| HighRadius | WEBSITE | `https://www.highradius.com/product/` | Main product page |
| HighRadius | CHANGELOG | `https://www.highradius.com/whats-new/` | "What's New" page |
| GTreasury | WEBSITE | `https://www.gtreasury.com/solutions/tms/treasury-management-system` | Main TMS page |
| GTreasury | PRESS_RSS | `https://www.gtreasury.com/company/press` | Press releases |

*Notes:* Kyriba, HighRadius, GTreasury, and Nium have no public pricing pages (contact sales only). Only Nium has a public status page. Airwallex's pricing page is the highest-value scraping target — a pricing change there is an immediate Signal Alert.

**Simulated IntelligenceItems:**
Seed 15-25 realistic simulated intelligence items across competitors, covering multiple `IntelType` values. These should reference real-world plausible scenarios (e.g., "Kyriba announces AI-powered cash forecasting", "Airwallex launches multi-currency treasury accounts"). All marked `simulated: true`.

**Initial Battlecard Reframes:**
Seed 3-4 reframes per Tier 1 competitor with realistic talk tracks, anti-reframes, and evidence tiers.

### Vercel Cron Configuration

```json
// vercel.json
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

Both endpoints check `Authorization: Bearer ${CRON_SECRET}` header. The generate endpoint checks:
- Is it Monday? → Generate Weekly Pulse
- Is it 1st-5th business day of month? → Generate Monthly Pulse
- Are there unprocessed alert-worthy items? → Generate Signal Alerts

### LLM Prompt Architecture

Each output type has a dedicated prompt template in `src/lib/llm/prompts/`. Prompts include:
- Finmo context (3 positioning claims, competitor tiers, recent intelligence items)
- Output structure requirements (exact JSON schema expected)
- Evidence tier rules (what can/cannot be asserted at each tier)
- The "intelligence, not information" principle: omit items that don't warrant attention
- Explicit instruction to output valid JSON matching the content schema

Prompts are regular TypeScript files (template literals with variable injection), versioned with the codebase.
