/**
 * Google News RSS URL utilities.
 *
 * Google News RSS feeds use opaque redirect URLs (/rss/articles/CBMi…)
 * that don't resolve via HTTP.  Stripping the /rss/ prefix yields
 * a standard Google News article URL that works in browsers — Google's
 * JS page redirects the user to the real article.
 *
 * resolveGoogleNewsUrl() goes further: it decodes the real publisher URL
 * from the base64-encoded article ID (no network call for CBMi… IDs),
 * falling back to Google's batchexecute API for newer AU_yqL… IDs.
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
 * Strategy 1 (instant, no network): Base64-decode the article ID.
 *   The CBMi… segment is base64-encoded protobuf containing the original URL.
 *
 * Strategy 2 (network, ~200ms): Google's batchexecute API.
 *   For newer AU_yqL… IDs where base64 yields an opaque token.
 *
 * Fallback: returns the normalized /articles/… URL (current behavior).
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

  // Strategy 2: batchexecute API (for AU_yqL IDs, ~200-400ms)
  try {
    const batchResult = await fetchViaBatchExecute(articleId);
    if (batchResult) return batchResult;
  } catch {
    // network failed — fall through
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

  // Opaque token — needs batchexecute
  if (urlStr.startsWith("AU_yqL")) return null;

  return urlStr.startsWith("http") ? urlStr : null;
}

/**
 * Resolve an article ID via Google's batchexecute API.
 *
 * Two-step process:
 * 1. Fetch the Google News article page to extract signature + timestamp
 * 2. POST to batchexecute with those credentials to get the real URL
 *
 * 5-second timeout per request.
 */
async function fetchViaBatchExecute(
  articleId: string,
): Promise<string | null> {
  const articleUrl = `https://news.google.com/articles/${articleId}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    // Step 1: Fetch article page to get signature and timestamp
    const pageRes = await fetch(articleUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: controller.signal,
    });
    const html = await pageRes.text();

    const sigMatch = html.match(/data-n-a-sg="([^"]+)"/);
    const tsMatch = html.match(/data-n-a-ts="([^"]+)"/);
    if (!sigMatch || !tsMatch) return null;

    const signature = sigMatch[1]!;
    const timestamp = tsMatch[1]!;

    // Step 2: batchexecute with credentials
    clearTimeout(timeout);
    const timeout2 = setTimeout(() => controller.abort(), 5000);

    const innerPayload = JSON.stringify([
      "garturlreq",
      [
        [
          "X",
          "X",
          ["X", "X"],
          null,
          null,
          1,
          1,
          "US:en",
          null,
          1,
          null,
          null,
          null,
          null,
          null,
          0,
          1,
        ],
        "X",
        "X",
        1,
        [1, 1, 1],
        1,
        1,
        null,
        0,
        0,
        null,
        0,
      ],
      articleId,
      Number(timestamp),
      signature,
    ]);

    const outerPayload = JSON.stringify([
      [["Fbv4je", innerPayload, null, "generic"]],
    ]);

    const res = await fetch(
      "https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
          Referer: "https://news.google.com/",
        },
        body: "f.req=" + encodeURIComponent(outerPayload),
        signal: controller.signal,
      },
    );

    const text = await res.text();

    // Response format: )]}\n\n<json array>
    // Parse the second line as JSON, then extract [0][2] → parse inner JSON → [1]
    const parts = text.split("\n\n");
    if (parts.length < 2) return null;

    const parsed = JSON.parse(parts[1]!);
    const innerJson = parsed[0]?.[2];
    if (!innerJson) return null;

    const innerParsed = JSON.parse(innerJson);
    const resolved = innerParsed?.[1];

    clearTimeout(timeout2);
    return typeof resolved === "string" && resolved.startsWith("http")
      ? resolved
      : null;
  } finally {
    clearTimeout(timeout);
  }
}
