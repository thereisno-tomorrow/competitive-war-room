import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataSource } from "@/generated/prisma/client";
import { RssAdapter } from "../adapters/rss";
import { hashContent } from "../diff-engine";

vi.mock("rss-parser", () => {
  const MockParser = vi.fn();
  MockParser.prototype.parseURL = vi.fn();
  return { default: MockParser };
});

import Parser from "rss-parser";

const mockDataSource: DataSource = {
  id: "src-2",
  competitorId: "comp-1",
  type: "PRESS_RSS",
  url: "https://example.com/feed.xml",
  cadence: "DAILY",
  health: "HEALTHY",
  lastChecked: null,
  lastChangeDetected: null,
  lastContentHash: null,
  createdAt: new Date("2025-01-01"),
};

describe("RssAdapter", () => {
  let adapter: RssAdapter;

  beforeEach(() => {
    adapter = new RssAdapter();
    vi.restoreAllMocks();
  });

  it("has sourceType PRESS_RSS", () => {
    expect(adapter.sourceType).toBe("PRESS_RSS");
  });

  describe("fetch", () => {
    it("concatenates RSS items into content", async () => {
      const mockFeed = {
        items: [
          { title: "Article One", contentSnippet: "First article summary" },
          { title: "Article Two", contentSnippet: "Second article summary" },
          { title: "No Snippet Item", contentSnippet: undefined },
        ],
      };
      vi.mocked(Parser.prototype.parseURL).mockResolvedValue(
        mockFeed as ReturnType<Parser["parseURL"]> extends Promise<infer T>
          ? T
          : never,
      );

      const result = await adapter.fetch(mockDataSource);

      expect(result.content).toBe(
        "Article One\nFirst article summary\n\nArticle Two\nSecond article summary\n\nNo Snippet Item",
      );
      expect(result.url).toBe(mockDataSource.url);
      expect(result.fetchedAt).toBeInstanceOf(Date);
    });

    it("handles empty feed", async () => {
      const mockFeed = { items: [] };
      vi.mocked(Parser.prototype.parseURL).mockResolvedValue(
        mockFeed as ReturnType<Parser["parseURL"]> extends Promise<infer T>
          ? T
          : never,
      );

      const result = await adapter.fetch(mockDataSource);

      expect(result.content).toBe("");
      expect(result.url).toBe(mockDataSource.url);
    });
  });

  describe("detectChanges", () => {
    it("returns changes when previous hash exists and content differs", async () => {
      const current = {
        content: "Article One\nSummary one\n\nArticle Two\nSummary two",
        url: "https://example.com/feed.xml",
        fetchedAt: new Date(),
      };
      const previousHash = hashContent("old feed content");

      const changes = await adapter.detectChanges(current, previousHash);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        competitorId: "",
        sourceId: "",
        changeType: "rss_new_items",
        content: current.content,
        url: "https://example.com/feed.xml",
        summary: "New RSS items detected at https://example.com/feed.xml",
      });
    });

    it("returns changes when previousHash is null (first fetch)", async () => {
      const current = {
        content: "some feed content",
        url: "https://example.com/feed.xml",
        fetchedAt: new Date(),
      };

      const changes = await adapter.detectChanges(current, null);

      expect(changes).toHaveLength(1);
      expect(changes[0]?.changeType).toBe("rss_new_items");
    });

    it("returns empty when content matches previous hash", async () => {
      const content = "unchanged feed content";
      const current = {
        content,
        url: "https://example.com/feed.xml",
        fetchedAt: new Date(),
      };
      const previousHash = hashContent(content);

      const changes = await adapter.detectChanges(current, previousHash);

      expect(changes).toHaveLength(0);
    });
  });
});
