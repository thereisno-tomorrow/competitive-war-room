/**
 * Extended Finmo context — injected into SYNTHESIS prompts only.
 *
 * NOT injected into classification prompts (those need speed, not depth).
 * Used by: weekly-pulse, monthly-pulse, signal-alert, claim-assessment.
 *
 * Contains geographic competitive landscape and temporal reasoning rules
 * that help the LLM calibrate analysis but aren't needed for basic classification.
 *
 * Target: ≤800 tokens. Tables > prose.
 */

export const FINMO_EXTENDED_CONTEXT = `
GEOGRAPHIC CONTEXT:
| Market     | License    | Key Threats                    | Finmo Position       |
|------------|------------|--------------------------------|----------------------|
| Singapore  | MAS MPI    | Airwallex (brand), Nium (DNA)  | Home turf, strongest |
| Australia  | ASIC       | Airwallex (HQ Melbourne)       | Fiskil edge, contested |
| UK         | FCA EMI    | Kyriba (EU presence), Airwallex| Expansion, challenger |
| UAE        | DFSA pend. | Low competition                | First-mover opportunity |
| US/Canada  | MSB        | Kyriba, HighRadius, Trovata    | Weakest position     |
| HK/ID/VN   | Expansion  | Unknown                        | Unvalidated          |

Rule: weight signals by geographic relevance. Airwallex in AU > Airwallex in EU. Kyriba in APAC > Kyriba in NA.

EVIDENCE FRESHNESS:
- Product capabilities: valid until contradicted. Flag if >6mo stale.
- Competitor positioning: volatile. Weight recent signals over defaults.
- Pricing: semi-stable. Flag if >3mo stale.
- Licensing/regulatory: stable. Changes slow and public.

PATTERN ACCUMULATION:
1 signal = data point (note). 2 = emerging (mention in pulse). 3+ = trend (lead with it, recommend action).
Contradictory signals: present both, state which is stronger and why.
`.trim();
