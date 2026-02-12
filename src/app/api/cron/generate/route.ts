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

export async function POST(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized", code: "unauthorized" },
      { status: 401 },
    );
  }

  const llm = new ClaudeProvider();
  const result: GenerateResult = {
    signalAlerts: [],
    weeklyPulse: null,
    monthlyPulse: null,
  };

  // 1. Generate signal alerts for unprocessed alert-worthy items
  const unprocessedItems = await prisma.intelligenceItem.findMany({
    where: { alertTriggered: false },
    include: { competitor: true, claimsAffected: true },
  });

  for (const item of unprocessedItems) {
    const evaluation = evaluateAlertThreshold({
      competitorTier: item.competitor.tier,
      intelType: item.type,
      content: item.rawContent,
      affectsPositioningClaims: item.claimsAffected.length > 0,
    });

    if (evaluation.shouldAlert) {
      const alert = await generateSignalAlert(llm, item.id, evaluation.reasons);
      result.signalAlerts.push({
        id: alert.id,
        headline: alert.headline,
        deduplicated: alert.deduplicated,
      });

      // Mark item as alert-triggered
      await prisma.intelligenceItem.update({
        where: { id: item.id },
        data: { alertTriggered: true },
      });
    }
  }

  // 2. Weekly pulse on Mondays (SGT)
  const sgtNow = getSGTDate();
  const dayOfWeek = sgtNow.getDay();

  if (dayOfWeek === SCHEDULE.WEEKLY_PULSE_DAY) {
    const alreadyDone = await alreadyGeneratedToday("WEEKLY_PULSE");
    if (!alreadyDone) {
      const weekly = await generateWeeklyPulse(llm);
      result.weeklyPulse = { id: weekly.id, headline: weekly.headline };
    }
  }

  // 3. Monthly pulse on 1st-5th of month (SGT)
  const dayOfMonth = sgtNow.getDate();
  if (dayOfMonth >= 1 && dayOfMonth <= SCHEDULE.MONTHLY_PULSE_MAX_BUSINESS_DAY) {
    const alreadyDone = await alreadyGeneratedToday("MONTHLY_PULSE");
    if (!alreadyDone) {
      const monthly = await generateMonthlyPulse(llm);
      result.monthlyPulse = { id: monthly.id, headline: monthly.headline };
    }
  }

  return NextResponse.json({ success: true, ...result });
}
