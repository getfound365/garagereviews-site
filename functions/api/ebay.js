// Live eBay price/stock check — Pages Function for garagereviews.us
// GET /api/ebay?item=<legacy_item_id>
//   -> { ok: true, live: true, item_id, title, price_value, price_display,
//        currency, in_stock, quantity, condition, buy_url,
//        review_rating: { average_rating, review_count } | null,
//        seller_feedback: { feedback_percentage, feedback_score } | null,
//        checked_at }
//   -> { ok: false, live: false, reason, fallback: { price_display,
//        in_stock, buy_url }, review_rating: null, seller_feedback: null,
//        checked_at }   (client keeps the static text)
//
// Architecture: server-side only. The browser never sees the eBay
// credentials. The function mints an eBay application access token with the
// OAuth 2.0 client-credentials grant (POST /identity/v1/oauth2/token,
// scope https://api.ebay.com/oauth/api_scope), then calls the Browse API
// getItemByLegacyId endpoint for the one allowlisted listing. The token is
// cached in module state until shortly before it expires (~2h lifetime),
// and the GET response carries edge-cache headers (s-maxage=900) so eBay
// is never hit on every page load.
//
// Credentials: EBAY_CLIENT_ID and EBAY_CLIENT_SECRET as Pages environment
// variables (secrets) on the garagereviews-site project. They come from the
// eBay Developers Program application for the marketsolutions06 developer
// account (production keyset). No credential is stored in this repo.
// If the credentials are not set, the function returns the fallback shape
// — the site keeps showing its verified static figures and nothing breaks.
//
// Allowlist: every eBay listing linked from the site (8 items, verified
// 2026-11-19). There are no suitable eBay listings for the iGen4500DF or
// the iGen4000DFc — do not add an item here without a live, verified
// listing. Tyler's rule (2026-11-19): eBay figures come from this API,
// dates are watched, and no listing is added unless it can be updated
// easily daily — the daily deal watcher re-checks every entry here.
// The buy_url returned is the existing EPN tracked link, never eBay's raw
// itemWebUrl, so affiliate tracking is preserved.
//
// Free tier: the Browse API is free — 5,000 calls/day per application by
// default (eBay API call-limits docs). No paid tier, no billing. With the
// 15-minute edge cache and eight listings, normal traffic uses a handful of
// calls a day. If eBay ever gates production Browse access behind an
// application review for this account, the function keeps returning the
// fallback shape and the site stays correct.
//
// Never invent: on ANY failure (no credentials, token failure, API error,
// listing ended/removed, unparsable response) the function returns
// ok:false with the static verified fallback — the client leaves the
// page's existing price/stock text untouched. A live figure is only ever
// shown when it came from the Browse API in this request.

// Docs (checked 2026-11-18):
// - https://developer.ebay.com/api-docs/buy/browse/resources/item/methods/getItemByLegacyId
// - Browse API requires an Application access token (client credentials grant).
// - getItem response: price {value, currency}, estimatedAvailabilities
//   [{availabilityThreshold, estimatedAvailableQuantity,
//   estimatedSoldQuantity}], itemEndDate, title, condition, buyingOptions.
// - Item.primaryProductReviewRating: ReviewRating { averageRating (string),
//   reviewCount (integer), ratingHistograms[] } — aggregate product rating
//   only, present only when the listing is linked to an eBay catalog
//   product; absent otherwise. The Browse API exposes NO individual
//   review text — do not build for it, do not use a scraper.
// - Item.seller (SellerDetail): feedbackPercentage (string),
//   feedbackScore (integer). getItemByLegacyId returns the default field
//   set — no fieldgroups parameter is needed for these fields.

const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const BROWSE_ROOT = "https://api.ebay.com/buy/browse/v1";
const TOKEN_SCOPE = "https://api.ebay.com/oauth/api_scope";

// One entry per live eBay listing on the site. price_display / in_stock
// are the last VERIFIED static figures (Jackery Nov 18, the other seven
// Nov 19, 2026; 310CRK sold out Nov 21, 2026; DELTA 3 eBay $415 Nov 22, 2026) — used ONLY as the
// fallback when the API cannot be reached. Update them when the deal
// watcher confirms a real change.
const ALLOWLIST = {
  "840084662851": {
    name: "Jackery Explorer 1000 v2",
    price_display: "$529.99",
    in_stock: true,
    buy_url:
      "https://www.ebay.com/itm/840084662851?amdata=enc%3AAQALAAAAoCHNgUiiE%2FjQhlDTaMiAde8pxdFQG0HwwTGa1pSBEYrLM9tdeJbgLyJmRiOoKPhYolY0hbeDusQdPQ%2FHPrzc5KN9OHPQ2vSrkkwy1riURjIERHDjobDOvwKGM7cWZWb4Eihs%2BIDRVWsmLsXBmKcWBseQjJSD6ahBOGFMjdz2faKDOeP9z%2FeaaEesq37yxRRUtxuq9FKMZ6qzrhzMU87UcVM%3D&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5338434176&customid=&toolid=10001&mkevt=1",
  },
  "336903887877": {
    name: "Westinghouse iGen2800 (iGen2500 page buyable option)",
    price_display: "$344.99",
    in_stock: true,
    buy_url:
      "https://www.ebay.com/itm/336903887877?mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5338434176&customid=&toolid=10001&mkevt=1",
  },
  "146761185248": {
    name: "Pulsar G12KBN",
    price_display: "$929.99",
    in_stock: true,
    buy_url:
      "https://www.ebay.com/itm/146761185248?mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5338434176&customid=&toolid=10001&mkevt=1",
  },
  "137928316231": {
    name: "EcoFlow DELTA 3 Classical 1000",
    price_display: "$415.00",
    in_stock: true,
    buy_url:
      "https://www.ebay.com/itm/137928316231?mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5338434176&customid=&toolid=10001&mkevt=1",
  },
  "336700335243": {
    name: "Aceup Energy AI4000S",
    price_display: "$379.90",
    in_stock: true,
    buy_url:
      "https://www.ebay.com/itm/336700335243?mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5338434176&customid=&toolid=10001&mkevt=1",
  },
  "227577563937": {
    name: "WEN 4750W Generator 56475",
    price_display: "$375.00",
    in_stock: true,
    buy_url:
      "https://www.ebay.com/itm/227577563937?mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5338434176&customid=&toolid=10001&mkevt=1",
  },
  "336662232018": {
    name: "Reliance Controls 310CRK",
    price_display: "$453.99",
    in_stock: false,
    buy_url:
      "https://www.ebay.com/itm/336662232018?mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5338434176&customid=&toolid=10001&mkevt=1",
  },
  "355913039258": {
    name: "Pulsar G1200SG",
    price_display: "$179.00",
    in_stock: true,
    buy_url:
      "https://www.ebay.com/itm/355913039258?mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5338434176&customid=&toolid=10001&mkevt=1",
  },
};

// Token cache — module state, survives across requests on one isolate.
let cachedToken = null;
let cachedTokenExpiresAt = 0;

function fallback(itemId, reason) {
  const entry = ALLOWLIST[itemId];
  return Response.json(
    {
      ok: false,
      live: false,
      reason,
      item_id: itemId,
      fallback: entry
        ? {
            price_display: entry.price_display,
            in_stock: entry.in_stock,
            buy_url: entry.buy_url,
          }
        : null,
      // No review data in a fallback — the pages show nothing new, and
      // the existing Walmart rating stays exactly as it is.
      review_rating: null,
      seller_feedback: null,
      checked_at: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, max-age=0",
      },
    }
  );
}

async function getAppToken(env) {
  const clientId = env.EBAY_CLIENT_ID;
  const clientSecret = env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt) return cachedToken;

  const basic = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(TOKEN_SCOPE)}`,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || typeof data.access_token !== "string" || !data.access_token) return null;

  cachedToken = data.access_token;
  // eBay tokens live ~2h; refresh 60s early. Never trust a missing expiry.
  const ttlMs =
    typeof data.expires_in === "number" && data.expires_in > 120
      ? (data.expires_in - 60) * 1000
      : 60 * 60 * 1000;
  cachedTokenExpiresAt = now + ttlMs;
  return cachedToken;
}

// Product rating — aggregate ONLY. The Browse API exposes no individual
// review text. Returns null unless the listing is linked to a catalog
// product AND the numbers parse cleanly (average 0–5, at least 1 review).
// A missing container is normal for unlinked listings, not an error.
function parseReviewRating(item) {
  const r = item ? item.primaryProductReviewRating : null;
  if (!r || typeof r !== "object") return null;
  const avg = parseFloat(r.averageRating);
  const count = Number(r.reviewCount);
  if (!Number.isFinite(avg) || avg <= 0 || avg > 5) return null;
  if (!Number.isInteger(count) || count < 1) return null;
  return { average_rating: Math.round(avg * 10) / 10, review_count: count };
}

// Seller feedback — percentage of positive feedback + lifetime score.
// The score may be absent; the percentage alone is still usable.
function parseSellerFeedback(item) {
  const s = item ? item.seller : null;
  if (!s || typeof s !== "object") return null;
  const pct = parseFloat(s.feedbackPercentage);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) return null;
  const score = Number(s.feedbackScore);
  return {
    feedback_percentage: Math.round(pct * 10) / 10,
    feedback_score: Number.isInteger(score) && score >= 0 ? score : null,
  };
}

function parseItem(item) {
  if (!item || typeof item !== "object") return null;
  const price = item.price || {};
  const value = parseFloat(price.value);
  if (!Number.isFinite(value) || value <= 0) return null;
  const currency = typeof price.currency === "string" && price.currency ? price.currency : "USD";

  // Stock: estimatedAvailableQuantity is the remaining quantity on a
  // fixed-price listing. 0 means sold out. If the field is absent, fall
  // back to the listing end date — a past end date means it is gone.
  let inStock = null;
  let quantity = null;
  const avail = Array.isArray(item.estimatedAvailabilities) ? item.estimatedAvailabilities[0] : null;
  if (avail && typeof avail.estimatedAvailableQuantity === "number") {
    quantity = avail.estimatedAvailableQuantity;
    inStock = quantity > 0;
  }
  if (inStock === null) {
    if (typeof item.itemEndDate === "string" && item.itemEndDate) {
      inStock = new Date(item.itemEndDate).getTime() > Date.now();
    } else if (Array.isArray(item.buyingOptions) && item.buyingOptions.includes("FIXED_PRICE")) {
      inStock = true;
    }
  }
  if (inStock === null) return null; // cannot determine stock — do not guess

  return {
    title: typeof item.title === "string" ? item.title : null,
    condition: typeof item.condition === "string" ? item.condition : null,
    price_value: value,
    currency,
    price_display:
      currency === "USD"
        ? "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + currency,
    in_stock: inStock,
    quantity,
    review_rating: parseReviewRating(item),
    seller_feedback: parseSellerFeedback(item),
  };
}

async function fetchItem(env, itemId) {
  let token = await getAppToken(env);
  if (!token) return null;
  const url = `${BROWSE_ROOT}/item/get_item_by_legacy_id?legacy_item_id=${encodeURIComponent(itemId)}`;
  const init = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(8000),
  });
  let res = await fetch(url, init());
  if (res.status === 401) {
    // The cached token may have been revoked or expired early — drop it
    // and retry once with a fresh token before giving up.
    cachedToken = null;
    cachedTokenExpiresAt = 0;
    token = await getAppToken(env);
    if (!token) return null;
    res = await fetch(url, init());
  }
  return res;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "GET") {
    return Response.json({ error: "Use GET with ?item=<legacy_item_id>." }, { status: 405 });
  }

  const url = new URL(request.url);
  const itemId = (url.searchParams.get("item") || "").trim();
  if (!/^[0-9]{6,15}$/.test(itemId) || !ALLOWLIST[itemId]) {
    return Response.json(
      { ok: false, live: false, reason: "unknown_item", checked_at: new Date().toISOString() },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  // No credentials configured yet — static fallback, no eBay call at all.
  if (!env.EBAY_CLIENT_ID || !env.EBAY_CLIENT_SECRET) {
    return fallback(itemId, "not_configured");
  }

  let res;
  try {
    res = await fetchItem(env, itemId);
  } catch {
    return fallback(itemId, "api_error");
  }
  if (!res) return fallback(itemId, "token_error");
  if (!res.ok) {
    // 404 = listing ended or removed; 401/403 = token/scope problem.
    // Either way the page keeps its static figures.
    return fallback(itemId, res.status === 404 ? "listing_ended" : "api_error");
  }

  let item;
  try {
    item = await res.json();
  } catch {
    return fallback(itemId, "bad_response");
  }
  const parsed = parseItem(item);
  if (!parsed) return fallback(itemId, "bad_response");

  const entry = ALLOWLIST[itemId];
  return Response.json(
    {
      ok: true,
      live: true,
      item_id: itemId,
      title: parsed.title,
      condition: parsed.condition,
      price_value: parsed.price_value,
      currency: parsed.currency,
      price_display: parsed.price_display,
      in_stock: parsed.in_stock,
      quantity: parsed.quantity,
      // Aggregate eBay product rating + seller feedback, or null when the
      // listing carries none — the client shows nothing new in that case.
      review_rating: parsed.review_rating,
      seller_feedback: parsed.seller_feedback,
      // The EPN tracked buy link — never eBay's raw itemWebUrl.
      buy_url: entry.buy_url,
      checked_at: new Date().toISOString(),
    },
    {
      headers: {
        // Edge caches a good answer 15 min, browsers 5 min — eBay is
        // never hit on every page load.
        "Cache-Control": "public, s-maxage=900, max-age=300",
      },
    }
  );
}
