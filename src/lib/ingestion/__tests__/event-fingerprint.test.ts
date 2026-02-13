import { describe, it, expect } from "vitest";
import { generateEventFingerprint } from "../event-fingerprint";

describe("generateEventFingerprint", () => {
  it("should produce a deterministic 16-char hex fingerprint", () => {
    const summary = "Kyriba announces new AI-powered cash forecasting feature";
    const fp1 = generateEventFingerprint(summary);
    const fp2 = generateEventFingerprint(summary);

    expect(fp1).toBe(fp2);
    expect(fp1).toHaveLength(16);
    expect(fp1).toMatch(/^[a-f0-9]{16}$/);
  });

  it("should be case and punctuation insensitive", () => {
    const s1 = "Trovata adds multi-currency support!";
    const s2 = "TROVATA ADDS MULTI-CURRENCY SUPPORT";

    expect(generateEventFingerprint(s1)).toBe(generateEventFingerprint(s2));
  });

  it("should be order-independent (sorted key terms)", () => {
    // Same significant words but different order
    const s1 = "Airwallex launches payment gateway Singapore";
    const s2 = "Singapore gateway payment launches Airwallex";

    expect(generateEventFingerprint(s1)).toBe(generateEventFingerprint(s2));
  });

  it("should produce different fingerprints for different events", () => {
    const s1 = "Kyriba pricing change to enterprise tier";
    const s2 = "Airwallex outage across Asia Pacific region";

    expect(generateEventFingerprint(s1)).not.toBe(
      generateEventFingerprint(s2),
    );
  });

  it("should match near-duplicate LLM summaries (same core terms)", () => {
    // LLM generates formulaic summaries — same entities and verbs
    const s1 =
      "Ripple acquires GTreasury, a corporate treasury platform, for $1 billion";
    const s2 =
      "Ripple acquires GTreasury, a corporate treasury management company";

    // First 5 significant words are identical: ripple, acquires, gtreasury, corporate, treasury
    expect(generateEventFingerprint(s1)).toBe(generateEventFingerprint(s2));
  });

  it("should only use first N significant words (longer summaries match)", () => {
    const short = "Kyriba announces AI-powered cash forecasting";
    const long =
      "Kyriba announces AI-powered cash forecasting feature for enterprise treasury teams globally with machine learning capabilities";

    // Both share the same first 5 significant words
    expect(generateEventFingerprint(short)).toBe(
      generateEventFingerprint(long),
    );
  });

  it("should handle empty or stop-word-only summaries", () => {
    const fp = generateEventFingerprint("the a an is was");

    // Should still return a valid hex fingerprint (from empty key terms)
    expect(fp).toHaveLength(16);
    expect(fp).toMatch(/^[a-f0-9]{16}$/);
  });
});
