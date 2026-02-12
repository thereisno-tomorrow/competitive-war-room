import type { CompetitorTier, IntelType } from "@/generated/prisma/client";

interface AlertEvalInput {
  competitorTier: CompetitorTier;
  intelType: IntelType;
  content: string;
  affectsPositioningClaims: boolean;
}

interface AlertEvalResult {
  shouldAlert: boolean;
  reasons: string[];
}

const ALERT_INTEL_TYPES: IntelType[] = ["PRICING_CHANGE", "OUTAGE"];

export function evaluateAlertThreshold(input: AlertEvalInput): AlertEvalResult {
  const reasons: string[] = [];

  if (input.competitorTier === "TIER_1") {
    reasons.push("Tier 1 competitor involved");
  }

  if (ALERT_INTEL_TYPES.includes(input.intelType)) {
    if (input.intelType === "PRICING_CHANGE") reasons.push("Pricing change detected");
    if (input.intelType === "OUTAGE") reasons.push("Outage detected");
  }

  if (input.affectsPositioningClaims) {
    reasons.push("Positioning claim affected");
  }

  if (/treasury\s+operating\s+system/i.test(input.content)) {
    reasons.push("'Treasury Operating System' language detected");
  }

  return {
    shouldAlert: reasons.length > 0,
    reasons,
  };
}
