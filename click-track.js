// Click + view tracking for garagereviews.us buy links.
// Standalone copy — the same code is appended to /site-search.js, which
// covers most review pages; this file is for pages without site-search.js.
// Guard prevents double-counting if both ever load on one page.
// Sends only: page path + link URL + retailer. No personal data, no cookies.
// Uses navigator.sendBeacon so navigation is never delayed.
(function () {
  'use strict';
  if (window.__grClickTrack) return;
  window.__grClickTrack = true;

  var EP = '/api/click';

  function retailerOf(href, a) {
    var h = href.toLowerCase();
    if (h.indexOf('walmrt.us') !== -1 || h.indexOf('walmart.com') !== -1) return 'Walmart';
    if (h.indexOf('amazon.com') !== -1 || h.indexOf('amzn.to') !== -1) return 'Amazon';
    if (h.indexOf('ebay.com') !== -1) return 'eBay';
    if (h.indexOf('sweatyyetisauna.com') !== -1) return 'Sweaty Yeti';
    if (h.indexOf('saunacloud.com') !== -1) return 'SaunaCloud';
    // Any other link sitting on a buy button counts, labelled by its domain.
    if (a && a.closest && a.closest('.buy-row, .buy-button, .sticky-buy, [data-buy]')) {
      try { return new URL(href).hostname.replace(/^www\./, ''); }
      catch (e) { return 'Other'; }
    }
    return null;
  }

  function send(payload) {
    try {
      var body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(EP, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(EP, { method: 'POST', body: body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(function () {});
      }
    } catch (e) { /* tracking must never break the page */ }
  }

  // One view event per page load — the CTR denominator.
  send({ t: 'v', p: location.pathname });

  // Delegated, capture phase: fires before navigation; sendBeacon survives it.
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    var a = null;
    try { a = t && t.closest ? t.closest('a[href]') : null; } catch (e) { a = null; }
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!/^https?:\/\//i.test(href)) return;
    var r = retailerOf(href, a);
    if (!r) return; // not an affiliate/monetized link (e.g. social icons)
    send({ t: 'c', p: location.pathname, u: href, r: r });
  }, true);
})();
