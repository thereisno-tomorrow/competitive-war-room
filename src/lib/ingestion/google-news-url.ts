/**
 * Google News RSS URL utilities.
 *
 * Google News RSS feeds use opaque redirect URLs (/rss/articles/CBMi…)
 * that don't resolve via HTTP.  Stripping the /rss/ prefix yields
 * a standard Google News article URL that works in browsers — Google's
 * JS page redirects the user to the real article.
 *
 * resolveGoogleNewsUrl() decodes the real publisher URL from the
 * base64-encoded article ID (no network call for CBMi… IDs).
 * AU_yqL… IDs fall back to the normalized Google News URL.
 */

const GNEWS_RSS_PATTERN = /^https?:\/\/news\.google\.com\/rss\/articles\//i;
const GNEWS_ARTICLE_PATTERN =
  /^https?:\/\/news\.google\.com\/(?:rss\/)?articles\/([^?#]+)/i;

/** True when the URL is a Google News RSS redirect. */
export function isGoogleNewsRssUrl(url: string): boolean {
  return GNEWS_RSS_PATTERN.test(url);
}

/**
 * Convert a Google News RSS redirect URL to a browser-clickable article URL.
 * Non-Google-News URLs are returned unchanged.
 *
 * `/rss/articles/CBMi…`  →  `/articles/CBMi…`
 */
export function normalizeGoogleNewsUrl(url: string): string {
  if (!isGoogleNewsRssUrl(url)) return url;
  return url.replace(/\/rss\/articles\//, "/articles/");
}

// ---------------------------------------------------------------------------
// Full URL resolution — decode the real publisher URL
// ---------------------------------------------------------------------------

/**
 * Resolve a Google News URL to the real publisher URL.
 *
 * Base64-decodes the article ID for CBMi… IDs (instant, no network).
 * Falls back to normalized /articles/… URL for undecodable IDs.
 */
export async function resolveGoogleNewsUrl(url: string): Promise<string> {
  const match = url.match(GNEWS_ARTICLE_PATTERN);
  if (!match) return url;

  const articleId = match[1]!;

  // Base64 protobuf decode (instant, no network).
  // Works for CBMi-prefixed IDs which encode the publisher URL directly.
  // AU_yqL-prefixed IDs are opaque tokens — fall back to Google News redirect URL.
  try {
    const decoded = decodeArticleId(articleId);
    if (decoded) return decoded;
  } catch {
    // decode failed — fall through
  }

  // Fallback: normalized Google News URL (JS redirect in browser)
  return normalizeGoogleNewsUrl(url);
}

/**
 * Decode the publisher URL from a base64-encoded protobuf article ID.
 * Returns null if the ID contains an opaque token (AU_yqL…) or can't be decoded.
 *
 * Protobuf structure:
 *   field 1 (varint): version/type marker
 *   field 4 (length-delimited): the original article URL
 */
function decodeArticleId(articleId: string): string | null {
  const buf = Buffer.from(articleId, "base64");
  let offset = 0;

  // Skip field 1 varint (tag 0x08) if present
  if (buf[0] === 0x08) {
    offset = 1;
    while (offset < buf.length && buf[offset]! >= 0x80) offset++;
    offset++; // past last byte of varint
  }

  // Expect field 4 length-delimited (tag 0x22)
  if (buf[offset] !== 0x22) return null;
  offset++;

  // Read length as varint
  let len = 0;
  let shift = 0;
  while (offset < buf.length) {
    const byte = buf[offset]!;
    len |= (byte & 0x7f) << shift;
    offset++;
    if (byte < 0x80) break;
    shift += 7;
  }

  const urlStr = buf.subarray(offset, offset + len).toString("utf-8");

  // Opaque token — can't decode locally
  if (urlStr.startsWith("AU_yqL")) return null;

  return urlStr.startsWith("http") ? urlStr : null;
}

