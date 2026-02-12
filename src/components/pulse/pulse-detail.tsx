"use client";

import type {
  WeeklyPulseContent,
  MonthlyPulseContent,
} from "@/types";
import type { ClaimStatus } from "@/generated/prisma/client";
import { EvidenceTierBadge } from "@/components/shared/evidence-tier-badge";
import { ClaimStatusIndicator } from "@/components/shared/claim-status-indicator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PulseDetailProps {
  type: "weekly" | "monthly";
  content: WeeklyPulseContent | MonthlyPulseContent;
  headline: string;
  publishedAt: string;
}

const changeIndicator: Record<
  "improved" | "unchanged" | "degraded",
  { icon: string; className: string; label: string }
> = {
  improved: { icon: "\u2191", className: "text-green-600", label: "Improved" },
  unchanged: { icon: "\u2192", className: "text-zinc-400", label: "Unchanged" },
  degraded: { icon: "\u2193", className: "text-red-600", label: "Degraded" },
};

const statusOrder: Record<ClaimStatus, number> = {
  CONTESTED: 0,
  UNDER_PRESSURE: 1,
  HOLDING: 2,
};

function WeeklyPulseDetail({ content }: { content: WeeklyPulseContent }) {
  const { topSignals, claimStatuses, actionRequired, outlook } =
    content.sections;

  const sortedClaims = [...claimStatuses].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status]
  );

  return (
    <div className="space-y-8">
      {/* Top Signals */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">
          Top Signals
        </h3>
        <div className="grid gap-3">
          {topSignals.map((signal, i) => (
            <Card key={i} className="py-4">
              <CardHeader className="pb-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold text-zinc-900">
                    {signal.competitor}
                  </CardTitle>
                  <EvidenceTierBadge tier={signal.evidenceTier} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-zinc-700 leading-relaxed">
                  {signal.summary}
                </p>
                <p className="text-sm text-zinc-500 italic">
                  Implication: {signal.implication}
                </p>
                {signal.sourceUrl && (
                  <a
                    href={signal.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-400 hover:text-zinc-600 underline underline-offset-2"
                  >
                    Source
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Claim Statuses */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">
          Positioning Claims
        </h3>
        <div className="space-y-3">
          {sortedClaims.map((claim) => {
            const change = changeIndicator[claim.changeFromLastWeek];
            return (
              <div
                key={claim.claimId}
                className="flex items-center justify-between"
              >
                <ClaimStatusIndicator
                  status={claim.status}
                  claimText={claim.claimText}
                />
                <span
                  className={`text-xs font-medium ${change.className}`}
                  title={change.label}
                >
                  {change.icon} {change.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Action Required */}
      {actionRequired && (
        <>
          <Separator />
          <section>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-1">
                Action Required
              </h3>
              <p className="text-sm text-amber-700 leading-relaxed">
                {actionRequired}
              </p>
            </div>
          </section>
        </>
      )}

      <Separator />

      {/* Outlook */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-2">
          Outlook
        </h3>
        <p className="text-sm text-zinc-700 leading-relaxed">{outlook}</p>
      </section>
    </div>
  );
}

function MonthlyPulseDetail({ content }: { content: MonthlyPulseContent }) {
  const {
    categoryHealth,
    tier1Shifts,
    tier2Watch,
    positioningConfidence,
    contentImplications,
  } = content.sections;

  return (
    <div className="space-y-8">
      {/* Category Health */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-2">
          Category Health
        </h3>
        <p className="text-sm text-zinc-700 leading-relaxed">
          {categoryHealth}
        </p>
      </section>

      <Separator />

      {/* Tier 1 Shifts */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">
          Tier 1 Narrative Shifts
        </h3>
        <div className="grid gap-3">
          {tier1Shifts.map((shift, i) => (
            <Card key={i} className="py-4">
              <CardHeader className="pb-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold text-zinc-900">
                    {shift.competitor}
                  </CardTitle>
                  <EvidenceTierBadge tier={shift.evidenceTier} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-700 leading-relaxed">
                  {shift.narrative}
                </p>
              </CardContent>
            </Card>
          ))}
          {tier1Shifts.length === 0 && (
            <p className="text-sm text-zinc-400 italic">
              No major narrative shifts detected this month.
            </p>
          )}
        </div>
      </section>

      <Separator />

      {/* Tier 2 Watch */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">
          Tier 2 Watch List
        </h3>
        <div className="space-y-2">
          {tier2Watch.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="font-medium text-zinc-600 shrink-0">
                {item.competitor}:
              </span>
              <span className="text-zinc-500">{item.signal}</span>
            </div>
          ))}
          {tier2Watch.length === 0 && (
            <p className="text-sm text-zinc-400 italic">
              No notable tier 2 signals this month.
            </p>
          )}
        </div>
      </section>

      <Separator />

      {/* Positioning Confidence */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">
          Positioning Confidence
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="text-left py-2 pr-4 font-medium text-zinc-500">
                  Claim
                </th>
                <th className="text-center py-2 px-3 font-medium text-zinc-500">
                  Status
                </th>
                <th className="text-center py-2 px-3 font-medium text-zinc-500">
                  For
                </th>
                <th className="text-center py-2 px-3 font-medium text-zinc-500">
                  Against
                </th>
                <th className="text-left py-2 pl-4 font-medium text-zinc-500">
                  Assessment
                </th>
              </tr>
            </thead>
            <tbody>
              {positioningConfidence.map((claim) => (
                <tr
                  key={claim.claimId}
                  className="border-b border-zinc-100 last:border-0"
                >
                  <td className="py-2.5 pr-4 text-zinc-700 max-w-[240px]">
                    {claim.claimText}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <ClaimStatusIndicator
                      status={claim.status}
                      claimText=""
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-green-600">
                    {claim.evidenceForCount}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-red-600">
                    {claim.evidenceAgainstCount}
                  </td>
                  <td className="py-2.5 pl-4 text-zinc-500 italic">
                    {claim.assessment}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Separator />

      {/* Content Implications */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Content Implications
        </h3>
        <ul className="space-y-1.5">
          {contentImplications.map((item, i) => (
            <li
              key={i}
              className="text-sm text-zinc-700 leading-relaxed flex items-start gap-2"
            >
              <span className="text-zinc-400 mt-0.5 shrink-0">&bull;</span>
              {item}
            </li>
          ))}
          {contentImplications.length === 0 && (
            <li className="text-sm text-zinc-400 italic">
              No specific content implications this month.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

export function PulseDetail({
  type,
  content,
}: PulseDetailProps) {
  return (
    <div>
      {type === "weekly" ? (
        <WeeklyPulseDetail
          content={content as WeeklyPulseContent}
        />
      ) : (
        <MonthlyPulseDetail
          content={content as MonthlyPulseContent}
        />
      )}
    </div>
  );
}
