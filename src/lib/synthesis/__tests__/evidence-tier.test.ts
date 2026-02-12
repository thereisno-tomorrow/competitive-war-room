import { describe, it, expect, vi } from "vitest";
import { classifyEvidenceTier, isPublicCitableSource } from "../evidence-tier";

describe("evidence-tier", () => {
  describe("isPublicCitableSource", () => {
    it("returns true for company website URLs", () => {
      expect(isPublicCitableSource("https://www.kyriba.com/blog/new-feature")).toBe(true);
    });

    it("returns true for press/news URLs", () => {
      expect(isPublicCitableSource("https://www.fintechsingapore.com/article/123")).toBe(true);
    });

    it("returns false for LinkedIn URLs (restricted source)", () => {
      expect(isPublicCitableSource("https://linkedin.com/company/kyriba/jobs")).toBe(false);
    });

    it("returns false for G2 review URLs (restricted source)", () => {
      expect(isPublicCitableSource("https://www.g2.com/products/kyriba/reviews")).toBe(false);
    });

    it("returns false for SEMrush URLs (restricted source)", () => {
      expect(isPublicCitableSource("https://www.semrush.com")).toBe(false);
    });
  });

  describe("classifyEvidenceTier", () => {
    it("classifies public citable source as CONFIRMED", () => {
      const tier = classifyEvidenceTier(
        "Kyriba launches new AI feature",
        "https://www.kyriba.com/blog/ai-feature",
        false
      );
      expect(tier).toBe("CONFIRMED");
    });

    it("classifies simulated data as INFERRED regardless of source", () => {
      const tier = classifyEvidenceTier(
        "Kyriba launches new AI feature",
        "https://www.kyriba.com/blog/ai-feature",
        true
      );
      expect(tier).toBe("INFERRED");
    });

    it("classifies restricted source as INFERRED", () => {
      const tier = classifyEvidenceTier(
        "Job posting analysis suggests AI investment",
        "https://linkedin.com/company/kyriba/jobs",
        false
      );
      expect(tier).toBe("INFERRED");
    });
  });
});
