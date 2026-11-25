// Conversational generator matcher — Pages Function for garagereviews.us
// POST /api/match  { "query": "backup for my sump pump, quiet, under $800" }
//   -> { needs, parsed_by: "ai" | "keywords", picks: [...], note }
//
// Architecture: Workers AI (env.AI) ONLY parses the visitor's plain words
// into structured needs. Matching is DETERMINISTIC against the verified
// roster below — the AI never invents specs, prices, or ratings, and the
// reasons shown to the visitor are built from roster fields only.
// If env.AI is not bound yet (Feature-1 worker owns the binding) or the AI
// call fails, a keyword parser produces the same needs shape, so the
// matcher still works — it just says so in `parsed_by`.
//
// Model: @cf/meta/llama-3.3-70b-instruct-fp8-fast — same model the Ask box
// uses (proven live). GLM 4.7-flash was tried first but is a reasoning model:
// it burns the token budget on its thinking trace and its JSON answer never
// completes inside max_tokens, so the matcher always fell back to keywords.
const MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
// chat model (docs, checked 2026-11-18; no planned-deprecation tag,
// function calling, 131,072-token context). Do NOT use
// @cf/meta/llama-3.1-8b-instruct (deprecated 2026-05-30) or its -fp8
// variant (Cloudflare docs list planned deprecation 2026-11-20).
//
// Roster verified 2026-11-18 from the live review pages in this repo
// (reviews/westinghouse-igen4500df, reviews/westinghouse-wgen9500df,
// reviews/westinghouse-igen4000dfc, reviews/jackery-explorer-1000-v2).
// Prices/stock as of Nov 18, 2026. Update the roster here AND the quiz
// in generator-finder/index.html when the roster changes.
// Nov 19, 2026: +9 models from the day's verified review pages
// (wgen3600c, igen2500, g12kbn, delta3classical1000, gxs4300i, ai4000s,
// wen4750w, g1200sg, wendf472). Prices/stock as of Nov 19, 2026.
// Nov 20, 2026: +10 models from the day's verified review pages
// (wgen9500dfc, champion201319, river2pro, jackery300v2, jackery300lifepo4,
// igen12000dfc, igen2800dfc, igen5000c, xp13000hx, igen5000). Prices/stock
// as of Nov 20, 2026. Also reconciled to the live finder: DELTA 3 $462 ->
// $438.90, wen4750w + wendf472 flipped to out of stock, g1200sg back in
// stock (all verified on the live site Nov 20, 2026).
// Nov 21, 2026: river2pro flipped to out of stock (verified live Nov 21, 2026).
// Nov 21, 2026: +5 models from the day's verified review pages
// (anker-solix-c1000x-gen2, wen-df680ix, wen-df480ix, wen-56360i,
// jackery-explorer-1000-plus-restored). Prices/stock as of Nov 21, 2026.
// Nov 22, 2026: +1 model from the day's verified review pages
// (ecoflow-river-3-plus). Price/stock as of Nov 22, 2026. RIVER 3 Plus is
// OUT OF STOCK (no buy button on the page). Capacity CONTESTED (286Wh
// maker vs 268Wh bundle name) — battery_wh uses the 286Wh maker figure
// with the dispute in the comment + fit copy; surge_w is null (1,200W
// X-Boost is per the bundle variant name only, not a verified surge
// rating); noise_dba is null ("under 30 dB" per the maker, no single
// figure verified). The other 9 Nov 22 pages are not backup-power gear
// and stay out of the matcher (KB + deal watcher only).
// Nov 23, 2026: +1 model from the day's verified review pages
// (bluetti-ac70). Price/stock as of Nov 25, 2026. AC70 is the 7,680 mAh
// $549.00 option on a shared Elite 100 Mini / AC70 listing, OUT OF STOCK;
// the $379.00 in-stock option is the Elite 100 Mini (1,004.8Wh), a different
// station — corrected Nov 25, 2026 after a variant-by-variant live read;
// the fit copy states this plainly.
// noise_dba is null — 45 dB on the review page is the Silent charging
// mode only, not a verified operating-noise figure. The other 9 Nov 23
// pages are not backup-power gear and stay out of the matcher (KB +
// deal watcher only).
// Nov 24, 2026: +3 models from the day's verified review pages
// (wgen7500dfc, jackery2000v2, pecron-f1000lfp). Prices/stock as of
// Nov 25, 2026. Jackery 2000 v2 is BACK IN STOCK (only 4 left, Nov 25) —
// rating_value/rating_count are 4.5/300 and the fit copy states the restock
// plainly with the in-stock Pecron as the smaller alternative. Its battery is 2,042Wh per Jackery (the
// bundle name says 2,036Wh — rounding difference, stated in the fit).
// noise_dba is null for both new stations (Jackery: "<30 dB" per the
// maker, 45 dB at full load — no single figure; Pecron's 25 dB IS a
// verified operating figure). The other 7 Nov 24 pages (sauna, 4 trail
// cams, tool chest, heater) are not backup-power gear and stay out of
// the matcher (KB + deal watcher only).
// Surge watts on the Anker C1000X Gen 2 are CONTESTED on the listing
// (2,400W marketing copy vs 3,000W spec table) — surge_w is null and the
// fit copy says so; the 2,000W continuous figure is the agreed number.
// The Jackery 1000 Plus bundle is a RESTORED unit of a DISCONTINUED model
// (replaced Sept 2026) — stated in its fit copy.

const ROSTER = [
  {
    id: "igen4500df",
    name: "Westinghouse iGen4500DF — Dual Fuel Inverter Generator",
    short: "iGen4500DF",
    price: 949,
    price_display: "$949",
    rating: "4.7 stars from 8,821 ratings",
    rating_value: 4.7,
    rating_count: 8821,
    stock: "in",
    stock_display: "In stock",
    fuel: "dual-fuel",
    type: "inverter",
    gas_peak_w: 4500,
    gas_running_w: 3700,
    propane_peak_w: 4050,
    propane_running_w: 3330,
    runtime_h: "up to 18 hours on gas at 25% load, 14 hours on propane",
    noise_dba: 52,
    weight_lb: 98,
    specs: "4,500 peak / 3,700 running watts on gas · 4,050 peak / 3,330 running on propane · up to 18 hours at 25% load · 52 dBA · remote start included · 98 lb",
    fit: "Fridge, lights, furnace fan and phones in an outage — exactly what this one is built for. Dual fuel means you are not stuck if one fuel runs out.",
    status: "reviewed",
    video: "https://www.youtube.com/watch?v=CT9JMiGgqgg",
    link: "https://walmrt.us/4t4whs1",
    review_url: "/reviews/westinghouse-igen4500df/",
  },
  {
    id: "wgen9500df",
    name: "Westinghouse WGen9500DF — Dual Fuel Portable Generator",
    short: "WGen9500DF",
    price: 999,
    price_display: "$999",
    rating: "4.8 stars from 26,408 ratings",
    rating_value: 4.8,
    rating_count: 26408,
    stock: "in",
    stock_display: "In stock",
    fuel: "dual-fuel",
    type: "open-frame",
    gas_peak_w: 12500,
    gas_running_w: 9500,
    propane_peak_w: 11200,
    propane_running_w: 8500,
    runtime_h: "up to 12 hours",
    noise_dba: null, // open-frame; no dBA figure verified — never invent one
    weight_lb: 211,
    specs: "12,500 peak / 9,500 running watts on gas · 11,200 peak / 8,500 running on propane · up to 12 hours · 211 lb · 120/240V with transfer-switch outlet",
    fit: "The big one — feeds a transfer switch for whole-home backup. Open-frame, so louder than an inverter, and it needs an electrician-installed connection.",
    status: "coming",
    video: null,
    link: "https://walmrt.us/4kiUs3z",
    review_url: "/reviews/westinghouse-wgen9500df/",
  },
  {
    id: "igen4000dfc",
    name: "Westinghouse iGen4000DFc — Dual Fuel Inverter Generator",
    short: "iGen4000DFc",
    price: 799,
    price_display: "$799",
    rating: "4.8 stars from 1,170 ratings",
    rating_value: 4.8,
    rating_count: 1170,
    stock: "out",
    stock_display: "Out of stock",
    fuel: "dual-fuel",
    type: "inverter",
    gas_peak_w: 4000,
    gas_running_w: 3300,
    propane_peak_w: null, // dual fuel confirmed; propane split not stated on the review page
    propane_running_w: null,
    runtime_h: "up to 7 hours on a 1.69-gal tank",
    noise_dba: null, // no dBA figure verified — never invent one
    weight_lb: null,
    specs: "4,000 peak / 3,300 running watts · dual fuel · CO sensor · remote start · TT-30R RV outlet · up to 7 hours on a 1.69-gal tank",
    fit: "The essentials pick for $150 less than the iGen4500DF — smaller tank and shorter runtime, but a CO sensor is included.",
    status: "coming",
    video: null,
    link: "https://walmrt.us/4zq3W0w",
    review_url: "/reviews/westinghouse-igen4000dfc/",
  },
  {
    id: "jackery1000v2",
    name: "Jackery Explorer 1000 v2 — Portable Power Station",
    short: "Jackery Explorer 1000 v2",
    price: 589,
    price_display: "$589",
    rating: "4.9 stars from 299 ratings",
    rating_value: 4.9,
    rating_count: 299,
    stock: "out", // Walmart listing out of stock; eBay alternative below is in stock
    stock_display: "Out of stock on Walmart",
    fuel: "solar",
    type: "power-station",
    battery_wh: 1060,
    continuous_w: 1500,
    surge_w: 3000,
    solar_input_w: 400,
    runtime_h: null,
    noise_dba: 0, // silent — no fuel, no engine
    weight_lb: 23.8,
    specs: "1,060 Wh LiFePO4 battery · 1,500W continuous / 3,000W surge · 400W solar input · 23.8 lb · charges from the wall or sun",
    fit: "No fuel, no fumes, safe indoors — runs a fridge for hours, not days. Add solar panels for longer outages. (Walmart titles this listing 'Jackery E1000AC Sand Gold 1060Wh' — same Explorer 1000 v2 unit.)",
    status: "coming",
    video: null,
    link: "https://walmrt.us/4zsmKfO",
    alt_link: "https://www.ebay.com/itm/840084662851?amdata=enc%3AAQALAAAAoCHNgUiiE%2FjQhlDTaMiAde8pxdFQG0HwwTGa1pSBEYrLM9tdeJbgLyJmRiOoKPhYolY0hbeDusQdPQ%2FHPrzc5KN9OHPQ2vSrkkwy1riURjIERHDjobDOvwKGM7cWZWb4Eihs%2BIDRVWsmLsXBmKcWBseQjJSD6ahBOGFMjdz2faKDOeP9z%2FeaaEesq37yxRRUtxuq9FKMZ6qzrhzMU87UcVM%3D&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5338434176&customid=&toolid=10001&mkevt=1",
    alt_price_display: "$529.99",
    alt_stock_display: "In stock on eBay",
    review_url: "/reviews/jackery-explorer-1000-v2/",
  },
  {
    id: "wgen3600c",
    name: "Westinghouse WGen3600c — Portable Generator",
    short: "WGen3600c",
    price: 399,
    price_display: "$399",
    rating: "4.8 stars from 4,857 ratings",
    rating_value: 4.8,
    rating_count: 4857,
    stock: "in",
    stock_display: "In stock",
    fuel: "gas",
    type: "open-frame",
    gas_peak_w: 4650,
    gas_running_w: 3600,
    propane_peak_w: null,
    propane_running_w: null,
    runtime_h: null, // runtime not confirmed from the sources reviewed — never invent one
    noise_dba: null, // noise level not confirmed from the sources reviewed
    weight_lb: null, // exact weight unverified (buyer-reported heavy)
    specs: "4,650 peak / 3,600 running watts · gas-only open-frame · 4-gal tank · TT-30R + L5-30R RV outlets · CO sensor",
    fit: "The budget essentials pick — 3,600 running watts with a CO sensor at $399 (down from $499). Open-frame, so louder than an inverter; run it outdoors, away from the house.",
    status: "coming",
    video: null,
    link: "https://walmrt.us/4kqHwsn",
    review_url: "/reviews/westinghouse-wgen3600c/",
  },
  {
    id: "igen2500",
    name: "Westinghouse iGen2500 — Inverter Generator",
    short: "iGen2500",
    price: 450,
    price_display: "$450",
    rating: "4.7 stars from 6,300 ratings",
    rating_value: 4.7,
    rating_count: 6300,
    stock: "out",
    stock_display: "Out of stock",
    fuel: "gas",
    type: "inverter",
    gas_peak_w: 2500,
    gas_running_w: 2200,
    propane_peak_w: null,
    propane_running_w: null,
    runtime_h: null, // runtime not stated on the review page — never invent one
    noise_dba: 52,
    weight_lb: 47.4,
    specs: "2,500 peak / 2,200 running watts · gas inverter · 52 dBA · 47.4 lb · parallel-ready · CO shutdown · clean power (≤3% THD)",
    fit: "The quiet, light inverter for small loads and campgrounds — 52 dBA and 47.4 lb with the deepest review pool in this batch. Out of stock at Walmart right now, so check the listing before you buy.",
    status: "coming",
    video: null,
    link: "https://walmrt.us/4zuNPz0",
    review_url: "/reviews/westinghouse-igen2500/",
  },
  {
    id: "g12kbn",
    name: "Pulsar G12KBN — Dual Fuel Portable Generator",
    short: "G12KBN",
    price: 749,
    price_display: "$749",
    rating: "4.3 stars from 596 ratings",
    rating_value: 4.3,
    rating_count: 596,
    stock: "out",
    stock_display: "Out of stock",
    fuel: "dual-fuel",
    type: "open-frame",
    gas_peak_w: 12000,
    gas_running_w: 9500,
    propane_peak_w: 10800,
    propane_running_w: 8550,
    runtime_h: null, // runtime not verified on the review page — never invent one
    noise_dba: 74,
    weight_lb: 209, // compare table: 209–214 lb, sources disagree
    specs: "12,000 peak / 9,500 running watts on gas · 10,800 peak / 8,550 running on propane · 50-amp outlet · 74 dB · 209–214 lb",
    fit: "Whole-home watts on a dual-fuel budget — 9,500 running watts and a 50-amp outlet for under $1,000. Open-frame and loud (74 dB), very heavy, and no CO shutoff — run it well away from the house. Out of stock at Walmart right now — the eBay listing at $929.99 is the buyable route.",
    status: "coming",
    video: null,
    link: "https://walmrt.us/4kpDiRS",
    review_url: "/reviews/pulsar-g12kbn/",
  },
  {
    id: "delta3classical1000",
    name: "EcoFlow DELTA 3 Classical 1000 — Portable Power Station",
    short: "DELTA 3 Classical 1000",
    price: 438.90,
    price_display: "$438.90",
    rating: "4.5 stars from 2,229 ratings",
    rating_value: 4.5,
    rating_count: 2229,
    stock: "in",
    stock_display: "In stock",
    fuel: "solar",
    type: "power-station",
    battery_wh: 1024,
    continuous_w: 1800,
    surge_w: 3600,
    solar_input_w: 500,
    runtime_h: null,
    noise_dba: 0, // silent — ≤30 dB per EcoFlow, no engine
    weight_lb: 26.7,
    specs: "1,024 Wh LiFePO4 battery · 1,800W continuous / 3,600W surge · 500W solar input · 26.7 lb · 0–80% charge in about 45 minutes",
    fit: "No fuel, no fumes, safe indoors — 1,800W of clean power in a 26.7 lb box, at $438.90 (down from $699). Runs a fridge for hours, not days; add solar panels for longer outages.",
    status: "coming",
    video: null,
    link: "https://walmrt.us/4Cahpwj",
    review_url: "/reviews/ecoflow-delta-3-classical-1000/",
  },
  {
    id: "gxs4300i",
    name: "A-iPower GXS4300i — Inverter Generator",
    short: "GXS4300i",
    price: 499.99,
    price_display: "$499.99",
    rating: "4.9 stars from 70 ratings",
    rating_value: 4.9,
    rating_count: 70,
    stock: "in",
    stock_display: "In stock",
    fuel: "gas",
    type: "inverter",
    gas_peak_w: 4300,
    gas_running_w: 3450,
    propane_peak_w: null,
    propane_running_w: null,
    runtime_h: "up to 9.5 hours at 25% load",
    noise_dba: null, // DISPUTED: 62 dB per A-iPower spec sheet (at half load) vs 52 dBA advertised on Walmart — never pick one
    weight_lb: 48.9,
    specs: "4,300 peak / 3,450 running watts · gas inverter · CO sensor · electric start · 48.9 lb · up to 9.5 hours at 25% load",
    fit: "A mid-size inverter with a CO sensor and electric start at $499.99 (down from $599.99) — but the noise figure is disputed (62 dB spec sheet vs 52 dBA listing), so do not buy it for quiet campground use on the claim alone. Thin review pool: 70 ratings.",
    status: "coming",
    video: null,
    link: "https://walmrt.us/3VG15CZ",
    review_url: "/reviews/a-ipower-gxs4300i/",
  },
  {
    id: "ai4000s",
    name: "Aceup Energy AI4000S — Inverter Generator",
    short: "AI4000S",
    price: 379.99,
    price_display: "$379.99",
    rating: "4.3 stars from 170 ratings",
    rating_value: 4.3,
    rating_count: 170,
    stock: "in",
    stock_display: "In stock",
    fuel: "gas",
    type: "inverter",
    gas_peak_w: 4000,
    gas_running_w: 3200, // Walmart listing states 3,200 running watts; the manual states 3,400 — roster uses the listing figure
    propane_peak_w: null,
    propane_running_w: null,
    runtime_h: "up to 8.5 hours at 25% load",
    noise_dba: null, // no dBA figure verified — never invent one
    weight_lb: 50.7,
    specs: "4,000 peak / 3,200 running watts (manual states 3,400) · gas inverter · CO sensor · 50.7 lb · up to 8.5 hours at 25% load",
    fit: "The cheapest in-stock inverter in this batch at $379.99 (down from $599.99) — 3,200 running watts with a CO sensor. Note the running-watts conflict: the listing says 3,200, the manual says 3,400; we use the listing figure.",
    status: "coming",
    video: null,
    link: "https://walmrt.us/3WL1Lr2",
    review_url: "/reviews/aceup-energy-ai4000s/",
  },
  {
    id: "wen4750w",
    name: "WEN 4750W Generator 56475 — Portable Generator",
    short: "4750W 56475",
    price: 525,
    price_display: "$525",
    rating: "4.3 stars from 137 ratings",
    rating_value: 4.3,
    rating_count: 137,
    stock: "out",
    stock_display: "Out of stock",
    fuel: "gas",
    type: "open-frame",
    gas_peak_w: 4750,
    gas_running_w: 3750,
    propane_peak_w: null,
    propane_running_w: null,
    runtime_h: null, // runtime not verified on the review page — never invent one
    noise_dba: null, // no dBA figure verified — never invent one
    weight_lb: null, // weight not verified on the review page — never invent one
    specs: "4,750 peak / 3,750 running watts · gas open-frame · electric start · RV-ready",
    fit: "Electric-start open-frame power for the essentials at $525 — RV-ready, but loud and heavy like every open-frame unit; run it outdoors, away from the house. Out of stock at Walmart right now, so check the listing before you buy.",
    status: "coming",
    video: null,
    link: "https://walmrt.us/4ADV3l0",
    review_url: "/reviews/wen-4750w-56475/",
  },
  {
    id: "g1200sg",
    name: "Pulsar G1200SG — Portable Generator",
    short: "G1200SG",
    price: 179,
    price_display: "$179",
    rating: "4.0 stars from 326 ratings",
    rating_value: 4.0,
    rating_count: 326,
    stock: "in",
    stock_display: "In stock",
    fuel: "gas",
    type: "open-frame",
    gas_peak_w: 1200,
    gas_running_w: 900,
    propane_peak_w: null,
    propane_running_w: null,
    runtime_h: null, // runtime conflicts across sources (5 vs 8.5 hours) — never pick one
    noise_dba: null, // noise conflicts across sources (65 vs 78 dB for sibling models) — never pick one
    weight_lb: 40, // ~40 lb per the manual
    specs: "1,200 peak / 900 running watts · 2-stroke gas — 40:1 gas/oil mix · ~40 lb · 1-gal tank · recoil start",
    fit: "The cheapest generator in this batch at $179 — a light 2-stroke for the smallest loads only, and it needs a 40:1 gas/oil mix. Back in stock at Walmart as of Nov 20, 2026.",
    status: "coming",
    video: null,
    link: "https://walmrt.us/3V5eJz8",
    review_url: "/reviews/pulsar-g1200sg/",
  },
  {
    id: "wendf472",
    name: "WEN DF472 — Dual Fuel Portable Generator",
    short: "DF472",
    price: 499.52,
    price_display: "$499.52",
    rating: "4.3 stars from 9 ratings",
    rating_value: 4.3,
    rating_count: 9,
    stock: "out",
    stock_display: "Out of stock",
    fuel: "dual-fuel",
    type: "open-frame",
    gas_peak_w: 4750,
    gas_running_w: 3800,
    propane_peak_w: 4350,
    propane_running_w: 3500,
    runtime_h: "~11 hours on gasoline at 50% load",
    noise_dba: null, // no dBA figure verified — never invent one
    weight_lb: 103.2,
    specs: "4,750 peak / 3,800 running watts on gas · 4,350 peak / 3,500 running on propane · 120/240V · 103.2 lb · recoil start only · no CO sensor listed",
    fit: "Dual fuel and 240V for the essentials at $499.52 — but recoil start only, no CO sensor listed, and a thin review pool (9 ratings), so the 4.3-star average is early, not proven. Out of stock at Walmart right now, so check the listing before you buy.",
    status: "coming",
    video: null,
    link: "https://walmrt.us/4tadlYD",
    review_url: "/reviews/wen-df472/",
  },
  {
    id: "wgen9500dfc",
    name: "Westinghouse WGen9500DFc — Dual Fuel Portable Generator",
    short: "WGen9500DFc",
    price: 1049,
    price_display: "$1,049",
    rating: "4.82 stars from 24,633 ratings", // BV product-specific count; PDP count (~48,176) is family-wide
    rating_value: 4.82,
    rating_count: 24633,
    stock: "out",
    stock_display: "Out of stock",
    fuel: "dual-fuel",
    type: "open-frame",
    gas_peak_w: 12500,
    gas_running_w: 9500,
    propane_peak_w: 11200,
    propane_running_w: 8500,
    runtime_h: "up to 12 hours on gas at 25% load",
    noise_dba: 74,
    weight_lb: 212,
    specs: "12,500 peak / 9,500 running watts on gas · 11,200 peak / 8,500 running on propane · up to 12 hours at 25% load · 74 dBA · CO sensor · transfer-switch ready · 212 lb",
    fit: "The big dual-fuel home-backup unit with a CO sensor — 9,500 running watts and a transfer-switch outlet. Out of stock at Walmart right now, so check the listing before you buy; the non-CO-sensor WGen9500DF is the in-stock sibling.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/Westinghouse-12-500-Peak-Watt-Dual-Fuel-Portable-Generator-Gas-Propane-Transfer-Switch-Ready-CO-Sensor/205592694",
    review_url: "/reviews/westinghouse-wgen9500dfc/",
  },
  {
    id: "champion201319",
    name: "Champion 201319 4500W Dual Fuel Inverter — Portable Inverter Generator",
    short: "Champion 201319",
    price: 999,
    price_display: "$999",
    rating: "4.8 stars from 200 ratings",
    rating_value: 4.8,
    rating_count: 200,
    stock: "in",
    stock_display: "In stock",
    fuel: "dual-fuel",
    type: "inverter",
    gas_peak_w: 4500,
    gas_running_w: 3500,
    propane_peak_w: 4500,
    propane_running_w: 3150,
    runtime_h: "up to 14 hours on gas at 25% load, 21 hours on propane",
    noise_dba: 61,
    weight_lb: null, // weight not published on the sources checked — never invent one
    specs: "4,500 peak / 3,500 running watts on gas · 4,500 peak / 3,150 running on propane · up to 14 hours on gas at 25% load · 61 dBA · CO Shield · TT-30R RV outlet · <3% THD",
    fit: "A quiet dual-fuel inverter for RV and essentials backup — 61 dBA with CO Shield and electric start at $999. The 3,500 running watts cover a fridge, lights, and furnace fan.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/Champion-4500-Watt-Electric-Start-Dual-Fuel-RV-Ready-Portable-Inverter-Generator-with-Quiet-Technology-and-CO-Shield/5292447369",
    review_url: "/reviews/champion-201319-4500w-dual-fuel-inverter/",
  },
  {
    id: "river2pro",
    name: "EcoFlow RIVER 2 Pro — Portable Power Station",
    short: "RIVER 2 Pro",
    price: 349,
    price_display: "$349",
    rating: "4.5 stars from 790 ratings",
    rating_value: 4.5,
    rating_count: 790,
    stock: "out",
    stock_display: "Out of stock",
    fuel: "solar",
    type: "power-station",
    battery_wh: 716, // Walmart unit is the RIVER 2 Pro 700 (716Wh) variant; the standard RIVER 2 Pro is 768Wh
    continuous_w: 800,
    surge_w: 1600,
    solar_input_w: null, // solar input not verified on the sources checked — never invent one
    runtime_h: null,
    noise_dba: 0, // silent — no fuel, no engine
    weight_lb: 18.2,
    specs: "716Wh LiFePO4 battery (Walmart RIVER 2 Pro 700 variant; standard version is 768Wh) · 800W continuous / 1,600W surge · 18.2 lb · 0–100% in about 70 minutes",
    fit: "No fuel, no fumes, safe indoors — 800W of clean power in an 18.2 lb box at $349 (down from $549 in the Black Friday sale). Runs a fridge for hours, not days; add solar panels for longer outages. Out of stock at Walmart right now, so check the listing before you buy.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/EF-EcoFlow-Portable-Power-Station-RIVER-2-Pro-700-716Wh-LFP-Battery-1600W-Solar-Generator-for-Outdoor-Home-Use/3285267150",
    review_url: "/reviews/ecoflow-river-2-pro/",
  },
  {
    id: "jackery300v2",
    name: "Jackery Explorer 300 v2 Auto Kit — Portable Power Station",
    short: "Jackery Explorer 300 v2",
    price: 198,
    price_display: "$198",
    rating: "4.4 stars from 289 ratings",
    rating_value: 4.4,
    rating_count: 289,
    stock: "out",
    stock_display: "Out of stock",
    fuel: "solar",
    type: "power-station",
    battery_wh: 288,
    continuous_w: 300,
    surge_w: 600,
    solar_input_w: null, // solar input not verified on the sources checked — never invent one
    runtime_h: null,
    noise_dba: 0, // silent — no fuel, no engine
    weight_lb: 8.1,
    specs: "288Wh LiFePO4 battery · 300W continuous / 600W surge · 8.1 lb · includes 12V auto-charging cable · charges from the wall, car, or sun",
    fit: "The smallest, lightest power station in the roster at $198 — 8.1 lb for phones, a laptop, and lights, with a 12V car-charging cable in the kit. The standalone unit is sold out at Jackery direct. Out of stock at Walmart as of Nov 23, 2026.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/Jackery-Explorer-300v2-Auto-Kit-Portable-Power-Station-with-12V-Battery-Charging-Cable/19346557265",
    review_url: "/reviews/jackery-explorer-300-v2-auto-kit/",
  },
  {
    id: "jackery300lifepo4",
    name: "Jackery Explorer 300 LiFePO4 — Portable Power Station",
    short: "Jackery Explorer 300 LiFePO4",
    price: 309,
    price_display: "$309",
    rating: "4.6 stars from 110 ratings",
    rating_value: 4.6,
    rating_count: 110,
    stock: "in",
    stock_display: "In stock",
    fuel: "solar",
    type: "power-station",
    battery_wh: 292, // Walmart titles it "E300New 290Wh" (290 vs 292Wh is rounding)
    continuous_w: 300,
    surge_w: null, // surge watts not verified on the sources checked — never invent one
    solar_input_w: null, // solar input not verified on the sources checked — never invent one
    runtime_h: null,
    noise_dba: 0, // silent — no fuel, no engine
    weight_lb: 7.5,
    specs: "292Wh LiFePO4 battery · 300W continuous · 7.5 lb · 4,000+ cycles to 70% · 100W USB-C PD · 5-year warranty",
    fit: "No fuel, no fumes, safe indoors — the lightest power station in the roster at 7.5 lb, at $309 (down from $349). Thin review base (3.53 stars from only 15 Bazaarvoice reviews), so the 4.6-star listing average is early, not proven.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/Jackery-E300New-290Wh-Portable-Power-Station-with-5m-Extension-Cord-300W-LiFePO4-Battery-for-Camping-Travel-Backup/17514002741",
    review_url: "/reviews/jackery-explorer-300-lifepo4/",
  },
  {
    id: "igen12000dfc",
    name: "Westinghouse iGen12000DFc — Dual Fuel Inverter Generator",
    short: "iGen12000DFc",
    price: 1899,
    price_display: "$1,899",
    rating: "4.8 stars from 2,293 ratings",
    rating_value: 4.8,
    rating_count: 2293,
    stock: "out",
    stock_display: "Out of stock",
    fuel: "dual-fuel",
    type: "inverter",
    gas_peak_w: 12000,
    gas_running_w: 9000,
    propane_peak_w: 11000,
    propane_running_w: 8100,
    runtime_h: "up to 19 hours on gas at 25% load, 9 hours on propane",
    noise_dba: 64,
    weight_lb: 189,
    specs: "12,000 peak / 9,000 running watts on gas · 11,000 peak / 8,100 running on propane · up to 19 hours at 25% load · 64 dBA · remote start · CO sensor · 50A outlet · 189 lb",
    fit: "Whole-home inverter watts with a CO sensor and remote start — 9,000 running watts on gas. Out of stock at Walmart right now, so check the listing before you buy.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/Westinghouse-11-000-Peak-Watt-Portable-Inverter-Generator-Dual-Fuel-Remote-Start-with-CO-Sensor/5255290485",
    review_url: "/reviews/westinghouse-igen12000dfc/",
  },
  {
    id: "igen2800dfc",
    name: "Westinghouse iGen2800DFc — Dual Fuel Inverter Generator",
    short: "iGen2800DFc",
    price: 549,
    price_display: "$549",
    rating: "4.7 stars from 5,346 ratings",
    rating_value: 4.7,
    rating_count: 5346,
    stock: "out",
    stock_display: "Out of stock",
    fuel: "dual-fuel",
    type: "inverter",
    gas_peak_w: 2800,
    gas_running_w: 2200,
    propane_peak_w: 2520,
    propane_running_w: 1980,
    runtime_h: "up to 12 hours on gas at 25% load",
    noise_dba: null, // CONTESTED: 52 dBA in marketing text vs 62 dBA at 25% load in one spec table — never pick one
    weight_lb: 45.4,
    specs: "2,800 peak / 2,200 running watts on gas · 2,520 peak / 1,980 running on propane · up to 12 hours at 25% load · CO sensor · TT-30R RV outlet · 45.4 lb · recoil start only",
    fit: "A light dual-fuel inverter for RV and camping — 45.4 lb with a CO sensor at $549. Noise is contested (52 dBA marketing vs 62 dBA in one spec table). Out of stock at Walmart right now, so check the listing before you buy.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/Westinghouse-2800-Peak-Watt-Portable-Gas-Propane-Powered-Inverter-Generator-Dual-Fuel-Parallel-Capable-with-CO-Sensor/18953253301",
    review_url: "/reviews/westinghouse-igen2800dfc/",
  },
  {
    id: "igen5000c",
    name: "Westinghouse iGen5000c — Gas Inverter Generator",
    short: "iGen5000c",
    price: 899,
    price_display: "$899",
    rating: "4.7 stars from 7,533 ratings",
    rating_value: 4.7,
    rating_count: 7533,
    stock: "in",
    stock_display: "In stock",
    fuel: "gas",
    type: "inverter",
    gas_peak_w: 5000,
    gas_running_w: 3900,
    propane_peak_w: null,
    propane_running_w: null,
    runtime_h: "up to 18 hours at 25% load, 15 hours at 50% load",
    noise_dba: 52,
    weight_lb: 105.8,
    specs: "5,000 peak / 3,900 running watts · gas inverter · CO sensor · up to 18 hours at 25% load · 52 dBA · 105.8 lb · TT-30R RV outlet",
    fit: "The essentials pick with a CO sensor — 3,900 running watts, quiet at 52 dBA, and in stock at $899. The gas-only twin without the CO sensor is $50 less.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/Westinghouse-5000-Peak-Watt-RV-Ready-Gasoline-Powered-Portable-Inverter-Generator-with-CO-Sensor/329397713",
    review_url: "/reviews/westinghouse-igen5000c/",
  },
  {
    id: "xp13000hx",
    name: "DuroMax XP13000HX — Dual Fuel Portable Generator",
    short: "XP13000HX",
    price: 1399,
    price_display: "$1,399",
    rating: "4.8 stars from 1,463 ratings",
    rating_value: 4.8,
    rating_count: 1463,
    stock: "out",
    stock_display: "Out of stock",
    fuel: "dual-fuel",
    type: "open-frame",
    gas_peak_w: 13000,
    gas_running_w: 10500,
    propane_peak_w: 12500,
    propane_running_w: 10000,
    runtime_h: "up to 17 hours on gas at 25% load, 13 hours on propane",
    noise_dba: 74,
    weight_lb: 240,
    specs: "13,000 peak / 10,500 running watts on gas · 12,500 peak / 10,000 running on propane · up to 17 hours at 25% load · 74 dB · CO Alert · 240 lb",
    fit: "The biggest dual-fuel unit in the roster — 10,500 running watts with CO Alert for whole-home backup. Out of stock at Walmart right now, so check the listing before you buy.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/DuroMax-XP13000HX-13-000-Watt-Portable-Dual-Fuel-Gas-Propane-CO-Alert-Generator/783922308",
    review_url: "/reviews/duromax-xp13000hx/",
  },
  {
    id: "igen5000",
    name: "Westinghouse iGen5000 — Gas Inverter Generator",
    short: "iGen5000",
    price: 849,
    price_display: "$849",
    rating: "4.7 stars from 16,250 ratings", // PDP count is a variant-family aggregate; BV is 7,819
    rating_value: 4.7,
    rating_count: 16250,
    stock: "in",
    stock_display: "In stock",
    fuel: "gas",
    type: "inverter",
    gas_peak_w: 5000,
    gas_running_w: 3900,
    propane_peak_w: null,
    propane_running_w: null,
    runtime_h: "up to 18 hours at 25% load, 15 hours at 50% load",
    noise_dba: 52,
    weight_lb: 104.7,
    specs: "5,000 peak / 3,900 running watts · gas inverter · up to 18 hours at 25% load · 52 dBA · 104.7 lb · TT-30R RV outlet · no CO sensor",
    fit: "The essentials pick without the CO sensor — 3,900 running watts at $849, $50 less than the iGen5000c twin that adds the sensor. Same core specs otherwise.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/Westinghouse-5000-Peak-Watt-RV-Ready-Gas-Powered-Portable-Inverter-Generator-with-Electric-Start/132513179",
    review_url: "/reviews/westinghouse-igen5000/",
  },
  {
    id: "anker-solix-c1000x-gen2",
    name: "Anker SOLIX C1000X Gen 2 — Portable Power Station",
    short: "SOLIX C1000X Gen 2",
    price: 569.99,
    price_display: "$569.99",
    rating: "4.5 stars from 55 ratings",
    rating_value: 4.5,
    rating_count: 55,
    stock: "out",
    stock_display: "Out of stock",
    fuel: "solar",
    type: "power-station",
    battery_wh: 1024,
    continuous_w: 2000,
    surge_w: null, // CONTESTED: 2,400W in the marketing copy vs 3,000W in the spec table — never pick one
    solar_input_w: null, // solar input not verified on the sources checked — never invent one
    runtime_h: null,
    noise_dba: 0, // silent — no fuel, no engine
    weight_lb: 27.12,
    specs: "1,024Wh LiFePO4 battery · 2,000W continuous · 49-minute recharge · 4,000+ cycles · 27.12 lb · charges from the wall or sun",
    fit: "No fuel, no fumes, safe indoors — 2,000W of clean power in a 27.12 lb box at $569.99 (was $799.99). Runs a fridge for hours, not days; add solar panels for longer outages. Surge watts are contested on the listing (2,400W marketing copy vs 3,000W spec table) — we use the 2,000W continuous figure, which both sources agree on. Out of stock at Walmart right now, so check the listing before you buy.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/17775762177",
    review_url: "/reviews/anker-solix-c1000x-gen-2/",
  },
  {
    id: "wen-df680ix",
    name: "WEN DF680iX — Dual Fuel Inverter Generator",
    short: "DF680iX",
    price: 798,
    price_display: "$798",
    rating: "4.1 stars from 55 ratings",
    rating_value: 4.1,
    rating_count: 55,
    stock: "out",
    stock_display: "Out of stock",
    fuel: "dual-fuel",
    type: "inverter",
    gas_peak_w: 6800,
    gas_running_w: 5100,
    propane_peak_w: 6000,
    propane_running_w: 4500,
    runtime_h: "up to 6.1 hours at half load on gas, 9 hours on propane",
    noise_dba: 64,
    weight_lb: 94.8, // spec table also lists 99.2 lb in one place — roster uses 94.8 lb from the listing
    specs: "6,800 peak / 5,100 running watts on gas · 6,000 peak / 4,500 running on propane · 224cc · 64 dB · 94.8 lb · electric start with recoil backup · up to 6.1 hours at half load",
    fit: "Dual-fuel inverter watts for the essentials — 5,100 running watts on gas at $798. Start method is contested on the listing (electric start with recoil backup in the title vs 'Pull Cord Start' in the spec table) — confirm it with WEN before you buy for someone who cannot pull-start a generator. Out of stock at Walmart right now, so check the listing before you buy.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/15322924646",
    review_url: "/reviews/wen-df680ix/",
  },
  {
    id: "wen-df480ix",
    name: "WEN DF480iX — Dual Fuel Inverter Generator",
    short: "DF480iX",
    price: 647,
    price_display: "$647",
    rating: "4.5 stars from 57 ratings",
    rating_value: 4.5,
    rating_count: 57,
    stock: "out",
    stock_display: "Out of stock",
    fuel: "dual-fuel",
    type: "inverter",
    gas_peak_w: 4800,
    gas_running_w: 4000,
    propane_peak_w: 4320,
    propane_running_w: 3600,
    runtime_h: "up to 7 hours at half load on gas, 12 hours on propane",
    noise_dba: 62,
    weight_lb: 78.5, // weight contested across sources (78.5 lb vs 91 lb) — roster uses 78.5 lb
    specs: "4,800 peak / 4,000 running watts on gas · 4,320 peak / 3,600 running on propane · 224cc · 62 dB · 78.5 lb · push-button start · up to 7 hours at half load",
    fit: "A quiet dual-fuel inverter for RV and essentials backup — 62 dB with push-button start at $647, the best-rated WEN in this batch. Consumer Reports lab-tested it and called its power 'especially clean.' Weight is contested across sources (78.5 lb vs 91 lb). Out of stock at Walmart right now, so check the listing before you buy.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/6341151320",
    review_url: "/reviews/wen-df480ix/",
  },
  {
    id: "wen-56360i",
    name: "WEN 56360i — Inverter Generator",
    short: "56360i",
    price: 440,
    price_display: "$440",
    rating: "4.7 stars from 55 ratings",
    rating_value: 4.7,
    rating_count: 55,
    stock: "out",
    stock_display: "Out of stock",
    fuel: "gas",
    type: "inverter",
    gas_peak_w: 3600,
    gas_running_w: 2900,
    propane_peak_w: null,
    propane_running_w: null,
    runtime_h: null, // CONTESTED: 3 hours in the spec table vs "up to 5 hours at half load" in the description — never pick one
    noise_dba: 65,
    weight_lb: 46,
    specs: "3,600 peak / 2,900 running watts · gas inverter · 149cc · 65 dB · 46 lb · pull-cord start · TT-30R RV outlet",
    fit: "A light gas inverter for small loads and campgrounds — 46 lb at $440 (down from $498) with clean power (under 1.2% THD). Runtime is contested on the listing (3 hours in the spec table vs up to 5 hours at half load in the description). Out of stock at Walmart right now, so check the listing before you buy.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/3686265971",
    review_url: "/reviews/wen-56360i/",
  },
  {
    id: "jackery1000plus-restored",
    name: "Jackery Explorer 1000 Plus (Restored) + 100W Mini Panel — Portable Power Station",
    short: "Explorer 1000 Plus (Restored)",
    price: 449,
    price_display: "$449",
    rating: "5.0 stars from 5 ratings",
    rating_value: 5.0,
    rating_count: 5,
    stock: "in",
    stock_display: "In stock",
    fuel: "solar",
    type: "power-station",
    battery_wh: 1264,
    continuous_w: 2000,
    surge_w: 4000,
    solar_input_w: 800,
    runtime_h: null,
    noise_dba: 0, // silent — no fuel, no engine
    weight_lb: 40,
    specs: "1,264Wh LiFePO4 battery · 2,000W continuous / 4,000W peak · 800W solar input · 40 lb · expandable to ~5kWh · includes 100W Mini solar panel",
    fit: "No fuel, no fumes, safe indoors — 2,000W of clean power with a 100W Mini solar panel in the box at $449. This is a RESTORED unit of a DISCONTINUED model (replaced Sept 2026 by the HomePower 1000 Plus v2), and delivery runs Dec 10–18 — the $449 buys the restored unit plus the panel. Runs a fridge for hours, not days; add solar panels for longer outages. Thin review base: 5 ratings, no written reviews.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/21197917802",
    review_url: "/reviews/jackery-explorer-1000-plus-restored/",
  },
  {
    id: "river3plus",
    name: "EcoFlow RIVER 3 Plus — Portable Power Station",
    short: "RIVER 3 Plus",
    price: 239,
    price_display: "From $239",
    rating: "4.6 stars from 58 ratings",
    rating_value: 4.6,
    rating_count: 58,
    stock: "out",
    stock_display: "Out of stock",
    fuel: "solar",
    type: "power-station",
    battery_wh: 286, // maker figure; the Walmart bundle name says 268Wh — print both, pick neither (see review page)
    continuous_w: 600,
    surge_w: null, // 1,200W with X-Boost is per the bundle variant name only, not a verified surge rating — never invent one
    solar_input_w: null, // solar input watts not verified on the sources checked — never invent one
    runtime_h: null,
    noise_dba: null, // "under 30 dB" per the maker — no single dBA figure verified; not silent-zero like the fanless stations
    weight_lb: 10.4,
    specs: "286Wh LiFePO4 battery (maker figure; bundle name says 268Wh) · 600W continuous (1,200W with X-Boost) · sub-10ms UPS · under 30 dB · 10.4 lb · 0–100% in 1 hour",
    fit: "No fuel, no fumes, safe indoors — 600W of clean power in a 10.4 lb box from $239, with a sub-10ms UPS for a router or CPAP through a short outage. Runs small loads for hours, not days; add solar panels for longer outages. Capacity is contested on the listing (286Wh per EcoFlow vs 268Wh in the bundle name) and the EB600 bundle named in the title has no variant or price shown. Out of stock at Walmart right now, so check the listing before you buy.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/16230373961", // verified RIVER 3 Plus item (picker + build footnote + BV confirm today). NOTE: the live review page's own "Check price" link wrongly points at the DELTA 3 item 1108904221 — build-agent fix needed; do NOT copy that link here.
    review_url: "/reviews/ecoflow-river-3-plus/",
  },
  {
    id: "bluetti-ac70",
    name: "BLUETTI AC70 — Portable Power Station",
    short: "AC70",
    price: 549,
    price_display: "$549.00",
    rating: "4.6 stars from 115 ratings",
    rating_value: 4.6,
    rating_count: 115,
    stock: "out",
    stock_display: "Out of stock",
    fuel: "solar",
    type: "power-station",
    battery_wh: 768,
    continuous_w: 1000,
    surge_w: 2000,
    solar_input_w: 500,
    runtime_h: null,
    noise_dba: null, // 45 dB on the review page is the Silent charging mode only (per BLUETTI) — no verified operating-noise figure; never guess
    weight_lb: 22.5,
    specs: "768Wh LiFePO4 battery · 1,000W continuous / 2,000W surge · 500W solar input · 22.5 lb · 850W AC input, 0–100% in about 1.5 hours (Turbo) · Silent charging mode 45 dB",
    fit: "No fuel, no fumes, safe indoors — 1,000W of clean power in a 22.5 lb box at $549.00. Shared listing with the BLUETTI Elite 100 Mini — the AC70 is the 7,680 mAh option; the $379.00 in-stock option is the Elite 100 Mini (1,004.8Wh), a different station. Runs a fridge for hours, not days; add solar panels for longer outages.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/5135434116",
    review_url: "/reviews/bluetti-ac70/",
  },
  {
    id: "wgen7500dfc",
    name: "Westinghouse WGen7500DFc — Dual Fuel Portable Generator",
    short: "WGen7500DFc",
    price: 949,
    price_display: "$949",
    rating: "4.7 stars from 6,058 ratings",
    rating_value: 4.7,
    rating_count: 6058,
    stock: "in",
    stock_display: "In stock",
    fuel: "dual-fuel",
    type: "open-frame",
    gas_peak_w: 9500,
    gas_running_w: 7500,
    propane_peak_w: 8550,
    propane_running_w: 6750,
    runtime_h: "up to 11 hours on gas at 25% load",
    noise_dba: 72,
    weight_lb: 202.1, // dry weight per Westinghouse spec table
    specs: "9,500 peak / 7,500 running watts on gas · 8,550 peak / 6,750 running on propane · up to 11 hours at 25% load · 72 dBA · CO sensor · transfer-switch ready · 202.1 lb",
    fit: "A 7,500-running-watt dual-fuel unit with a CO sensor and a 30A transfer-switch outlet at $949 — the smaller sibling of the WGen9500DF, same transfer-switch-ready setup. Open-frame, so louder than an inverter, and it needs an electrician-installed connection. Remote start included; runtime is 11 hours on gas at 25% load per Westinghouse's own spec table.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/Westinghouse-9500-Peak-Watt-Home-Backup-Dual-Fuel-Portable-Generator-Transfer-Switch-Ready-CO-Sensor/884106339",
    review_url: "/reviews/westinghouse-wgen7500dfc/",
  },
  {
    id: "jackery2000v2",
    name: "Jackery Explorer 2000 v2 — Portable Power Station",
    short: "Jackery Explorer 2000 v2",
    price: 1349,
    price_display: "$1,349",
    rating: "4.5 stars from 300 ratings",
    rating_value: 4.5,
    rating_count: 300,
    stock: "in",
    stock_display: "In stock (only 4 left)",
    fuel: "solar",
    type: "power-station",
    battery_wh: 2042, // Jackery maker figure; bundle name says 2,036Wh — rounding difference
    continuous_w: 2200,
    surge_w: 4400,
    solar_input_w: null, // bundle includes one 200W panel; solar input watts not verified on the sources checked — never invent one
    runtime_h: null,
    noise_dba: null, // "<30 dB" per the maker, 45 dB at full load — no single operating figure verified
    weight_lb: 39.5,
    specs: "2,042Wh LiFePO4 battery (maker figure; bundle name says 2,036Wh) · 2,200W continuous / 4,400W surge · <20ms UPS · under 30 dB · 39.5 lb · 0–100% in about 1.7 hours · 4,000 cycles",
    fit: "The big Jackery station — 2,200W continuous for a fridge plus more, with a sub-20ms UPS. Back in stock at Walmart as of Nov 25, 2026 — only 4 left (the $1,189 variant was out of stock as of Nov 24 and was not re-checked); the Pecron F1000LFP at $369 is the in-stock alternative for smaller loads. Jackery direct lists the unit-only version at $999 pre-order, shipping Dec 14.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/17303366024", // bare /ip/ URL — no slugged URL on the listing
    review_url: "/reviews/jackery-explorer-2000-v2/",
  },
  {
    id: "pecron-f1000lfp",
    name: "PECRON F1000LFP — Portable Power Station",
    short: "F1000LFP",
    price: 369,
    price_display: "$369",
    rating: "4.3 stars from 14 ratings",
    rating_value: 4.3,
    rating_count: 14,
    stock: "in",
    stock_display: "In stock",
    fuel: "solar",
    type: "power-station",
    battery_wh: 960,
    continuous_w: 1500,
    surge_w: 3000,
    solar_input_w: 600,
    runtime_h: null,
    noise_dba: 25,
    weight_lb: 23.9,
    specs: "960Wh LiFePO4 battery · 1,500W continuous / 3,000W surge · 600W solar input · 25 dB · 23.9 lb · 1,000W AC input, 0–80% in 50 minutes · <20ms UPS · 3,500+ cycles",
    fit: "No fuel, no fumes, safe indoors — 1,500W of clean power in a 23.9 lb box at $369 (was $399). The cheapest way into a 1,500W station in the roster; runs a fridge for hours, not days. Thin review base (4.3 stars from 14 ratings), so the rating is early, not proven.",
    status: "coming",
    video: null,
    link: "https://www.walmart.com/ip/PECRON-F1000LFP-Portable-Power-Station-960Wh-1500W-LiFePO4-Battery-Solar-Generator-BMS-UPS-Fast-Charging-Power-Backup-for-Camping-Home-Use-RV/19942953345",
    review_url: "/reviews/pecron-f1000lfp/",
  },
];

// Effective running watts for a needs check: gas running watts for fuel
// generators, continuous watts for the power station.
function effectiveWatts(m) {
  return m.type === "power-station" ? m.continuous_w : m.gas_running_w;
}

// ---------------------------------------------------------------------------
// Needs parsing
// ---------------------------------------------------------------------------

// Deterministic keyword fallback — same shape the AI returns. Used when
// env.AI is not bound yet or the AI call fails / returns bad JSON.
function parseKeywords(query) {
  const q = query.toLowerCase();
  const needs = {
    budget_max: null,
    running_watts_needed: null,
    fuel: "any", // "dual-fuel" | "solar" | "any"
    quiet: false,
    indoor: false,
    use_case: "other", // "small" | "essentials" | "whole-home" | "other"
    portable: false,
    summary: "",
  };

  // Budget: "under $800", "below 500", "max $1000", "around $900", "budget 700".
  const budgetRe = /(?:under|below|less than|at most|max(?:imum)?|around|about|budget(?: of)?|up to)\s*\$?\s*([\d,]{2,7})/;
  const bm = q.match(budgetRe);
  if (bm) needs.budget_max = parseInt(bm[1].replace(/,/g, ""), 10);

  // Explicit wattage: "3000 watts", "need 5000W".
  const wattRe = /(\d[\d,]{2,7})\s*(?:watts?|w)\b/;
  const wm = q.match(wattRe);
  if (wm) needs.running_watts_needed = parseInt(wm[1].replace(/,/g, ""), 10);

  if (/\b(solar|battery|power station|no fuel|no gas|no fumes|indoor|inside|apartment|camping|tent)\b/.test(q)) {
    needs.fuel = "solar";
  } else if (/\b(propane|dual[- ]?fuel|gas)\b/.test(q)) {
    needs.fuel = "dual-fuel";
  }
  if (/\b(indoor|inside|apartment|no fumes)\b/.test(q)) needs.indoor = true;
  if (/\b(quiet|silent|low noise|not loud|noise)\b/.test(q)) needs.quiet = true;
  if (/\b(light|lightweight|portable|carry|carryable|take (it )?with|rv|camper|camping)\b/.test(q)) needs.portable = true;

  if (/\b(whole[- ]?house|whole[- ]?home|well pump|air condition|\bac\b|central air|everything at once|entire house|entire home)\b/.test(q)) {
    needs.use_case = "whole-home";
    if (!needs.running_watts_needed) needs.running_watts_needed = 9500;
  } else if (/\b(sump pump|fridge|refrigerator|freezer|furnace|outage|power outage|backup|essentials|storm|hurricane)\b/.test(q)) {
    needs.use_case = "essentials";
    if (!needs.running_watts_needed) needs.running_watts_needed = 3300;
  } else if (/\b(phone|laptop|lights?|small|devices?|charge)\b/.test(q)) {
    needs.use_case = "small";
    if (!needs.running_watts_needed) needs.running_watts_needed = 1500;
  }

  // Solar / indoor forces a power station regardless of the use-case words.
  if (needs.fuel === "solar" || needs.indoor) {
    if (!needs.running_watts_needed) needs.running_watts_needed = 1500;
  }

  needs.summary = summarizeNeeds(needs);
  return needs;
}

function summarizeNeeds(n) {
  const parts = [];
  if (n.use_case === "whole-home") parts.push("whole-home backup");
  else if (n.use_case === "essentials") parts.push("outage essentials backup");
  else if (n.use_case === "small") parts.push("small loads");
  if (n.running_watts_needed) parts.push("about " + n.running_watts_needed.toLocaleString() + " running watts");
  if (n.budget_max) parts.push("under $" + n.budget_max.toLocaleString());
  if (n.fuel === "solar") parts.push("solar / no fuel");
  else if (n.fuel === "dual-fuel") parts.push("gas or propane");
  if (n.quiet) parts.push("quiet matters");
  if (n.indoor) parts.push("safe to run indoors");
  if (n.portable) parts.push("light enough to carry");
  return parts.length ? parts.join(" · ") : "a generator";
}

const PARSE_SYSTEM_PROMPT = [
  "You parse a visitor's plain-words description of the generator they need.",
  "Return ONLY a JSON object, no other text, with exactly these fields:",
  '{ "budget_max": number|null, "running_watts_needed": number|null, "fuel": "dual-fuel"|"solar"|"any", "quiet": boolean, "indoor": boolean, "use_case": "small"|"essentials"|"whole-home"|"other", "portable": boolean }',
  "Rules:",
  '- budget_max: the most they will pay, from phrases like "under $800" (800) or "around $1000" (1000). null if no budget is given.',
  "- running_watts_needed: running watts the job needs. Estimate from the use case when no number is given: small loads (phones, laptop, lights) 1500; outage essentials (fridge, lights, furnace fan, sump pump) 3300; whole home (well pump, AC, everything at once) 9500. Use an explicit number from the text when one is given.",
  '- fuel: "solar" when they want solar, battery, no fuel, or indoor-safe power; "dual-fuel" when they mention gas, propane, or dual fuel; otherwise "any".',
  '- quiet: true when they say quiet, silent, low noise, or not loud.',
  '- indoor: true when they say indoors, inside, apartment, or no fumes.',
  '- use_case: "small", "essentials", or "whole-home" as above; "other" if it fits none.',
  '- portable: true when they say light, lightweight, portable, carry, RV, or camping.',
  "Never add fields, never add explanations, never invent a product.",
].join("\n");

async function parseWithAI(env, query) {
  if (!env.AI) return null;
  const res = await env.AI.run(MODEL_ID, {
    messages: [
      { role: "system", content: PARSE_SYSTEM_PROMPT },
      { role: "user", content: query },
    ],
    temperature: 0.1,
    max_tokens: 300,
  });
  // GLM 4.7 is a reasoning model: its answer lands in the reasoning fields
  // with message.content null, not in res.response. Read every plausible
  // slot so a valid JSON answer is never missed.
  const msg = res && res.choices && res.choices[0] && res.choices[0].message;
  const text = (
    (res && typeof res.response === "string" && res.response) ||
    (msg && typeof msg.content === "string" && msg.content) ||
    (msg && typeof msg.reasoning_content === "string" && msg.reasoning_content) ||
    (msg && typeof msg.reasoning === "string" && msg.reasoning) ||
    ""
  ).trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  const parsed = JSON.parse(text.slice(start, end + 1));
  if (typeof parsed !== "object" || parsed === null) return null;
  return {
    budget_max: typeof parsed.budget_max === "number" && parsed.budget_max > 0 ? Math.round(parsed.budget_max) : null,
    running_watts_needed: typeof parsed.running_watts_needed === "number" && parsed.running_watts_needed > 0 ? Math.round(parsed.running_watts_needed) : null,
    fuel: ["dual-fuel", "solar", "any"].includes(parsed.fuel) ? parsed.fuel : "any",
    quiet: parsed.quiet === true,
    indoor: parsed.indoor === true,
    use_case: ["small", "essentials", "whole-home", "other"].includes(parsed.use_case) ? parsed.use_case : "other",
    portable: parsed.portable === true,
  };
}

// ---------------------------------------------------------------------------
// Deterministic matching — no AI output reaches the visitor beyond `needs`.
// ---------------------------------------------------------------------------

function matchNeeds(needs) {
  let pool = ROSTER.slice();
  const notes = [];

  // Fuel / indoor hard filters.
  if (needs.fuel === "solar" || needs.indoor) {
    pool = pool.filter((m) => m.type === "power-station");
    if (needs.indoor) notes.push("Indoor-safe means a power station — fuel generators must run outside.");
  } else if (needs.fuel === "dual-fuel") {
    pool = pool.filter((m) => m.fuel === "dual-fuel");
  }

  // Wattage hard filter — a pick must actually run the job.
  const watts = needs.running_watts_needed;
  if (watts) {
    const fitting = pool.filter((m) => effectiveWatts(m) >= watts);
    if (fitting.length) {
      pool = fitting;
    } else {
      // Nothing in the (fuel-filtered) pool can run it. Say so plainly and
      // show the strongest option as the honest "closest" pick.
      const strongest = pool.slice().sort((a, b) => effectiveWatts(b) - effectiveWatts(a))[0] || null;
      return {
        picks: strongest ? [buildPick(strongest, needs, 0, true)] : [],
        no_exact_fit: true,
        note:
          "Nothing in the roster can deliver " + watts.toLocaleString() + " running watts" +
          (needs.fuel === "solar" || needs.indoor ? " from a solar power station" : "") +
          ". The strongest option is shown below — it will not run the whole job at once.",
      };
    }
  }

  // Budget hard filter — never stretch the visitor's budget to make a sale.
  let overBudget = false;
  if (needs.budget_max) {
    const affordable = pool.filter((m) => m.price <= needs.budget_max);
    if (affordable.length) {
      pool = affordable;
    } else {
      overBudget = true;
      notes.push(
        "Nothing in the roster is under $" + needs.budget_max.toLocaleString() +
        " — every option below costs more than your budget. We would rather tell you that than stretch it."
      );
    }
  }

  // Rank the survivors: in stock first, then watts headroom, quiet, reviewed.
  const scored = pool.map((m) => {
    let score = 0;
    if (m.stock === "in") score += 30;
    else if (m.alt_link) score += 20; // buyable via the eBay alternative
    if (watts && effectiveWatts(m) >= watts * 1.25) score += 15;
    else if (watts) score += 10;
    if (needs.quiet && m.noise_dba !== null && m.noise_dba <= 60) score += 20;
    if (needs.quiet && m.type === "open-frame") score -= 20;
    // Small loads are a power-station job (same call the 3-question quiz makes).
    if (needs.use_case === "small" && m.type === "power-station") score += 25;
    if (needs.portable && m.weight_lb !== null && m.weight_lb <= 100) score += 10;
    if (needs.portable && m.weight_lb !== null && m.weight_lb <= 30) score += 10;
    if (m.status === "reviewed") score += 10;
    if (needs.budget_max && m.price <= needs.budget_max * 0.9) score += 5;
    score += Math.min(m.rating_value, 5); // tiny tiebreak on rating
    return { m, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const picks = scored.slice(0, 3).map((s, i) => buildPick(s.m, needs, i, false));

  // If the best match is out of stock with no buyable alternative, point at
  // the best in-stock option that can still do the job — even if it costs
  // more than the budget — and say so plainly.
  const bestBuyable = picks.length && (picks[0].in_stock);
  if (picks.length && !bestBuyable) {
    const shown = new Set(picks.map((p) => p.id));
    const altPool = ROSTER.filter((m) => {
      if (shown.has(m.id)) return false;
      if (needs.fuel === "solar" || needs.indoor) return m.type === "power-station";
      if (needs.fuel === "dual-fuel") return m.fuel === "dual-fuel";
      return true;
    }).filter((m) => !watts || effectiveWatts(m) >= watts)
      .filter((m) => m.stock === "in" || m.alt_link);
    if (altPool.length) {
      altPool.sort((a, b) => a.price - b.price);
      const alt = altPool[0];
      const altPick = buildPick(alt, needs, picks.length, false);
      altPick.best = false;
      altPick.alternative = true;
      altPick.reasons.unshift(
        "In-stock alternative to the out-of-stock best match" +
        (needs.budget_max && alt.price > needs.budget_max
          ? " — $" + (alt.price - needs.budget_max).toLocaleString() + " over your budget, but buyable today"
          : " — buyable today")
      );
      picks.push(altPick);
    }
  }

  return { picks, no_exact_fit: overBudget, note: notes.join(" ") || null };
}

function buildPick(m, needs, rank, isClosest) {
  const reasons = [];
  if (needs.budget_max) {
    if (m.price <= needs.budget_max) reasons.push(m.price_display + " — under your $" + needs.budget_max.toLocaleString() + " budget");
    else reasons.push(m.price_display + " — $" + (m.price - needs.budget_max).toLocaleString() + " over your $" + needs.budget_max.toLocaleString() + " budget");
  } else {
    reasons.push(m.price_display);
  }
  if (needs.running_watts_needed) {
    if (m.type === "power-station") {
      reasons.push(
        effectiveWatts(m) >= needs.running_watts_needed
          ? m.continuous_w.toLocaleString() + "W continuous covers the " + needs.running_watts_needed.toLocaleString() + "W job" + (m.surge_w ? " (" + m.surge_w.toLocaleString() + "W surge for motor starts)" : "")
          : "Only " + m.continuous_w.toLocaleString() + "W continuous — short of the " + needs.running_watts_needed.toLocaleString() + "W job"
      );
    } else {
      reasons.push(
        effectiveWatts(m) >= needs.running_watts_needed
          ? effectiveWatts(m).toLocaleString() + " running watts covers the " + needs.running_watts_needed.toLocaleString() + "W job"
          : "Only " + effectiveWatts(m).toLocaleString() + " running watts — short of the " + needs.running_watts_needed.toLocaleString() + "W job"
      );
    }
  }
  if (needs.quiet) {
    if (m.noise_dba === 0) reasons.push("Silent — no engine, no noise at all");
    else if (m.noise_dba !== null && m.noise_dba <= 60) reasons.push(m.noise_dba + " dBA — the quietest fuel generator in the roster");
    else if (m.type === "open-frame") reasons.push("Open-frame design, so louder than an inverter — the trade-off for whole-home watts");
  }
  if (needs.indoor || needs.fuel === "solar") reasons.push("No fuel, no fumes — safe to run indoors");
  if (needs.portable && m.weight_lb !== null) reasons.push(m.weight_lb + " lb — light enough to carry");
  if (m.stock === "in") reasons.push("In stock on Walmart (checked Nov 22, 2026)");
  else if (m.alt_link) reasons.push("Out of stock on Walmart — but in stock on eBay at " + m.alt_price_display);
  else reasons.push("Out of stock on Walmart right now — check the listing before you buy");
  if (m.status === "reviewed") reasons.push("Reviewed on video by Garage Reviews");
  else reasons.push("Specs verified from the listing — video review coming");
  if (isClosest) reasons.unshift("Closest fit in the roster — not an exact match");

  return {
    id: m.id,
    name: m.name,
    short: m.short,
    price: m.price_display,
    rating: m.rating,
    stock: m.stock_display,
    in_stock: m.stock === "in" || !!m.alt_link,
    specs: m.specs,
    fit: m.fit,
    reasons,
    status: m.status,
    video: m.video,
    link: m.link,
    alt_link: m.alt_link || null,
    alt_price: m.alt_price_display || null,
    alt_stock: m.alt_stock_display || null,
    review_url: m.review_url,
    best: rank === 0,
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "POST") {
    return Response.json({ error: "Use POST with {\"query\": \"...\"}." }, { status: 405 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a JSON body with a \"query\" field." }, { status: 400 });
  }
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return Response.json({ error: "Describe what you need — for example, \"backup for my sump pump, quiet, under $800\"." }, { status: 400 });
  }
  if (query.length > 500) {
    return Response.json({ error: "Keep it under 500 characters." }, { status: 400 });
  }

  // 1. Parse the words (AI when bound, keywords otherwise).
  let needs = null;
  let parsedBy = "keywords";
  try {
    needs = await parseWithAI(env, query);
    if (needs) parsedBy = "ai";
  } catch {
    needs = null; // AI failed — fall through to the keyword parser.
  }
  if (!needs) needs = parseKeywords(query);
  needs.summary = summarizeNeeds(needs);

  // 2. Match deterministically against the verified roster.
  const { picks, no_exact_fit, note } = matchNeeds(needs);

  return Response.json(
    {
      query,
      needs,
      parsed_by: parsedBy,
      picks,
      no_exact_fit,
      note,
      checked: "Nov 22, 2026",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
