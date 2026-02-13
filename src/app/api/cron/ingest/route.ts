import type { SourceType } from "@/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { IngestionRunner } from "@/lib/ingestion/runner";
import type { IngestionAdapter } from "@/lib/ingestion/adapters/base";
import { WebsiteAdapter } from "@/lib/ingestion/adapters/website";
import { ChangelogAdapter } from "@/lib/ingestion/adapters/changelog";
import { RssAdapter } from "@/lib/ingestion/adapters/rss";
import { StatusPageAdapter } from "@/lib/ingestion/adapters/status-page";
import { LinkedInAdapter } from "@/lib/ingestion/adapters/linkedin";
import { ClaudeProvider } from "@/lib/llm/claude";

export const maxDuration = 300;

function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

export async function POST(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized", code: "unauthorized" },
      { status: 401 },
    );
  }

  const adapters = new Map<SourceType, IngestionAdapter>([
    ["WEBSITE", new WebsiteAdapter()],
    ["CHANGELOG", new ChangelogAdapter()],
    ["PRESS_RSS", new RssAdapter()],
    ["STATUS_PAGE", new StatusPageAdapter()],
  ]);

  // LinkedIn adapter requires PhantomBuster API key — skip when not configured
  if (process.env.PHANTOMBUSTER_API_KEY) {
    adapters.set("LINKEDIN", new LinkedInAdapter());
  }

  const llm = new ClaudeProvider();
  const runner = new IngestionRunner(adapters, llm);

  try {
    const result = await runner.run();
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[INGEST] Fatal error:", message, stack);
    return NextResponse.json(
      { error: message, stack },
      { status: 500 },
    );
  }
}
