import { createHash } from "crypto";
import * as cheerio from "cheerio";

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function hasContentChanged(
  content: string,
  previousHash: string | null,
): boolean {
  if (!previousHash) return true;
  return hashContent(content) !== previousHash;
}

export function extractTextContent(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  const text = $.text();
  return text.replace(/\s+/g, " ").trim();
}
