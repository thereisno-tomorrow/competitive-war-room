"use client";

import { useBattlecards } from "@/lib/hooks/use-battlecards";
import { BattlecardGrid } from "@/components/battlecard/battlecard-grid";

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 animate-pulse">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="h-28 rounded-xl border border-zinc-100 bg-zinc-100"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-medium text-zinc-400">
        No battlecards available yet
      </p>
      <p className="mt-2 text-sm text-zinc-300">
        Battlecards will appear here once competitor data has been processed.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-medium text-red-500">
        Failed to load battlecards
      </p>
      <p className="mt-2 text-sm text-zinc-400">{message}</p>
    </div>
  );
}

export default function BattlecardsPage() {
  const { data, isLoading, error } = useBattlecards();

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
          Battlecards
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Competitive positioning guides for sales conversations.
        </p>
      </header>

      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : !data || data.length === 0 ? (
        <EmptyState />
      ) : (
        <BattlecardGrid battlecards={data} />
      )}
    </div>
  );
}
