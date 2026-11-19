// Buyer reviews — client script for garagereviews.us
// Included on review pages that have a Walmart listing with reviews.
// It fetches /api/reviews?item=<walmart_item_id> once and renders the
// newest reviews into the "What buyers say" section — ONLY on a live
// answer. On any failure the section keeps its static verified summary
// (rating + count from the page) and the review list stays hidden, so
// the page is never wrong and never empty.
//
// Mark-up contract (static summary is the last-verified fallback,
// always present; on a live answer the script overwrites the numbers
// with the live stats — KEEP EVERYTHING LIVE, Tyler 2026-11-18):
//   <section class="buyer-reviews" data-bv-item="299247705">
//     <h2>What buyers say</h2>
//     <p class="reviews-summary">4.7 stars from 8,821 ratings on
//       Walmart. Reviews below are from Walmart, newest first.</p>
//     <div class="reviews-list" hidden></div>
//     <p class="reviews-note" hidden></p>
//   </section>
//
// Live rating/count: any element carrying data-bv-rating="<item id>"
// or data-bv-count="<item id"> (verdict line, At-a-Glance) is updated
// with the live average/count on a live answer, so the numbers the
// visitor sees are never more than one page load old. The static text
// stays as the fallback when the API is unreachable. JSON-LD keeps the
// build-time figures (it is a snapshot by nature) and is refreshed by
// the daily rebuild when the deal watcher confirms a change.
//
// The list is filled with one <blockquote> per review: title (when the
// buyer wrote one), star rating, text exactly as written, author + date.
// Reviews arrive newest-first from the API, which gives a natural mix
// of ratings — nothing is cherry-picked. The section is labelled
// "Reviews from Walmart" so the source is never ambiguous.

(function () {
  function starLine(rating) {
    var full = Math.round(rating);
    var stars = "";
    for (var i = 0; i < 5; i++) stars += i < full ? "★" : "☆";
    return stars + " " + rating + "/5";
  }

  function formatDate(isoDate) {
    if (!isoDate) return "";
    var parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    var months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    var m = Number(parts[1]);
    var d = Number(parts[2]);
    if (!m || m < 1 || m > 12 || !d) return isoDate;
    return months[m - 1] + " " + d + ", " + parts[0];
  }

  function renderReview(r) {
    var quote = document.createElement("blockquote");
    quote.className = "buyer-review";
    if (r.title) {
      var title = document.createElement("p");
      title.className = "buyer-review-title";
      title.textContent = r.title;
      quote.appendChild(title);
    }
    var stars = document.createElement("p");
    stars.className = "buyer-review-stars";
    stars.textContent = starLine(r.rating);
    quote.appendChild(stars);
    var text = document.createElement("p");
    text.className = "buyer-review-text";
    text.textContent = r.text;
    quote.appendChild(text);
    var meta = document.createElement("footer");
    var author = r.author || "Walmart customer";
    var when = formatDate(r.date);
    meta.textContent = "— " + author + (when ? ", " + when : "");
    quote.appendChild(meta);
    return quote;
  }

  function init() {
    var sections = document.querySelectorAll("[data-bv-item]");
    if (!sections.length) return;

    sections.forEach(function (section) {
      var itemId = section.getAttribute("data-bv-item");
      if (!itemId) return;
      var list = section.querySelector(".reviews-list");
      var note = section.querySelector(".reviews-note");
      if (!list) return;

      fetch("/api/reviews?item=" + encodeURIComponent(itemId) + "&limit=5", {
        credentials: "same-origin",
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          // Only a live API answer may add reviews. Anything else —
          // API error, no reviews, listing without reviews — leaves
          // the static verified summary exactly as it is.
          if (!data || data.ok !== true || data.live !== true) return;
          if (!Array.isArray(data.reviews) || !data.reviews.length) return;
          data.reviews.forEach(function (r) {
            list.appendChild(renderReview(r));
          });
          list.hidden = false;
          // Liveness (Tyler 2026-11-18: KEEP EVERYTHING LIVE): the
          // rating/count the visitor sees comes from this live stats
          // call, not the build-time number — BUT only when Bazaarvoice
          // actually tracks what shoppers see. On some listings BV
          // counts a small subset of the reviews Walmart's product
          // page shows (Jackery: BV 6 vs PDP 299; HART 52: BV 23 vs
          // PDP ~70), and overwriting the PDP figure with the BV
          // subset would show a WRONG rating. Pages where build-time
          // BV diverged from PDP carry data-bv-live-stats="false":
          // the review list still renders, but the static verified
          // PDP summary/rating/count is left untouched.
          if (
            section.getAttribute("data-bv-live-stats") !== "false" &&
            typeof data.average_rating === "number" &&
            typeof data.total_reviews === "number"
          ) {
            var avgText = data.average_rating.toFixed(1);
            var countText = Number(data.total_reviews).toLocaleString("en-US");
            var summary = section.querySelector(".reviews-summary");
            if (summary) {
              summary.textContent =
                avgText +
                " stars from " +
                countText +
                " ratings on Walmart. Reviews below are from Walmart, newest first.";
            }
            document
              .querySelectorAll('[data-bv-rating="' + itemId + '"]')
              .forEach(function (el) {
                el.textContent = avgText;
              });
            document
              .querySelectorAll('[data-bv-count="' + itemId + '"]')
              .forEach(function (el) {
                el.textContent = countText;
              });
          }
          if (note) {
            // When live stats are gated off (BV diverges from the PDP
            // figure), the BV total would contradict the verified PDP
            // summary above it — so state how many reviews are shown
            // without the BV total.
            if (section.getAttribute("data-bv-live-stats") === "false") {
              note.textContent =
                "Showing the " +
                data.reviews.length +
                " newest reviews on Walmart. Reviews are buyers' own words.";
            } else {
              note.textContent =
                "Showing the " +
                data.reviews.length +
                " newest of " +
                Number(data.total_reviews).toLocaleString("en-US") +
                " reviews on Walmart. Reviews are buyers' own words.";
            }
            note.hidden = false;
          }
        })
        .catch(function () {
          // Network failure: static summary stays. Nothing to do.
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
