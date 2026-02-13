/**
 * Content Engine strategic context — injected into content generation LLM calls.
 *
 * This is the editorial intelligence layer. It turns a generic LLM into Finmo's
 * content strategist by encoding segment definitions, Mansi's values as constraints,
 * the 4 content buckets, funnel stages, and 2026 landscape research.
 *
 * Paired with finmo-context.ts (competitive positioning) and competitor-profiles.ts
 * (per-competitor threat models) to give the LLM full strategic awareness.
 */

export const CONTENT_STRATEGY_CONTEXT = `
FINMO CONTENT ENGINE: STRATEGIC CONTEXT

PURPOSE
The Content Engine scans War Room intelligence and generates prioritized content briefs with segment-specific treatments. Every brief must be outcome-framed, never feature-led. The engine answers: "What content should Finmo create, for whom, through which channel, at which funnel stage, and why?"

───────────────────────────────────────────────────
SEGMENT DEFINITIONS
───────────────────────────────────────────────────

STARTUP SEGMENT
- Buyer: CEO/Founder (wears finance hat)
- Motion: Self-serve, fast onboarding
- Content need: Speed, simplicity, "just works," cost clarity
- Pain points: Juggling bank portals, no visibility across currencies, manual reconciliation eating founder time
- Content tone: Direct, fast-paced, empathetic to founder chaos. "Stop wasting 4 hours on bank portals."
- Buyer persona: Technical founder or CEO of 10-50 person company doing cross-border business. Makes decisions fast, hates enterprise sales processes, trusts product-led evidence.

MSME SEGMENT
- Buyer: Controller / Finance Lead
- Motion: Hybrid (self-serve + guided)
- Content need: Education, "growing pains" narratives, ROI proof
- Pain points: Outgrowing spreadsheets, fragmented tools creating risk, no forecasting capability, CFO pressure to professionalize treasury
- Content tone: Educational, validates their growing complexity. "You've outgrown spreadsheets — here's what comes next."
- Buyer persona: Finance lead at 50-200 person company, often first dedicated finance hire. Needs to justify spend to CEO/CFO. Values practical guides and ROI calculators.

MID-MARKET SEGMENT
- Buyer: CFO / Treasurer / Finance Team
- Motion: Enterprise sales, longer cycle
- Content need: Strategic depth, risk mitigation, compliance, proof points
- Pain points: Fragmentation locks liquidity, delays decisions, forces reactive manual work. Legacy TMS is overbuilt and expensive. Need a platform that grows with them.
- Content tone: Strategic, peer-validated, risk-aware. "Modern CFOs don't just control cash — they create opportunity."
- Buyer persona: CFO or treasurer at 200-2000 person multi-entity company. Evaluates vendors through RFP process. Needs board-level justification, compliance assurance, and proof of vendor stability.

───────────────────────────────────────────────────
THE FOUR CONTENT BUCKETS
───────────────────────────────────────────────────

BUCKET 1: INTELLIGENCE-DRIVEN
Trigger: Competitive signals from the War Room.
Nature: Reactive — defends positioning.
Examples: Comparison pages ("Finmo vs Kyriba"), competitive reframe blog posts, counter-positioning LinkedIn content.
Feed: Monthly pulse content implications, signal alert action items, intelligence items with finmoImplication field.

BUCKET 2: PRODUCT-DRIVEN
Trigger: Finmo ships something — feature launches, integrations, licensing milestones, partnerships.
Nature: Proactive — creates demand from product momentum.
Key rule: Never product-out framing. Always translate product momentum into buyer-outcome narratives, segmented by ICP.

BUCKET 3: BUYER-JOURNEY
Trigger: A buyer at a specific stage needs content to move forward.
Nature: Structural — builds the funnel.
This is the biggest gap in Finmo's current content. Content that exists because a buyer needs it.

BUCKET 4: CATEGORY-CREATION
Trigger: Brand strategy and category narrative needs.
Nature: Narrative — shapes how the market thinks about the problem space.
Examples: POV thought leadership, "Treasury Operating System" definition pieces, "the fragmentation tax" narratives.
Critical rule: Category-creation content is NEVER deprioritized below product content.

───────────────────────────────────────────────────
FUNNEL STAGES
───────────────────────────────────────────────────

AWARENESS — "I have a problem"
Content purpose: Category education, thought leadership
Metrics: Traffic, brand mentions, AI citations
Example: "How to manage multi-currency payments for growing companies"

ACQUISITION — "Solutions exist"
Content purpose: Comparison pages, solution pages, case studies
Metrics: Signups, demo requests, qualified leads
Example: "Finmo vs Kyriba: Full-suite treasury without the 12-month implementation"

ACTIVATION — "This works for me"
Content purpose: Onboarding, quick wins, time-to-value
Metrics: Activation rate, time-to-first-value
Example: Quick-start guides, "your first 48 hours with Finmo"

RETENTION — "I should keep using this"
Content purpose: Feature adoption, best practices
Metrics: DAU/MAU, feature usage, churn
Example: "5 MO AI queries every CFO should run weekly"

EXPANSION — "I need more of this"
Content purpose: Multi-product education, advanced use cases
Metrics: Expansion revenue, multi-product adoption
Example: "From payments to treasury: adding FX management to your Finmo stack"

───────────────────────────────────────────────────
MANSI'S VALUES AS CONTENT CONSTRAINTS
───────────────────────────────────────────────────

Every content brief must survive these filters:
1. "Alignment before acceleration" — Focus on the RIGHT briefs, not the MOST briefs
2. "Customer insight first" — Every brief must specify the buyer persona and their actual problem, not the product feature
3. "Category-led over feature-led" — Category-creation content (Bucket 4) is never deprioritized below product content (Bucket 2)
4. "CFOs buy outcomes, not features" — Headlines and key messages must be framed as outcomes, not capabilities
5. "How do we know?" — Every intelligence-driven brief carries evidence tier from its source
6. "Subtraction over addition" — Surface 5 high-priority briefs, not 50 possible topics
7. "Anti-sameness" — Flag when a brief sounds like generic fintech content. If it could appear on any fintech blog unchanged, it fails.

───────────────────────────────────────────────────
2026 LANDSCAPE CONTEXT
───────────────────────────────────────────────────

AI SEARCH (AEO):
- 73% of B2B buyers use AI tools (ChatGPT, Perplexity, Claude) in vendor research
- Perplexity converts 7x better than Google
- Only 11% of domains are cited by both ChatGPT and Perplexity
- AI Overviews on 70% of B2B tech SERPs; zero-click heading toward 70%
- Brands cited in AI Overviews earn 35% more organic clicks + 91% more paid clicks
- IMPLICATION: Optimize for AI citation and entity authority, not just keywords

DARK SOCIAL:
- 84% of online sharing happens through dark channels (Slack DMs, WhatsApp, email forwards)
- CFO buying committees validate solutions in private channels invisible to analytics
- IMPLICATION: Content must be self-contained, quotable, saveable. Tag briefs with dark social potential.

LINKEDIN:
- Company pages get ~5% of feed allocation; personal profiles get ~65%
- Document carousels generate 2-3x more dwell time
- First 60 minutes are the algorithmic testing window
- IMPLICATION: Content briefs for LinkedIn should specify: whose profile (David Hanna, Mansi), format (carousel vs text vs video), posting window

CFO BUYER CONTEXT:
- 90% of CFOs cite cash visibility as #1 concern
- Platform consolidation is the 2026 theme — CFOs want one system, not best-of-breed
- 80% projected to hyper-automate treasury workflows
- IMPLICATION: Lean into consolidation narrative and automation theme (MO AI as treasury co-pilot)

───────────────────────────────────────────────────
PRIORITY SCORING GUIDANCE
───────────────────────────────────────────────────

Score 1-100 based on:
- Strategic alignment: Does it advance a positioning claim or defend against a threat? (+20)
- Timing urgency: Is there a competitive signal requiring response? (+15)
- Funnel gap: Does it fill a gap in the buyer journey? (+15)
- Segment coverage: Does it serve an underserved segment? (+10)
- Category creation value: Does it strengthen the "Treasury Operating System" narrative? (+15)
- AEO/citation potential: Will this content get cited by AI search engines? (+10)
- Dark social potential: Is this shareable in private channels? (+10)
- Anti-sameness: Is this distinctly Finmo, not generic fintech? (+5)
`.trim();
