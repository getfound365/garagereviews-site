# Garage Reviews — garagereviews.us — Build Report

**Built:** Nov 18, 2026 (local only — NOT deployed, no repo exists yet)
**Location:** `~/workspace/garagereviews-site/`
**Domain:** garagereviews.us — BOUGHT by Tyler Nov 18, 2026 ($6.50/yr Cloudflare). Site not wired to it yet.
**Model:** Wattroster-style roster hub + finder with up to 3 options + full comparison table, video reviews included. Walmart links only — no Amazon anywhere (Tyler's rule after the KDP termination).

## Nov 18 update — live re-check applied (~05:49–05:53, browser)

All four seeded models were re-checked on live walmart.com listings and the figures below replaced the search-crawl figures. Roster is now **4 models** (was 5). What changed:
- **WGen9500DF:** rating corrected to 4.8 stars / **26,307** ratings (the build's 15,771 was stale — never publish it). In stock, $999. Affiliate link https://walmrt.us/4kiUs3z (2%, $19.98/sale), listing 566066875.
- **iGen4000DFc:** rating now verified, 4.8 stars / **1,164** ratings. **OUT OF STOCK** — flagged on every page. Regular walmart.com listing confirmed (listing 5315492644), replacing the business.walmart.com link. Affiliate link https://walmrt.us/4zq3W0w. Commission rate was NOT displayed for this listing — $15.98 (2% of $799) is arithmetic only, never presented as a verified figure.
- **iGen2200: REMOVED from the roster entirely.** No live Walmart listing exists, no verifiable price, no link. Removed from homepage, compare table, and finder MODELS. Finder branches that offered it now offer what remains or honestly state nothing fits (under-$500 now returns 0 options).
- **Jackery Explorer 1000 v2: KEPT** — Tyler's decision Nov 18 (declined the in-stock HomePower 1000 v2 swap, $549, listing 21351753268, link https://walmrt.us/4zUu5Wo — recorded here only, NOT on the site). Corrected to **$589.00** on Walmart (not $559), **OUT OF STOCK**, 4.9 stars / 299 ratings, capacity **1,060 Wh** (not 1,070, not 1,024), 23.8 lb. Affiliate link https://walmrt.us/4zsmKfO (2%, $11.78). Walmart titles the listing "Jackery E1000AC Sand Gold 1060Wh" — the unit photo and reviews confirm it is the Explorer 1000 v2; the naming is noted on the site.
- **iGen4500DF:** unchanged ($949, 4.7/8,781, link 4t4whs1). **Video review is LIVE and verified:** https://www.youtube.com/watch?v=CT9JMiGgqgg — the loop published it Nov 18 and the URL was confirmed against the live video page (title, description, and affiliate link all match). The channel-link TODO is gone.
- No eBay links on the site — the EPN task is still running; none exist yet and none were invented.
- New `.oos` badge in styles.css for out-of-stock flags.

## Pages built

| Page | File | What it does |
|---|---|---|
| Homepage (roster hub) | `index.html` | Hero, browse by job (essentials / whole home / portable), browse by budget (under $500 / around $1,000 / over $1,000), solar battery section, latest review (iGen4500DF), short comparison table, 3-step outage-plan guide, "Always on" links |
| Generator finder v2 | `generator-finder/index.html` | Same 3 questions as the old finder (what to power / fuel / budget), but the result shows up to 3 option cards — best match + alternatives — each with price, rating, specs, fit line, review status, and shop link where verified |
| Compare all | `compare/index.html` | Full table: gas running/starting, propane running, type/voltage, weight, price, rating, best fit, review status/link |
| Review: iGen4500DF | `reviews/westinghouse-igen4500df/index.html` | Full review page with embedded video (CT9JMiGgqgg), verified specs, pros/cons, FAQ, Walmart buy button. SEO: "Westinghouse iGen4500DF review" |
| Review: WGen9500DF | `reviews/westinghouse-wgen9500df/index.html` | Full review page, no video yet ("Video review coming"), Walmart buy button |
| Review: iGen4000DFc | `reviews/westinghouse-igen4000dfc/index.html` | Full review page, OUT OF STOCK flag prominent, no video yet, buy-the-iGen4500DF-instead button |
| Review: Jackery Explorer 1000 v2 | `reviews/jackery-explorer-1000-v2/index.html` | Full review page, Walmart OOS + eBay $529.99 in-stock second option, no video yet |
| Best dual-fuel under $1,000 | `best-dual-fuel-generators-under-1000/index.html` | Best-of page: the three dual-fuel models under $1,000 ranked with a verdict each + comparison table. SEO: "best dual fuel generator under $1000" |
| Shared stylesheet | `styles.css` | Garage brand v2: charcoal #1A1A1A, orange #FF6A00, green #2EE56B, off-white #FAFAF7; FTC disclosure styling top + bottom of every page |
| Sitemap | `sitemap.xml` | 3 URLs under https://garagereviews.us/ |

## Roster — verified data (Nov 18, 2026)

**Verification status (updated Nov 18 ~05:53):** the live-browser re-check is DONE — all four seeded models were verified on live walmart.com listings Nov 18 ~05:49–05:53. The figures below are the verified ones. The original caveat (bot-check blocked the text crawler) applied only to the first build; it no longer applies.

### 1. Westinghouse iGen4500DF — REVIEWED ✅
- **Price:** $949.00, in stock, free shipping, arrives Sat Nov 21
- **Rating:** 4.7 stars / 8,781 ratings / 8,741 reviews, 79% 5-star
- **Specs:** gas 4,500 peak / 3,700 running W; propane 4,050 peak / 3,330 running W; 224cc; 3.4-gal tank; up to 18h gas at 25% load (14h propane); 52 dBA; <3% THD; electric push-button + remote start (109 yd) + recoil; TT-30R 30A RV, 5-20R duplex, dual USB; 98 lb
- **Source:** Walmart listing 299247705, verified live by parent via browser Nov 18 ~05:31 CST (and Nov 17 evening run). Specs from listing spec block + Westinghouse spec sheet.
- **Affiliate link:** https://walmrt.us/4t4whs1 (2%, $18.98/sale) — generated Nov 18 ~05:29 in Creator
- **Video review:** LIVE and verified Nov 18: https://www.youtube.com/watch?v=CT9JMiGgqgg ("Westinghouse iGen4500DF: Is the $949 Dual-Fuel Inverter Generator Worth It?"). Hub, finder, and compare table all link to the video.

### 2. Westinghouse WGen9500DF — Review coming
- **Price:** $999.00
- **Rating:** 4.8 stars / 26,307 ratings (25,911 reviews) — the first build's 15,771 was stale; corrected by the live re-check.
- **Specs:** gas 12,500 peak / 9,500 running W; propane 11,200 peak / 8,500 running W; 457cc; 6.6-gal tank; up to 12h; 211 lb; 120/240V; L14-30R transfer-switch outlet; remote start — specs confirmed on the live listing.
- **Source:** Walmart listing 566066875, verified live Nov 18 ~05:49–05:53.
- **Stock:** In stock. Free shipping, arrives Sat Nov 21. Sold and shipped by Westinghouse Outdoor Power.
- **Affiliate link:** https://walmrt.us/4kiUs3z (2%, $19.98/sale) — generated in Creator Nov 18.
- **Best fit:** whole home via transfer switch.

### 3. Westinghouse iGen4000DFc — Review coming
- **Price:** $799.00
- **Rating:** 4.8 stars / 1,164 ratings (1,149 reviews) — verified by the live re-check; was unknown in the first build.
- **Specs:** 4,000 peak / 3,300 running W; dual fuel; CO sensor; remote start; TT-30R RV outlet; up to 7h on a 1.69-gal tank
- **Source:** regular walmart.com listing 5315492644 (identity confirmed by the product image showing "iGen4000DFc" and a review naming it), verified live Nov 18 ~05:49–05:53. Replaces the business.walmart.com link used in the first build.
- **Stock:** OUT OF STOCK (no Add to cart — "Shop similar" only). Flagged on every page.
- **Affiliate link:** https://walmrt.us/4zq3W0w — generated in Creator Nov 18 despite the item being out of stock. Commission rate NOT displayed for this listing (its card did not appear in Creator Products search, apparently because it is out of stock); $15.98 is 2% arithmetic only, never presented as verified.
- **Best fit:** essentials, CO sensor included — $150 less than the iGen4500DF.

### 4. Westinghouse iGen2200 — REMOVED Nov 18
- **Reason:** no live walmart.com listing exists. Walmart search returned only a non-Westinghouse BE 2800/2200W generator; Creator Products search (68 results) contains only parts/filters/conversion kits for the iGen2200, no generator. No verifiable price, no rating, no link — so it is off the roster entirely (homepage, compare table, finder MODELS and finder logic). Under-$500 branches now honestly return no options.
- **Old figures (do NOT reuse):** MSRP $579 on westinghouse.com (out of stock there); 2,200 peak / 1,800 running W; 52 dBA; 46 lb — maker/review-site figures only, never verified against a Walmart listing.

### 5. Jackery Explorer 1000 v2 — Review coming (solar) — KEPT per Tyler's decision Nov 18
- **Price:** $589.00 on Walmart (not the $559 Jackery.com price)
- **Rating:** 4.9 stars / 299 ratings (297 reviews) — verified by the live re-check.
- **Specs:** 1,060 Wh LiFePO4 battery (not 1,070, not 1,024 — the live listing's own figure); 1,500W continuous / 3,000W surge; 400W solar input; 23.8 lb; charges from wall or sun
- **Source:** Walmart listing 19996171850, verified live Nov 18 ~05:49–05:53. Walmart titles it "Jackery E1000AC Sand Gold 1060Wh" — the unit photo and imported jackery.com reviews confirm it is the Explorer 1000 v2; the naming is noted on the site.
- **Stock:** OUT OF STOCK (no Add to cart — "Shop similar" only). Flagged on every page.
- **Affiliate link:** https://walmrt.us/4zsmKfO (2%, $11.78/sale) — generated in Creator Nov 18.
- **Decision note:** the in-stock Jackery HomePower 1000 v2 ($549, 1,024 Wh, listing 21351753268, link https://walmrt.us/4zUu5Wo) was offered as a swap and DECLINED by Tyler Nov 18 — keep the Explorer 1000 v2. The HomePower link is recorded here only and is NOT on the site.
- **Best fit:** quiet indoor-safe backup.

### Researched but EXCLUDED (not in the roster)
- **Champion 200988** (4,500W dual fuel inverter): specs verified from the manufacturer (4,500 peak / 3,500 running gas; 4,500 / 3,150 propane; 61 dBA; 14h gas / 21h propane at 25%; 99.2 lb) — but NO live Walmart listing or current price could be confirmed anywhere (Ordinary Prepper, Nov 1, 2026, also could not verify a price). Excluded per the "only models with a live Walmart listing" rule.
- **Westinghouse iGen12000DFc** (12,000 peak / 9,000 running, $1,899, listing 5255290485): search crawl showed OUT OF STOCK. Excluded — roster lists buyable models only.

## Tests run (Nov 18, 2026)

**Finder JS — node, real script extracted from the file (`/tmp/test-finder-v2.js`): 48/48 PASS (re-run after the Nov 18 live re-check update)**
- Unanswered → "Answer all 3 questions first" (0 cards)
- essentials / gas / around $1,000 → 3 options, best match iGen4500DF
- essentials / either / over $1,000 → 3 options, best match iGen4500DF
- essentials / gas / under $500 → "Under $500 — nothing fits yet", 0 options (was 2 before the iGen2200 removal)
- small / gas / under $500 → "Small loads — one honest option", 1 option (Jackery, flagged out of stock)
- small / solar / around $1,000 → 1 option (Jackery)
- essentials / solar / around $1,000 → 1 option (Jackery)
- whole / gas / over $1,000 → "Whole-home backup", 2 options, best match WGen9500DF
- whole / either / around $1,000 → 2 options, best match WGen9500DF
- Content checks: $949, 4.7 stars / 8,781 ratings, walmrt.us/4t4whs1, youtube.com/watch?v=CT9JMiGgqgg, "Review coming", $799, $999, "Best match:", 4.8 stars from 26,307 ratings, walmrt.us/4kiUs3z, walmrt.us/4zq3W0w, 4.8 stars from 1,164 ratings, "Out of stock", "In stock" all present in the essentials result; solar result contains $589, 1,060 Wh, walmrt.us/4zsmKfO, 4.9 stars from 299 ratings, "Out of stock"; under-$500 result states honestly that nothing fits.
- Stale-figure checks: no rendered result contains 15,771, 1,070, $559, iGen2200, 15.98, or 1,024.

**HTML validation (Python html.parser):** all 3 pages well-formed, no unclosed/unmatched tags (re-checked after the update).

**Internal links:** all resolve to files in the site (/, /compare/, /generator-finder/, /styles.css).

**External-link audit:** only garagereviews.us, walmart.com, walmrt.us, youtube.com, instagram.com, pinterest.com, sweatyyetisauna.com, zc.vg. **No Amazon links anywhere** (grep-verified across all site files). No eBay links — none exist yet.

**Stale-figure grep (after the update):** no occurrences of 15,771, $559, 1,070 Wh, 1,024 Wh, iGen2200, 15.98, or business.walmart.com in any site file (index.html, compare/index.html, generator-finder/index.html, styles.css, sitemap.xml) — CLEAN.

## Nov 18 update — review pages + best-of page (WattRoster model build-out)

Five new pages built Nov 18 (all figures from the verified Nov 18 live re-check + the EPN link check the same morning; no new figures invented):
- 4 per-model review pages under `reviews/` — iGen4500DF (video embedded), WGen9500DF, iGen4000DFc (OOS flag), Jackery Explorer 1000 v2 (Walmart OOS + eBay $529.99 in-stock second option). Each has canonical URL, breadcrumb, FTC disclosure near the buy buttons, specs table, pros/cons, FAQ.
- `best-dual-fuel-generators-under-1000/` — the three dual-fuel models under $1,000 ranked (#1 iGen4500DF, #2 WGen9500DF, #3 iGen4000DFc) with a comparison table.
- Homepage + compare table model names now link to their review pages; the best-of page links from the homepage (Around $1,000 card + "Always on" row).
- Sitemap now lists 8 URLs.
- eBay link used (Jackery only): campid 5338434176 (EPN Default Campaign, 1%–4%). The WGen9500DF eBay link ($1,440.93) is NOT featured — worse than Walmart $999. No iGen2200 page — dropped from the roster (its only eBay listing is local-pickup-only).

## Still owed (updated Nov 18, after the review-page build-out)

1. **Video reviews for 3 models** — WGen9500DF, iGen4000DFc, Jackery Explorer 1000 v2 have no video yet; their pages say "Video review coming." The daily garage loop films them in turn.
2. **Domain wiring** — Tyler BOUGHT garagereviews.us Nov 18 ($6.50/yr Cloudflare). Still to do: create a repo for the site, connect Cloudflare Pages, and 301-redirect granthcaldwell.com/garage/ → garagereviews.us (keep the old hub live until the redirect is in place; Pinterest pins point at the old hub).
3. **Champion 200988** — re-check Walmart presence later; if a live listing appears, add it as the direct iGen4500DF rival (it is the natural second review in that class).
4. **Roster growth** — the daily garage loop adds one reviewed row per day; each new review gets a "Reviewed" badge + video link, and the finder grows with it. Under-$500 and over-$1,000 budget bands are empty on purpose until a model lands there. The iGen4000DFc and Jackery are out of stock — re-check their stock on the next price sweep before relying on them in a "buy now" context.

## Nov 18 redesign v3 — cleaner, glossier look + real product photos (WattRoster style)

Look-and-images pass only — no figures, prices, ratings, stock states, links, canonicals, disclosures, JSON-LD, or sitemap entries changed. generator-finder/ untouched.

**Design system (generic, reusable — not generator-specific in structure):** the components are named for any product category, so the next category reuses them without a rebuild: `.product-img` (image panel on cards), `.product-hero` (image + key facts on review/ranked pages), `.spec-big` (headline value + label stats), `.spec-list` (short bullets), `.thumb` (compare-table thumbnails), `.video-embed`, and the softened quiz pieces (`fieldset`, `.option-card`, `.quiz-submit`).
- Soft 1px borders + layered shadows replace the heavy 2px black card borders; cards lift slightly on hover.
- Page background is a subtle soft gradient (white → off-white → pale warm gray), fixed.
- Glossy touches: gradient primary buttons/badges (orange, green), soft shadows, inset top highlights.
- More whitespace, larger price/spec type; h2/h3 no longer all-caps (h1 and the header brand lockup stay uppercase).
- Mobile: product hero stacks to one column, spec numbers shrink, thumbs shrink.

**Product photos (all REAL, visually verified as the correct model; no AI images):**
- iGen4500DF — https://i.ebayimg.com/images/g/p0MAAOSwozNm2Lta/s-l1600.jpg (1500×1207, side view, "iGen4500DF DUAL FUEL" legible). Hotlinked; preflighted 200 with a garagereviews.us referer.
- WGen9500DF — https://generatorbible.com/wp-content/uploads/Westinghouse-WGen9500DF-1.jpg (1200×864, panel reads "WGen9500DF", 9500/12500 + 8500/11200). Hotlinked; preflighted 200.
- iGen4000DFc — https://westinghouse.com/cdn/shop/files/iGen4000DFc-HEROR_2130e00a-60ec-4aba-99c6-dbf4476d7735_1440x.jpg?v=1739908137 (1440×1440, manufacturer's own CDN hero, side reads "iGen4000DFc Dual Fuel", CO sensor visible). Hotlinked; preflighted 200.
- Jackery Explorer 1000 v2 — https://de.jackery.com/cdn/shop/files/Explorer1000v2TragbarePowerstation_6.png?v=1722245525&width=650 (650×433, manufacturer's own CDN, "Jackery Explorer 1000" badge; verified clean on a white background). Hotlinked; preflighted 200. (A closer 768×768 retailer shot was verified too but not used — its host filename contains "1070wh", which would read as the stale figure.)
- Hosting route: hotlink (no binaries in the repo — the github push-files CLI is text-only, so no image files were pushed). Each URL was fetched with a cross-origin referer and visually inspected before use. If any host later blocks hotlinking, the fallback is to upload the same verified files via the GitHub web UI.
- Walmart's own listing pages block direct fetches (bot check), so images came from the manufacturer's CDN (2 models) and retailer/review-site product photos (2 models) — never from a different model, never AI-generated.

**Where photos appear:** homepage pick cards (job bands + solar card + latest review) and short-list table; compare-table rows; each review page's product hero; each ranked entry on the best-dual-fuel page + its side-by-side table.

**Validation (after the redesign):** all 8 HTML pages well-formed (python html.parser); stale-figure grep CLEAN (15,771, $559, 1,070, 1,024, iGen2200, 15.98, business.walmart.com, amazon); eBay links unchanged (homepage 2, compare 1, Jackery review 1, everywhere else 0); iGen4000DFc OUT OF STOCK flag + "Buy the iGen4500DF instead" button intact; iGen4500DF video embed intact (class-based now, same video).

## Nov 18 redesign v3b — 3-retailer buy-button row (Tyler steer)

Layout-only addition, no new retailer links: a generic `.buy-row` flex component in styles.css holds up to 3 retailer buttons (Walmart / eBay / Home Depot or Lowe's) — buttons share the row on wide screens and stack on narrow ones; a single button still fills the row. Applied to every retailer buy-button area: homepage pick cards (5 rows incl. the Jackery Walmart+eBay pairs), each of the 4 review pages (Jackery's eBay + Walmart pair sits in one row), and the 3 ranked entries on the best-dual-fuel page. The compare table keeps its stacked text links (a button row inside the narrow Review column would hurt readability). Home Depot / Lowe's links are NOT added in this pass — their rates are being checked separately; the row is ready for the third button when they land. No figures, links, or disclosures changed. Validation: all 8 pages well-formed; stale-figure grep CLEAN (incl. no homedepot/lowes/amazon).

## 2026-11-18 — mobile fix, AI hero, scene images + At-a-Glance cards
- Mobile bug: Tyler's screenshot showed the homepage card image at natural
  width (~1500px) with spec-big as plain text — the signature of a stale
  cached styles.css (pre-v3) served with v3 HTML. Fix: all 8 pages now link
  /styles.css?v=3 (cache-bust), image links are display:block, and a 640px
  media query caps image heights as a safety net.
- Hero: AI-generated storm-house background (original, not WattRoster's photo)
  embedded as a data URI in the homepage inline style, with a dark gradient
  overlay so the white headline stays legible on mobile and desktop.
- Review pages: real product photos composited onto an AI gravel-sunset scene
  (product pixels untouched) and embedded as data URIs; dark At-a-Glance
  card with verified numbers only (fuel bars omitted where propane watts are
  unverified — iGen4000DFc; Jackery gets capacity/output chips instead).
- No prices, ratings, links, or specs changed in this pass.

## 2026-11-18 — homepage rebuild: vision section, category tiles, in-scene images, bubbly shapes

- Vision section under the hero ("How Garage Reviews works") + 4 trust points
  (real prices checked live, a video review for every pick, no hype / no paid
  placements, honest about what we haven't done). No new claims — all from
  existing brand language; affiliate disclosure not duplicated.
- Category tiles ("Browse by category"): Generators (live, links to /compare/),
  Tools, Hunting, Health, Sauna, Cold Plunges (coming-soon, no links, gold
  "Coming soon" badge), Guides & tools (links to /generator-finder/). Each tile
  has a small AI scene image (400x225, q60, embedded as data URI). No empty
  category pages created, no dead links.
- In-scene product images everywhere: homepage cards + short-list thumbs,
  compare thumbs, best-of heroes + thumbs now use the existing scene composites
  (real product photo composited onto the AI gravel-sunset scene) as data URIs
  — 480px for cards/heroes, 160px for thumbs. No white-background product shots
  left on those pages; no external image hosts left on index/compare/best-of.
  Product pixels untouched — composites reused, not regenerated.
- Bubbly Web3 shapes (Tyler steer): pill buttons (hero CTAs, buy buttons,
  watch-video, secondary buttons, quiz submit), 22-24px radii on cards/hero/
  tiles, softer diffused shadows. Palette unchanged.
- styles.css?v=3 -> ?v=4 on all 8 pages.
- Homepage now 384KB total including all data URIs (under the 500KB aim).
- Validation: all 8 pages well-formed (python html.parser); visible-text diff
  vs live shows ZERO removals and only the 30 added vision/tile lines;
  stale-figure grep clean; headless-Chromium render at 390px (docScrollW 375,
  no page overflow) and 1280px verified by screenshot; compare tables scroll
  inside their wrapper on mobile by design. Hero, At-a-Glance cards, buy rows,
  and generator-finder/ untouched except the stylesheet version bump.
