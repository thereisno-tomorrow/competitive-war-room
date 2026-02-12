"use client";

import type { BattlecardDetail as BattlecardDetailType } from "@/types";
import { EvidenceTierBadge } from "@/components/shared/evidence-tier-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ReframeCard({
  reframe,
}: {
  reframe: BattlecardDetailType["reframes"][number];
}) {
  return (
    <Card className="py-4">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            When they say
          </span>
          <EvidenceTierBadge tier={reframe.evidenceTier} />
        </div>
        <p className="text-sm text-zinc-600 mt-1">{reframe.weakness}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* The reframe — hero content, large and readable */}
        <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-1.5 block">
            Say this
          </span>
          <p className="text-base text-zinc-900 leading-relaxed font-medium">
            {reframe.reframe}
          </p>
        </div>

        {/* Anti-reframe — visually distinct caution style */}
        {reframe.antiReframe && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1 block">
              Don&apos;t say
            </span>
            <p className="text-sm text-amber-800 leading-relaxed">
              {reframe.antiReframe}
            </p>
          </div>
        )}

        {/* Sources */}
        {reframe.sources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {reframe.sources.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-400 hover:text-zinc-600 underline underline-offset-2"
              >
                Source
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WeaknessItem({
  weakness,
}: {
  weakness: BattlecardDetailType["weaknesses"][number];
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-zinc-400 mt-0.5 shrink-0">&bull;</span>
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <span className="text-sm text-zinc-700 leading-relaxed">
          {weakness.text}
        </span>
        <EvidenceTierBadge tier={weakness.evidenceTier} />
        {weakness.sourceUrl && (
          <a
            href={weakness.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-zinc-600 underline underline-offset-2"
          >
            Source
          </a>
        )}
      </div>
    </div>
  );
}

export function BattlecardDetailView({
  battlecard,
}: {
  battlecard: BattlecardDetailType;
}) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            {battlecard.competitor.name}
          </h1>
          <Badge
            variant={
              battlecard.competitor.tier === "TIER_1" ? "default" : "secondary"
            }
          >
            {battlecard.competitor.tier === "TIER_1" ? "Tier 1" : "Tier 2"}
          </Badge>
        </div>
        <p className="text-xs text-zinc-400">
          Last updated {formatDate(battlecard.lastUpdated)}
        </p>
      </header>

      {/* Reframes — HERO SECTION, placed first for above-the-fold visibility */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">
          Reframes
        </h2>
        {battlecard.reframes.length > 0 ? (
          <div className="grid gap-4">
            {battlecard.reframes.map((reframe) => (
              <ReframeCard key={reframe.id} reframe={reframe} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400 italic">
            No reframes available yet.
          </p>
        )}
      </section>

      <Separator />

      {/* When They Come Up */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-2">
          When They Come Up
        </h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          {battlecard.whenTheyComeUp}
        </p>
      </section>

      <Separator />

      {/* Their Pitch */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Their Pitch
        </h2>
        {battlecard.theirPitch.length > 0 ? (
          <ul className="space-y-1.5">
            {battlecard.theirPitch.map((point, i) => (
              <li
                key={i}
                className="text-sm text-zinc-700 leading-relaxed flex items-start gap-2"
              >
                <span className="text-zinc-400 mt-0.5 shrink-0">&bull;</span>
                {point}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400 italic">
            No pitch points documented yet.
          </p>
        )}
      </section>

      <Separator />

      {/* Weaknesses */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Weaknesses
        </h2>
        {battlecard.weaknesses.length > 0 ? (
          <div>
            {battlecard.weaknesses.map((weakness, i) => (
              <WeaknessItem key={i} weakness={weakness} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400 italic">
            No weaknesses documented yet.
          </p>
        )}
      </section>

      <Separator />

      {/* Open Questions */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Open Questions
        </h2>
        {battlecard.openQuestions.length > 0 ? (
          <ul className="space-y-1.5">
            {battlecard.openQuestions.map((question, i) => (
              <li
                key={i}
                className="text-sm text-zinc-700 leading-relaxed flex items-start gap-2"
              >
                <span className="text-zinc-400 mt-0.5 shrink-0">&bull;</span>
                {question}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400 italic">
            No open questions at this time.
          </p>
        )}
      </section>
    </div>
  );
}
