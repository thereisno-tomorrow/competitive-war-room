"use client";

import { useLatestPulse } from "@/lib/hooks/use-latest-pulse";
import { PulseDetail } from "@/components/pulse/pulse-detail";
import { AlertCard } from "@/components/pulse/alert-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 w-32 bg-zinc-200 rounded" />
        <div className="h-8 w-3/4 bg-zinc-200 rounded" />
        <div className="h-3 w-48 bg-zinc-100 rounded" />
      </div>
      <div className="h-px bg-zinc-100" />
      <div className="space-y-4">
        <div className="h-4 w-24 bg-zinc-200 rounded" />
        <div className="h-24 bg-zinc-100 rounded-xl" />
        <div className="h-24 bg-zinc-100 rounded-xl" />
      </div>
      <div className="h-px bg-zinc-100" />
      <div className="space-y-4">
        <div className="h-4 w-40 bg-zinc-200 rounded" />
        <div className="h-16 bg-zinc-100 rounded-xl" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-medium text-zinc-400">
        No intelligence published yet
      </p>
      <p className="mt-2 text-sm text-zinc-300">
        The first pulse will appear here once the ingestion pipeline has run.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-medium text-red-500">
        Failed to load intelligence
      </p>
      <p className="mt-2 text-sm text-zinc-400">{message}</p>
    </div>
  );
}

export default function Home() {
  const { data, isLoading, error } = useLatestPulse();

  if (isLoading) {
    return (
      <div className="max-w-3xl">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl">
        <ErrorState message={error.message} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl">
        <EmptyState />
      </div>
    );
  }

  const formattedDate = new Date(data.publishedAt).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const pulseLabel = data.type === "weekly" ? "Weekly Pulse" : "Monthly Pulse";

  return (
    <div className="max-w-3xl space-y-10">
      {/* Pulse Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs font-medium">
            {pulseLabel}
          </Badge>
          <span className="text-xs text-zinc-400">{formattedDate}</span>
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900 leading-tight tracking-tight">
          {data.headline}
        </h1>
      </header>

      {/* Pulse Content */}
      <PulseDetail
        type={data.type}
        content={data.content}
        headline={data.headline}
        publishedAt={data.publishedAt}
      />

      {/* Signal Alerts */}
      <Separator />
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Signal Alerts This Week
        </h2>
        {data.signalAlertsThisWeek.length > 0 ? (
          <div className="grid gap-3">
            {data.signalAlertsThisWeek.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400 italic py-4">
            Nothing notable this week. A quiet week is a good week.
          </p>
        )}
      </section>
    </div>
  );
}
