"use client";

import { useClaims } from "@/lib/hooks/use-claims";
import { ClaimStatusIndicator } from "@/components/shared/claim-status-indicator";

export function ClaimsStrip() {
  const { data: claims, isLoading } = useClaims();

  if (isLoading) {
    return (
      <div className="border-b border-zinc-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-7xl gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-48 animate-pulse rounded bg-zinc-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!claims?.length) return null;

  return (
    <div className="border-b border-zinc-200 bg-white px-6 py-3">
      <div className="mx-auto flex max-w-7xl gap-8">
        {claims.map((claim) => (
          <ClaimStatusIndicator
            key={claim.id}
            status={claim.status}
            claimText={claim.claimText}
          />
        ))}
      </div>
    </div>
  );
}
