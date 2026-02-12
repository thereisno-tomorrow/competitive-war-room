import { prisma } from "@/lib/db";
import type { EvidenceTier } from "@/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";

interface BattlecardWeakness {
  text: string;
  evidenceTier: EvidenceTier;
  sourceUrl: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ competitorId: string }> },
) {
  const { competitorId } = await params;

  const battlecard = await prisma.battlecard.findUnique({
    where: { competitorId },
    include: {
      competitor: {
        include: {
          reframes: {
            include: {
              sourceItems: {
                select: { sourceUrl: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!battlecard) {
    return NextResponse.json(
      { error: "Battlecard not found", code: "not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    competitor: {
      id: battlecard.competitor.id,
      name: battlecard.competitor.name,
      tier: battlecard.competitor.tier,
    },
    whenTheyComeUp: battlecard.whenTheyComeUp,
    theirPitch: battlecard.theirPitch as string[],
    weaknesses: battlecard.weaknesses as unknown as BattlecardWeakness[],
    reframes: battlecard.competitor.reframes.map((r) => ({
      id: r.id,
      weakness: r.weakness,
      reframe: r.reframe,
      antiReframe: r.antiReframe,
      evidenceTier: r.evidenceTier,
      sources: r.sourceItems.map((s) => s.sourceUrl),
    })),
    openQuestions: battlecard.openQuestions as string[],
    lastUpdated: battlecard.updatedAt.toISOString(),
  });
}
