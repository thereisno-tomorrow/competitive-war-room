import type { PositioningClaim } from "@/generated/prisma/client";
import type { SourceCategory } from "@/lib/config/thresholds";

const MAX_CONTENT_LENGTH = 4000;

interface ClassifyIntelPromptContext {
  competitorName: string;
  sourceType: string;
  sourceUrl: string;
  rawContent: string;
  changeType: string;
  claims: PositioningClaim[];
  sourceCategory: SourceCategory;
  isFirstRun: boolean;
}

export interface ClassificationResult {
  type: string;
  summary: string;
  finmoImplication: string;
  evidenceTier: string;
  affectedClaimIds: string[];
  sourceUrl: string;
  publishedAt: string;
}

export function buildClassifyIntelPrompt(ctx: ClassifyIntelPromptContext): string {
  const truncated = ctx.rawContent.length > MAX_CONTENT_LENGTH
    ? ctx.rawContent.slice(0, MAX_CONTENT_LENGTH) + "\n[...truncated]"
    : ctx.rawContent;

  const claimsList = ctx.claims
    .map((c) => `- [${c.id}] "${c.claimText}"`)
    .join("\n");

  const typeOptions = '"PRODUCT_CHANGE" | "PRICING_CHANGE" | "HIRING_SIGNAL" | "PARTNERSHIP" | "REVIEW" | "PRESS" | "OUTAGE" | "MESSAGING_SHIFT" | "SEO_CHANGE" | "REGULATORY" | "SKIP"';

  const contextBlock = ctx.sourceCategory === "EVENT"
    ? buildEventContext(ctx)
    : buildStateContext(ctx);

  return `You are a competitive intelligence classifier for Finmo, a Series A treasury and payments fintech.

COMPETITOR: ${ctx.competitorName}
SOURCE TYPE: ${ctx.sourceType}
SOURCE URL: ${ctx.sourceUrl}
CHANGE TYPE: ${ctx.changeType}

${contextBlock}

CONTENT:
${truncated}

FINMO'S POSITIONING CLAIMS:
${claimsList}

TASK: Classify this intelligence. Respond with ONLY valid JSON matching this schema:
{
  "type": one of ${typeOptions},
  "summary": string (one clear sentence describing what happened — no fluff. If type is SKIP, explain briefly why),
  "finmoImplication": string (one sentence on why this matters to Finmo's positioning. Empty string if SKIP),
  "evidenceTier": "CONFIRMED" if directly citable from source, "INFERRED" if reasonable conclusion, "UNKNOWN" if unclear,
  "affectedClaimIds": string[] (IDs of positioning claims affected, empty array if none or SKIP),
  "sourceUrl": string (the most specific article or press-release URL found in the content — look for URLs in parentheses. If no specific URL found, return the SOURCE URL above),
  "publishedAt": string (publication date if visible in content, as ISO 8601 YYYY-MM-DD. If no date found, return "")
}

RULES:
- Pick the single most accurate type
- Use "SKIP" if this content is not competitively noteworthy, is boilerplate, or contains no actionable intelligence
- Summary should be factual and specific (e.g. "Kyriba adds AI cash forecasting to treasury suite")
- Finmo implication should focus on competitive impact, not restate the summary
- Be conservative with evidence tier — use CONFIRMED only when the source directly states it
- Only include claim IDs that are genuinely affected by this signal
- For sourceUrl: prefer specific article/announcement links over generic landing pages
- For publishedAt: look for dates near headlines or article metadata — do NOT guess or invent dates`;
}

function buildEventContext(ctx: ClassifyIntelPromptContext): string {
  const sourceLabel = ctx.sourceType === "PRESS_RSS"
    ? "press/news RSS feed"
    : "changelog/release notes page";
  return `CONTEXT: This is a NEW ITEM from a ${sourceLabel}. Each item typically represents a discrete event (article, announcement, release). Classify it based on its content. Use SKIP if this is boilerplate, a duplicate, or not competitively meaningful.`;
}

function buildStateContext(_ctx: ClassifyIntelPromptContext): string {
  return `CONTEXT: We detected a CONTENT CHANGE on this web page. You are seeing a snapshot of the page AFTER the change was detected.

CRITICAL GUARDRAILS:
- Do NOT describe the current state of the page as if it were a new event or announcement
- Do NOT treat long-standing features, pricing tiers, or existing content as new developments
- The intelligence value is in WHAT CHANGED, not what the page currently says
- If you cannot identify a specific, recent, noteworthy change, use type "SKIP"
- Phrases like "introduced", "launched", "announced" are ONLY appropriate if the content itself explicitly says so — do not infer launch timing from a page snapshot`;
}
