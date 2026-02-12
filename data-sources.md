# Data Sources

10 monitored sources across 6 competitors. Rebuilt from the original 18 after audit found only 1 producing real intelligence.

## Design Principle

Instead of watching competitor websites directly (product pages, blog listings, newsrooms), the system monitors **news coverage about competitors** via Google News RSS feeds. Each article arrives individually with its own URL and date — the same format that already works with the RSS adapter.

High-value direct sources (pricing pages, status pages, Trovata's blog RSS) are kept where they provide unique signal.

---

## Google News RSS — Per-Competitor (6 sources)

Aggregates all press coverage (Finextra, TechCrunch, industry press, competitor newsrooms) into one feed per competitor. Each article is a discrete EVENT with its own link and date.

| # | Competitor | Tier | URL | Search Filter | Notes |
|---|-----------|------|-----|---------------|-------|
| 1 | Kyriba | T1 | `https://news.google.com/rss/search?q=Kyriba+fintech` | `+fintech` reduces noise | Product launches, funding, analyst mentions |
| 2 | Airwallex | T1 | `https://news.google.com/rss/search?q=Airwallex` | Unique name, no filter needed | Key watch: treasury expansion signals |
| 3 | Trovata | T2 | `https://news.google.com/rss/search?q=Trovata+treasury` | `+treasury` needed (common Italian word) | Supplements their direct RSS |
| 4 | Nium | T2 | `https://news.google.com/rss/search?q=Nium+payments` | `+payments` filters false matches | Licensing, partnership news |
| 5 | HighRadius | T2 | `https://news.google.com/rss/search?q=HighRadius` | Unique name | Product announcements, Gartner mentions |
| 6 | GTreasury | T2 | `https://news.google.com/rss/search?q=GTreasury` | Unique name | Press releases, partnerships |

Type: `PRESS_RSS` (EVENT) — Adapter: `RssAdapter`

## Competitor Direct RSS (1 source)

| # | Competitor | URL | Notes |
|---|-----------|-----|-------|
| 7 | Trovata | `https://trovata.io/feed/` | Only competitor with a working RSS feed. Blog posts, product announcements. |

Type: `PRESS_RSS` (EVENT) — Adapter: `RssAdapter`

## High-Value STATE Sources (3 sources)

These detect real changes on specific high-value pages. Hash-based comparison — fires when content changes.

| # | Competitor | URL | Type | Signal |
|---|-----------|-----|------|--------|
| 8 | Airwallex | `https://www.airwallex.com/us/pricing` | WEBSITE | Pricing change = immediate Signal Alert |
| 9 | Trovata | `https://trovata.io/pricing/` | WEBSITE | Pricing change = real signal |
| 10 | Nium | `https://status.nium.com/` | STATUS_PAGE | Outage detection |

Adapter: `WebsiteAdapter` / `StatusPageAdapter`

---

## First-Run Behavior

- **RSS feeds (EVENT):** On first run, processes only the 15 most recent articles from the last 14 days. Prevents processing 50-100 backlog articles and hitting Vercel timeout. After first run, only new articles are processed (typically 0-5 per feed per day).
- **Website/Status (STATE):** On first run, stores baseline hash only — produces zero intelligence items. On subsequent runs, fires when content changes.

---

## What Was Dropped (from original 18)

| Source | Why Dropped |
|--------|-------------|
| Kyriba solutions page, resources page, blog listing | Low signal / listing page that can't isolate articles. Google News replaces. |
| Kyriba API changelog | Dead (403). Never worked. |
| Airwallex homepage, newsroom listing, blog listing | Low signal / listing pages. Google News replaces. Blog was mislabeled as CHANGELOG. |
| Trovata product page | Low signal. Covered by direct RSS + Google News. |
| Nium products page, changelog | Products page is low signal. Changelog is high value but adapter can't parse entries (V2). |
| HighRadius product page, What's New page | Products is low signal. What's New needs structured parsing (V2). |
| GTreasury TMS page, press listing | Low signal / listing page. Google News replaces. |

## V2 Enhancements

| Source | Value | Blocker |
|--------|-------|---------|
| Trade press feeds (Finextra, Fintech Singapore) | Category-level trend monitoring | Need competitor identification logic — articles aren't about one specific competitor |
| "Treasury Operating System" topic feed | Detect category language adoption | Same blocker — need to identify which competitor (or new entrant) |
| Nium changelog, HighRadius What's New | Product-level change tracking | Need structured entry parsing adapter |
| Competitor blog link extraction | Direct competitor content | Need two-step listing-to-article adapter |
