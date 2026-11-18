// Live eBay price/stock — client script for garagereviews.us
// Included on pages that show an eBay listing (Jackery review, Compare,
// homepage). It fetches /api/ebay?item=<id> once per item id on the page
// and updates the price/stock spans — ONLY when the API returns a live
// answer. On any failure (no credentials yet, API down, listing ended)
// it does nothing: the page keeps its verified static figures, which is
// the correct fallback. It never rewrites a buy link and never invents
// a price.
//
// Mark-up contract (static text is the fallback, always present):
//   <span data-ebay-price="840084662851">$529.99</span>
//   <span data-ebay-stock="840084662851">in stock</span>
//   <small data-ebay-status="840084662851" hidden>…</small>  (optional;
//   shown only on a live answer, as "Live price checked just now")
//   <small data-ebay-rating="840084662851" hidden></small>  (optional;
//   shown only on a live answer WITH a product rating, as
//   "4.9★ (299 eBay reviews)")
//   <small data-ebay-seller="840084662851" hidden></small>  (optional;
//   shown only on a live answer WITH seller feedback, as
//   "Seller 99.5% positive · 12,345 feedback")
//
// The rating is the eBay catalog product's aggregate rating only — the
// Browse API exposes no individual review text. When the listing is not
// linked to a catalog product the API returns no rating and these
// elements stay hidden; the page's existing Walmart rating is untouched.

(function () {
  function formatPrice(value, currency) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency || "USD",
      }).format(value);
    } catch {
      return "$" + Number(value).toFixed(2);
    }
  }

  function applyLive(itemId, data) {
    var priceEls = document.querySelectorAll('[data-ebay-price="' + itemId + '"]');
    var stockEls = document.querySelectorAll('[data-ebay-stock="' + itemId + '"]');
    var statusEls = document.querySelectorAll('[data-ebay-status="' + itemId + '"]');
    var ratingEls = document.querySelectorAll('[data-ebay-rating="' + itemId + '"]');
    var sellerEls = document.querySelectorAll('[data-ebay-seller="' + itemId + '"]');

    priceEls.forEach(function (el) {
      el.textContent = data.price_display || formatPrice(data.price_value, data.currency);
    });
    stockEls.forEach(function (el) {
      el.textContent = data.in_stock ? "in stock" : "out of stock";
    });
    statusEls.forEach(function (el) {
      el.textContent = data.in_stock
        ? "Live price checked just now · eBay"
        : "Live check just now: out of stock on eBay";
      el.hidden = false;
    });
    // Aggregate product rating — only when the API actually returned one.
    // A null rating (listing not linked to a catalog product) leaves these
    // elements hidden and the page's existing rating text untouched.
    var rr = data.review_rating;
    if (rr && typeof rr.average_rating === "number" && typeof rr.review_count === "number") {
      ratingEls.forEach(function (el) {
        el.textContent =
          rr.average_rating.toFixed(1) + "★ (" + rr.review_count.toLocaleString("en-US") + " eBay reviews)";
        el.hidden = false;
      });
    }
    var sf = data.seller_feedback;
    if (sf && typeof sf.feedback_percentage === "number") {
      var sellerText = "Seller " + sf.feedback_percentage.toFixed(1) + "% positive";
      if (typeof sf.feedback_score === "number") {
        sellerText += " · " + sf.feedback_score.toLocaleString("en-US") + " feedback";
      }
      sellerEls.forEach(function (el) {
        el.textContent = sellerText;
        el.hidden = false;
      });
    }
  }

  function init() {
    var ids = new Set();
    document.querySelectorAll("[data-ebay-price], [data-ebay-stock], [data-ebay-rating], [data-ebay-seller]").forEach(function (el) {
      var id =
        el.getAttribute("data-ebay-price") ||
        el.getAttribute("data-ebay-stock") ||
        el.getAttribute("data-ebay-rating") ||
        el.getAttribute("data-ebay-seller");
      if (id) ids.add(id);
    });
    if (!ids.size) return;

    ids.forEach(function (itemId) {
      fetch("/api/ebay?item=" + encodeURIComponent(itemId), { credentials: "same-origin" })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          // Only a live API answer may change the page. Anything else —
          // not configured, API error, listing ended — leaves the static
          // verified figures exactly as they are.
          if (data && data.ok === true && data.live === true) applyLive(itemId, data);
        })
        .catch(function () {
          // Network failure: static fallback stays. Nothing to do.
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
