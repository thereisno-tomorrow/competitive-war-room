"use client";

import { useState } from "react";
import type { SignalAlertContent } from "@/types";
import { EvidenceTierBadge } from "@/components/shared/evidence-tier-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AlertCardProps {
  alert: {
    id: string;
    headline: string;
    publishedAt: string;
    content: SignalAlertContent;
  };
}

export function AlertCard({ alert }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { sections } = alert.content;

  const formattedDate = new Date(alert.publishedAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );

  return (
    <Card
      className="py-4 cursor-pointer transition-colors hover:border-zinc-300"
      onClick={() => setExpanded(!expanded)}
    >
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-sm font-semibold text-zinc-900 truncate">
              {alert.headline}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <EvidenceTierBadge tier={sections.evidenceTier} />
            <span className="text-xs text-zinc-400">{formattedDate}</span>
            <span className="text-xs text-zinc-400">
              {expanded ? "\u2212" : "+"}
            </span>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent
          className="space-y-4 pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* What Happened */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              What Happened
            </h4>
            <p className="text-sm text-zinc-700 leading-relaxed">
              {sections.whatHappened}
            </p>
          </div>

          {/* Why It Matters */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              Why It Matters
            </h4>
            <p className="text-sm text-zinc-700 leading-relaxed">
              {sections.whyItMatters}
            </p>
          </div>

          {/* Recommended Response */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              Recommended Response
            </h4>
            <p className="text-sm text-zinc-700 leading-relaxed">
              {sections.recommendedResponse}
            </p>
          </div>

          {/* Action Items */}
          {sections.actionItems.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                Action Items
              </h4>
              <ul className="space-y-1">
                {sections.actionItems.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm text-zinc-700 flex items-start gap-2"
                  >
                    <span className="text-zinc-400 mt-0.5 shrink-0">
                      &bull;
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Claims Affected */}
          {sections.claimsAffected.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                Claims Affected
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {sections.claimsAffected.map((claim, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-zinc-100 text-zinc-600 border border-zinc-200"
                  >
                    {claim}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {sections.sourceUrls.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                Sources
              </h4>
              <div className="flex flex-wrap gap-2">
                {sections.sourceUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-400 hover:text-zinc-600 underline underline-offset-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Source {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
