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
    <div className="max-w-3xl space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-8 w-48 bg-zinc-200 rounded" />
        <div className="h-3 w-32 bg-zinc-100 rounded" />
      </div>
      <div className="space-y-4">
        <div className="h-4 w-24 bg-zinc-200 rounded" />
        <div className="h-32 bg-zinc-100 rounded-xl" />
        <div className="h-32 bg-zinc-100 rounded-xl" />
      </div>
      <div className="h-px bg-zinc-100" />
      <div className="space-y-4">
        <div className="h-4 w-40 bg-zinc-200 rounded" />
        <div className="h-16 bg-zinc-100 rounded-xl" />
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="max-w-3xl flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-medium text-red-500">
        Failed to load battlecard
      </p>
      <p className="mt-2 text-sm text-zinc-400">{message}</p>
      <Link
        href="/battlecards"
        className="mt-6 text-sm text-zinc-500 hover:text-zinc-700 underline underline-offset-2"
      >
        Back to Battlecards
      </Link>
    </div>
  );
}

function NotFoundState({ name }: { name: string }) {
  return (
    <div className="max-w-3xl flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-medium text-zinc-400">
        Battlecard not found
      </p>
      <p className="mt-2 text-sm text-zinc-300">
        No battlecard found for &ldquo;{name}&rdquo;.
      </p>
      <Link
        href="/battlecards"
        className="mt-6 text-sm text-zinc-500 hover:text-zinc-700 underline underline-offset-2"
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
    <div className="max-w-3xl">
      <Link
        href="/battlecards"
        className="inline-block mb-6 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
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
