import type { SourceType } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Ingestion guardrails
// ---------------------------------------------------------------------------

/**
 * Source categories determine how the ingestion pipeline handles each source type.
 *
 * EVENT: Each scraped item IS an intelligence signal (RSS articles with per-item parsing).
 *        First-run behavior: process items normally — they represent real discrete events.
 *
 * STATE: The page is a snapshot; intelligence is in the DELTA between snapshots.
 *        First-run behavior: baseline only — store hash, produce zero IntelligenceItems.
 */
export type SourceCategory = "EVENT" | "STATE";

export const SOURCE_CATEGORIES: Record<SourceType, SourceCategory> = {
  // Event sources — adapter yields discrete per-item entries
  PRESS_RSS: "EVENT",

  // State sources — intelligence is in the change, not the snapshot
  // CHANGELOG uses hash-based detection on full page blobs (same as WEBSITE),
  // so it needs baseline handling to avoid hallucinating from historical entries.
  CHANGELOG: "STATE",
  WEBSITE: "STATE",
  STATUS_PAGE: "STATE",

  // LinkedIn uses PhantomBuster — posts/jobs are discrete events, company
  // sub-adapter handles its own baseline logic internally.
  LINKEDIN: "EVENT",

  // Simulated/future types default to STATE (safe default = no hallucination)
  REVIEW: "STATE",
  JOB_POSTING: "STATE",
  SEO: "STATE",
  REGULATORY: "STATE",
} as const;

export const INGESTION = {
  /** State sources with null lastContentHash skip LLM classification (baseline only) */
  SKIP_FIRST_RUN_FOR_STATE_SOURCES: true,
  /** On first run, RSS feeds may contain 50-100 backlog articles.
   *  Cap to the N most recent to avoid timeout and excessive LLM calls. */
  MAX_ITEMS_ON_FIRST_RUN: 15,
  /** Skip RSS articles older than this many days on first run */
  MAX_ARTICLE_AGE_DAYS: 14,
  /** Maximum articles to enrich with full content per source */
  MAX_ARTICLE_ENRICHMENTS_PER_SOURCE: 10,
  /** Timeout for individual article fetch including URL resolution (ms) */
  ARTICLE_FETCH_TIMEOUT_MS: 10_000,
} as const;

// ---------------------------------------------------------------------------
// Event-level dedup
// ---------------------------------------------------------------------------

export const DEDUP = {
  /** Same fingerprint + competitor within this window = duplicate */
  EVENT_FINGERPRINT_WINDOW_DAYS: 7,
  /** Ignore words shorter than this in fingerprint generation */
  MIN_WORD_LENGTH: 4,
  /** Number of significant words to include in fingerprint */
  KEY_TERM_COUNT: 5,
} as const;

// ---------------------------------------------------------------------------
// Alert thresholds
// ---------------------------------------------------------------------------

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
  WEEKLY_PULSE_MAX_WORDS: 800,
  MONTHLY_PULSE_MAX_WORDS: 1500,
  SIGNAL_ALERT_MAX_WORDS: 700,
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
