import { describe, it, expect } from "vitest";
import {
  validateWeeklyPulse,
  validateSignalAlert,
  validateBattlecardReframe,
  countWords,
} from "../validators";
import type { WeeklyPulseContent, SignalAlertContent } from "@/types";

describe("validators", () => {
  describe("countWords", () => {
    it("counts words correctly", () => {
      expect(countWords("hello world")).toBe(2);
      expect(countWords("one two three four five")).toBe(5);
    });

    it("handles empty string", () => {
      expect(countWords("")).toBe(0);
    });
  });

  describe("validateWeeklyPulse", () => {
    const validPulse: WeeklyPulseContent = {
      sections: {
        topSignals: [{
          competitor: "Kyriba",
          summary: "Launched AI feature",
          implication: "Threatens MO AI positioning claim",
          evidenceTier: "CONFIRMED",
          sourceUrl: "https://kyriba.com/blog",
        }],
        claimStatuses: [{
          claimId: "c1",
          claimText: "Mid-market treasury+payments",
          status: "HOLDING",
          changeFromLastWeek: "unchanged",
        }],
        actionRequired: null,
        outlook: "Competitive landscape stable this week.",
      },
    };

    it("passes valid weekly pulse", () => {
      const result = validateWeeklyPulse(validPulse, 100);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects pulse exceeding word limit", () => {
      const result = validateWeeklyPulse(validPulse, 5);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("word limit"))).toBe(true);
    });

    it("rejects pulse with missing evidence tiers", () => {
      const invalid = structuredClone(validPulse);
      // @ts-expect-error -- testing invalid input
      invalid.sections.topSignals[0].evidenceTier = undefined;
      const result = validateWeeklyPulse(invalid, 500);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateSignalAlert", () => {
    const validAlert: SignalAlertContent = {
      sections: {
        whatHappened: "Kyriba launched AI cash forecasting",
        whyItMatters: "Directly challenges MO AI positioning claim",
        evidenceTier: "CONFIRMED",
        claimsAffected: ["Mid-market treasury+payments"],
        recommendedResponse: "Accelerate MO AI roadmap communications",
        actionItems: ["Update battlecard", "Brief sales team"],
        sourceUrls: ["https://kyriba.com/blog/ai"],
      },
    };

    it("passes valid signal alert", () => {
      const result = validateSignalAlert(validAlert, 500);
      expect(result.valid).toBe(true);
    });

    it("rejects alert without claims affected (Finmo specificity check)", () => {
      const invalid = structuredClone(validAlert);
      invalid.sections.claimsAffected = [];
      const result = validateSignalAlert(invalid, 500);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Finmo specificity"))).toBe(true);
    });

    it("rejects alert without source URLs", () => {
      const invalid = structuredClone(validAlert);
      invalid.sections.sourceUrls = [];
      const result = validateSignalAlert(invalid, 500);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateBattlecardReframe", () => {
    it("passes Confirmed tier reframe", () => {
      const result = validateBattlecardReframe("CONFIRMED");
      expect(result.valid).toBe(true);
    });

    it("rejects Inferred tier reframe", () => {
      const result = validateBattlecardReframe("INFERRED");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Battlecard reframes must be CONFIRMED tier only");
    });

    it("rejects Unknown tier reframe", () => {
      const result = validateBattlecardReframe("UNKNOWN");
      expect(result.valid).toBe(false);
    });
  });
});
