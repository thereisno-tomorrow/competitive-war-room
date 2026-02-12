import { cn } from "@/lib/utils";
import type { ClaimStatus } from "@/generated/prisma/client";

const statusConfig: Record<ClaimStatus, { label: string; className: string }> =
  {
    HOLDING: { label: "Holding", className: "bg-green-500" },
    UNDER_PRESSURE: { label: "Under Pressure", className: "bg-amber-500" },
    CONTESTED: { label: "Contested", className: "bg-red-500" },
  };

export function ClaimStatusIndicator({
  status,
  claimText,
}: {
  status: ClaimStatus;
  claimText: string;
}) {
  const config = statusConfig[status];
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-2.5 w-2.5 rounded-full", config.className)} />
      <div>
        <span className="text-xs font-medium text-zinc-500">
          {config.label}
        </span>
        <p className="text-sm text-zinc-900 truncate max-w-[200px]">
          {claimText}
        </p>
      </div>
    </div>
  );
}
