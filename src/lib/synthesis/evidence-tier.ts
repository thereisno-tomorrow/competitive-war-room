import type { EvidenceTier } from "@/generated/prisma/client";

const RESTRICTED_DOMAINS = [
  "linkedin.com",
  "g2.com",
  "gartner.com",
  "semrush.com",
  "ahrefs.com",
];

export function isPublicCitableSource(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return !RESTRICTED_DOMAINS.some((domain) => hostname.includes(domain));
  } catch {
    return false;
  }
}

export function classifyEvidenceTier(
  content: string,
  sourceUrl: string,
  simulated: boolean
): EvidenceTier {
  if (simulated) return "INFERRED";
  if (isPublicCitableSource(sourceUrl)) return "CONFIRMED";
  return "INFERRED";
}
