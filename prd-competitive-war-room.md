# PRD: Competitive War Room

**Status:** Complete
**Created:** 2026-02-12
**Topic:** Competitive intelligence system — ingests competitor data, produces structured CI outputs on a cadence

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
| 9 | Change Analysis | ✅ |
| 10 | Architecture Decisions | ✅ |
| 11 | Edge Cases & Errors | ✅ |
| 12 | Testing Strategy | ✅ |
| 13 | Success Metrics | ✅ |
| 14 | Scope Boundaries | ✅ |
| 15 | Risks & Mitigations | ✅ |
| 16 | Dependencies | ✅ |
| 17 | Technical Constraints | ✅ |
| 18 | Evolution Strategy | ✅ |
| 19 | Tech Stack | ✅ |
| 20 | Project Structure | ✅ |
| 21 | Commands | ✅ |
| 22 | Code Style & Examples | ✅ |
| 23 | Git Workflow | ✅ |
| 24 | AI Agent Boundaries | ✅ |

---

## 0. Vision & Principles

### Vision

The Competitive War Room is the intelligence foundation that every downstream GTM function depends on. It ingests raw competitor data — websites, changelogs, reviews, job postings, pricing pages, press releases — and produces opinionated, synthesized competitive intelligence. Without it, positioning, messaging, battlecards, and content are built on assumption instead of evidence.

The CMO has no competitive intel analyst. This system is that analyst.

### Core Principles

**1. Intelligence, not information.**
The system's value is synthesis, not collection. Every output must answer "so what?" with specificity. "Competitor X shipped AI reconciliation targeting mid-market" is data. "This directly threatens 60% of our pipeline and sales should expect objections in active deals with [segment]" is intelligence. If the CMO still has to connect the dots, the system has failed.

**2. Tiered trust, not uniform confidence.**
Not all data deserves the same treatment. Alerts ship fast and rough — a status page ping or Twitter spike is enough. Battlecards and feature matrices ship slow and verified — one wrong claim in a sales call destroys trust in the entire system permanently. Every output must signal its confidence level.

**3. Depth over breadth.**
Focus on the closest competitors. Know them deeply — their product trajectory, their hiring patterns, their messaging shifts, their pricing strategy. Surface-level coverage of twenty competitors is worth less than real understanding of five.

**4. Urgency-aware, not calendar-driven.**
Cadence exists (weekly pulse, monthly deep-dives), but the system must break cadence when reality demands it. A major competitor outage on Tuesday cannot wait until Monday's weekly pulse. If the cadence is more reliable than the alerting, the architecture is wrong.

**5. Signal over noise. Always.**
If the CMO opens this and sees a wall of data, it's failed. If alerts fire more than 2-3 times per week, the threshold is wrong. If everything feels urgent, nothing is. The system's editorial judgment — what to *exclude* — is the product.

**6. Disappear into the workflow.**
The CMO should not be "using a competitive intelligence tool." Information arrives in the right format, at the right time, in the right channel. The system is infrastructure, not an interface.

**7. Auto-publish. No human gate.**
Outputs publish automatically on cadence. This is a non-negotiable design constraint that forces the accuracy and confidence frameworks to be bulletproof — there's no safety net of human review.

### Output Personas

| Output | Feels Like... |
|--------|--------------|
| Weekly Pulse | A sharp chief of staff briefing. 3 minutes. What changed, does it matter, do you need to act. |
| Battlecards | Your best sales rep's cheat sheet. Tactical, in sales language, not a research doc. |
| Alerts | A trusted colleague tapping your shoulder. Rare. When it comes, you pay attention. |
| Quarterly Brief | The CMO wrote it themselves. Their vocabulary, their framing. Drops into a board deck without editing. |
| Feature Matrix | Verified, sourced, publishable. Could go on the website or into a sales deck tomorrow. |

### Data Freshness Tiers

| Tier | Cadence | Data Types |
|------|---------|------------|
| Real-time / same-day | Alert-driven | Pricing changes, outages, regulatory flags, negative press |
| Weekly | Scheduled | Changelogs, messaging shifts, job postings, ad copy |
| Bi-weekly / monthly | Scheduled | Reviews, content themes, headcount trends, partnership announcements |

---

## 1. Problem Statement

### The Problem

Finmo is a Series A treasury and payments platform competing in a landscape that includes well-funded enterprise incumbents (Kyriba, HighRadius), well-capitalized horizontal players (Airwallex — $902M raised), and architecturally similar mid-market challengers (Trovata). The company is actively creating a new category ("Treasury Operating System") and positioning around three core claims: full treasury + payments integration, AI-native intelligence (MO AI), and multi-jurisdiction licensing as a moat.

**The CMO has no competitive intelligence infrastructure.** There is no dedicated competitive intelligence analyst, no structured win/loss program, no systematic competitor monitoring, and no validated buyer evidence behind competitive claims. The Head of Content Strategy functions as de facto Product Marketing and Sales Enablement — but without a CI system feeding them, competitive positioning is built on inference rather than evidence.

### What This Causes

1. **Battlecards don't exist or are based on unvalidated assumptions.** Sales reps improvise competitive responses. Reframes are logical but untested — no one knows which actually work in deals. One wrong claim in a call destroys credibility.

2. **Positioning claims are unverified.** Finmo asserts "only mid-market accessible platform combining full treasury + payments" — but has no systematic way to confirm this is still true or detect when a competitor closes the gap. The CMO cannot answer "how do we know?" for core positioning.

3. **Competitive threats arrive late.** Without systematic monitoring, the CMO learns about material moves (Airwallex launching treasury capabilities, Kyriba pushing downmarket, Trovata adding payments) from journalists, board members, or customers — not from an early warning system. Reactive, not prepared.

4. **Category creation is flying blind.** "Treasury Operating System" is a deliberate category strategy, but there's no empirical measurement of whether it's gaining traction — no search volume tracking, no buyer language validation, no analyst adoption signals.

5. **No feedback loop between sales reality and marketing strategy.** Without win/loss data, there's no way to know which competitors actually appear in evaluations, at what stage buyers eliminate alternatives, or what language buyers use to describe the treasury problem. Content and messaging are based on what Finmo believes, not what buyers experience.

### Why Now

- Finmo is post-Series A and scaling GTM — the cost of wrong positioning compounds with every hire, every campaign, every sales cycle
- Airwallex's expansion into treasury-adjacent capabilities is an inferred but plausible threat that could invalidate Finmo's structural positioning
- The Head of Content Strategy role (de facto PMM/SE) needs a CI system to function effectively — without it, one person is trying to do competitive intelligence, product marketing, and sales enablement simultaneously with no data foundation
- Every downstream output — messaging, content strategy, sales enablement, board narratives — depends on competitive intelligence that currently doesn't exist in structured form

---

## 2. Target Users

### Primary User: CMO (Mansi Chopra)

- **Relationship to system:** Primary consumer of all outputs. Does not operate the system — receives its intelligence.
- **Key behaviors:** LinkedIn-first, hands-on, acts on intelligence directly, strategic thinker who needs "so what" not "what happened." Tests every claim against "how do we know?"
- **Consumes:** Weekly Pulse, Competitive Signal Alerts, Monthly Positioning Pulse, Quarterly Evidence Gap Report. Reviews battlecards for accuracy.
- **Action threshold:** Needs to know in 3 minutes whether anything requires her attention this week. Most weeks the answer is no.

### Secondary User: Head of Content Strategy (de facto PMM / Sales Enablement)

- **Relationship to system:** Operator and maintainer. Translates CI outputs into content strategy, messaging, and sales enablement materials. Owns the win/loss interview program.
- **Key behaviors:** Maintains battlecards, executes on Positioning Pulse content implications, runs win/loss interviews, feeds evidence back into the system.
- **Consumes:** All outputs, plus raw data feeds for content creation. Needs the "Content Implications" sections to be specific and actionable.
- **Unique need:** This person is stretched across CI, PMM, and SE functions with no dedicated support. The system must reduce their workload, not add to it.

### Tertiary User: Sales Team (AEs)

- **Relationship to system:** Consumers of battlecards. Contributors of sales conversation signals (weekly debrief data, win/loss interview participation).
- **Key behaviors:** Need competitive answers in-call or in prep. Will not read research documents. Need cheat sheets in the language they actually use with buyers.
- **Consumes:** Battlecards only. May receive forwarded Signal Alerts when relevant to active deals.
- **Unique need:** If battlecards feel academic or long, they won't use them. The format must survive a "30 seconds before a call" use case.

### Peripheral User: CEO / Board

- **Relationship to system:** Occasional consumer of Quarterly Evidence Gap Report and board-ready competitive narratives.
- **Consumes:** Quarterly brief, positioned as CMO's own strategic analysis.
- **Unique need:** The quarterly output must match the CMO's voice — it lands in board decks as her work, not as "system output."

---

## 3. User Stories

### Priority Key
- **MUST** — System is incomplete without this
- **SHOULD** — High value, required for full utility
- **COULD** — Enhances experience, can ship without

### CMO

**US-1 [MUST]:** As the CMO, when a Tier 1 competitor makes a material move (product launch, pricing change, major partnership), I receive a Signal Alert within 24 hours so I can decide whether to respond before the market notices I'm behind.
- AC: Alert appears on dashboard home within 24 hours of qualifying event detection
- AC: Alert follows structure: What Happened → Why It Matters → Evidence Tier → Recommended Response
- AC: Alert references at least one Finmo positioning claim affected

**US-2 [MUST]:** As the CMO, every Monday I receive a Weekly Pulse that tells me in under 3 minutes what changed in the competitive landscape and whether any of it requires action this week — so I don't have to go looking.
- AC: Pulse published to dashboard by 8:00 AM SGT every Monday
- AC: Pulse is under 500 words
- AC: Quiet weeks produce "Nothing notable this week" — no filler

**US-3 [MUST]:** As the CMO, monthly I receive a Positioning Pulse that tells me whether each of my three core competitive claims is still holding, under pressure, or contested — with evidence — so I can adjust strategy before positioning erodes.
- AC: Published within first 5 business days of each month
- AC: All three positioning claims assessed with current status and evidence count
- AC: Content Implications section contains 2-3 actionable bullets

**US-4 [SHOULD]:** As the CMO, quarterly I receive an Evidence Gap Report that shows what we've learned, what we still don't know, and whether our inferences are holding up against new data — so I can answer "how do we know?" to the board.
- AC: Report shows evidence tier migration (Unknown → Inferred → Confirmed) for each gap
- AC: Report includes gap closure count vs. target
- AC: System calibration section shows which inferences held vs. failed

**US-5 [COULD]:** As the CMO, the quarterly brief matches my voice and strategic framing so I can drop it into a board deck without heavy editing.
- AC: Brief uses Finmo's strategic vocabulary and the CMO's framing patterns
- AC: Brief is structured for board consumption (not operational detail)

### Head of Content Strategy

**US-6 [MUST]:** As the Head of Content Strategy, the Monthly Positioning Pulse gives me 2-3 specific, actionable content implications — so I can prioritize content production against competitive shifts, not guesses.

**US-7 [SHOULD]:** As the Head of Content Strategy, battlecard maintenance takes less than 2 hours/month because the system surfaces what changed and what needs updating — rather than me auditing everything manually.

**US-8 [SHOULD]:** As the Head of Content Strategy, win/loss interview insights automatically feed back into battlecard reframes and evidence tier labels — so the system gets smarter without me manually cross-referencing.

**US-9 [COULD]:** As the Head of Content Strategy, I can see which battlecard reframes are Tested vs. Untested — so I know where to focus validation effort.

### Sales Team

**US-10 [MUST]:** As an AE, when a competitor comes up in a deal, I can pull up a one-page battlecard and know exactly what to say and what not to say — in 30 seconds, in language I'd actually use on a call.

**US-11 [MUST]:** As an AE, every reframe on the battlecard tells me its evidence tier (Confirmed/Inferred/Unknown) — so I don't make a claim that blows up in a live conversation.

**US-12 [SHOULD]:** As an AE, my 5-minute weekly competitive debrief (which competitors came up, what objections I heard) feeds directly into system intelligence — so contributing feels useful, not bureaucratic.

### System-Level

**US-13 [MUST]:** As the system, I distinguish between fast-and-rough signals (outages, pricing diffs) and verified intelligence (battlecard claims, feature matrices) — and never present them with the same confidence level.
- AC: Every output item carries a visible evidence tier badge (Confirmed/Inferred/Unknown)
- AC: Battlecards and Feature Matrix contain only Confirmed-tier claims
- AC: Validation layer rejects outputs with unlabeled assertions

**US-14 [MUST]:** As the system, when a competitor event crosses the alert threshold, I break cadence and publish a Signal Alert immediately — regardless of where we are in the weekly/monthly cycle.
- AC: Alert published within 24 hours of threshold-crossing event
- AC: Alert fires independently of weekly/monthly schedule
- AC: Alert volume averages ≤3/week; sustained excess triggers recalibration flag

**US-15 [SHOULD]:** As the system, I track evidence migration over time (Unknown → Inferred → Confirmed) — so the Evidence Gap Report can show the system is getting smarter, not just busier.
- AC: Every tier change logged with timestamp, source, and previous tier
- AC: Quarterly report includes migration visualization
- AC: Tier regressions (Confirmed → Inferred) are logged and surfaced

---

## 4. Functional Requirements

### 4.1 Data Ingestion

**FR-1 [MUST]: Multi-source competitor monitoring**
The system must ingest data from the following source types per competitor:
- Websites (product pages, pricing pages, about pages) — diff detection for changes
- Changelogs / release notes
- G2 and Gartner Peer Insights reviews
- Job postings (LinkedIn Jobs, career pages)
- Press releases and newsroom pages
- Trade press (Fintech Singapore, Finextra, FF News, etc.)
- Leadership LinkedIn activity
- Status pages (for outage detection)
- SEO/AEO keyword rankings (via SEMrush/Ahrefs API or export)
- Regulatory body announcements (MAS, ASIC, FCA, DFSA)

*Supports: US-1, US-2, US-14*

**FR-2 [MUST]: Competitor tiering**
The system must support Tier 1 (Kyriba, Airwallex) and Tier 2 (Trovata, Nium, HighRadius, GTreasury) competitor classification. Tier 1 competitors receive full monitoring across all sources. Tier 2 competitors receive monitoring on a defined subset. Tiering must be configurable.

*Supports: US-2, US-3*

**FR-3 [MUST]: Freshness-aware scheduling**
Ingestion must run on three cadences:
- Real-time/same-day: Status pages, pricing page diffs, news alerts (Google Alerts or equivalent), social/press signals
- Weekly: Changelogs, job postings, LinkedIn activity, ad copy, messaging changes
- Bi-weekly/monthly: G2/Gartner reviews, content themes, headcount trends, partnership announcements, regulatory filings

*Supports: US-1, US-2, US-14*

**FR-4 [MUST]: Change detection**
For web-based sources (product pages, pricing pages, messaging), the system must detect meaningful content changes and flag them — filtering out layout/cosmetic changes from substantive content changes.

*Supports: US-1, US-7*

### 4.2 Synthesis & Analysis

**FR-5 [MUST]: Evidence tier labeling**
Every piece of intelligence must be labeled with an evidence tier:
- **Confirmed** — Public source, citable, factual
- **Inferred** — Reasonable conclusion from confirmed evidence
- **Unknown** — Requires buyer/primary validation

The system must never present Inferred or Unknown claims with the same visual weight as Confirmed.

*Supports: US-11, US-13*

**FR-6 [MUST]: Alert threshold evaluation**
When a new data point arrives, the system must evaluate it against alert criteria:
- Does it involve a Tier 1 competitor?
- Does it directly affect one of Finmo's three core positioning claims?
- Is it a pricing change, outage, regulatory flag, or negative press event?
- Does a competitor use "Treasury Operating System" language?

If yes to any, trigger Signal Alert generation (FR-9). If no, queue for next scheduled output.

*Supports: US-1, US-14*

**FR-7 [MUST]: Positioning claim assessment**
The system must maintain Finmo's three core competitive claims and continuously assess each as **Holding / Under Pressure / Contested** based on accumulated evidence:
1. "Only mid-market accessible platform combining full treasury + payments"
2. "AI-native treasury intelligence (MO AI) vs. bolt-on AI from legacy players"
3. "Multi-jurisdiction licensing as compliance moat"

*Supports: US-3*

**FR-8 [MUST]: "So what" synthesis**
Every output must include Finmo-specific interpretation — not just what happened, but why it matters for Finmo's positioning, which segment is affected, and what action (if any) is recommended. Generic analysis that could apply to any company must be filtered out.

*Supports: US-1, US-2, US-3, US-5*

### 4.3 Output Generation

**FR-9 [MUST]: Competitive Signal Alert**
Auto-generated within 24 hours of a qualifying event. One page max. Structure: What Happened → Why It Matters for Finmo → Evidence Tier → Recommended Response → Action Items. Max 2-3 alerts per week under normal conditions.

*Supports: US-1, US-14*

**FR-10 [MUST]: Weekly Pulse**
Auto-generated every Monday. 3-minute read. Structure: what changed this week, does it matter, do you need to act. Most weeks: "nothing urgent, here's what's trending."

*Supports: US-2*

**FR-11 [MUST]: Monthly Positioning Pulse**
Auto-generated first week of each month. Two pages max. Structure: Category Health → Tier 1 Competitor Shifts → Tier 2 Watch → Review Sentiment → Positioning Confidence (3 claims) → Content Implications (2-3 actionable bullets).

*Supports: US-3, US-6*

**FR-12 [MUST]: Competitive Battlecards**
One page per competitor. Updated monthly (minor) and ad hoc (triggered by Signal Alerts). Structure: When They Come Up → Their Pitch → Their Real Weaknesses → Our Reframe → What Not To Say → Open Questions. Every reframe labeled Tested/Untested. Every claim labeled with evidence tier.

*Supports: US-10, US-11*

**FR-13 [SHOULD]: Quarterly Evidence Gap Report**
Auto-generated quarterly. One page. Structure: Gaps Closed → Critical Gaps Remaining → Win/Loss Program Health → System Calibration (are inferences holding up?).

*Supports: US-4, US-15*

**FR-14 [SHOULD]: Feature Comparison Matrix**
Maintained as a living document. All claims Confirmed-tier only — no inferred capabilities. Publishable quality (could go on website or in sales deck). Updated when competitor product changes are detected.

*Supports: US-10*

### 4.4 Feedback Loop

**FR-15 [SHOULD]: Win/loss data ingestion**
The system must accept structured win/loss interview data (competitors evaluated, stage eliminated, decision drivers, buyer language, objections) and use it to update battlecard reframes, evidence tiers, and evidence gap tracking.

*Supports: US-8, US-15*

**FR-16 [SHOULD]: Sales signal capture**
The system must accept weekly AE debrief data (which competitors appeared, what objections were raised, buyer language) via a lightweight input mechanism (form, Slack bot, or structured template). Maximum 5 minutes per AE per week.

*Supports: US-12*

**FR-17 [SHOULD]: Evidence migration tracking**
The system must track the movement of intelligence across evidence tiers over time (Unknown → Inferred → Confirmed) and surface this in the quarterly Evidence Gap Report.

*Supports: US-15*

---

## 5. Non-Functional Requirements

### Timeliness

- **NFR-1:** Signal Alerts must be generated and delivered within 24 hours of a qualifying event being detected.
- **NFR-2:** Weekly Pulse must be delivered by 8:00 AM Monday (CMO's local timezone, SGT).
- **NFR-3:** Monthly Positioning Pulse must be delivered within the first 5 business days of each month.
- **NFR-4:** Real-time monitoring sources (status pages, pricing diffs, news) must be checked at minimum every 4 hours.

### Accuracy & Trust

- **NFR-5:** Battlecard claims and Feature Comparison Matrix entries must be 100% Confirmed-tier. Zero tolerance for inferred data in these outputs.
- **NFR-6:** Every claim in every output must carry a visible evidence tier label. No unlabeled assertions.
- **NFR-7:** Signal Alerts must have a false positive rate below ~10%. If more than 1 in 10 alerts turns out to be noise, the threshold needs recalibration.

### Readability & Usability

- **NFR-8:** Weekly Pulse must be consumable in under 3 minutes. Maximum 500 words.
- **NFR-9:** Monthly Positioning Pulse must not exceed 2 pages / ~1,000 words.
- **NFR-10:** Battlecards must fit on one page per competitor. No scrolling to find a reframe.
- **NFR-11:** Signal Alerts must not exceed one page. If it takes longer to explain, the alert threshold is wrong — the event isn't clear enough.

### Volume & Noise Control

- **NFR-12:** Signal Alerts should average no more than 2-3 per week. Sustained alert volumes above this indicate threshold miscalibration, not a busier market.
- **NFR-13:** Quiet weeks must produce a quiet Weekly Pulse ("nothing notable this week") — not filler content to justify the system's existence.

### Delivery

- **NFR-14:** All outputs must auto-publish to the dashboard without human approval. (Principle 7). Dashboard is the single delivery surface for V1.
- **NFR-15:** The output pipeline must produce format-agnostic structured data so additional delivery surfaces (email, Slack) can be added later without modifying the generation layer.

### Data Retention & Sourcing

- **NFR-16:** Every factual claim must link to its source. No unsourced assertions.
- **NFR-17:** Historical data must be retained to support trend analysis in Monthly Pulse and Quarterly Evidence Gap Report. Minimum 12 months rolling.

### Security (V1 — No Auth)

- **NFR-20:** CORS must be restricted to known frontend origins (Vercel deployment URL, localhost for dev). No wildcard `*`.
- **NFR-21:** All dashboard page views must be logged with timestamp and page accessed — required for success metric measurement (CMO weekly access).
- **NFR-22:** Database must use encryption at rest (Railway/Supabase default). Competitive intelligence data is sensitive even if the dashboard is open.
- **NFR-23:** Admin API routes (`PUT /api/battlecards/*/reframes/*`, `POST /api/win-loss`, `POST /api/sales-signals`) must be protected by a shared secret header (`X-Admin-Key`) in V1 as a minimal access gate.

### Maintainability

- **NFR-18:** Adding or removing a competitor (changing tiers, adding a new entrant) must be achievable without system redesign — configuration change only.
- **NFR-19:** Adding a new data source type must be modular — plugging in a new ingestion source should not require changes to the synthesis or output layers.

---

## 6. Data Model

### Core Entities

**Competitor**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| name | string | e.g., "Kyriba" |
| tier | enum | `tier_1` / `tier_2` |
| monitored_sources | array | List of active source configurations |
| positioning_threat | text | Which Finmo claim(s) this competitor threatens |
| status | enum | `active` / `watching` / `archived` |

**DataSource**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| competitor_id | FK | Link to Competitor |
| type | enum | `website` / `changelog` / `review` / `job_posting` / `press` / `linkedin` / `status_page` / `seo` / `regulatory` |
| url | string | Source URL or API endpoint |
| cadence | enum | `realtime` / `weekly` / `biweekly` / `monthly` |
| last_checked | timestamp | Last successful ingestion |
| last_change_detected | timestamp | Last meaningful change found |

**IntelligenceItem**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| competitor_id | FK | Link to Competitor |
| source_id | FK | Link to DataSource |
| detected_at | timestamp | When the system detected this |
| type | enum | `product_change` / `pricing_change` / `hiring_signal` / `partnership` / `review` / `press` / `outage` / `regulatory` / `messaging_shift` / `seo_change` |
| raw_content | text | Original scraped/ingested content |
| summary | text | System-generated summary |
| finmo_implication | text | "So what" — Finmo-specific analysis |
| evidence_tier | enum | `confirmed` / `inferred` / `unknown` |
| source_url | string | Citable link |
| alert_triggered | boolean | Whether this item triggered a Signal Alert |
| claims_affected | array | Which of Finmo's 3 positioning claims are affected |
| included_in_outputs | array | Which output(s) consumed this item |

**PositioningClaim**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| claim_text | string | e.g., "Only mid-market accessible platform combining full treasury + payments" |
| current_status | enum | `holding` / `under_pressure` / `contested` |
| last_assessed | timestamp | Date of last assessment |
| evidence_for | array[FK] | IntelligenceItems supporting "holding" |
| evidence_against | array[FK] | IntelligenceItems indicating pressure/contestation |

**BattlecardReframe**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| competitor_id | FK | Link to Competitor |
| weakness | text | Competitor weakness being addressed |
| reframe | text | What to say (talk track) |
| anti_reframe | text | What NOT to say |
| evidence_tier | enum | `confirmed` / `inferred` / `unknown` |
| validation_status | enum | `tested` / `untested` |
| source_items | array[FK] | IntelligenceItems supporting this reframe |
| win_loss_references | array[FK] | Win/loss entries that validate or invalidate |

**EvidenceGap**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| description | text | What we don't know |
| impact | text | Which decision is impaired without this |
| current_tier | enum | `unknown` / `inferred` / `confirmed` |
| previous_tier | enum | Previous tier (for migration tracking) |
| tier_changed_at | timestamp | When tier last changed |
| closure_method | text | How to close this gap |
| owner | string | Who is responsible |
| target_quarter | string | Target resolution quarter |

**WinLossEntry**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| deal_outcome | enum | `won` / `lost` |
| competitors_evaluated | array[FK] | Competitors in this evaluation |
| elimination_stage | text | When competitors were eliminated |
| decision_drivers | text | What drove the final decision |
| buyer_language | text | How the buyer described their problem |
| objections | text | Objections raised about Finmo |
| interview_date | date | When the interview was conducted |

**SalesSignal**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| ae_name | string | Contributing AE |
| week_of | date | Week this signal covers |
| competitors_mentioned | array[FK] | Competitors that came up |
| objections_heard | text | Buyer objections |
| new_language | text | Buyer language that didn't match messaging |

**GeneratedOutput**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| type | enum | `weekly_pulse` / `monthly_pulse` / `signal_alert` / `quarterly_report` |
| published_at | timestamp | When auto-published to dashboard |
| headline | string | Output headline / title |
| content | jsonb | Structured content (sections vary by type) |
| intelligence_items_consumed | array[FK] | IntelligenceItems that fed into this output |
| word_count | integer | For NFR length compliance validation |
| validation_status | enum | `passed` / `rejected` / `regenerated` |
| generation_metadata | jsonb | LLM model used, prompt version, generation time, retry count |

**FeatureCapability**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| category | string | Capability category (e.g., "Treasury", "Payments", "AI") |
| capability_name | string | e.g., "Multi-bank connectivity" |
| competitor_id | FK | Link to Competitor |
| status | enum | `supported` / `partial` / `not_supported` / `unknown` |
| evidence_tier | enum | `confirmed` only (enforced) |
| source_url | string | Citable link |
| last_verified | timestamp | When last confirmed |

### Key Relationships

```
Competitor → has many → DataSources
Competitor → has many → IntelligenceItems
Competitor → has many → BattlecardReframes
Competitor → has many → FeatureCapabilities
IntelligenceItem → affects → PositioningClaims (many-to-many)
IntelligenceItem → supports → BattlecardReframes (many-to-many)
IntelligenceItem → consumed by → GeneratedOutputs (many-to-many)
GeneratedOutput → contains → IntelligenceItems (many-to-many)
WinLossEntry → validates → BattlecardReframes (many-to-many)
EvidenceGap → closed by → IntelligenceItems / WinLossEntries
```

---

## 7. UI/UX Specification

### Design Philosophy

The Competitive War Room is a web dashboard — CMO-first, designed so the Monday morning check is effortless. No push notifications, no email digests. The CMO opens it when they're ready, and the latest intelligence is waiting. Pull-based, not push-based.

### Information Architecture

```
WAR ROOM DASHBOARD
├── Home (Latest Output)
│   └── Most recent Weekly Pulse, front and center
│   └── Active Signal Alerts (if any this week)
│
├── Pulse Archive
│   ├── Weekly Pulses (chronological)
│   └── Monthly Positioning Pulses
│
├── Battlecards
│   ├── [Competitor cards — filterable by tier]
│   └── Feature Comparison Matrix
│
├── Evidence Tracker
│   ├── Positioning Claims (3 claims, current status)
│   ├── Evidence Gaps (filterable by status)
│   └── Quarterly Evidence Gap Reports
│
├── Intel Feed
│   └── All IntelligenceItems (filterable by competitor, type, tier, date)
│
└── Admin (Head of Content Strategy only)
    ├── Edit Battlecard Reframes
    ├── Enter Win/Loss Data
    ├── Enter Sales Signals
    └── Manage output drafts
```

### Page Specifications

**Home — Latest Output**
- Landing page shows the most recent Weekly Pulse as the primary content
- Below the pulse: card row showing any active Signal Alerts from the current week (expandable)
- Sidebar or top bar: Positioning Claims status strip — three indicators showing Holding / Under Pressure / Contested at a glance, always visible
- If the most recent output is a Monthly Positioning Pulse (first week of month), that takes priority over the Weekly Pulse

**Battlecards**
- Card grid layout — one card per competitor, showing: competitor name, tier badge, last updated date, key stats (number of reframes, tested vs. untested ratio)
- Click into a card → full interactive battlecard:
  - Expandable sections: When They Come Up, Their Pitch, Their Weaknesses, Our Reframes, Don't Say, Open Questions
  - Each reframe shows evidence tier (✓ / ~ / ?) and validation status (Tested / Untested) as inline badges
  - Reframes filterable by evidence tier and validation status
- Feature Comparison Matrix: interactive table, filterable by competitor and capability category. All entries Confirmed-tier only. Source links on hover/click.
- Direct URL pattern: `/battlecards/kyriba` — bookmarkable, shareable in Slack for AE quick access

**Evidence Tracker**
- Three positioning claim cards at top — each showing current status, last assessed date, count of supporting vs. challenging evidence
- Click into a claim → drill down to all IntelligenceItems linked to it, sorted by date
- Evidence Gaps section: table of gaps, sortable by impact/priority, filterable by status (Unknown / Inferred / Confirmed). Visual indicator showing tier migration over time.
- Quarterly reports accessible as archived documents

**Intel Feed**
- Chronological feed of all IntelligenceItems
- Filters: competitor (multi-select), intelligence type, evidence tier, date range, alert-triggered only
- Each item shows: competitor, type badge, summary, Finmo implication, evidence tier, source link, which outputs consumed it
- Expandable to show raw content

**Admin Panel (Head of Content Strategy only)**
- Edit battlecard reframes inline — update talk tracks, change evidence tiers, mark as Tested
- Win/loss data entry form (maps to WinLossEntry data model): deal outcome, competitors evaluated, elimination stage, decision drivers, buyer language, objections
- Sales signal entry form: 4 fields matching FR-16 spec (competitors mentioned, objections, new competitors, surprising language)
- Cannot change system configuration (competitor tiers, source URLs, scheduling) — that stays in backend config

### Visual Design Principles

- **Evidence tiers are always visually distinct:**
  - Confirmed ✓ — solid badge, full opacity
  - Inferred ~ — outlined badge, reduced opacity
  - Unknown ? — dashed badge, flagged
- **Positioning claim status is color-coded:**
  - Holding — green
  - Under Pressure — amber
  - Contested — red
- **Quiet states are valued.** "Nothing notable this week" is a valid, well-designed state — not an empty state or error. The dashboard should feel calm most weeks.
- **Scannable first, detailed on demand.** Every page has a summary layer (cards, badges, status indicators) that tells you whether to dig deeper. Detail is one click away, never forced.
- **One-page battlecard constraint holds in UI.** Even in interactive format, the battlecard's core content (reframes + don't say) must be visible without scrolling past the first viewport on a standard laptop screen.

---

## 8. API Contract

### 8.1 Dashboard API (Backend → Frontend)

**GET /api/pulse/latest**
Returns the most recent Weekly or Monthly Pulse for the home page.
```
Response: {
  type: "weekly" | "monthly",
  published_at: timestamp,
  headline: string,
  content: structured output (sections vary by type),
  signal_alerts_this_week: SignalAlert[]
}
```

**GET /api/pulses?type={weekly|monthly}&limit={n}&offset={n}**
Paginated pulse archive.

**GET /api/alerts?status={active|archived}&limit={n}**
Signal Alerts, most recent first.

**GET /api/battlecards**
List all battlecards with summary stats.
```
Response: [{
  competitor_id: UUID,
  competitor_name: string,
  tier: "tier_1" | "tier_2",
  last_updated: timestamp,
  reframe_count: number,
  tested_ratio: number (0-1),
  update_trigger: string
}]
```

**GET /api/battlecards/:competitor_id**
Full battlecard for a competitor.
```
Response: {
  competitor: Competitor,
  when_they_come_up: string,
  their_pitch: string[],
  weaknesses: [{ text: string, evidence_tier: tier, source_url: string }],
  reframes: [{
    weakness: string,
    talk_track: string,
    anti_reframe: string,
    evidence_tier: tier,
    validation_status: "tested" | "untested",
    sources: string[]
  }],
  open_questions: string[],
  last_updated: timestamp
}
```

**GET /api/feature-matrix?competitors={ids}**
Feature comparison matrix, filterable by competitor.

**GET /api/claims**
Positioning claims with current status.
```
Response: [{
  id: UUID,
  claim_text: string,
  status: "holding" | "under_pressure" | "contested",
  last_assessed: timestamp,
  evidence_for_count: number,
  evidence_against_count: number
}]
```

**GET /api/claims/:id/evidence**
Drill-down: all IntelligenceItems linked to a specific claim.

**GET /api/evidence-gaps?status={unknown|inferred|confirmed}**
Evidence gaps, filterable and sortable.

**GET /api/evidence-gaps/reports?quarter={Q1-2026}**
Quarterly Evidence Gap Reports archive.

**GET /api/intel?competitor={id}&type={type}&tier={tier}&from={date}&to={date}&alert_only={bool}**
Intel feed with filters. Paginated.

### 8.2 Admin API (Head of Content Strategy)

**PUT /api/battlecards/:competitor_id/reframes/:id**
Update a battlecard reframe (talk track, evidence tier, validation status).

**POST /api/win-loss**
Submit a win/loss interview entry.
```
Body: {
  deal_outcome: "won" | "lost",
  competitors_evaluated: UUID[],
  elimination_stage: string,
  decision_drivers: string,
  buyer_language: string,
  objections: string,
  interview_date: date
}
```

**POST /api/sales-signals**
Submit weekly AE debrief.
```
Body: {
  ae_name: string,
  week_of: date,
  competitors_mentioned: UUID[],
  objections_heard: string,
  new_language: string
}
```

### 8.3 Ingestion APIs (External → System)

Outbound integrations the system calls, not endpoints it exposes:

| Source | Integration Method | Notes |
|--------|-------------------|-------|
| Websites | Web scraper + diff engine | Custom per-page selectors |
| G2 Reviews | G2 API or scraper | Check API availability/cost |
| Gartner Peer Insights | Scraper | No public API |
| Job postings | LinkedIn API or scraper | LinkedIn API has restrictions |
| Press/newsrooms | RSS feeds + scraper | Most newsrooms have RSS |
| Trade press | RSS feeds (Finextra, etc.) | Standard RSS ingestion |
| Status pages | HTTP polling (StatusPage API) | Most use Atlassian StatusPage |
| SEO data | SEMrush/Ahrefs API | Paid API, export as fallback |
| Regulatory | Web scraper per regulator | MAS, ASIC, FCA, DFSA sites |
| LinkedIn activity | Scraper or manual feed | LinkedIn blocks automated access |

### 8.4 Error Responses

All endpoints return errors in a consistent format:
```
{
  error: string,          // Human-readable message
  code: string,           // Machine-readable error code
  details?: object        // Optional context (e.g., validation errors)
}
```

| HTTP Status | Code | When |
|-------------|------|------|
| 400 | `invalid_request` | Malformed query params, invalid filter values |
| 404 | `not_found` | Competitor ID, claim ID, or report not found |
| 422 | `validation_error` | Win/loss or sales signal submission fails validation |
| 500 | `internal_error` | Unhandled server error |
| 503 | `generation_failed` | Output generation failed (LLM error, validation rejection) |

### 8.5 Authentication

No authentication for V1. Dashboard is open access. Auth can be added later if needed.

---

## 9. Change Analysis

### What Will Almost Certainly Change

**1. Competitor list** — New competitors will emerge, existing ones will change tier, some will become irrelevant. Must be a config change, not a code change. *(NFR-18)*

**2. Positioning claims** — Finmo's three claims will evolve. "Treasury Operating System" might give way to a new category frame. Claims must be editable entities, not embedded logic.

**3. Data sources** — New source types will be needed. Existing sources will break (websites redesign, APIs deprecate). Ingestion layer must be pluggable. *(NFR-19)*

**4. Alert thresholds** — Initial thresholds will be wrong. Needs tuning per source type and competitor without rewriting alert logic.

**5. Output formats** — Users will want template adjustments. Output templates must be configurable, not hardcoded into generation logic.

### What Might Change

**6. Delivery mechanism** — Dashboard-only is V1, but email/Slack push may be requested. Outputs should be format-agnostic and renderable to multiple surfaces.

**7. Number of output types** — New outputs may emerge (e.g., "Deal-Specific Competitive Brief"). Output pipeline should support new types without modifying core synthesis.

**8. LLM provider** — Synthesis layer will use an LLM. Provider lock-in would make switching expensive. LLM interface should be abstracted.

**9. Role-based access** — V1 has no auth. If this serves well, access control will be needed. API layer should support auth middleware addition without restructuring routes.

### What Probably Won't Change

- The evidence tier framework (Confirmed / Inferred / Unknown)
- The feedback loop concept (win/loss → battlecards → evidence gaps)
- The principle of synthesis over collection
- The core entities in the data model

### Architectural Implications

| Change | Design Constraint |
|--------|------------------|
| Competitor list changes | Competitors stored as data, not code. All queries parameterized. |
| Positioning claims evolve | Claims are database entities with CRUD. Synthesis references them dynamically. |
| Sources break/change | Each source type is a pluggable adapter with a standard interface. |
| Alert thresholds tuned | Thresholds stored as config per source type and competitor tier. |
| Output templates adjusted | Templates separated from generation logic. Structured data → template → render. |
| Delivery mechanism expands | Output pipeline produces structured data. Dashboard renderer is one consumer. |
| LLM provider switches | LLM calls go through an abstraction layer with provider-agnostic interface. |

---

## 10. Architecture Decisions

### AD-1: LLM-Powered Synthesis

**Decision:** Use an LLM (Claude or equivalent) for the synthesis layer — evidence tier assignment, "so what" analysis, alert threshold evaluation, and output generation.

**Rationale:** The core value proposition ("intelligence, not information") requires judgment that can't be rule-based. Determining whether a competitor's job posting signals treasury expansion requires contextual reasoning.

**Trade-off:** LLM outputs are non-deterministic. For auto-publish (Principle 7), the system must have guardrails — structured output formats, evidence tier constraints, and template adherence checks. The LLM generates content within strict structural constraints, not freeform prose.

### AD-2: Scraping + RSS as Primary Ingestion

**Decision:** Web scraping with diff detection for websites, RSS for press/newsrooms, API integrations where available (G2, SEMrush).

**Rationale:** Most competitor data sources don't have APIs. Scraping is fragile but necessary. The adapter pattern (NFR-19) mitigates this — when a scraper breaks, it's isolated.

**Risk:** LinkedIn blocks automated access. Job postings and leadership activity may require manual or semi-automated ingestion. System must gracefully handle sources going offline without breaking the output pipeline.

### AD-3: Structured Data Pipeline, Not Monolith

**Decision:** Three-layer architecture: Ingestion → Synthesis → Rendering. Each layer communicates through structured data (IntelligenceItems). No layer directly depends on another's implementation.

**Rationale:** Change Analysis shows each layer changes independently — sources break (ingestion), analysis requirements evolve (synthesis), output formats shift (rendering). Coupling them makes every change risky.

### AD-4: Dashboard as Single Surface (V1)

**Decision:** Web dashboard is the only delivery mechanism. No email, no Slack, no notifications.

**Rationale:** Reduces V1 complexity. CMO's workflow is pull-based. Adding push delivery later is an additive change that doesn't require restructuring.

### AD-5: No Auth (V1)

**Decision:** Dashboard is open access in V1. No login required.

**Rationale:** Small user base. Auth adds complexity without proportional value. API structured for auth middleware to be added later.

---

## 11. Edge Cases & Errors

### Ingestion Failures

| Scenario | Behavior |
|----------|----------|
| Scraper breaks (website redesign) | Log failure, mark source as `degraded`. Continue generating outputs from other sources. Flag in next Weekly Pulse: "Source X unavailable — coverage gap for [competitor]." |
| Source returns no changes for extended period | After 2x expected cadence, flag as `stale` and surface in admin. Could mean nothing changed or scraper is broken. |
| LinkedIn blocks automated access | Fallback to manual ingestion. Admin can manually enter LinkedIn intelligence items. System must not depend on LinkedIn automation. |
| Rate limiting / API quota exhaustion | Backoff and retry. Queue missed checks for next cycle. Never skip a competitor entirely — degrade gracefully. |

### Synthesis Edge Cases

| Scenario | Behavior |
|----------|----------|
| LLM generates output violating evidence tier rules | Validation layer rejects before publishing. Regenerate with stricter constraints. If repeated failure, flag for operator review — the one case where auto-publish pauses. |
| LLM generates generic "so what" | Validation check: must reference at least one positioning claim or Finmo segment. If not, regenerate with explicit context injection. |
| Conflicting intelligence (two sources disagree) | Surface both with evidence tiers. Don't resolve automatically. Flag conflict explicitly in output. |
| Quiet week — no intelligence items | Weekly Pulse publishes with "Nothing notable this week." Designed state, not error. No padding. |
| Quiet month — no material changes | Monthly Pulse publishes abbreviated: "No material positioning shifts. All three claims holding." Still valuable — confirms stability. |

### Alert Edge Cases

| Scenario | Behavior |
|----------|----------|
| Multiple alert-worthy events same day | Each gets its own Signal Alert. If >3 in one week, note elevated volume. |
| Same event from multiple sources | Deduplicate. Single alert with multiple source citations. |
| Ambiguous event (might be alert-worthy) | Default to NOT alerting. Queue for Weekly Pulse. False negatives beat false positives. |
| Threshold appears miscalibrated | After 4 weeks, surface alert frequency stats in admin. If >3/week sustained, recommend tightening. |

### Concurrency

| Scenario | Behavior |
|----------|----------|
| Duplicate output generation (two workers trigger Weekly Pulse simultaneously) | Use Celery task-level locking (Redis lock). First worker generates, second is rejected. One output per cadence period. |
| Manual ingestion runs while scheduled ingestion is active for same competitor | Queue the manual run. Don't run two scrapers against the same source concurrently (rate limit risk, duplicate IntelligenceItems). |
| Battlecard reframe edited while output generation is consuming it | Output generation reads a snapshot. Edits apply to next generation cycle, not in-flight. |

### Data Integrity

| Scenario | Behavior |
|----------|----------|
| Win/loss references untracked competitor | Accept and flag as "untracked." If appears 3+ times, recommend adding. |
| Reframe evidence invalidated by new data | Flag reframe as "evidence challenged." Don't auto-remove — operator decides. |
| Closed evidence gap reopened by new data | Revert tier. Log regression. Surface in quarterly report. |

---

## 12. Testing Strategy

### Output Quality Testing

| Test | Method | Acceptance Criteria |
|------|--------|-------------------|
| Evidence tier accuracy | Manual review of 20 random IntelligenceItems/month | >95% correctly tiered |
| "So what" specificity | Manual review: does every output reference Finmo positioning? | Zero generic outputs published |
| Battlecard claim accuracy | Quarterly audit against current sources | 100% verifiable. Unverifiable claims downgraded. |
| Output length compliance | Automated check on generation | Weekly <500w, Monthly <1000w, Battlecard fits one viewport |
| Alert false positive rate | Track: alerts fired vs. those leading to action | <10% false positive over rolling 4 weeks |

### Ingestion Testing

| Test | Method | Acceptance Criteria |
|------|--------|-------------------|
| Source health monitoring | Automated: each source reports last check and last change | No source >2x cadence without stale flag |
| Change detection accuracy | Manual review: 10 detected changes/week | >90% substantive (not layout/cosmetic) |
| Scraper resilience | Automated: failure triggers degraded flag within 1 hour | Zero silent failures |

### Feedback Loop Testing

| Test | Method | Acceptance Criteria |
|------|--------|-------------------|
| Win/loss → battlecard flow | After each entry, verify battlecard flagged for update | Every entry surfaces in related battlecard admin |
| Evidence migration tracking | Quarterly: verify report reflects tier changes | All tier changes logged with timestamp and source |
| Sales signal capture | Weekly: verify signals appear in Intel Feed | 100% captured |

### System Health (Admin Dashboard)

- Source health: healthy / degraded / stale per source
- Alert frequency: rolling 4-week trend
- Output generation: last successful generation per type
- Evidence migration: gaps closed this quarter vs. target
- Ingestion stats: items collected this week by source type

---

## 13. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| CMO opens dashboard weekly | >90% of Mondays | Dashboard access logs |
| Signal Alert response time | <24 hours from event detection to published alert | System timestamp comparison |
| Battlecard usage by sales | >70% of AEs access battlecards at least once/week | Dashboard access logs |
| Evidence gap closure rate | 4 of 6 initial gaps moved from Unknown by Q4 | Evidence Gap Report |
| Battlecard tested/untested ratio | >70% tested reframes by Q4 | BattlecardReframe validation_status |
| Alert false positive rate | <10% | Quarterly review |
| Win/loss interview volume | 5/month by Q2, 8-10/month by Q3 | WinLossEntry count |

---

## 14. Scope Boundaries

### In Scope
- Automated competitor monitoring across defined sources
- LLM-powered synthesis and output generation
- Web dashboard for intelligence consumption
- Battlecard management with evidence tiers
- Win/loss and sales signal data capture
- Evidence migration tracking

### Out of Scope
- Comprehensive competitor profiles (one-time deep-dives that decay)
- Social media sentiment monitoring at scale
- Detailed competitor pricing tracking (opaque, deal-specific)
- Content generation (system informs strategy, doesn't produce content)
- Product-level technical architecture comparisons (product team's domain)
- CRM integration (V1 — manual win/loss entry)
- Mobile app (dashboard is desktop/laptop web only)

---

## 15. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Scrapers break frequently | Coverage gaps, stale data | High | Adapter pattern isolates failures. Degraded flags. Manual fallback. |
| LLM produces inaccurate synthesis | Bad battlecard claims, trust erosion | Medium | Validation layer before auto-publish. Evidence tier constraints. Quarterly audit. |
| LinkedIn blocks all automated access | Lose job posting + leadership signals | High | Design for manual ingestion fallback from day 1. |
| Low AE adoption of sales signal capture | Feedback loop doesn't close | Medium | Keep it to 5 min/week. Show AEs their inputs in updated battlecards quickly. |
| Win/loss interviews don't reach volume | Evidence stays at Inferred | Medium | CMO sponsors program. Head of Content Strategy owns. Position as sales improvement, not audit. |
| Alert threshold too noisy | CMO ignores alerts, system loses trust | Medium | Start conservative (miss rather than spam). Tune after 4 weeks. |
| Admin panel data tampering (no auth V1) | Fake win/loss data or modified battlecards corrupt system intelligence | Low | V1 mitigated by shared secret header (NFR-23). Small user base makes social accountability sufficient. Full auth in V2 if user base grows. |

---

## 16. Dependencies

| Dependency | Type | Risk |
|-----------|------|------|
| LLM API (Claude/OpenAI) | External service | Provider outage blocks synthesis. Abstraction layer enables switching. |
| SEMrush/Ahrefs | Paid API | Cost. Export as fallback. |
| G2 API | Paid/restricted | May require scraping instead. |
| Competitor websites | Public web | Redesigns break scrapers. Expected and mitigated. |
| Sales team participation | Organizational | Requires CMO sponsorship and visible value-back to AEs. |
| Win/loss interview access | Organizational | Requires Sales collaboration. Head of Content Strategy owns relationship. |

---

## 17. Technical Constraints

- System must run on standard cloud infrastructure (no specialized hardware)
- LLM costs must be manageable — batch synthesis where possible, avoid per-item LLM calls for low-value data
- Scraping must respect robots.txt and rate limits — no aggressive crawling
- Data storage must support 12 months rolling history with reasonable cost
- Dashboard must load in <3 seconds for all pages
- System must operate in SGT business hours for scheduled outputs (Monday 8 AM pulse)

---

## 18. Evolution Strategy

**Q1: Foundation** — All monitoring sources live. Initial battlecards. Win/loss program piloted. First pulses published. Evidence Gap baseline.

**Q2: Feedback loop activation** — Win/loss reaching 5/month. First battlecard reframes validated. Category health baseline from SEO. Airwallex early warning tested.

**Q3: Intelligence maturity** — Win/loss at 8-10/month. 50%+ battlecard reframes Tested. Competitive set confirmed by segment. Category language validated.

**Q4: System proves value** — CMO can answer "how do we know?" for every major claim. 4 of 6 initial gaps closed. 70%+ tested reframes. System calibration shows which inferences were wrong.

---

## 19. Tech Stack

### Frontend
- **Next.js 14.2+** (App Router) with TypeScript 5.4+
- **Tailwind CSS 3.4** for styling
- **shadcn/ui** (latest) for component library (clean, accessible, composable)
- **TanStack Query 5.x** for data fetching and caching

**Rationale:** Next.js gives us server-side rendering for fast dashboard loads, API routes if needed, and a mature ecosystem. Tailwind + shadcn gives production-quality UI without design overhead.

### Backend
- **Python 3.12+** with **FastAPI 0.111+** for the API server and synthesis pipeline
- **Celery 5.4+** with **Redis 7+** for scheduled task queue (ingestion cadences, output generation)
- **BeautifulSoup4** + **Playwright** for web scraping (BS4 for simple pages, Playwright for JS-rendered pages)
- **feedparser** for RSS ingestion
- **SQLAlchemy 2.0+** ORM with **Alembic** for migrations
- **pytest** for testing

**Rationale:** Python is the natural choice for scraping, LLM integration, and data processing. FastAPI provides async performance and auto-generated API docs. Celery handles the multi-cadence scheduling cleanly.

### Database
- **PostgreSQL 16** (via Supabase for hosted, or raw Postgres on Railway)

**Rationale:** The data model is heavily relational (competitors → sources → intelligence items → claims, with many-to-many joins). Postgres handles this well. Supabase gives us free auth middleware later if needed.

### LLM
- **Anthropic Claude API** via **anthropic Python SDK 0.30+** (claude-sonnet-4-5-20250929 for synthesis, claude-haiku-4-5-20251001 for classification/triage)
- Abstracted behind a provider interface (can swap to OpenAI or local models)

**Rationale:** Sonnet for output generation (quality matters for auto-publish). Haiku for cheaper, high-volume tasks like evidence tier classification and change detection filtering.

### Deployment
- **Vercel** for Next.js frontend
- **Railway** for Python backend, Celery workers, Redis, Postgres
- **GitHub Actions** for CI/CD

**Rationale:** Low operational overhead. Railway handles background workers and scheduled tasks natively. Vercel handles frontend deploys on push.

### Full Stack Summary

```
┌─────────────────────────────────────┐
│         VERCEL (Frontend)           │
│         Next.js + TypeScript        │
│         Tailwind + shadcn/ui        │
└──────────────┬──────────────────────┘
               │ API calls
┌──────────────▼──────────────────────┐
│         RAILWAY (Backend)           │
│  ┌──────────────────────────────┐   │
│  │   FastAPI (API Server)       │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │   Celery Workers             │   │
│  │   - Ingestion (scrapers)     │   │
│  │   - Synthesis (LLM pipeline) │   │
│  │   - Output generation        │   │
│  └──────────────────────────────┘   │
│  ┌─────────┐  ┌─────────────────┐   │
│  │  Redis  │  │   PostgreSQL    │   │
│  │ (queue) │  │   (data store)  │   │
│  └─────────┘  └─────────────────┘   │
└─────────────────────────────────────┘
               │ External calls
    ┌──────────▼──────────┐
    │  Claude API         │
    │  SEMrush/Ahrefs API │
    │  G2 API             │
    │  Web (scrapers)     │
    └─────────────────────┘
```

---

## 20. Project Structure

```
competitive-war-room/
├── frontend/                    # Next.js app
│   ├── app/
│   │   ├── page.tsx            # Home — latest pulse
│   │   ├── pulses/
│   │   │   └── page.tsx        # Pulse archive
│   │   ├── battlecards/
│   │   │   ├── page.tsx        # Battlecard grid
│   │   │   └── [competitor]/
│   │   │       └── page.tsx    # Individual battlecard
│   │   ├── evidence/
│   │   │   └── page.tsx        # Evidence tracker
│   │   ├── intel/
│   │   │   └── page.tsx        # Intel feed
│   │   └── admin/
│   │       └── page.tsx        # Admin panel
│   ├── components/
│   │   ├── ui/                 # shadcn components
│   │   ├── pulse/              # Pulse display components
│   │   ├── battlecard/         # Battlecard components
│   │   ├── evidence/           # Evidence tracker components
│   │   └── shared/             # Evidence tier badges, claim status, etc.
│   ├── lib/
│   │   └── api.ts              # API client
│   └── tailwind.config.ts
│
├── backend/                     # Python FastAPI
│   ├── api/
│   │   ├── routes/
│   │   │   ├── pulses.py
│   │   │   ├── alerts.py
│   │   │   ├── battlecards.py
│   │   │   ├── claims.py
│   │   │   ├── evidence.py
│   │   │   ├── intel.py
│   │   │   └── admin.py
│   │   └── main.py             # FastAPI app
│   ├── ingestion/
│   │   ├── adapters/           # One per source type
│   │   │   ├── base.py         # Abstract adapter interface
│   │   │   ├── website.py
│   │   │   ├── changelog.py
│   │   │   ├── g2_reviews.py
│   │   │   ├── job_postings.py
│   │   │   ├── press_rss.py
│   │   │   ├── status_page.py
│   │   │   ├── seo.py
│   │   │   └── regulatory.py
│   │   ├── scheduler.py        # Cadence management
│   │   └── diff_engine.py      # Change detection
│   ├── synthesis/
│   │   ├── llm/
│   │   │   ├── provider.py     # Abstract LLM interface
│   │   │   ├── claude.py       # Claude implementation
│   │   │   └── prompts/        # Prompt templates per output type
│   │   ├── evidence_tier.py    # Tier classification logic
│   │   ├── alert_evaluator.py  # Alert threshold logic
│   │   ├── claim_assessor.py   # Positioning claim assessment
│   │   └── validators.py       # Output validation (evidence tier rules, specificity checks)
│   ├── outputs/
│   │   ├── generators/         # One per output type
│   │   │   ├── signal_alert.py
│   │   │   ├── weekly_pulse.py
│   │   │   ├── monthly_pulse.py
│   │   │   ├── battlecard.py
│   │   │   ├── evidence_gap.py
│   │   │   └── feature_matrix.py
│   │   └── templates/          # Output structure templates
│   ├── models/                 # SQLAlchemy models
│   │   ├── competitor.py
│   │   ├── data_source.py
│   │   ├── intelligence_item.py
│   │   ├── positioning_claim.py
│   │   ├── battlecard_reframe.py
│   │   ├── evidence_gap.py
│   │   ├── win_loss.py
│   │   └── sales_signal.py
│   ├── config/
│   │   ├── competitors.yaml    # Competitor definitions and tiers
│   │   ├── sources.yaml        # Source URLs and cadences
│   │   └── thresholds.yaml     # Alert threshold config
│   └── tasks/                  # Celery task definitions
│       ├── ingest.py
│       ├── synthesize.py
│       └── generate.py
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 21. Commands

### Development

```bash
# Setup
git clone <repo>
cd competitive-war-room
cp .env.example .env          # Add API keys (Claude, SEMrush, etc.)

# Frontend
cd frontend && npm install && npm run dev    # localhost:3000

# Backend
cd backend && pip install -r requirements.txt
uvicorn api.main:app --reload                # localhost:8000

# Workers
celery -A tasks worker --loglevel=info       # Start Celery workers
celery -A tasks beat --loglevel=info         # Start scheduler

# Database
alembic upgrade head                         # Run migrations
python scripts/seed.py                       # Seed competitors, sources, initial claims
```

### Testing

```bash
# Backend unit tests
cd backend && pytest tests/ -v

# Backend with coverage
cd backend && pytest tests/ --cov=. --cov-report=term-missing

# Run output validation tests only
cd backend && pytest tests/validation/ -v

# Frontend tests
cd frontend && npm test

# Frontend with coverage
cd frontend && npm test -- --coverage

# End-to-end: generate a test Weekly Pulse and validate
cd backend && python -m outputs.generate --type weekly_pulse --dry-run
```

### Operations

```bash
# Manual ingestion trigger (useful for testing)
python -m ingestion.run --competitor kyriba --source website

# Generate output manually
python -m outputs.generate --type weekly_pulse

# Check source health
python -m ingestion.health

# Run all scrapers for a specific competitor
python -m ingestion.run --competitor airwallex --all
```

### Deployment

```bash
# Frontend (Vercel — deploys on push to main)
git push origin main

# Backend (Railway — deploys on push to main)
git push origin main

# Database migrations (run on Railway)
railway run alembic upgrade head
```

---

## 22. Code Style & Examples

### Python Backend

- **Style:** PEP 8, type hints everywhere, docstrings on public functions only
- **Async:** FastAPI routes are async. Celery tasks are sync (Celery doesn't support async natively).
- **Error handling:** Let exceptions propagate to centralized handler. Don't catch-and-swallow.

### Naming Conventions

| Layer | Convention | Example |
|-------|-----------|---------|
| Python files | snake_case | `evidence_tier.py`, `weekly_pulse.py` |
| Python classes | PascalCase | `BaseAdapter`, `ClaudeProvider` |
| Python functions/variables | snake_case | `detect_changes()`, `evidence_tier` |
| Database tables | snake_case, plural | `intelligence_items`, `positioning_claims` |
| Database columns | snake_case | `competitor_id`, `last_checked` |
| API routes | kebab-case | `/api/evidence-gaps`, `/api/win-loss` |
| TypeScript files | kebab-case | `evidence-tier-badge.tsx`, `api.ts` |
| React components | PascalCase | `EvidenceTierBadge`, `BattlecardGrid` |
| TypeScript types/interfaces | PascalCase | `EvidenceTier`, `PulseResponse` |
| Environment variables | SCREAMING_SNAKE_CASE | `CLAUDE_API_KEY`, `DATABASE_URL` |
| Config YAML keys | snake_case | `alert_threshold`, `check_interval` |

**Example: Ingestion Adapter**
```python
from abc import ABC, abstractmethod
from models.intelligence_item import IntelligenceItem, EvidenceTier

class BaseAdapter(ABC):
    """All ingestion adapters implement this interface."""

    @abstractmethod
    async def fetch(self, source: DataSource) -> list[RawContent]:
        """Fetch current content from source."""
        ...

    @abstractmethod
    async def detect_changes(
        self, current: list[RawContent], previous: list[RawContent]
    ) -> list[Change]:
        """Compare current vs previous, return meaningful changes only."""
        ...

    def to_intelligence_items(self, changes: list[Change]) -> list[IntelligenceItem]:
        """Convert detected changes to IntelligenceItems.
        Evidence tier defaults to Confirmed for public sources."""
        return [
            IntelligenceItem(
                competitor_id=change.competitor_id,
                source_id=change.source_id,
                type=change.change_type,
                raw_content=change.content,
                evidence_tier=EvidenceTier.CONFIRMED,
                source_url=change.url,
            )
            for change in changes
        ]
```

**Example: LLM Provider Interface**
```python
from abc import ABC, abstractmethod

class LLMProvider(ABC):
    @abstractmethod
    async def synthesize(self, prompt: str, context: dict) -> str:
        ...

    @abstractmethod
    async def classify(self, content: str, categories: list[str]) -> str:
        ...

class ClaudeProvider(LLMProvider):
    async def synthesize(self, prompt: str, context: dict) -> str:
        response = await self.client.messages.create(
            model="claude-sonnet-4-5-20250929",
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text

    async def classify(self, content: str, categories: list[str]) -> str:
        # Use Haiku for classification — cheaper, faster
        response = await self.client.messages.create(
            model="claude-haiku-4-5-20251001",
            messages=[{"role": "user", "content": f"Classify: {content}\nCategories: {categories}"}],
        )
        return response.content[0].text
```

### Frontend (TypeScript)

- **Style:** Strict TypeScript, no `any`. Functional components only.
- **Data fetching:** TanStack Query for all API calls. No raw `fetch` in components.
- **Components:** Small, composable. One component per file.

**Example: Evidence Tier Badge**
```tsx
type EvidenceTier = "confirmed" | "inferred" | "unknown";

const tierConfig = {
  confirmed: { label: "Confirmed", icon: "✓", className: "bg-green-100 text-green-800 border-green-300" },
  inferred: { label: "Inferred", icon: "~", className: "bg-amber-50 text-amber-700 border-amber-200 border-dashed" },
  unknown: { label: "Unknown", icon: "?", className: "bg-red-50 text-red-600 border-red-200 border-dashed" },
} as const;

export function EvidenceTierBadge({ tier }: { tier: EvidenceTier }) {
  const config = tierConfig[tier];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${config.className}`}>
      {config.icon} {config.label}
    </span>
  );
}
```

---

## 23. Git Workflow

### Branching

- `main` — production. Deploys automatically.
- `dev` — integration branch. PRs merge here first.
- Feature branches: `feat/ingestion-website-adapter`, `feat/weekly-pulse-generator`
- Fix branches: `fix/scraper-kyriba-timeout`

### Commit Convention

```
feat: add website scraping adapter for Kyriba
fix: handle empty changelog response gracefully
chore: update Claude API to latest SDK
docs: add deployment instructions
```

### PR Process

- All PRs to `dev` first, then `dev` → `main` for releases
- PRs must include: what changed, which FR/US it addresses, how to test
- No direct commits to `main`

---

## 24. AI Agent Boundaries

### What the AI Agent Can Do

- Generate output content (pulses, alerts, battlecard drafts) within structural templates
- Classify evidence tiers for ingested data
- Evaluate alert thresholds against defined criteria
- Assess positioning claims against accumulated evidence
- Generate "so what" synthesis tied to Finmo's specific context
- Suggest battlecard reframe updates based on new intelligence

### What the AI Agent Cannot Do

- Publish Inferred or Unknown claims in battlecards or feature matrices (validation layer blocks this)
- Override an operator's manual evidence tier assignment
- Generate outputs that don't reference Finmo's positioning claims (validation rejects generic analysis)
- Add or remove competitors (config-only, requires human)
- Change alert thresholds (config-only)
- Access or modify source URLs or ingestion schedules
- Fabricate source URLs or citations (every claim must link to real, crawled content)

### Guardrails for Auto-Publish

Since outputs publish without human review (Principle 7), these guardrails are mandatory:

1. **Structural validation** — Every output must conform to its defined template structure. Missing sections = rejected.
2. **Evidence tier enforcement** — Battlecard reframes and feature matrix entries must be Confirmed. System rejects Inferred/Unknown in these outputs.
3. **Finmo specificity check** — Every output must reference at least one positioning claim or Finmo-specific segment. Generic analysis = rejected and regenerated.
4. **Length limits** — Outputs exceeding word/page limits are rejected and regenerated with tighter constraints.
5. **Source verification** — Every factual claim must include a source_url that maps to a real IntelligenceItem in the database. No hallucinated citations.
6. **Confidence signaling** — If the LLM's synthesis confidence is below threshold (e.g., insufficient data for a positioning assessment), the output must explicitly state "Insufficient data — assessment deferred" rather than guessing.

### LLM Prompt Architecture

- Each output type has a dedicated prompt template in `backend/synthesis/llm/prompts/`
- Prompts include: Finmo context (3 positioning claims, competitor tiers, recent intelligence), output structure requirements, evidence tier rules, example outputs
- Prompts are versioned and treated as code (reviewed in PRs, not ad hoc edits)
- System prompts enforce the "intelligence, not information" principle: the LLM is instructed to omit items that don't warrant attention, not to include everything for completeness
