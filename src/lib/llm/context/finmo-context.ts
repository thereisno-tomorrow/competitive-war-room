/**
 * Core Finmo strategic context — injected into every LLM call.
 *
 * This is the "onboarding document" that turns a generic LLM into Finmo's
 * competitive intelligence analyst. Without it, the LLM produces competent
 * summaries. With it, the LLM produces intelligence.
 *
 * Keep this under ~2,800 tokens. Every word here costs tokens on every call.
 * Earn every sentence. Use compressed shorthand: [C]=Confirmed, [I]=Inferred, [U]=Unknown.
 */

export const FINMO_STRATEGIC_CONTEXT = `
FINMO: STRATEGIC CONTEXT

WHAT FINMO IS
Finmo is a Treasury Operating System (TOS) — a unified platform combining treasury management, cross-border payments, cash visibility, FX risk management, and compliance in a single system. Series A ($18.5M, Feb 2025) co-led by Quona Capital + PayPal Ventures, with Citi Ventures. ~116 employees, headquartered in Singapore.

"Treasury Operating System" is a deliberate category creation play. Finmo is NOT competing in the "Treasury Management System" category (where Kyriba dominates the enterprise quadrant). Finmo is defining a new category that combines treasury + payments + AI intelligence + mid-market accessibility — none of which exist together in any current TMS or payments platform.

PRODUCT CAPABILITIES
- Cash visibility: Real-time global position across all accounts, currencies, entities
- Cash forecasting: 13-week multi-entity forecasting
- Payments: Collections in 30+ currencies, payouts to 180+ countries on real-time rails
- AR/AP automation: Automated workflows with reconciliation
- FX management: Automated hedging, competitive rates, exposure analysis
- Working capital: Idle cash investment, liquidity optimization
- MO AI (June 2025): NL treasury co-pilot via "Ask AI" in dashboard.
  Does: cash position queries, payment analysis, report generation, tx authorization, reconciliation — plain English, no dashboard navigation.
  Built on: domain-specific models trained on real financial tx data + Finmo's Model Context Protocol.
  For: non-treasury users (controllers, multi-hat CFOs). No treasury training needed.
  vs Kyriba TAI: enterprise/audit-focused, for dedicated treasury teams. MO AI = NL-first for small teams.
  vs HighRadius: O2C + forecast accuracy metrics. MO AI = full-workflow co-pilot.
  Unproven: no published accuracy metrics, no 3rd-party validation. [PLACEHOLDER: update when available]

LICENSING MOAT
Licensed in 7+ jurisdictions: Singapore (MAS MPI), Australia (ASIC), New Zealand, Canada, US, UK (EMI, July 2025), Dubai pending (DFSA). Each license is expensive and time-consuming to obtain. This is a genuine competitive moat.

KEY PARTNERSHIPS
- Standard Chartered: Global Currency Account integration (announced SFF 2025)
- OCBC: Joint Best Treasury Solution award (The Asset)
- Fiskil: Australian open banking
- Tribe Payments: Europe-Asia card infrastructure bridge

FINMO'S HONEST POSITION:
Strong [C]:
- Time to value: 4-6 weeks vs Kyriba 6-12mo (buyer-confirmed)
- Pricing: ~$45K/yr vs Kyriba $230K+ yr-1 TCO
- UX: "Controller needs to use this without a PhD" — Finmo wins
- Unified treasury+payments: no mid-market equivalent (Claim #1 holding)
- Licensing: 7+ jurisdictions, 18-24mo each to replicate

Weak [C unless noted]:
- Brand: founded 2021, ~$3.8M ARR, no Gartner/Forrester. Board-level risk.
- Track record: lost pharma deal — "can't afford to be early adopters." No industry proof points.
- No hedge accounting, IFRS 9, intercompany netting, complex scenario modeling
- Bank connectivity: 2K integrations vs Kyriba 9.9K
- FX: "Unfunded Spot" still beta
- MO AI: no published metrics, no independent reviews [U — PLACEHOLDER]
- SAP depth: less than Kyriba (6-8 weeks but comprehensive)
- G2/Capterra: minimal review presence
- [PLACEHOLDER: win/loss data — update when interviews begin]

Analytical rule: threats targeting Finmo's WEAK areas are more urgent than threats targeting STRONG areas.

THREE POSITIONING CLAIMS (the system's analytical spine)
1. "Only mid-market accessible platform combining full treasury + payments"
   Threats: Airwallex adding treasury. Trovata adding payments. Kyriba moving downmarket.
2. "AI-native treasury intelligence (MO AI) vs. bolt-on AI from legacy players"
   Threats: Kyriba's TAI gaining mid-market traction. HighRadius AI claims validated by buyers.
3. "Multi-jurisdiction licensing as compliance moat"
   Threats: Airwallex expanding licensing overlap. Any competitor gaining MAS/ASIC/FCA licenses.

TARGET SEGMENTS:
Startup   | 1-50 emp  | <$10M rev  | CEO buys       | self-serve  | <$10K ACV
MSME      | 50-200    | $10-50M    | Controller buys | hybrid      | $10-30K ACV
Mid-mkt   | 200-2K    | $50-500M   | CFO + 1-5 team | enterprise  | $30-80K ACV
Enterprise| 2K+       | $500M+     | NOT FINMO'S TARGET → Kyriba's territory

"Mid-market accessible" (Claim #1) = deployable by 1-5 person team without treasury analysts, weeks not months, <$100K/yr TCO.
Most common competitor across all segments: status quo (spreadsheets + bank portals). → see STATUS_QUO profile

CMO: MANSI CHOPRA (the intelligence consumer)
Joined Jan 2026. 14+ years fintech marketing (Nium, Thunes, Ant International).
- "Alignment before acceleration" — foundations before campaigns
- Customer insight first: "I spend time in real conversations with buyers"
- Category-led over feature-led: "To lead a category, articulate the problem you solve"
- "CFOs do not care about features. They buy outcomes."
- Evidence-based: Her standard question is "How do we know?"
- Subtraction over addition: "What am I willing to stop doing?"
- Anti-sameness: "When brands default to sameness, they are choosing invisibility"
Her test: "Does this reflect how a modern CFO actually experiences their role?"

EVIDENCE GAPS:
[PLACEHOLDER: WIN/LOSS] No structured data. Reframes are logical but untested. Target: 5 interviews/mo.
[PLACEHOLDER: MO AI METRICS] No accuracy/adoption data. Cannot quantitatively defend Claim #2.
[PLACEHOLDER: PARTNERSHIPS] Defensibility unknown. Are any exclusive? Do competitors have equivalents?

Open questions (buyer validation needed):
1. Which competitor weakness is most decisive in mid-market deals
2. How often buyers evaluate Airwallex alongside Finmo
3. What language CFOs use to describe the treasury problem
4. Primary purchase driver by segment
5. Whether buyers recognize "Treasury Operating System" as category
6. Actual competitive set by segment
`.trim();
