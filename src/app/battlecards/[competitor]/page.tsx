"use client";

import { use } from "react";
import {
  useBattlecards,
  useBattlecard,
} from "@/lib/hooks/use-battlecards";
import { BattlecardDetailView } from "@/components/battlecard/battlecard-detail";
import Link from "next/link";

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 rounded-xl bg-zinc-100" />
      <div className="h-64 rounded-xl bg-zinc-100" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-48 rounded-xl bg-zinc-100" />
        <div className="h-48 rounded-xl bg-zinc-100" />
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/50 py-24 text-center">
      <p className="text-base font-medium text-red-600">
        Failed to load battlecard
      </p>
      <p className="mt-1.5 text-sm text-red-400">{message}</p>
      <Link
        href="/battlecards"
        className="mt-4 text-sm font-medium text-finmo-600 hover:text-finmo-700 underline underline-offset-2"
      >
        Back to Battlecards
      </Link>
    </div>
  );
}

function NotFoundState({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-24 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-finmo-50">
        <span className="text-xl text-finmo-400">?</span>
      </div>
      <p className="text-base font-medium text-zinc-500">
        Battlecard not found
      </p>
      <p className="mt-1.5 text-sm text-zinc-400">
        No battlecard found for &ldquo;{name}&rdquo;.
      </p>
      <Link
        href="/battlecards"
        className="mt-4 text-sm font-medium text-finmo-600 hover:text-finmo-700 underline underline-offset-2"
      >
        Back to Battlecards
      </Link>
    </div>
  );
}

function BattlecardLoader({ competitorSlug }: { competitorSlug: string }) {
  const {
    data: battlecards,
    isLoading: listLoading,
    error: listError,
  } = useBattlecards();

  // Find the matching competitor by name (slug is lowercase)
  const matchedCompetitor = battlecards?.find(
    (bc) => bc.competitorName.toLowerCase() === competitorSlug.toLowerCase()
  );

  const competitorId = matchedCompetitor?.competitorId ?? "";

  const {
    data: detail,
    isLoading: detailLoading,
    error: detailError,
  } = useBattlecard(competitorId);

  if (listLoading || (competitorId && detailLoading)) {
    return <LoadingSkeleton />;
  }

  if (listError) {
    return <ErrorState message={listError.message} />;
  }

  if (!matchedCompetitor) {
    return <NotFoundState name={competitorSlug} />;
  }

  if (detailError) {
    return <ErrorState message={detailError.message} />;
  }

  if (!detail) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      <Link
        href="/battlecards"
        className="inline-flex items-center gap-1.5 mb-6 text-sm font-medium text-zinc-400 hover:text-finmo-600 transition-colors"
      >
        &larr; All Battlecards
      </Link>
      <BattlecardDetailView battlecard={detail} />
    </div>
  );
}

export default function BattlecardPage({
  params,
}: {
  params: Promise<{ competitor: string }>;
}) {
  const { competitor } = use(params);

  return <BattlecardLoader competitorSlug={competitor} />;
}
