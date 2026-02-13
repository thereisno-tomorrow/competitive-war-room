/**
 * Core Finmo strategic context — injected into every LLM call.
 *
 * This is the "onboarding document" that turns a generic LLM into Finmo's
 * competitive intelligence analyst. Without it, the LLM produces competent
 * summaries. With it, the LLM produces intelligence.
 *
 * Keep this under ~2,500 tokens. Every word here costs tokens on every call.
 * Earn every sentence.
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
- MO AI (launched June 2025): Conversational AI co-pilot — not a dashboard, but an intelligence layer that surfaces anomalies, triggers alerts, delivers proactive insights. Mansi describes it as "an autonomous finance partner." Built on domain-specific models trained on real financial data.

LICENSING MOAT
Licensed in 7+ jurisdictions: Singapore (MAS MPI), Australia (ASIC), New Zealand, Canada, US, UK (EMI, July 2025), Dubai pending (DFSA). Each license is expensive and time-consuming to obtain. This is a genuine competitive moat.

KEY PARTNERSHIPS
- Standard Chartered: Global Currency Account integration (announced SFF 2025)
- OCBC: Joint Best Treasury Solution award (The Asset)
- Fiskil: Australian open banking
- Tribe Payments: Europe-Asia card infrastructure bridge

THREE POSITIONING CLAIMS (the system's analytical spine)
1. "Only mid-market accessible platform combining full treasury + payments"
   Threats: Airwallex adding treasury. Trovata adding payments. Kyriba moving downmarket.
2. "AI-native treasury intelligence (MO AI) vs. bolt-on AI from legacy players"
   Threats: Kyriba's TAI gaining mid-market traction. HighRadius AI claims validated by buyers.
3. "Multi-jurisdiction licensing as compliance moat"
   Threats: Airwallex expanding licensing overlap. Any competitor gaining MAS/ASIC/FCA licenses.

THE BUYER
Mid-market CFOs and finance leaders managing multi-entity, multi-currency operations. They:
- Currently use fragmented tools (spreadsheets, bank portals, maybe a legacy TMS that's overbuilt for them)
- Think in terms of risk, resilience, credibility, and foresight — NOT features
- Are evolving from controllers to opportunity creators, but their tools haven't kept up
- Face fragmentation that "locks liquidity, delays decisions, and forces reactive manual work"
- The most common "competitor" is the status quo: spreadsheets + bank portals

Three segments with different buying dynamics:
- Startups: CEO-led, self-serve, speed matters most
- MSMEs: Controller-led, starting to feel pain, need guidance
- Mid-market: CFO/treasury teams, enterprise sales, need confidence in vendor stability

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

CRITICAL EVIDENCE GAPS (what we don't yet know)
1. Which specific competitor weakness is most decisive in mid-market deals
2. How often buyers evaluate Airwallex alongside Finmo
3. What language mid-market CFOs use to describe the treasury problem
4. Which Finmo capability is the primary purchase driver by segment
5. Whether buyers recognize "Treasury Operating System" as a meaningful category
6. Finmo's actual competitive set by segment (startups may face Airwallex; mid-market may face Kyriba)
These gaps can only be closed through buyer conversations. Until then, competitive reframes are logical but untested.
`.trim();
