import { describe, it, expect } from "vitest";
import { evaluateAlertThreshold } from "../alert-evaluator";

describe("alert-evaluator", () => {
  it("triggers alert for Tier 1 competitor events", () => {
    const result = evaluateAlertThreshold({
      competitorTier: "TIER_1",
      intelType: "PRODUCT_CHANGE",
      content: "Some product update",
      affectsPositioningClaims: false,
    });
    expect(result.shouldAlert).toBe(true);
    expect(result.reasons).toContain("Tier 1 competitor involved");
  });

  it("triggers alert for pricing changes regardless of tier", () => {
    const result = evaluateAlertThreshold({
      competitorTier: "TIER_2",
      intelType: "PRICING_CHANGE",
      content: "New pricing announced",
      affectsPositioningClaims: false,
    });
    expect(result.shouldAlert).toBe(true);
    expect(result.reasons).toContain("Pricing change detected");
  });

  it("triggers alert for outage events", () => {
    const result = evaluateAlertThreshold({
      competitorTier: "TIER_2",
      intelType: "OUTAGE",
      content: "Service degraded",
      affectsPositioningClaims: false,
    });
    expect(result.shouldAlert).toBe(true);
  });

  it("triggers alert when positioning claims affected", () => {
    const result = evaluateAlertThreshold({
      competitorTier: "TIER_2",
      intelType: "PRODUCT_CHANGE",
      content: "Some update",
      affectsPositioningClaims: true,
    });
    expect(result.shouldAlert).toBe(true);
    expect(result.reasons).toContain("Positioning claim affected");
  });

  it("triggers alert when 'treasury operating system' language detected", () => {
    const result = evaluateAlertThreshold({
      competitorTier: "TIER_2",
      intelType: "MESSAGING_SHIFT",
      content: "We are the Treasury Operating System for enterprise",
      affectsPositioningClaims: false,
    });
    expect(result.shouldAlert).toBe(true);
    expect(result.reasons).toContain("'Treasury Operating System' language detected");
  });

  it("does NOT trigger alert for routine Tier 2 events", () => {
    const result = evaluateAlertThreshold({
      competitorTier: "TIER_2",
      intelType: "HIRING_SIGNAL",
      content: "Hiring a frontend engineer",
      affectsPositioningClaims: false,
    });
    expect(result.shouldAlert).toBe(false);
  });
});
