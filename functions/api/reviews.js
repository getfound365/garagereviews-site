// Buyer reviews — Pages Function for garagereviews.us
// GET /api/reviews?item=<walmart_item_id>&limit=<1-10, default 5>
//   -> { ok: true, live: true, item_id, average_rating, total_reviews,
//        reviews: [{ title, text, rating, author, date, syndicated }],
//        checked_at }
//   -> { ok: false, live: false, reason, checked_at }
//      (client keeps the page's static verified rating/count text and
//      leaves the review list hidden)
//
// Architecture: server-side only. The function reads Walmart's reviews
// through Bazaarvoice's Conversations API — Walmart's reviews run on
// Bazaarvoice, and the read-only display key below is the public key
// shipped in Walmart's own public JavaScript config
// (apps.bazaarvoice.com/deployments/walmart/main_site/production/en_US/
// ratings-config.js, "mprsAPIKey"). It is NOT a secret: every visitor's
// browser receives it, and it can only read public review data. It may
// be overridden with a BV_PASSKEY Pages environment variable; the
// hard-coded value is the fallback so the function works with no setup.
//
// Two Bazaarvoice calls, made in parallel:
//   - reviews.json?filter=productid:<id>&sort=SubmissionTime:desc
//     returns the newest reviews first (title, text, rating, author,
//     date). Ratings-only reviews (no text) are filtered out.
//   - statistics.json?filter=ProductId:<id> returns the aggregate
//     AverageOverallRating + TotalReviewCount for the listing.
// The newest-first sort is deliberate: it shows a natural mix of ratings
// instead of cherry-picked 5-star reviews. Review text is returned
// exactly as buyers wrote it, with author + date; the client renders it
// with attribution "Reviews from Walmart".
//
// Limits, verified 2026-11-18: Bazaarvoice's Conversations API exposes
// NO per-review "verified purchase" flag on these records (the Badges
// object is empty), so none is shown. Review counts here include reviews
// syndicated from the manufacturer's own site (SourceClient), which is
// why the total can run slightly above the count Walmart's page shows.
// Free, no billing, no account: the display API needs no auth beyond the
// public passkey. With the edge cache below, normal traffic makes a
// handful of Bazaarvoice calls a day.
//
// Never invent: on ANY failure (bad item id, API error, unparsable
// response, no reviews with text) the function returns ok:false and the
// page shows nothing new. A review is only ever shown when it came from
// Bazaarvoice in this request. Products without a Walmart listing get no
// reviews section at all — do not wire one.

const BV_ROOT = "https://api.bazaarvoice.com/data";
// Walmart's public read-only Bazaarvoice display key (see header).
// Public by design — shipped in Walmart's own public JS config.
const BV_PASSKEY_FALLBACK = "3eg76rmghu221u0icpolu8lup";
const API_VERSION = "5.4";

function bvPasskey(env) {
  return typeof env.BV_PASSKEY === "string" && env.BV_PASSKEY
    ? env.BV_PASSKEY
    : BV_PASSKEY_FALLBACK;
}

function fail(reason, itemId) {
  return Response.json(
    {
      ok: false,
      live: false,
      reason,
      item_id: itemId || null,
      checked_at: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "public, s-maxage=60, max-age=0" } }
  );
}

function bvUrl(passkey, endpoint, itemId, limit) {
  const base =
    `${BV_ROOT}/${endpoint}.json?passkey=${encodeURIComponent(passkey)}` +
    `&apiversion=${API_VERSION}`;
  if (endpoint === "reviews") {
    return (
      `${base}&filter=productid:${encodeURIComponent(itemId)}` +
      `&sort=SubmissionTime:desc&limit=${limit}`
    );
  }
  return `${base}&stats=Reviews&filter=ProductId:${encodeURIComponent(itemId)}`;
}

// One review, exactly as the buyer wrote it. Ratings-only records (no
// text) are dropped — a stars-only row adds nothing to the page.
function parseReview(r) {
  if (!r || typeof r !== "object") return null;
  const text = typeof r.ReviewText === "string" ? r.ReviewText.trim() : "";
  if (!text) return null;
  const rating = Number(r.Rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return null;
  const date =
    typeof r.SubmissionTime === "string" && r.SubmissionTime
      ? r.SubmissionTime.slice(0, 10)
      : null;
  return {
    title: typeof r.Title === "string" && r.Title.trim() ? r.Title.trim() : null,
    text,
    rating,
    author:
      typeof r.UserNickname === "string" && r.UserNickname.trim()
        ? r.UserNickname.trim()
        : "Walmart customer",
    date,
    syndicated: r.IsSyndicated === true,
  };
}

// Aggregate stats: average (1 decimal) + total count, or null when the
// listing carries no review statistics at all.
function parseStats(data) {
  const res = data && Array.isArray(data.Results) ? data.Results[0] : null;
  const stats =
    res && res.ProductStatistics && res.ProductStatistics.ReviewStatistics
      ? res.ProductStatistics.ReviewStatistics
      : null;
  if (!stats || typeof stats !== "object") return null;
  const avg = parseFloat(stats.AverageOverallRating);
  const count = Number(stats.TotalReviewCount);
  if (!Number.isFinite(avg) || avg <= 0 || avg > 5) return null;
  if (!Number.isInteger(count) || count < 0) return null;
  return { average_rating: Math.round(avg * 10) / 10, total_reviews: count };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "GET") {
    return Response.json({ error: "Use GET with ?item=<walmart_item_id>." }, { status: 405 });
  }

  const url = new URL(request.url);
  const itemId = (url.searchParams.get("item") || "").trim();
  if (!/^[0-9]{6,15}$/.test(itemId)) {
    return Response.json(
      { ok: false, live: false, reason: "unknown_item", checked_at: new Date().toISOString() },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
  let limit = Number(url.searchParams.get("limit"));
  if (!Number.isInteger(limit) || limit < 1) limit = 5;
  if (limit > 10) limit = 10;

  const passkey = bvPasskey(env);
  let reviewsRes;
  let statsRes;
  try {
    [reviewsRes, statsRes] = await Promise.all([
      fetch(bvUrl(passkey, "reviews", itemId, limit), {
        signal: AbortSignal.timeout(8000),
      }),
      fetch(bvUrl(passkey, "statistics", itemId, limit), {
        signal: AbortSignal.timeout(8000),
      }),
    ]);
  } catch {
    return fail("api_error", itemId);
  }
  if (!reviewsRes.ok || !statsRes.ok) return fail("api_error", itemId);

  let reviewsData;
  let statsData;
  try {
    reviewsData = await reviewsRes.json();
    statsData = await statsRes.json();
  } catch {
    return fail("bad_response", itemId);
  }
  if (!reviewsData || reviewsData.HasErrors || !Array.isArray(reviewsData.Results)) {
    return fail("bad_response", itemId);
  }

  const reviews = reviewsData.Results.map(parseReview).filter(Boolean);
  if (!reviews.length) return fail("no_reviews", itemId);
  const stats = parseStats(statsData);
  if (!stats) return fail("no_reviews", itemId);

  return Response.json(
    {
      ok: true,
      live: true,
      item_id: itemId,
      average_rating: stats.average_rating,
      total_reviews: stats.total_reviews,
      reviews,
      checked_at: new Date().toISOString(),
    },
    {
      headers: {
        // Edge caches a good answer 1h, browsers 10 min — Bazaarvoice
        // is never hit on every page load. Reviews change slowly.
        "Cache-Control": "public, s-maxage=3600, max-age=600",
      },
    }
  );
}
