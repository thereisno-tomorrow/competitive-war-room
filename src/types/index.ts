import type { EvidenceTier, ClaimStatus } from "@/generated/prisma/client";

// === Output Content Schemas (JSON in GeneratedOutput.content) ===

export interface WeeklyPulseContent {
  sections: {
    topSignals: Array<{
      competitor: string;
      summary: string;
      implication: string;
      evidenceTier: EvidenceTier;
      sourceUrl: string;
    }>;
    claimStatuses: Array<{
      claimId: string;
      claimText: string;
      status: ClaimStatus;
      changeFromLastWeek: "improved" | "unchanged" | "degraded";
    }>;
    actionRequired: string | null;
    outlook: string;
  };
}

export interface MonthlyPulseContent {
  sections: {
    categoryHealth: string;
    tier1Shifts: Array<{
      competitor: string;
      narrative: string;
      evidenceTier: EvidenceTier;
    }>;
    tier2Watch: Array<{
      competitor: string;
      signal: string;
    }>;
    positioningConfidence: Array<{
      claimId: string;
      claimText: string;
      status: ClaimStatus;
      evidenceForCount: number;
      evidenceAgainstCount: number;
      assessment: string;
    }>;
    contentImplications: string[];
  };
}

export interface SignalAlertContent {
  sections: {
    whatHappened: string;
    whyItMatters: string;
    evidenceTier: EvidenceTier;
    claimsAffected: string[];
    recommendedResponse: string;
    actionItems: string[];
    sourceUrls: string[];
  };
}

// === API Response Types ===

export interface LatestPulseResponse {
  type: "weekly" | "monthly";
  publishedAt: string;
  headline: string;
  content: WeeklyPulseContent | MonthlyPulseContent;
  signalAlertsThisWeek: Array<{
    id: string;
    headline: string;
    publishedAt: string;
    content: SignalAlertContent;
  }>;
}

export interface BattlecardSummary {
  competitorId: string;
  competitorName: string;
  tier: "TIER_1" | "TIER_2";
  lastUpdated: string;
  reframeCount: number;
}

export interface BattlecardDetail {
  competitor: { id: string; name: string; tier: string };
  whenTheyComeUp: string;
  theirPitch: string[];
  weaknesses: Array<{ text: string; evidenceTier: EvidenceTier; sourceUrl: string }>;
  reframes: Array<{
    id: string;
    weakness: string;
    reframe: string;
    antiReframe: string;
    evidenceTier: EvidenceTier;
    sources: string[];
  }>;
  openQuestions: string[];
  lastUpdated: string;
}

export interface ClaimSummary {
  id: string;
  claimText: string;
  status: ClaimStatus;
  lastAssessed: string | null;
  evidenceForCount: number;
  evidenceAgainstCount: number;
}

// === Config Types ===

export interface AlertThresholds {
  tier1CompetitorInvolved: boolean;
  positioningClaimAffected: boolean;
  pricingChange: boolean;
  outage: boolean;
  negativePressEvent: boolean;
  treasuryOSLanguageDetected: boolean;
}
