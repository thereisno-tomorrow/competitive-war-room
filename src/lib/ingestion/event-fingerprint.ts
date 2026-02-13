/**
 * Event-level dedup via LLM-generated canonical event keys.
 *
 * The LLM classification prompt now returns an `eventKey` — a normalized,
 * human-readable identifier like "nium-c-suite-hires-2026-02" that stays
 * identical across publishers covering the same event.
 *
 * Falls back to the legacy word-extraction + SHA-256 algorithm when the
 * LLM fails or returns no eventKey.
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
 * Generate event fingerprint for dedup.
 *
 * If the LLM provided an eventKey, normalize and use it directly.
 * Falls back to legacy word-extraction + SHA-256 if no eventKey.
 */
export function generateEventFingerprint(
  eventKey: string | undefined,
  summaryFallback: string,
): string {
  if (eventKey?.trim()) {
    // Normalize: lowercase, collapse whitespace to hyphens
    let normalized = eventKey.trim().toLowerCase().replace(/\s+/g, "-");
    // Strip trailing date patterns the LLM might add despite instructions
    // Matches: -2026-02, -2026, -02 (trailing month-only)
    normalized = normalized.replace(/-\d{4}(-\d{2})?$/, "");
    return normalized;
  }

  // Legacy fallback for LLM failures
  const words = summaryFallback
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= DEDUP.MIN_WORD_LENGTH && !STOP_WORDS.has(w));

  const keyTerms = words.slice(0, DEDUP.KEY_TERM_COUNT).sort();
  const input = keyTerms.join("|");

  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}
