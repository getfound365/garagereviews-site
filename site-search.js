// Site search for garagereviews.us — shared by the homepage and all review pages.
// Client-side product index built from the review pages' own JSON-LD
// (names, categories, verified prices as of Nov 19–20, 2026). No prices are
// invented: a product with no verified price shows no price at all.
// As you type, a dropdown lists matching products — name (brand + model
// first), category, and price. Click a row (or arrow keys + Enter) to open
// that product's review page. Esc / click-outside / blur closes it.
(function () {
  "use strict";

  var INDEX = [
    { name: "Westinghouse iGen4500DF", url: "/reviews/westinghouse-igen4500df/", cat: "Generators", price: "$949" },
    { name: "Westinghouse WGen9500DF", url: "/reviews/westinghouse-wgen9500df/", cat: "Generators", price: "$999" },
    { name: "Westinghouse iGen4000DFc", url: "/reviews/westinghouse-igen4000dfc/", cat: "Generators", price: "$799" },
    { name: "Westinghouse WGen3600c", url: "/reviews/westinghouse-wgen3600c/", cat: "Generators", price: "$399" },
    { name: "Westinghouse iGen2500", url: "/reviews/westinghouse-igen2500/", cat: "Generators", price: "$450" },
    { name: "Pulsar G12KBN", url: "/reviews/pulsar-g12kbn/", cat: "Generators", price: "$749" },
    { name: "Pulsar G1200SG", url: "/reviews/pulsar-g1200sg/", cat: "Generators", price: "$179" },
    { name: "EcoFlow DELTA 3 Classical 1000", url: "/reviews/ecoflow-delta-3-classical-1000/", cat: "Generators", price: "$438.90" },
    { name: "Jackery Explorer 1000 v2", url: "/reviews/jackery-explorer-1000-v2/", cat: "Generators", price: "$589" },
    { name: "A-iPower GXS4300i", url: "/reviews/a-ipower-gxs4300i/", cat: "Generators", price: "$599.99" },
    { name: "Aceup Energy AI4000S", url: "/reviews/aceup-energy-ai4000s/", cat: "Generators", price: "$379.99" },
    { name: "WEN 4750W Generator 56475", url: "/reviews/wen-4750w-56475/", cat: "Generators", price: "$525" },
    { name: "WEN DF472", url: "/reviews/wen-df472/", cat: "Generators", price: "$499.52" },
    { name: "Reliance Controls 310CRK", url: "/reviews/reliance-controls-310crk/", cat: "Tools", price: "$503.79" },
    { name: "HART 52-Inch 6-Drawer Tool Chest", url: "/reviews/hart-52-tool-chest/", cat: "Tools", price: "$448.81" },
    { name: "HART 72-Inch 15-Drawer Mobile Workbench", url: "/reviews/hart-72-tool-chest/", cat: "Tools", price: "$1,498" },
    { name: "WORKPRO 48\" x 20\" Garage Workbench", url: "/reviews/workpro-48-workbench/", cat: "Workbenches", price: "$112.99" },
    { name: "Barnett Demun Tri Strike", url: "/reviews/barnett-demun-tri-strike/", cat: "Hunting", price: "$103.13" },
    { name: "Moultrie Edge 3", url: "/reviews/moultrie-edge-3/", cat: "Hunting", price: "$149.00" },
    { name: "Walsunny 12x20 Steel-Roof Carport", url: "/reviews/walsunny-12x20-carport/", cat: "Yard Equipment", price: "$519.99" },
    { name: "Patiowell 10x10 Metal Shed", url: "/reviews/patiowell-10x10-shed/", cat: "Yard Equipment", price: "$389.99" },
    { name: "EasyHawk 14x12 Steel Shed", url: "/reviews/easyhawk-shed/", cat: "Yard Equipment", price: "$450" },
    { name: "Sweaty Yeti Sauna", url: "/reviews/sweaty-yeti-sauna/", cat: "Sauna", price: "$29,700" },
    { name: "Sweaty Yeti Sauna Models Compared", url: "/reviews/sweaty-yeti-sauna-models/", cat: "Sauna", price: "From $29,700" },
    { name: "Sweaty Yeti Sauna vs Cold Plunge", url: "/reviews/sweaty-yeti-sauna-vs-cold-plunge/", cat: "Sauna", price: "$51,700" }
  ];

  var MAX_RESULTS = 7;

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function tokens(q) {
    return q.toLowerCase().split(/[^a-z0-9]+/).filter(function (t) { return t.length > 0; });
  }

  function search(q) {
    var toks = tokens(q);
    if (!toks.length) return [];
    var qLower = q.toLowerCase().trim();
    var scored = [];
    INDEX.forEach(function (p) {
      var hay = (p.name + " " + p.cat + " " + p.url).toLowerCase();
      var score = 0;
      var matched = true;
      toks.forEach(function (t) {
        if (hay.indexOf(t) === -1) { matched = false; return; }
        if (p.name.toLowerCase().indexOf(t) !== -1) score += 50;
        else if (p.cat.toLowerCase().indexOf(t) !== -1) score += 20;
        else score += 10;
      });
      if (!matched) return;
      if (p.name.toLowerCase().indexOf(qLower) === 0) score += 100;
      scored.push({ p: p, score: score });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, MAX_RESULTS).map(function (s) { return s.p; });
  }

  function init() {
    var input = document.querySelector(".site-search input[type='search']");
    var list = document.getElementById("site-search-list");
    if (!input || !list) return;
    var box = input.closest(".site-search");
    var results = [];
    var highlight = -1;
    var open = false;

    function close() {
      open = false;
      highlight = -1;
      list.hidden = true;
      list.innerHTML = "";
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }

    function render() {
      var q = input.value.trim();
      if (q.length < 2) { close(); return; }
      results = search(q);
      if (!results.length) {
        list.innerHTML = '<div class="site-search-empty">No matching reviews — try &ldquo;generator&rdquo; or <a href="/#reviews">browse all reviews &rarr;</a></div>';
        list.hidden = false;
        open = true;
        highlight = -1;
        input.setAttribute("aria-expanded", "true");
        input.removeAttribute("aria-activedescendant");
        return;
      }
      var html = "";
      results.forEach(function (p, i) {
        html += '<a class="site-search-row" id="ssr-' + i + '" role="option" aria-selected="false" href="' + esc(p.url) + '">'
          + '<span class="ss-name">' + esc(p.name) + "</span>"
          + '<span class="ss-meta">' + esc(p.cat) + (p.price ? ' &middot; <span class="ss-price">' + esc(p.price) + "</span>" : "") + "</span>"
          + "</a>";
      });
      list.innerHTML = html;
      list.hidden = false;
      open = true;
      highlight = -1;
      input.setAttribute("aria-expanded", "true");
      input.removeAttribute("aria-activedescendant");
    }

    function setHighlight(i) {
      var rows = list.querySelectorAll(".site-search-row");
      rows.forEach(function (r) { r.setAttribute("aria-selected", "false"); r.classList.remove("highlight"); });
      highlight = i;
      if (i >= 0 && rows[i]) {
        rows[i].setAttribute("aria-selected", "true");
        rows[i].classList.add("highlight");
        input.setAttribute("aria-activedescendant", rows[i].id);
      } else {
        input.removeAttribute("aria-activedescendant");
      }
    }

    function go(i) {
      if (results[i]) window.location.href = results[i].url;
    }

    input.addEventListener("input", render);
    input.addEventListener("focus", render);

    input.addEventListener("keydown", function (e) {
      if (!open) {
        if (e.key === "ArrowDown" && input.value.trim().length >= 2) { render(); if (results.length) { e.preventDefault(); setHighlight(0); } }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight(highlight + 1 >= results.length ? 0 : highlight + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight(highlight - 1 < 0 ? results.length - 1 : highlight - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        go(highlight >= 0 ? highlight : 0);
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    });

    // mousedown fires before blur, so a row click always lands.
    list.addEventListener("mousedown", function (e) {
      var row = e.target.closest(".site-search-row");
      if (row) { e.preventDefault(); window.location.href = row.getAttribute("href"); }
    });

    input.addEventListener("blur", function () {
      setTimeout(function () { if (document.activeElement !== input) close(); }, 150);
    });

    document.addEventListener("click", function (e) {
      if (box && !box.contains(e.target)) close();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
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
