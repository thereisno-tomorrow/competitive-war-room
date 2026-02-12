import type { ClaimStatus } from "@/generated/prisma/client";

interface ClaimEvidence {
  evidenceFor: number;
  evidenceAgainst: number;
}

export function assessClaimStatus(evidence: ClaimEvidence): ClaimStatus {
  const { evidenceFor, evidenceAgainst } = evidence;

  if (evidenceAgainst === 0) return "HOLDING";
  if (evidenceAgainst > evidenceFor) return "CONTESTED";
  if (evidenceAgainst > 0) return "UNDER_PRESSURE";

  return "HOLDING";
}
