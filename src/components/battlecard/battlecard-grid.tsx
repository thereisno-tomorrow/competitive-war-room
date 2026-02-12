"use client";

import Link from "next/link";
import type { BattlecardSummary } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function BattlecardCard({ battlecard }: { battlecard: BattlecardSummary }) {
  const href = `/battlecards/${battlecard.competitorName.toLowerCase()}`;

  return (
    <Link href={href} className="block">
      <Card className="py-4 transition-colors hover:border-zinc-300">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-zinc-900">
              {battlecard.competitorName}
            </CardTitle>
            <Badge
              variant={battlecard.tier === "TIER_1" ? "default" : "secondary"}
            >
              {battlecard.tier === "TIER_1" ? "Tier 1" : "Tier 2"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>
              Updated {formatDate(battlecard.lastUpdated)}
            </span>
            <span className="font-medium tabular-nums">
              {battlecard.reframeCount}{" "}
              {battlecard.reframeCount === 1 ? "reframe" : "reframes"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function BattlecardGrid({
  battlecards,
}: {
  battlecards: BattlecardSummary[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {battlecards.map((bc) => (
        <BattlecardCard key={bc.competitorId} battlecard={bc} />
      ))}
    </div>
  );
}
