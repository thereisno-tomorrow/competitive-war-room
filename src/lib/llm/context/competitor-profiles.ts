/**
 * Per-competitor strategic profiles — injected when analyzing that competitor.
 *
 * Each profile answers: WHY does this competitor matter to Finmo specifically?
 * Not a fact sheet — a threat model.
 *
 * These are loaded by competitor name when the LLM is classifying intel,
 * generating alerts, or updating battlecards for a specific competitor.
 */

const KYRIBA_PROFILE = `
COMPETITOR: KYRIBA (Tier 1)
Threatens Claims: #1 (mid-market expansion), #2 (AI capabilities)

WHY KYRIBA MATTERS:
Kyriba defines the category Finmo is deliberately NOT competing in. They are the Gartner Magic Quadrant "Leader" for enterprise TMS — 25+ years, 3,400+ clients, 9,900+ bank connections. When a consultant recommends a treasury system, Kyriba is on the shortlist by default. They are the benchmark buyers compare against, even in mid-market deals where Kyriba is objectively overbuilt.

THE SPECIFIC THREAT:
If Kyriba successfully makes their platform accessible to mid-market buyers (simplified packaging, faster implementation, mid-market SKU), they neutralize Finmo's primary structural advantage. Their TAI (agentic AI) launch is the second threat — if TAI gains credibility with mid-market buyers, it challenges the "AI-native vs. bolt-on" narrative.

CONFIRMED:
- Enterprise pricing: $150K+ ACV, $230K+ year-one TCO including implementation
- Implementation: 12-18 months (consistently cited in G2/Gartner reviews)
- Architecture: Treasury and payments are separate modules, not a unified workflow
- TAI launched as "trust-first AI" with auditability focus
- Euromoney "World's Best TMS 2025"
- G2/Gartner complaints: implementation complexity, dated UI, cost
- Reviewers describe it as "often too complex and costly for most SMBs"

INFERRED:
- TAI is acquired technology, not natively built
- Enterprise DNA makes genuine mid-market pivot culturally and architecturally difficult
- Implementation burden is structural (deep customization model), not operational

UNKNOWN:
- Whether TAI is gaining traction with any mid-market buyers
- Whether Kyriba has created a mid-market pricing tier
- How often Finmo actually loses deals to Kyriba
- Whether "trust-first AI" framing effectively counters Finmo's "AI-native" positioning

SIGNALS THAT MATTER:
- Product pages mentioning mid-market, SMB, or simplified deployment
- TAI case studies featuring mid-market or APAC companies
- Pricing page changes or new packaging tiers
- Job postings for mid-market sales roles or APAC expansion
- Analyst commentary comparing TAI to other treasury AI
- Implementation timeline claims below 6 months (would signal a real shift)
`.trim();

const AIRWALLEX_PROFILE = `
COMPETITOR: AIRWALLEX (Tier 1 — highest consequence threat)
Threatens Claims: #1 (adding treasury to payments), #3 (multi-jurisdiction licensing overlap)

WHY AIRWALLEX MATTERS:
Airwallex is not today's competitor — they are tomorrow's. They are the single highest-consequence threat because one product launch could invalidate Finmo's entire structural positioning.

THE SPECIFIC THREAT:
Finmo's Claim #1 — "only mid-market accessible platform combining full treasury + payments" — depends entirely on Airwallex NOT having treasury capabilities. Airwallex has $902M in funding, global infrastructure, strong APAC presence, and existing mid-market relationships. If they build or acquire cash forecasting, multi-bank visibility, or treasury intelligence, they become a direct competitor overnight — with better brand recognition and deeper pockets.

This system is an early warning system for that move. The goal is to detect signals BEFORE the press release.

Note: Holly Fang, Finmo's new CBO (Feb 2026), previously worked at Airwallex — she has inside knowledge of their strategic direction.

CONFIRMED:
- $902M raised. One of the most well-funded fintechs globally.
- Global infrastructure: 150+ countries, multi-currency accounts, competitive FX rates
- Strong APAC brand recognition, especially among fintech-native companies
- Modern API-first platform with strong developer experience
- Currently NO treasury module, NO cash forecasting, NO consolidated multi-bank visibility
- No AI/ML treasury intelligence — purely transactional platform

INFERRED:
- Treasury expansion is strategically logical given their infrastructure and funding
- Mansi's own post noting "cross-border payment companies expanding into bits of treasury" may reference Airwallex specifically
- Their developer-centric buyer base partially overlaps with Finmo's target market

UNKNOWN:
- When or whether they will build treasury capabilities
- How often buyers currently evaluate Airwallex alongside Finmo
- Whether their developer-centric buyers and Finmo's CFO-centric buyers are the same people

SIGNALS THAT MATTER (HIGHEST PRIORITY — any of these is an immediate Signal Alert):
- ANY product page mention of: cash visibility, cash forecasting, treasury management, multi-bank connectivity, financial reporting, working capital
- Acquisitions or partnerships adding treasury-adjacent capabilities (e.g., acquiring a cash management startup)
- Job postings for: Treasury Product Manager, Cash Management Engineer, Bank Integration Lead, Head of Treasury
- Language shift from "payments infrastructure" toward "financial platform," "financial operating system," or "treasury"
- APAC expansion milestones overlapping with Finmo's licensed markets
- Pricing tiers that bundle analytics or intelligence features above pure payments
`.trim();

const TROVATA_PROFILE = `
COMPETITOR: TROVATA (Tier 2)
Threatens Claim: #1 (mid-market treasury positioning)

WHY TROVATA MATTERS:
Trovata is architecturally most similar to Finmo — cloud-native, modern UX, mid-market accessible, rapid deployment. They occupy the same "modern treasury for mid-market" quadrant. The differentiation is structural: Trovata does cash management only. No payments, no multi-market licensing, no AI intelligence layer.

THE SPECIFIC THREAT:
If Trovata adds payments capability or partners with a payments provider to offer integrated treasury + payments, they become the most direct competitor. They already have the mid-market positioning and modern architecture that matches Finmo's approach.

CONFIRMED:
- Cloud-native cash management platform, Series B funded
- Modern UX, rapid deployment (weeks, not months)
- Public pricing: $24K/year base tier (accessible for mid-market)
- No payments capability — cash management and forecasting only
- No multi-market licensing (software platform, not licensed payments entity)
- Blog/content focuses on treasury automation and bank connectivity

INFERRED:
- Most likely to appear in competitive evaluations alongside Finmo for cloud-native mid-market buyers
- Their limited scope (no payments, no licensing) is a feature for some buyers who only need cash management

UNKNOWN:
- Whether Trovata is building or partnering for payments capability
- Whether they appear in Finmo's actual deal cycles

SIGNALS THAT MATTER:
- Product pages mentioning payments, money movement, or cross-border
- Partnership announcements with payments providers
- Job postings for payments engineers or compliance/licensing roles
- Pricing changes (especially upmarket moves)
`.trim();

const NIUM_PROFILE = `
COMPETITOR: NIUM (Tier 2)
Threatens Claim: #3 (multi-jurisdiction payments infrastructure)

WHY NIUM MATTERS:
Singapore-based, $300M+ raised, cross-border payments in 100+ countries. Multiple Finmo C-suite came from Nium (CMO Mansi, CBO Holly context at SFA, CFO Jonathan Lew was founding corporate dev at Nium). The shared DNA means Finmo's leadership deeply understands Nium's capabilities and limitations.

THE SPECIFIC THREAT:
Nium is a payments infrastructure company with strong multi-jurisdiction licensing. If they move into treasury capabilities, their licensing breadth + payments reach makes them a structural competitor to Finmo's Claim #3 (licensing moat).

CONFIRMED:
- $300M+ raised, Singapore HQ
- Cross-border payments infrastructure, 100+ countries
- Strong licensing portfolio across multiple jurisdictions
- Public status page (only competitor with one — useful for outage monitoring)
- Comprehensive developer documentation / API changelog

SIGNALS THAT MATTER:
- Product announcements mentioning treasury, cash management, or financial intelligence
- Expansion into markets where Finmo is licensed (especially MAS, ASIC overlap)
- Partnerships with treasury or ERP providers
`.trim();

const HIGHRADIUS_PROFILE = `
COMPETITOR: HIGHRADIUS (Tier 2)
Threatens Claim: #2 (AI-powered treasury intelligence)

WHY HIGHRADIUS MATTERS:
HighRadius is the AI credibility threat. $1B+ funded, they claim 95% forecast accuracy in their AI-powered treasury and O2C solutions. If buyers believe these claims, it raises the bar for Finmo's MO AI and could create an "AI standard" that Finmo needs to match.

THE SPECIFIC THREAT:
HighRadius's AI claims are ambitious. If validated by buyers and analysts, they set an expectation that treasury AI must deliver quantifiable accuracy metrics. This shifts the competitive conversation from "AI-native vs. bolt-on" (where Finmo wins) to "whose AI delivers better results" (harder to prove at Finmo's scale).

CONFIRMED:
- $1B+ funded, large enterprise customer base
- AI-powered O2C (Order to Cash) + treasury solutions
- Claims 95% cash forecast accuracy
- "What's New" page provides regular product updates

INFERRED:
- AI claims may be overstated or specific to narrow use cases (common in enterprise AI marketing)
- Their O2C focus means treasury is one module, not the entire platform

SIGNALS THAT MATTER:
- Independent validation of the 95% accuracy claim (analyst reports, case studies)
- Expansion of AI capabilities into areas that overlap with MO AI
- Mid-market or APAC go-to-market moves
- G2/Gartner reviews mentioning AI quality
`.trim();

const GTREASURY_PROFILE = `
COMPETITOR: GTREASURY (Tier 2)
Threatens Claim: #1 (treasury management, potential mid-market overlap)

WHY GTREASURY MATTERS:
PE-backed legacy TMS that claims 90-day implementation — directly countering the "legacy TMS = slow implementation" narrative that benefits Finmo. If their 90-day claim is real, it undermines one of Finmo's key competitive reframes against traditional TMS.

THE SPECIFIC THREAT:
GTreasury occupying the "legacy TMS but faster" position could make it harder for Finmo to paint all legacy TMS with the "slow and overbuilt" brush. They're the counter-example.

CONFIRMED:
- PE-backed, established enterprise player
- Claims 90-day implementation (vs. Kyriba's 12-18 months)
- Treasury management for corporates

SIGNALS THAT MATTER:
- Evidence validating or challenging the 90-day implementation claim
- Mid-market pricing or packaging moves
- APAC expansion
- Press/analyst coverage positioning them as Kyriba alternative
`.trim();

const STATUS_QUO_PROFILE = `
COMPETITOR: STATUS QUO — Spreadsheets + Bank Portals
Threatens Claims: #1 (delays platform adoption), all claims (prevents evaluation entirely)
Most frequent competitive loss across all segments. Not a company — inertia.

THE THREAT: Switching feels riskier than staying. Status quo has zero sales team, zero budget, wins by default.

WHAT IT LOOKS LIKE [C, buyer-stated]:
- 3-5 bank portals daily + copy/paste to spreadsheet
- "Two hours every morning just reconciling" (MSME)
- "I built this spreadsheet three years ago — I'm the only one who understands it" (single point of failure)
- Cash position 6+ hours stale by time CFO sees it
- "I don't want some tech platform that requires me to learn a whole new way"

WHY IT PERSISTS:
- Sunk cost ("three years of workflows"), familiarity, invisible distributed pain, "good enough" inertia

WHAT BREAKS IT [C, from buyer decisions]:
- Board asks for consolidated view controller can't deliver
- Audit findings on intercompany reporting
- FX loss (one case: $12K single conversion)
- Near-miss on payroll/supplier payment
- CEO embarrassment at board level

SIGNALS TO WATCH:
- Banks improving portal analytics or multi-entity views
- Treasury Excel add-ins gaining traction
- "Do you really need a TMS?" narrative in press
- Budget freezes (delay = status quo win)
`.trim();

export const COMPETITOR_PROFILES: Record<string, string> = {
  Kyriba: KYRIBA_PROFILE,
  Airwallex: AIRWALLEX_PROFILE,
  Trovata: TROVATA_PROFILE,
  Nium: NIUM_PROFILE,
  HighRadius: HIGHRADIUS_PROFILE,
  GTreasury: GTREASURY_PROFILE,
  "Status Quo": STATUS_QUO_PROFILE,
};

/**
 * Returns the strategic profile for a competitor, or a minimal fallback.
 */
export function getCompetitorProfile(competitorName: string): string {
  return (
    COMPETITOR_PROFILES[competitorName] ??
    `COMPETITOR: ${competitorName}\nNo strategic profile available. Classify based on general competitive context.`
  );
}

/**
 * Returns all competitor profiles concatenated — used for synthesis prompts
 * that need the full competitive landscape view (monthly pulse, claim assessment).
 */
export function getAllCompetitorProfiles(): string {
  return Object.values(COMPETITOR_PROFILES).join("\n\n---\n\n");
}
