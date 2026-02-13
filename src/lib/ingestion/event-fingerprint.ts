/**
 * Event-level dedup via deterministic fingerprinting.
 *
 * Same news event covered by 5 publishers produces 5 articles with different
 * URLs but near-identical LLM-generated summaries. This module generates a
 * stable fingerprint from the summary so duplicate events can be detected
 * before creating redundant IntelligenceItems.
 */

import { createHash } from "crypto";
import { DEDUP } from "@/lib/config/thresholds";

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "was", "are", "were", "be", "been",
  "has", "had", "have", "will", "would", "could", "should", "may", "might",
  "its", "it", "this", "that", "these", "those", "their", "our", "your",
  "his", "her", "not", "into", "over", "also", "than", "more", "most",
  "new", "about", "says", "said", "per", "via", "each", "all", "any",
]);

/**
 * Generate a deterministic fingerprint from an intelligence summary.
 *
 * 1. Lowercase, strip punctuation
 * 2. Filter out stop words and short words
 * 3. Take first N significant words (captures subject/object/action)
 * 4. Sort alphabetically (order-independent)
 * 5. SHA-256, truncated to 16 hex chars
 */
export function generateEventFingerprint(summary: string): string {
  const words = summary
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= DEDUP.MIN_WORD_LENGTH && !STOP_WORDS.has(w));

  const keyTerms = words.slice(0, DEDUP.KEY_TERM_COUNT).sort();
  const input = keyTerms.join("|");

  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}
