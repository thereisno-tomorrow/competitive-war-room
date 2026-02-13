import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { evaluateAlertThreshold } from "@/lib/synthesis/alert-evaluator";
import { generateSignalAlert } from "@/lib/generators/signal-alert";
import { generateWeeklyPulse } from "@/lib/generators/weekly-pulse";
import { generateMonthlyPulse } from "@/lib/generators/monthly-pulse";
import { ClaudeProvider } from "@/lib/llm/claude";
import { SCHEDULE } from "@/lib/config/thresholds";

function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

/** Get current date in SGT (UTC+8) */
function getSGTDate(): Date {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  return new Date(utcMs + SCHEDULE.SGT_OFFSET_HOURS * 3600_000);
}

/** Check if an output of this type was already generated today (SGT) */
async function alreadyGeneratedToday(
  type: "WEEKLY_PULSE" | "MONTHLY_PULSE",
): Promise<boolean> {
  const sgtNow = getSGTDate();
  const startOfDay = new Date(sgtNow);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(sgtNow);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await prisma.generatedOutput.findFirst({
    where: {
      type,
      publishedAt: { gte: startOfDay, lte: endOfDay },
    },
  });

  return existing !== null;
}

interface GenerateResult {
  signalAlerts: Array<{ id: string; headline: string; deduplicated: boolean }>;
  weeklyPulse: { id: string; headline: string } | null;
  monthlyPulse: { id: string; headline: string } | null;
}

const MAX_SIGNAL_ALERTS_PER_RUN = 20;

export async function POST(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized", code: "unauthorized" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const llm = new ClaudeProvider();
  const forceGenerate = url.searchParams.get("force") === "true";
  const pulseOnly = url.searchParams.get("pulseOnly") === "true";
  const result: GenerateResult = {
    signalAlerts: [],
    weeklyPulse: null,
    monthlyPulse: null,
  };

  // 1. Pulses FIRST (fast — 2 LLM calls, ~30-60s)
  const sgtNow = getSGTDate();
  const dayOfWeek = sgtNow.getDay();

  if (forceGenerate || dayOfWeek === SCHEDULE.WEEKLY_PULSE_DAY) {
    const alreadyDone = !forceGenerate && await alreadyGeneratedToday("WEEKLY_PULSE");
    if (!alreadyDone) {
      const weekly = await generateWeeklyPulse(llm);
      result.weeklyPulse = { id: weekly.id, headline: weekly.headline };
    }
  }

  const dayOfMonth = sgtNow.getDate();
  if (forceGenerate || (dayOfMonth >= 1 && dayOfMonth <= SCHEDULE.MONTHLY_PULSE_MAX_BUSINESS_DAY)) {
    const alreadyDone = !forceGenerate && await alreadyGeneratedToday("MONTHLY_PULSE");
    if (!alreadyDone) {
      const monthly = await generateMonthlyPulse(llm);
      result.monthlyPulse = { id: monthly.id, headline: monthly.headline };
    }
  }

  // 2. Signal alerts (slow — 1 LLM call per item, capped)
  if (!pulseOnly) {
    const unprocessedItems = await prisma.intelligenceItem.findMany({
      where: { alertTriggered: false },
      include: { competitor: true, claimsAffected: true },
      orderBy: { detectedAt: "desc" },
      take: MAX_SIGNAL_ALERTS_PER_RUN,
    });

    for (const item of unprocessedItems) {
      const evaluation = evaluateAlertThreshold({
        competitorTier: item.competitor.tier,
        intelType: item.type,
        content: item.rawContent,
        affectsPositioningClaims: item.claimsAffected.length > 0,
      });

      if (evaluation.shouldAlert) {
        try {
          const alert = await generateSignalAlert(llm, item.id, evaluation.reasons);
          result.signalAlerts.push({
            id: alert.id,
            headline: alert.headline,
            deduplicated: alert.deduplicated,
          });
        } catch (e) {
          console.error(`Signal alert failed for ${item.id}:`, e instanceof Error ? e.message : e);
        }
      }

      // Mark as triggered whether alert generated or not (prevents infinite retries)
      await prisma.intelligenceItem.update({
        where: { id: item.id },
        data: { alertTriggered: true },
      });
    }
  }

  return NextResponse.json({ success: true, ...result });
}
