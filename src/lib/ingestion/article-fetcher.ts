/**
 * Fetches and extracts article content from news URLs.
 *
 * Uses Mozilla's Readability (Firefox Reader View algorithm) to extract
 * clean article text from web pages. Handles Google News URL resolution
 * internally so the caller gets the real publisher URL back.
 *
 * Returns null on any failure — the ingestion pipeline falls back to
 * the RSS snippet when enrichment isn't available.
 */

import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { resolveGoogleNewsUrl } from "./google-news-url";

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_HTML_SIZE = 2_000_000; // 2MB — skip very large pages
const MAX_ARTICLE_LENGTH = 6000; // characters to keep

const GNEWS_HOST = /^https?:\/\/news\.google\.com\//i;

export interface ArticleContent {
  content: string;
  resolvedUrl: string;
  title?: string;
}

export async function fetchArticleContent(
  url: string,
  options?: { timeoutMs?: number },
): Promise<ArticleContent | null> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // Single AbortController covers both URL resolution and article fetch.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Step 1: Resolve Google News URL to real publisher URL
    const resolvedUrl = await resolveGoogleNewsUrl(url);

    // FP1: If URL is still Google News after resolution, skip —
    // Google News pages use JS redirects that fetch() can't follow.
    if (GNEWS_HOST.test(resolvedUrl)) {
      return null;
    }

    // Step 2: Fetch the article HTML
    const response = await fetch(resolvedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!response.ok) return null;

    // Skip non-HTML content (PDFs, images, etc.)
    const contentType = response.headers.get("content-type") ?? "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml")
    ) {
      return null;
    }

    const html = await response.text();
    if (html.length > MAX_HTML_SIZE) return null;

    // Step 3: Extract article content with Readability
    const dom = new JSDOM(html, { url: response.url || resolvedUrl });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (
      !article ||
      !article.textContent ||
      article.textContent.trim().length < 100
    ) {
      return null;
    }

    // Step 4: Clean and truncate
    const cleanText = article.textContent
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, MAX_ARTICLE_LENGTH);

    // Use final URL after any HTTP redirects
    const finalUrl = response.url || resolvedUrl;

    return {
      content: cleanText,
      resolvedUrl: finalUrl,
      title: article.title || undefined,
    };
  } catch {
    // Network error, timeout, parse error — all return null (graceful degradation)
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
