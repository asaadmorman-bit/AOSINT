import { base44 } from "@/api/base44Client";

/**
 * Checks investigation/scan content against active watchlist keywords.
 * Returns an array of matched keywords.
 */
export async function checkAgainstWatchlist(textContent) {
  const keywords = await base44.entities.WatchlistKeyword.filter({ is_active: true });
  if (!keywords?.length) return [];

  const lowerText = textContent.toLowerCase();
  return keywords.filter(kw => lowerText.includes(kw.keyword.toLowerCase()));
}

/**
 * Builds a single searchable text blob from investigation data.
 */
export function buildInvestigationText(investigation) {
  const parts = [
    investigation.query || "",
    investigation.notes || "",
    ...(investigation.tags || []),
    ...(investigation.results || []).flatMap(r => [
      r.title || "", r.description || "", r.source || ""
    ])
  ];
  return parts.join(" ");
}