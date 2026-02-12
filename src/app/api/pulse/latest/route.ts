import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const latestPulse = await prisma.generatedOutput.findFirst({
    where: {
      type: { in: ["WEEKLY_PULSE", "MONTHLY_PULSE"] },
      validationStatus: { in: ["PASSED", "REGENERATED"] },
    },
    orderBy: { publishedAt: "desc" },
  });

  if (!latestPulse) {
    return NextResponse.json(
      { error: "No pulses found", code: "not_found" },
      { status: 404 },
    );
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const signalAlerts = await prisma.generatedOutput.findMany({
    where: {
      type: "SIGNAL_ALERT",
      validationStatus: { in: ["PASSED", "REGENERATED"] },
      publishedAt: { gte: weekAgo },
    },
    orderBy: { publishedAt: "desc" },
  });

  return NextResponse.json({
    type: latestPulse.type === "WEEKLY_PULSE" ? "weekly" : "monthly",
    publishedAt: latestPulse.publishedAt.toISOString(),
    headline: latestPulse.headline,
    content: latestPulse.content,
    signalAlertsThisWeek: signalAlerts.map((alert) => ({
      id: alert.id,
      headline: alert.headline,
      publishedAt: alert.publishedAt.toISOString(),
      content: alert.content,
    })),
  });
}
