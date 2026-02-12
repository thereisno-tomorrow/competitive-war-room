import { prisma } from "@/lib/db";
import type { IntelType, EvidenceTier } from "@/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const competitorId = searchParams.get("competitorId");
  const type = searchParams.get("type") as IntelType | null;
  const tier = searchParams.get("tier") as EvidenceTier | null;
  const simulated = searchParams.get("simulated");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const where: Record<string, unknown> = {};

  if (competitorId) where.competitorId = competitorId;
  if (type) where.type = type;
  if (tier) where.evidenceTier = tier;
  if (simulated === "true") where.simulated = true;
  else if (simulated === "false") where.simulated = false;

  if (from ?? to) {
    const detectedAt: Record<string, Date> = {};
    if (from) detectedAt.gte = new Date(from);
    if (to) detectedAt.lte = new Date(to);
    where.detectedAt = detectedAt;
  }

  const [items, total] = await Promise.all([
    prisma.intelligenceItem.findMany({
      where,
      include: { competitor: true },
      orderBy: { detectedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.intelligenceItem.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      competitor: { id: item.competitor.id, name: item.competitor.name },
      type: item.type,
      summary: item.summary,
      finmoImplication: item.finmoImplication,
      evidenceTier: item.evidenceTier,
      sourceUrl: item.sourceUrl,
      simulated: item.simulated,
      detectedAt: item.detectedAt.toISOString(),
    })),
    total,
    limit,
    offset,
  });
}
