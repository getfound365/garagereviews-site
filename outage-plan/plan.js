// Printable outage plan — /outage-plan/
// Client-side only. Reads the recommendation from URL query params
// (see the contract at the bottom of this file) and renders the plan
// from the VERIFIED roster below. No specs, prices, or ratings are
// invented here: every figure matches the live review pages and the
// Nov 18, 2026 roster check. Unknown / missing product -> empty state,
// never a plan for a made-up product.
(function () {
  "use strict";

  // Roster verified Nov 18, 2026. Keep in sync with the quiz roster in
  // generator-finder/index.html and functions/api/match.js.
  // Fields left null are UNVERIFIED — never guess them (e.g. WGen9500DF
  // noise, iGen4000DFc propane watts). The renderer omits nulls.
  // Nov 19, 2026: +10 models from the day's verified review pages
  // (wgen3600c, igen2500, g12kbn, delta3classical1000, gxs4300i, ai4000s,
  // wen4750w, reliance310crk, g1200sg, wendf472). Prices/stock as of
  // Nov 19, 2026. reliance310crk is a manual transfer switch kit, not a
  // generator — it renders through the transfer-switch branch below.
  // Nov 20, 2026: +10 models from the day's verified review pages
  // (wgen9500dfc, champion201319, river2pro, jackery300v2, jackery300lifepo4,
  // igen12000dfc, igen2800dfc, igen5000c, xp13000hx, igen5000). Prices/stock
  // as of Nov 20, 2026. Also reconciled to the live site: wen4750w +
  // wendf472 flipped to out of stock, g1200sg back in stock, 310CRK
  // $491.71 -> $453.99 (all verified on the live site Nov 20, 2026).
  // Nov 21, 2026: 310CRK $453.99 -> $479 (Walmart), eBay listing sold out;
  // river2pro out of stock (verified live Nov 21, 2026).
  // Nov 21, 2026: +5 models from the day's verified review pages
  // (anker-solix-c1000x-gen2, wen-df680ix, wen-df480ix, wen-56360i,
  // jackery1000plus-restored). Prices/stock as of Nov 21, 2026. Also
  // reconciled: delta3classical1000 $462 -> $438.90 (already fixed in
  // match.js + finder Nov 20, 2026).
  // Nov 22, 2026: +1 model from the day's verified review pages
  // (river3plus). Price/stock as of Nov 22, 2026. RIVER 3 Plus is OUT OF
  // STOCK (no buy button on the page); capacity CONTESTED (286Wh maker
  // vs 268Wh bundle name); surge_w null (1,200W X-Boost is per the bundle
  // variant name only); noiseDba null ("under 30 dB" per the maker).
  // Nov 23, 2026: +1 model from the day's verified review pages
  // (bluetti-ac70). Price/stock as of Nov 25, 2026. AC70 is the 7,680 mAh
  // $549.00 option on a shared Elite 100 Mini / AC70 listing, OUT OF STOCK;
  // the $379.00 in-stock option is the Elite 100 Mini (1,004.8Wh), a different
  // station — corrected Nov 25, 2026 after a variant-by-variant live read;
  // noiseDba null (45 dB is the Silent charging mode only, not a verified
  // operating-noise figure).
  // Nov 24, 2026: +3 models from the day's verified review pages
  // (wgen7500dfc, jackery2000v2, pecron-f1000lfp). Prices/stock as of
  // Nov 25, 2026. Jackery 2000 v2 is BACK IN STOCK (Nov 25; "only 4 left" wording gone Nov 26) —
  // rating reads "4.5 stars from 300 ratings", inStock true.
  // Battery 2,042Wh per Jackery (bundle name says 2,036Wh — rounding
  // difference, stated in the specs). noiseDba null for the Jackery
  // ("<30 dB" per the maker, 45 dB at full load — no single figure);
  // Pecron noiseDba is the verified 25 dB operating figure.
  // Nov 25, 2026: +6 models from the day's verified review pages
  // (bluetti-elite-30-v2, oukitel-p2001-plus, greenworks-60v-2000w-inverter,
  // bluetti-elite-10, bailibatt-2000w, jackery-homepower-1000-v2). Prices/stock
  // as of Nov 25, 2026. Elite 30 V2 is OUT OF STOCK ($259 was $289.99).
  // HomePower 1000 v2 has NO ratings yet (0 ratings on the PDP). Greenworks is
  // an inverter ONLY — BATTERIES NOT INCLUDED, no built-in battery
  // (batteryWh null; up to 1,728Wh with the owner's own 60V batteries).
  // Bailibatt Wh capacity is NOT stated on the listing (batteryWh null).
  // noiseDba null for all six new stations (no verified operating figure);
  // weightLb null where the listing states none (Greenworks, Bailibatt,
  // HomePower).
  // Nov 26, 2026: +7 models from the day's verified review pages
  // (champion-6500w-rv-ready-inverter, jackery-explorer-2000-v2-solar-bundle,
  // pulsar-pg12000b, pulsar-pgx60bisrco, wen-df451i,
  // champion-7250w-open-frame-inverter, pulsar-gd10kbn). Prices/stock as of
  // Nov 26, 2026. WEN DF451i is OUT OF STOCK ($879.99). The Jackery bundle
  // is a DISTINCT SKU from the standalone Explorer 2000 v2 ($1,349) and has
  // NO ratings yet; surgeW null (not stated on the Jackery page) and
  // noiseDba null ("<30 dB" per the maker — no single figure). PG12000B
  // propane watts equal the gas watts per Pulsar's own spec table, and it
  // has NO CO auto-shutoff (CARB conflict flagged in the review page).
  // GD10KBN rating is the PDP family figure (4.3/602); noiseDba is the
  // 68 dB spec-block figure. Champion 6500W weightLb null (NOT verified).
  var ROSTER = {
    igen4500df: {
      name: "Westinghouse iGen4500DF — Dual Fuel Inverter Generator",
      short: "iGen4500DF",
      price: 949, priceDisplay: "$949",
      rating: "4.7 stars from 8,821 ratings",
      stock: "In stock", inStock: true,
      gasRunningW: 3700, gasPeakW: 4500,
      propaneRunningW: 3330, propanePeakW: 4050,
      runtime: "up to 18 hours on gas at 25% load, 14 hours on propane",
      noiseDba: 52, weightLb: 98,
      specs: "4,500 peak / 3,700 running watts on gas · 4,050 peak / 3,330 running on propane · up to 18 hours at 25% load · 52 dBA · remote start included · 98 lb",
      link: "https://walmrt.us/4t4whs1",
      reviewUrl: "/reviews/westinghouse-igen4500df/"
    },
    wgen9500df: {
      name: "Westinghouse WGen9500DF — Dual Fuel Portable Generator",
      short: "WGen9500DF",
      price: 999, priceDisplay: "$999",
      rating: "4.8 stars from 26,408 ratings",
      stock: "In stock", inStock: true,
      gasRunningW: 9500, gasPeakW: 12500,
      propaneRunningW: 8500, propanePeakW: 11200,
      runtime: "up to 12 hours",
      noiseDba: null, weightLb: 211,
      specs: "12,500 peak / 9,500 running watts on gas · 11,200 peak / 8,500 running on propane · up to 12 hours · 211 lb · 120/240V with transfer-switch outlet",
      link: "https://walmrt.us/4kiUs3z",
      reviewUrl: "/reviews/westinghouse-wgen9500df/"
    },
    igen4000dfc: {
      name: "Westinghouse iGen4000DFc — Dual Fuel Inverter Generator",
      short: "iGen4000DFc",
      price: 799, priceDisplay: "$799",
      rating: "4.8 stars from 1,170 ratings",
      stock: "Out of stock", inStock: false,
      gasRunningW: 3300, gasPeakW: 4000,
      propaneRunningW: null, propanePeakW: null,
      runtime: "up to 7 hours on a 1.69-gal tank",
      noiseDba: null, weightLb: null,
      specs: "4,000 peak / 3,300 running watts · dual fuel · CO sensor · remote start · TT-30R RV outlet · up to 7 hours on a 1.69-gal tank",
      link: "https://walmrt.us/4zq3W0w",
      reviewUrl: "/reviews/westinghouse-igen4000dfc/"
    },
    jackery1000v2: {
      name: "Jackery Explorer 1000 v2 — Portable Power Station",
      short: "Jackery Explorer 1000 v2",
      price: 589, priceDisplay: "$589",
      rating: "4.9 stars from 299 ratings",
      stock: "Out of stock on Walmart", inStock: false,
      continuousW: 1500, surgeW: 3000, batteryWh: 1060,
      runtime: null,
      noiseDba: 0, weightLb: 23.8,
      specs: "1,060 Wh LiFePO4 battery · 1,500W continuous / 3,000W surge · 400W solar input · 23.8 lb · charges from the wall or sun",
      link: "https://walmrt.us/4zsmKfO",
      altLink: "https://www.ebay.com/itm/840084662851",
      altPriceDisplay: "$529.99", altStock: "In stock on eBay",
      reviewUrl: "/reviews/jackery-explorer-1000-v2/"
    },
    wgen3600c: {
      name: "Westinghouse WGen3600c — Portable Generator",
      short: "WGen3600c",
      price: 399, priceDisplay: "$399",
      rating: "4.8 stars from 4,857 ratings",
      stock: "In stock", inStock: true,
      gasRunningW: 3600, gasPeakW: 4650,
      propaneRunningW: null, propanePeakW: null,
      runtime: null,
      noiseDba: null, weightLb: null,
      specs: "4,650 peak / 3,600 running watts · gas-only open-frame · 4-gal tank · TT-30R + L5-30R RV outlets · CO sensor",
      link: "https://walmrt.us/4kqHwsn",
      reviewUrl: "/reviews/westinghouse-wgen3600c/"
    },
    igen2500: {
      name: "Westinghouse iGen2500 — Inverter Generator",
      short: "iGen2500",
      price: 450, priceDisplay: "$450",
      rating: "4.7 stars from 6,300 ratings",
      stock: "Out of stock", inStock: false,
      gasRunningW: 2200, gasPeakW: 2500,
      propaneRunningW: null, propanePeakW: null,
      runtime: null,
      noiseDba: 52, weightLb: 47.4,
      specs: "2,500 peak / 2,200 running watts · gas inverter · 52 dBA · 47.4 lb · parallel-ready · CO shutdown · clean power (≤3% THD)",
      link: "https://walmrt.us/4zuNPz0",
      reviewUrl: "/reviews/westinghouse-igen2500/"
    },
    g12kbn: {
      name: "Pulsar G12KBN — Dual Fuel Portable Generator",
      short: "G12KBN",
      price: 749, priceDisplay: "$749",
      rating: "4.3 stars from 596 ratings",
      stock: "Out of stock", inStock: false,
      gasRunningW: 9500, gasPeakW: 12000,
      propaneRunningW: 8550, propanePeakW: 10800,
      runtime: null,
      noiseDba: 74, weightLb: 209, // compare table: 209–214 lb, sources disagree
      specs: "12,000 peak / 9,500 running watts on gas · 10,800 peak / 8,550 running on propane · 50-amp outlet · 74 dB · 209–214 lb",
      link: "https://walmrt.us/4kpDiRS",
      reviewUrl: "/reviews/pulsar-g12kbn/"
    },
    delta3classical1000: {
      name: "EcoFlow DELTA 3 Classical 1000 — Portable Power Station",
      short: "DELTA 3 Classical 1000",
      price: 438.90, priceDisplay: "$438.90",
      rating: "4.5 stars from 2,229 ratings",
      stock: "In stock", inStock: true,
      continuousW: 1800, surgeW: 3600, batteryWh: 1024,
      runtime: null,
      noiseDba: 0, weightLb: 26.7,
      specs: "1,024 Wh LiFePO4 battery · 1,800W continuous / 3,600W surge · 500W solar input · 26.7 lb · 0–80% charge in about 45 minutes",
      link: "https://walmrt.us/4Cahpwj",
      reviewUrl: "/reviews/ecoflow-delta-3-classical-1000/"
    },
    gxs4300i: {
      name: "A-iPower GXS4300i — Inverter Generator",
      short: "GXS4300i",
      price: 499.99, priceDisplay: "$499.99",
      rating: "4.8 stars from 71 ratings",
      stock: "In stock", inStock: true,
      gasRunningW: 3450, gasPeakW: 4300,
      propaneRunningW: null, propanePeakW: null,
      runtime: "up to 9.5 hours at 25% load",
      noiseDba: null, // DISPUTED: 62 dB per A-iPower spec sheet vs 52 dBA advertised on Walmart
      weightLb: 48.9,
      specs: "4,300 peak / 3,450 running watts · gas inverter · CO sensor · electric start · 48.9 lb · up to 9.5 hours at 25% load",
      link: "https://walmrt.us/3VG15CZ",
      reviewUrl: "/reviews/a-ipower-gxs4300i/"
    },
    ai4000s: {
      name: "Aceup Energy AI4000S — Inverter Generator",
      short: "AI4000S",
      price: 379.99, priceDisplay: "$379.99",
      rating: "4.3 stars from 170 ratings",
      stock: "In stock", inStock: true,
      gasRunningW: 3200, gasPeakW: 4000, // listing states 3,200 running watts; manual states 3,400
      propaneRunningW: null, propanePeakW: null,
      runtime: "up to 8.5 hours at 25% load",
      noiseDba: null, weightLb: 50.7,
      specs: "4,000 peak / 3,200 running watts (manual states 3,400) · gas inverter · CO sensor · 50.7 lb · up to 8.5 hours at 25% load",
      link: "https://walmrt.us/3WL1Lr2",
      reviewUrl: "/reviews/aceup-energy-ai4000s/"
    },
    wen4750w: {
      name: "WEN 4750W Generator 56475 — Portable Generator",
      short: "4750W 56475",
      price: 525, priceDisplay: "$525",
      rating: "4.3 stars from 137 ratings",
      stock: "Out of stock", inStock: false,
      gasRunningW: 3750, gasPeakW: 4750,
      propaneRunningW: null, propanePeakW: null,
      runtime: null,
      noiseDba: null, weightLb: null,
      specs: "4,750 peak / 3,750 running watts · gas open-frame · electric start · RV-ready",
      link: "https://walmrt.us/4ADV3l0",
      reviewUrl: "/reviews/wen-4750w-56475/"
    },
    reliance310crk: {
      name: "Reliance Controls 310CRK — Manual Transfer Switch Kit",
      short: "310CRK",
      type: "transfer-switch",
      price: 491.71, priceDisplay: "$491.71",
      rating: "4.8 stars from 132 ratings",
      stock: "In stock", inStock: true,
      gasRunningW: null, gasPeakW: null,
      propaneRunningW: null, propanePeakW: null,
      runtime: null,
      noiseDba: null, weightLb: null,
      specs: "10-circuit manual transfer switch kit · 30-amp · 7,500W max · connects a portable generator to home circuits",
      link: "https://walmrt.us/4AFHn9e",
      reviewUrl: "/reviews/reliance-controls-310crk/"
    },
    g1200sg: {
      name: "Pulsar G1200SG — Portable Generator",
      short: "G1200SG",
      price: 179, priceDisplay: "$179",
      rating: "4.0 stars from 326 ratings",
      stock: "In stock", inStock: true,
      gasRunningW: 900, gasPeakW: 1200,
      propaneRunningW: null, propanePeakW: null,
      runtime: null, // runtime conflicts across sources (5 vs 8.5 hours)
      noiseDba: null, // noise conflicts across sources (65 vs 78 dB for sibling models)
      weightLb: 40, // ~40 lb per the manual
      specs: "1,200 peak / 900 running watts · 2-stroke gas — 40:1 gas/oil mix · ~40 lb · 1-gal tank · recoil start",
      link: "https://walmrt.us/3V5eJz8",
      reviewUrl: "/reviews/pulsar-g1200sg/"
    },
    wendf472: {
      name: "WEN DF472 — Dual Fuel Portable Generator",
      short: "DF472",
      price: 499.52, priceDisplay: "$499.52",
      rating: "4.3 stars from 9 ratings",
      stock: "Out of stock", inStock: false,
      gasRunningW: 3800, gasPeakW: 4750,
      propaneRunningW: 3500, propanePeakW: 4350,
      runtime: "~11 hours on gasoline at 50% load",
      noiseDba: null, weightLb: 103.2,
      specs: "4,750 peak / 3,800 running watts on gas · 4,350 peak / 3,500 running on propane · 120/240V · 103.2 lb · recoil start only · no CO sensor listed",
      link: "https://walmrt.us/4tadlYD",
      reviewUrl: "/reviews/wen-df472/"
    },
    wgen9500dfc: {
      name: "Westinghouse WGen9500DFc — Dual Fuel Portable Generator",
      short: "WGen9500DFc",
      price: 1049, priceDisplay: "$1,049",
      rating: "4.82 stars from 24,633 ratings", // BV product-specific count; PDP count (~48,176) is family-wide
      stock: "Out of stock", inStock: false,
      gasRunningW: 9500, gasPeakW: 12500,
      propaneRunningW: 8500, propanePeakW: 11200,
      runtime: "up to 12 hours on gas at 25% load",
      noiseDba: 74, weightLb: 212,
      specs: "12,500 peak / 9,500 running watts on gas · 11,200 peak / 8,500 running on propane · up to 12 hours at 25% load · 74 dBA · CO sensor · transfer-switch ready · 212 lb",
      link: "https://walmrt.us/48FabCY",
      reviewUrl: "/reviews/westinghouse-wgen9500dfc/"
    },
    champion201319: {
      name: "Champion 201319 4500W Dual Fuel Inverter — Portable Inverter Generator",
      short: "Champion 201319",
      price: 999, priceDisplay: "$999",
      rating: "4.8 stars from 200 ratings",
      stock: "In stock", inStock: true,
      gasRunningW: 3500, gasPeakW: 4500,
      propaneRunningW: 3150, propanePeakW: 4500,
      runtime: "up to 14 hours on gas at 25% load, 21 hours on propane",
      noiseDba: 61, weightLb: null, // weight not published on the sources checked
      specs: "4,500 peak / 3,500 running watts on gas · 4,500 peak / 3,150 running on propane · up to 14 hours on gas at 25% load · 61 dBA · CO Shield · TT-30R RV outlet · <3% THD",
      link: "https://walmrt.us/4fRZAIF",
      reviewUrl: "/reviews/champion-201319-4500w-dual-fuel-inverter/"
    },
    river2pro: {
      name: "EcoFlow RIVER 2 Pro — Portable Power Station",
      short: "RIVER 2 Pro",
      price: 349, priceDisplay: "$349",
      rating: "4.5 stars from 805 ratings",
      stock: "In stock", inStock: true,
      continuousW: 800, surgeW: 1600, batteryWh: 716, // Walmart RIVER 2 Pro 700 variant; standard version is 768Wh
      runtime: null,
      noiseDba: 0, weightLb: 18.2,
      specs: "716Wh LiFePO4 battery (Walmart RIVER 2 Pro 700 variant; standard version is 768Wh) · 800W continuous / 1,600W surge · 18.2 lb · 0–100% in about 70 minutes",
      link: "https://walmrt.us/4jCTSN2",
      reviewUrl: "/reviews/ecoflow-river-2-pro/"
    },
    jackery300v2: {
      name: "Jackery Explorer 300 v2 Auto Kit — Portable Power Station",
      short: "Jackery Explorer 300 v2",
      price: 198, priceDisplay: "$198",
      rating: "4.4 stars from 304 ratings",
      stock: "In stock", inStock: true,
      continuousW: 300, surgeW: 600, batteryWh: 288,
      runtime: null,
      noiseDba: 0, weightLb: 8.1,
      specs: "288Wh LiFePO4 battery · 300W continuous / 600W surge · 8.1 lb · includes 12V auto-charging cable · charges from the wall, car, or sun",
      link: "https://walmrt.us/4ATl5kn",
      reviewUrl: "/reviews/jackery-explorer-300-v2-auto-kit/"
    },
    jackery300lifepo4: {
      name: "Jackery Explorer 300 LiFePO4 — Portable Power Station",
      short: "Jackery Explorer 300 LiFePO4",
      price: 309, priceDisplay: "$309",
      rating: "4.6 stars from 110 ratings",
      stock: "In stock", inStock: true,
      continuousW: 300, surgeW: null, batteryWh: 292, // surge watts not verified; Walmart titles it "E300New 290Wh" (rounding)
      runtime: null,
      noiseDba: 0, weightLb: 7.5,
      specs: "292Wh LiFePO4 battery · 300W continuous · 7.5 lb · 4,000+ cycles to 70% · 100W USB-C PD · 5-year warranty",
      link: "https://walmrt.us/4jdAqoK",
      reviewUrl: "/reviews/jackery-explorer-300-lifepo4/"
    },
    igen12000dfc: {
      name: "Westinghouse iGen12000DFc — Dual Fuel Inverter Generator",
      short: "iGen12000DFc",
      price: 1899, priceDisplay: "$1,899",
      rating: "4.8 stars from 2,293 ratings",
      stock: "Out of stock", inStock: false,
      gasRunningW: 9000, gasPeakW: 12000,
      propaneRunningW: 8100, propanePeakW: 11000,
      runtime: "up to 19 hours on gas at 25% load, 9 hours on propane",
      noiseDba: 64, weightLb: 189,
      specs: "12,000 peak / 9,000 running watts on gas · 11,000 peak / 8,100 running on propane · up to 19 hours at 25% load · 64 dBA · remote start · CO sensor · 50A outlet · 189 lb",
      link: "https://walmrt.us/48LFyMa",
      reviewUrl: "/reviews/westinghouse-igen12000dfc/"
    },
    igen2800dfc: {
      name: "Westinghouse iGen2800DFc — Dual Fuel Inverter Generator",
      short: "iGen2800DFc",
      price: 549, priceDisplay: "$549",
      rating: "4.7 stars from 5,346 ratings",
      stock: "Out of stock", inStock: false,
      gasRunningW: 2200, gasPeakW: 2800,
      propaneRunningW: 1980, propanePeakW: 2520,
      runtime: "up to 12 hours on gas at 25% load",
      noiseDba: null, // CONTESTED: 52 dBA marketing vs 62 dBA at 25% load in one spec table
      weightLb: 45.4,
      specs: "2,800 peak / 2,200 running watts on gas · 2,520 peak / 1,980 running on propane · up to 12 hours at 25% load · CO sensor · TT-30R RV outlet · 45.4 lb · recoil start only",
      link: "https://walmrt.us/4AOGWtf",
      reviewUrl: "/reviews/westinghouse-igen2800dfc/"
    },
    igen5000c: {
      name: "Westinghouse iGen5000c — Gas Inverter Generator",
      short: "iGen5000c",
      price: 899, priceDisplay: "$899",
      rating: "4.7 stars from 7,533 ratings",
      stock: "In stock", inStock: true,
      gasRunningW: 3900, gasPeakW: 5000,
      propaneRunningW: null, propanePeakW: null,
      runtime: "up to 18 hours at 25% load, 15 hours at 50% load",
      noiseDba: 52, weightLb: 105.8,
      specs: "5,000 peak / 3,900 running watts · gas inverter · CO sensor · up to 18 hours at 25% load · 52 dBA · 105.8 lb · TT-30R RV outlet",
      link: "https://walmrt.us/3WWAgLe",
      reviewUrl: "/reviews/westinghouse-igen5000c/"
    },
    xp13000hx: {
      name: "DuroMax XP13000HX — Dual Fuel Portable Generator",
      short: "XP13000HX",
      price: 1399, priceDisplay: "$1,399",
      rating: "4.8 stars from 1,463 ratings",
      stock: "Out of stock", inStock: false,
      gasRunningW: 10500, gasPeakW: 13000,
      propaneRunningW: 10000, propanePeakW: 12500,
      runtime: "up to 17 hours on gas at 25% load, 13 hours on propane",
      noiseDba: 74, weightLb: 240,
      specs: "13,000 peak / 10,500 running watts on gas · 12,500 peak / 10,000 running on propane · up to 17 hours at 25% load · 74 dB · CO Alert · 240 lb",
      link: "https://walmrt.us/4AcLWYU",
      reviewUrl: "/reviews/duromax-xp13000hx/"
    },
    igen5000: {
      name: "Westinghouse iGen5000 — Gas Inverter Generator",
      short: "iGen5000",
      price: 849, priceDisplay: "$849",
      rating: "4.7 stars from 16,250 ratings", // PDP count is a variant-family aggregate; BV is 7,819
      stock: "In stock", inStock: true,
      gasRunningW: 3900, gasPeakW: 5000,
      propaneRunningW: null, propanePeakW: null,
      runtime: "up to 18 hours at 25% load, 15 hours at 50% load",
      noiseDba: 52, weightLb: 104.7,
      specs: "5,000 peak / 3,900 running watts · gas inverter · up to 18 hours at 25% load · 52 dBA · 104.7 lb · TT-30R RV outlet · no CO sensor",
      link: "https://walmrt.us/4Ciz84R",
      reviewUrl: "/reviews/westinghouse-igen5000/"
    },
    "anker-solix-c1000x-gen2": {
      name: "Anker SOLIX C1000X Gen 2 — Portable Power Station",
      short: "SOLIX C1000X Gen 2",
      price: 569.99, priceDisplay: "$569.99",
      rating: "4.5 stars from 55 ratings",
      stock: "Out of stock", inStock: false,
      continuousW: 2000, surgeW: null, batteryWh: 1024, // surge CONTESTED: 2,400W marketing vs 3,000W spec table — never pick one
      runtime: null,
      noiseDba: 0, weightLb: 27.12,
      specs: "1,024Wh LiFePO4 battery · 2,000W continuous · 49-minute recharge · 4,000+ cycles · 27.12 lb · charges from the wall or sun",
      link: "https://walmrt.us/4zHAtQ2",
      reviewUrl: "/reviews/anker-solix-c1000x-gen-2/"
    },
    "wen-df680ix": {
      name: "WEN DF680iX — Dual Fuel Inverter Generator",
      short: "DF680iX",
      price: 798, priceDisplay: "$798",
      rating: "4.1 stars from 55 ratings",
      stock: "Out of stock", inStock: false,
      gasRunningW: 5100, gasPeakW: 6800,
      propaneRunningW: 4500, propanePeakW: 6000,
      runtime: "up to 6.1 hours at half load on gas, 9 hours on propane",
      noiseDba: 64, weightLb: 94.8, // spec table also lists 99.2 lb in one place
      specs: "6,800 peak / 5,100 running watts on gas · 6,000 peak / 4,500 running on propane · 224cc · 64 dB · 94.8 lb · electric start with recoil backup · up to 6.1 hours at half load",
      link: "https://walmrt.us/4ClqnGW",
      reviewUrl: "/reviews/wen-df680ix/"
    },
    "wen-df480ix": {
      name: "WEN DF480iX — Dual Fuel Inverter Generator",
      short: "DF480iX",
      price: 647, priceDisplay: "$647",
      rating: "4.5 stars from 57 ratings",
      stock: "Out of stock", inStock: false,
      gasRunningW: 4000, gasPeakW: 4800,
      propaneRunningW: 3600, propanePeakW: 4320,
      runtime: "up to 7 hours at half load on gas, 12 hours on propane",
      noiseDba: 62, weightLb: 78.5, // weight contested across sources (78.5 lb vs 91 lb)
      specs: "4,800 peak / 4,000 running watts on gas · 4,320 peak / 3,600 running on propane · 224cc · 62 dB · 78.5 lb · push-button start · up to 7 hours at half load",
      link: "https://walmrt.us/4zHfPzu",
      reviewUrl: "/reviews/wen-df480ix/"
    },
    "wen-56360i": {
      name: "WEN 56360i — Inverter Generator",
      short: "56360i",
      price: 440, priceDisplay: "$440",
      rating: "4.7 stars from 55 ratings",
      stock: "Out of stock", inStock: false,
      gasRunningW: 2900, gasPeakW: 3600,
      propaneRunningW: null, propanePeakW: null,
      runtime: null, // CONTESTED: 3 hours spec table vs "up to 5 hours at half load" description
      noiseDba: 65, weightLb: 46,
      specs: "3,600 peak / 2,900 running watts · gas inverter · 149cc · 65 dB · 46 lb · pull-cord start · TT-30R RV outlet",
      link: "https://walmrt.us/4zJXi5B",
      reviewUrl: "/reviews/wen-56360i/"
    },
    "jackery1000plus-restored": {
      name: "Jackery Explorer 1000 Plus (Restored) + 100W Mini Panel — Portable Power Station",
      short: "Explorer 1000 Plus (Restored)",
      price: 449, priceDisplay: "$449",
      rating: "5.0 stars from 5 ratings",
      stock: "In stock", inStock: true,
      continuousW: 2000, surgeW: 4000, batteryWh: 1264,
      runtime: null,
      noiseDba: 0, weightLb: 40,
      specs: "1,264Wh LiFePO4 battery · 2,000W continuous / 4,000W peak · 800W solar input · 40 lb · expandable to ~5kWh · includes 100W Mini solar panel · RESTORED unit of a DISCONTINUED model (replaced Sept 2026)",
      link: "https://walmrt.us/4eVey0a",
      reviewUrl: "/reviews/jackery-explorer-1000-plus-restored/"
    },
    river3plus: {
      name: "EcoFlow RIVER 3 Plus — Portable Power Station",
      short: "RIVER 3 Plus",
      price: 239, priceDisplay: "From $239",
      rating: "4.6 stars from 58 ratings",
      stock: "Out of stock", inStock: false,
      continuousW: 600, surgeW: null, batteryWh: 286, // surge null: 1,200W X-Boost is per the bundle variant name only, not a verified surge rating; battery 286Wh maker figure, bundle name says 268Wh
      runtime: null,
      noiseDba: null, weightLb: 10.4, // "under 30 dB" per the maker — no single dBA figure verified
      specs: "286Wh LiFePO4 battery (maker figure; bundle name says 268Wh) · 600W continuous (1,200W with X-Boost) · sub-10ms UPS · under 30 dB · 10.4 lb · 0–100% in 1 hour",
      link: "https://walmrt.us/4tozcMf", // verified RIVER 3 Plus item; the live review page's "Check price" link wrongly points at the DELTA 3 item 1108904221 — build-agent fix needed
      reviewUrl: "/reviews/ecoflow-river-3-plus/"
    },
    "bluetti-ac70": {
      name: "BLUETTI AC70 — Portable Power Station",
      short: "AC70",
      price: 549, priceDisplay: "$549.00",
      rating: "4.6 stars from 116 ratings",
      stock: "Out of stock", inStock: false,
      continuousW: 1000, surgeW: 2000, batteryWh: 768, // shared Elite 100 Mini / AC70 listing — AC70 is the 7,680 mAh $549.00 option, out of stock; $379.00 option is the Elite 100 Mini
      runtime: null,
      noiseDba: null, weightLb: 22.5, // 45 dB is the Silent charging mode only — no verified operating-noise figure
      specs: "768Wh LiFePO4 battery · 1,000W continuous / 2,000W surge · 500W solar input · 22.5 lb · 850W AC input, 0–100% in about 1.5 hours (Turbo) · Silent charging mode 45 dB",
      link: "https://walmrt.us/4lcIJnn",
      reviewUrl: "/reviews/bluetti-ac70/"
    },
    wgen7500dfc: {
      name: "Westinghouse WGen7500DFc — Dual Fuel Portable Generator",
      short: "WGen7500DFc",
      price: 949, priceDisplay: "$949",
      rating: "4.7 stars from 6,058 ratings",
      stock: "In stock", inStock: true,
      gasRunningW: 7500, gasPeakW: 9500,
      propaneRunningW: 6750, propanePeakW: 8550,
      runtime: "up to 11 hours on gas at 25% load",
      noiseDba: 72, weightLb: 202.1, // dry weight per Westinghouse spec table
      specs: "9,500 peak / 7,500 running watts on gas · 8,550 peak / 6,750 running on propane · up to 11 hours at 25% load · 72 dBA · CO sensor · transfer-switch ready · 202.1 lb",
      link: "https://walmrt.us/4j2Sao7",
      reviewUrl: "/reviews/westinghouse-wgen7500dfc/"
    },
    jackery2000v2: {
      name: "Jackery Explorer 2000 v2 — Portable Power Station",
      short: "Jackery Explorer 2000 v2",
      price: 1349, priceDisplay: "$1,349",
      rating: "4.5 stars from 300 ratings",
      stock: "Out of stock", inStock: false,
      continuousW: 2200, surgeW: 4400, batteryWh: 2042, // Jackery maker figure; bundle name says 2,036Wh — rounding difference
      runtime: null,
      noiseDba: null, weightLb: 39.5, // "<30 dB" per the maker, 45 dB at full load — no single operating figure verified
      specs: "2,042Wh LiFePO4 battery (maker figure; bundle name says 2,036Wh) · 2,200W continuous / 4,400W surge · <20ms UPS · under 30 dB · 39.5 lb · 0–100% in about 1.7 hours · 4,000 cycles",
      link: "https://walmrt.us/4kuPEYW", // bare /ip/ URL — no slugged URL on the listing
      reviewUrl: "/reviews/jackery-explorer-2000-v2/"
    },
    "pecron-f1000lfp": {
      name: "PECRON F1000LFP — Portable Power Station",
      short: "F1000LFP",
      price: 369, priceDisplay: "$369",
      rating: "4.3 stars from 14 ratings",
      stock: "In stock", inStock: true,
      continuousW: 1500, surgeW: 3000, batteryWh: 960,
      runtime: null,
      noiseDba: 25, weightLb: 23.9,
      specs: "960Wh LiFePO4 battery · 1,500W continuous / 3,000W surge · 600W solar input · 25 dB · 23.9 lb · 1,000W AC input, 0–80% in 50 minutes · <20ms UPS · 3,500+ cycles",
      link: "https://walmrt.us/4ANVhpR",
      reviewUrl: "/reviews/pecron-f1000lfp/"
    },
    "bluetti-elite-30-v2": {
      name: "BLUETTI Elite 30 V2 — Portable Power Station",
      short: "Elite 30 V2",
      price: 259, priceDisplay: "$259",
      rating: "4.2 stars from 67 ratings",
      stock: "Out of stock", inStock: false,
      continuousW: 600, surgeW: null, batteryWh: 288, // 1,500W Power Lifting is a resistive-load mode, not a surge rating
      runtime: null,
      noiseDba: null, weightLb: 9.48,
      specs: "288Wh LiFePO4 battery · 600W continuous (1,500W Power Lifting, resistive loads only) · 200W solar input · ≤10ms UPS · 9.48 lb · 3,000+ cycles",
      link: "https://walmrt.us/4zNnXP9",
      reviewUrl: "/reviews/bluetti-elite-30-v2/"
    },
    "oukitel-p2001-plus": {
      name: "OUKITEL P2001 Plus — Portable Power Station",
      short: "P2001 Plus",
      price: 659.99, priceDisplay: "$659.99",
      rating: "4.6 stars from 5 ratings",
      stock: "In stock", inStock: true,
      continuousW: 2400, surgeW: 4800, batteryWh: 2048,
      runtime: null,
      noiseDba: null, weightLb: 48.5,
      specs: "2,048Wh LiFePO4 battery · 2,400W continuous / 4,800W surge · 500W solar input · <10ms EPS · 48.5 lb · 3,500+ cycles",
      link: "https://walmrt.us/4tjxDzd",
      reviewUrl: "/reviews/oukitel-p2001-plus/"
    },
    "greenworks-60v-2000w-inverter": {
      name: "Greenworks 60V 2000W 4-Slot Battery Inverter",
      short: "Greenworks 60V Inverter",
      price: 748, priceDisplay: "$748",
      rating: "4.2 stars from 20 ratings",
      stock: "In stock", inStock: true,
      continuousW: 2000, surgeW: 3000, batteryWh: null, // inverter-only: 0 Ah built in; up to 1,728Wh with the owner's own 60V batteries
      runtime: null,
      noiseDba: null, weightLb: null, // weight/dimensions not published anywhere found
      specs: "2,000W continuous / 3,000W surge inverter — BATTERIES NOT INCLUDED (0 Ah built in; up to 1,728Wh with the owner's own 60V batteries) · 3 AC outlets · 1,500W fast charger · smart LCD + Bluetooth app",
      link: "https://walmrt.us/3WQIwwi",
      reviewUrl: "/reviews/greenworks-60v-2000w-inverter/"
    },
    "bluetti-elite-10": {
      name: "BLUETTI Elite 10 — Portable Power Station",
      short: "Elite 10",
      price: 139.99, priceDisplay: "$139.99",
      rating: "4.7 stars from 3 ratings",
      stock: "In stock", inStock: true,
      continuousW: 200, surgeW: 300, batteryWh: 128, // 400W Power Lifting is resistive-only, not surge
      runtime: null,
      noiseDba: null, weightLb: 3.97,
      specs: "128Wh LiFePO4 battery · 200W continuous / 300W surge (400W Power Lifting, resistive loads only) · 100W solar input · 10ms UPS · 3.97 lb · 3,000+ cycles",
      link: "https://walmrt.us/49eDNqV",
      reviewUrl: "/reviews/bluetti-elite-10/"
    },
    "bailibatt-2000w": {
      name: "Bailibatt 2000W — Portable Power Station",
      short: "Bailibatt 2000W",
      price: 659.99, priceDisplay: "$659.99",
      rating: "4.1 stars from 12 ratings",
      stock: "In stock", inStock: true,
      continuousW: 2000, surgeW: 4000, batteryWh: null, // Wh capacity NOT stated on the listing — never compute it
      runtime: null,
      noiseDba: null, weightLb: null, // weight/dimensions not stated on the listing
      specs: "2,000W continuous / 4,000W surge · LiFePO4 · 4,000+ cycles — Wh capacity NOT stated on the listing, so no battery size is claimed",
      link: "https://walmrt.us/4th04gY",
      reviewUrl: "/reviews/bailibatt-2000w/"
    },
    "jackery-homepower-1000-v2": {
      name: "Jackery HomePower 1000 v2 — Portable Power Station",
      short: "HomePower 1000 v2",
      price: 469, priceDisplay: "$469",
      rating: "No ratings yet",
      stock: "In stock", inStock: true,
      continuousW: 1500, surgeW: 3000, batteryWh: 1024,
      runtime: "8 hours", // listing spec-block figure
      noiseDba: null, weightLb: null, // weight/dimensions NOT stated on the listing
      specs: "1,024Wh LiFePO4 battery · 1,500W continuous / 3,000W surge · 400W solar input · sub-10ms UPS · 6,000 cycles to 70%+ · 50-min Emergency Charge",
      link: "https://walmrt.us/49ge811",
      reviewUrl: "/reviews/jackery-homepower-1000-v2/"
    },
    "champion-6500w-rv-ready-inverter": {
      name: "Champion 6500W RV Ready Inverter Generator",
      short: "6500W RV Ready",
      price: 999, priceDisplay: "$999",
      rating: "4.9 stars from 115 ratings",
      stock: "In stock", inStock: true,
      gasRunningW: 5000, gasPeakW: 6500,
      propaneRunningW: null, propanePeakW: null,
      runtime: "up to 18 hours at 25% load",
      noiseDba: 64, weightLb: null, // weight and tank capacity NOT verified — never invent them
      specs: "6,500 peak / 5,000 running watts on gas · up to 18 hours at 25% load · 64 dBA at 23 feet · CO Shield auto-shutoff · TT-30R RV outlet · <3% THD",
      link: "https://www.walmart.com/ip/18034608937",
      reviewUrl: "/reviews/champion-6500w-rv-ready-inverter/"
    },
    "jackery-explorer-2000-v2-solar-bundle": {
      name: "Jackery Explorer 2000 v2 + 2×100W Mini Solar Panels — Portable Power Station",
      short: "Explorer 2000 v2 Solar Bundle",
      price: 999, priceDisplay: "$999",
      rating: "No ratings yet",
      stock: "In stock", inStock: true,
      continuousW: 2200, surgeW: null, batteryWh: 2042, // surge wattage NOT stated on the Jackery page — never invent one
      runtime: null,
      noiseDba: null, weightLb: 39.5, // "<30 dB" per the maker — no single operating figure verified
      specs: "2,042Wh LiFePO4 battery · 2,200W continuous · 2×100W Mini solar panels included · ≤20ms UPS · under 30 dB · 39.5 lb · LiFePO4 rated 10+ years",
      link: "https://www.walmart.com/ip/15009717653",
      reviewUrl: "/reviews/jackery-explorer-2000-v2-solar-bundle/"
    },
    "pulsar-pg12000b": {
      name: "Pulsar PG12000B — Dual Fuel Portable Generator",
      short: "PG12000B",
      price: 899, priceDisplay: "$899",
      rating: "3.9 stars from 169 ratings",
      stock: "In stock", inStock: true,
      gasRunningW: 9500, gasPeakW: 12000,
      propaneRunningW: 9500, propanePeakW: 12000, // Pulsar's spec table lists 9,500W running for BOTH fuels — quoted as listed
      runtime: "up to 12 hours at 50% load",
      noiseDba: 74, weightLb: 209,
      specs: "12,000 peak / 9,500 running watts · dual fuel · up to 12 hours at 50% load · 74 dB · 14-50R transfer-switch outlet · 209 lb",
      link: "https://walmrt.us/4j7EvuI", // verified resolving to item 695477131
      reviewUrl: "/reviews/pulsar-pg12000b/"
    },
    "pulsar-pgx60bisrco": {
      name: "Pulsar PGX60BiSRCO — Dual Fuel Inverter Generator",
      short: "PGX60BiSRCO",
      price: 799, priceDisplay: "$799",
      rating: "4.6 stars from 36 ratings",
      stock: "In stock", inStock: true,
      gasRunningW: 5400, gasPeakW: 6000,
      propaneRunningW: 4600, propanePeakW: 5400,
      runtime: "up to 6.5 hours at 50% load on gas",
      noiseDba: 67, weightLb: 93.5,
      specs: "6,000 peak / 5,400 running watts on gas · 5,400 peak / 4,600 running on propane · up to 6.5 hours at 50% load · 67 dB · remote start · CO detection with auto shutoff · 93.5 lb",
      link: "https://www.walmart.com/ip/17033002957",
      reviewUrl: "/reviews/pulsar-pgx60bisrco/"
    },
    "wen-df451i": {
      name: "WEN DF451i — Dual Fuel Inverter Generator",
      short: "DF451i",
      price: 879.99, priceDisplay: "$879.99",
      rating: "4.6 stars from 23 ratings",
      stock: "Out of stock", inStock: false,
      gasRunningW: 3500, gasPeakW: 4500,
      propaneRunningW: 3150, propanePeakW: 4500,
      runtime: "up to 8.5 hours at 50% load on gas",
      noiseDba: 58, weightLb: 100, // WEN's own 58 dBA at quarter load; one retailer table lists 63 dB
      specs: "4,500 peak / 3,500 running watts on gas · 4,500 peak / 3,150 running on propane · up to 8.5 hours at 50% load · 58 dBA at quarter load · keyless electric start · 100 lb",
      link: "https://www.walmart.com/ip/1800120129",
      reviewUrl: "/reviews/wen-df451i/"
    },
    "champion-7250w-open-frame-inverter": {
      name: "Champion 7250W Open Frame Inverter Generator",
      short: "7250W Open Frame",
      price: 999, priceDisplay: "$999",
      rating: "4.5 stars from 6 ratings",
      stock: "In stock", inStock: true,
      gasRunningW: 5500, gasPeakW: 7250,
      propaneRunningW: null, propanePeakW: null,
      runtime: "up to 15 hours at 25% load",
      noiseDba: 69, weightLb: 111.6,
      specs: "7,250 peak / 5,500 running watts · gas-only open-frame inverter · up to 15 hours at 25% load · 69 dBA at 23 feet · CO Shield · TT-30R + L14-30R · 111.6 lb",
      link: "https://www.walmart.com/ip/18037912019",
      reviewUrl: "/reviews/champion-7250w-open-frame-inverter/"
    },
    "pulsar-gd10kbn": {
      name: "Pulsar GD10KBN — Dual Fuel Inverter Generator",
      short: "GD10KBN",
      price: 779, priceDisplay: "$779",
      rating: "4.3 stars from 602 ratings",
      stock: "Out of stock", inStock: false,
      gasRunningW: 8000, gasPeakW: 10500,
      propaneRunningW: 7200, propanePeakW: 9400,
      runtime: "up to 10 hours at half load on gasoline",
      noiseDba: 68, weightLb: 125, // 68 dB is the spec-block figure; listing copy claims 50 dB, a buyer measured ~72–75 dB
      specs: "10,500 peak / 8,000 running watts on gas · 9,400 peak / 7,200 running on propane · up to 10 hours at half load · 68 dB · electric push-button start · 14-50R RV outlet · 125 lb",
      link: "https://www.walmart.com/ip/12533757646",
      reviewUrl: "/reviews/pulsar-gd10kbn/"
    }
  };

  // Job estimates — the same estimates the matcher uses (functions/api/
  // match.js). Labelled as estimates on the page, never as metered loads.
  var JOBS = {
    small: {
      label: "Small loads — phones, laptop, a few lights",
      watts: 1500,
      loads: ["Phones", "Laptop", "A few lights"]
    },
    essentials: {
      label: "Outage essentials — fridge, lights, furnace fan, phones",
      watts: 3300,
      loads: ["Fridge", "Lights", "Furnace fan", "Phones"]
    },
    whole: {
      label: "Whole house — well pump, AC, everything at once",
      watts: 9500,
      loads: ["Well pump", "Air conditioning", "Fridge", "Lights", "Everything at once"]
    }
  };

  var BUDGETS = {
    under500: { label: "Under $500", max: 500 },
    around1000: { label: "Around $1,000", max: 1000 },
    over1000: { label: "Over $1,000", max: null }
  };

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function fmt(n) { return n.toLocaleString("en-US"); }
  function $(id) { return document.getElementById(id); }

  function params() {
    var q = new URLSearchParams(window.location.search);
    var product = (q.get("product") || "").trim();
    var use = (q.get("use") || q.get("use_case") || "").trim().toLowerCase();
    if (use === "whole-home") use = "whole";
    var fuel = (q.get("fuel") || "").trim().toLowerCase();
    var budget = (q.get("budget") || "").trim().toLowerCase();
    var budgetMax = q.get("budget_max");
    var watts = q.get("watts");
    var words = (q.get("q") || "").trim().slice(0, 200);
    return {
      product: product,
      use: use,
      fuel: fuel,
      budget: budget,
      budgetMax: budgetMax !== null && budgetMax !== "" ? parseInt(budgetMax, 10) : null,
      watts: watts !== null && watts !== "" ? parseInt(watts, 10) : null,
      words: words
    };
  }

  function effectiveWatts(m) {
    // Gas running watts for fuel generators, continuous watts for the
    // power station — same rule as the matcher.
    if (m.continuousW) return m.continuousW;
    return m.gasRunningW;
  }

  function renderEmpty() {
    $("plan").hidden = true;
    $("empty").hidden = false;
    document.title = "Your Outage Plan — Garage Reviews";
  }

  function render(p) {
    var m = ROSTER[p.product];
    if (!m) { renderEmpty(); return; }

    var job = JOBS[p.use] || null;
    var jobWatts = (p.watts && p.watts > 0) ? p.watts : (job ? job.watts : null);
    var runW = effectiveWatts(m);
    var isStation = !!m.continuousW;

    // --- Loads: from the visitor's answers, plus anything named in
    // their own plain words (sump pump / well pump / AC). ---
    var loads = job ? job.loads.slice() : [];
    var w = p.words.toLowerCase();
    if (w.indexOf("sump pump") !== -1 && loads.indexOf("Sump pump") === -1) loads.push("Sump pump");
    if (w.indexOf("well pump") !== -1 && loads.indexOf("Well pump") === -1) loads.push("Well pump");
    if ((w.indexOf("air condition") !== -1 || /\bac\b/.test(w)) && loads.indexOf("Air conditioning") === -1) loads.push("Air conditioning");

    // --- Budget: quiz bucket or matcher budget_max. ---
    var budgetLabel = null, budgetMax = null;
    if (p.budgetMax && p.budgetMax > 0) {
      budgetMax = p.budgetMax;
      budgetLabel = "Under $" + fmt(budgetMax);
    } else if (BUDGETS[p.budget]) {
      budgetLabel = BUDGETS[p.budget].label;
      budgetMax = BUDGETS[p.budget].max;
    }
    var overBy = (budgetMax !== null) ? m.price - budgetMax : null;

    document.title = "Your Outage Plan — " + m.short + " — Garage Reviews";
    $("plan").hidden = false;
    $("empty").hidden = true;

    // Header / what they asked for.
    var asked = [];
    if (job) asked.push(job.label);
    else if (p.words) asked.push("“" + p.words + "”");
    else asked.push("A generator for an outage");
    if (p.fuel === "solar") asked.push("solar only, no fuel");
    else if (p.fuel === "gas" || p.fuel === "dual-fuel") asked.push("gas or propane");
    if (budgetLabel) asked.push("budget " + budgetLabel);
    $("plan-summary").textContent = asked.join(" · ") + ".";

    // 1. WHAT TO BUY
    $("buy-name").textContent = m.name;
    $("buy-price").textContent = m.priceDisplay;
    $("buy-rating").textContent = m.rating;
    $("buy-specs").textContent = m.specs + ".";
    var stockEl = $("buy-stock");
    stockEl.textContent = m.stock + " — checked Nov 22, 2026";
    stockEl.className = m.inStock ? "stock in" : "stock out";
    $("buy-link").href = m.link;
    $("buy-link").textContent = "Shop the " + m.short + " — " + m.priceDisplay;
    var alt = $("buy-alt");
    if (m.altLink) {
      alt.hidden = false;
      $("buy-alt-link").href = m.altLink;
      $("buy-alt-link").textContent = "Same " + m.short + " on eBay — " + m.altPriceDisplay + " (" + m.altStock + ", checked Nov 22, 2026)";
    } else {
      alt.hidden = true;
    }
    $("buy-review").href = m.reviewUrl;
    $("buy-review").textContent = "Read the full " + m.short + " review";
    if (!m.inStock) {
      $("buy-stock-note").hidden = false;
      $("buy-stock-note").textContent = m.altLink
        ? "The Walmart listing is out of stock right now — the eBay option above is in stock. Check the listing before you buy."
        : "This one is out of stock on Walmart right now — check the listing before you buy, or re-run the finder for an in-stock option.";
    } else {
      $("buy-stock-note").hidden = true;
    }

    // 2. WHAT IT RUNS
    var runsEl = $("runs-list");
    if (loads.length) {
      runsEl.innerHTML = loads.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("");
    } else {
      runsEl.innerHTML = "<li>Your loads, as described — see “what you asked for” above.</li>";
    }
    var fitEl = $("runs-fit");
    if (m.type === "transfer-switch") {
      // A transfer switch generates no power — it safely connects a
      // portable generator (up to 7,500W) to 10 home circuits. Never run
      // the watts fit check on it: effectiveWatts is null here by design.
      fitEl.className = "fit unknown";
      fitEl.innerHTML = "<strong>This is a transfer switch, not a generator.</strong> It does not generate power — it safely connects a portable generator (up to 7,500W) to 10 home circuits. Pair it with a generator from the roster; the switch alone runs nothing.";
    } else if (jobWatts) {
      if (runW >= jobWatts) {
        fitEl.className = "fit ok";
        fitEl.innerHTML = "<strong>It fits.</strong> This job needs about " + fmt(jobWatts) +
          " running watts (estimate) and the " + esc(m.short) + " delivers " + fmt(runW) +
          (isStation ? "W continuous" + (m.surgeW ? " (" + fmt(m.surgeW) + "W surge for motor starts)" : "") : " running watts on gas") +
          " — enough to run these loads together.";
      } else {
        fitEl.className = "fit no";
        fitEl.innerHTML = "<strong>It will not run the whole job at once.</strong> This job needs about " +
          fmt(jobWatts) + " running watts (estimate) and the " + esc(m.short) + " delivers " +
          fmt(runW) + (isStation ? "W continuous" : " running watts on gas") +
          " — short by about " + fmt(jobWatts - runW) + " watts. Run the loads in turns, or pick a bigger unit.";
        if (p.use === "whole" && m !== ROSTER.wgen9500df) {
          fitEl.innerHTML += " For whole-home backup, the WGen9500DF in the roster delivers 9,500 running watts on gas.";
        }
      }
    } else {
      fitEl.className = "fit unknown";
      fitEl.textContent = "No wattage estimate for this job — add up the running watts on your appliances' labels and compare with the " +
        fmt(runW) + (isStation ? "W continuous" : " running watts on gas") + " this unit delivers.";
    }
    if (m.type === "transfer-switch") {
      $("runs-note").textContent = "A transfer switch does not generate power — pair it with a portable generator (up to 7,500W) and have it installed by a licensed electrician.";
    } else if (isStation) {
      $("runs-note").textContent = "A power station runs a fridge for hours, not days — recharge it from the wall or a solar panel between uses.";
    } else if (m.runtime) {
      $("runs-note").textContent = "Runtime: " + m.runtime + ".";
    } else {
      $("runs-note").textContent = "";
    }

    // 3. WHAT IT COSTS
    $("cost-price").textContent = m.priceDisplay;
    var costNote = $("cost-note");
    if (overBy !== null && overBy > 0) {
      costNote.className = "cost-over";
      costNote.innerHTML = "<strong>Over your budget by $" + fmt(overBy) + ".</strong> Your budget was " +
        esc(budgetLabel) + " and this pick costs " + m.priceDisplay + ". We would rather tell you that than stretch it.";
    } else if (budgetMax !== null) {
      costNote.className = "cost-ok";
      costNote.textContent = "Within your budget of " + budgetLabel + ".";
    } else {
      costNote.className = "";
      costNote.textContent = "No budget was given with this plan.";
    }
    $("cost-extra").textContent = m.type === "transfer-switch"
      ? "That is the switch kit only. A generator to feed it, and electrician installation, are extra and are not priced here."
      : "That is the unit only. Fuel, extension cords, and — for whole-home use — an electrician-installed transfer switch are extra and are not priced here.";

    // 4. SAFETY BASICS — from the review pages (iGen4500DF review,
    // WGen9500DF review, homepage outage guide).
    var safetyEl = $("safety-list");
    if (m.type === "transfer-switch") {
      safetyEl.innerHTML =
        "<li><strong>Have it installed by a licensed electrician.</strong> A transfer switch is wired into your home's panel — this is not a DIY job.</li>" +
        "<li><strong>Never backfeed.</strong> Never plug a generator into a wall outlet to feed the house. A transfer switch is the safe way to power home circuits from a generator.</li>" +
        "<li><strong>Stay under 7,500W.</strong> The switch is rated for 30 amps / 7,500W max — do not feed it with a larger generator.</li>";
    } else if (isStation) {
      safetyEl.innerHTML =
        "<li><strong>No fuel, no fumes — safe indoors.</strong> This is a battery power station, not an engine. There is no exhaust and no carbon-monoxide risk.</li>" +
        "<li><strong>Never backfeed.</strong> Never plug it into a wall outlet to feed the house — use its outlets for your appliances directly.</li>" +
        "<li><strong>Do not overload it.</strong> Stay under " + fmt(m.continuousW) + "W continuous" + (m.surgeW ? " (" + fmt(m.surgeW) + "W surge for motor starts)" : "") + ".</li>";
    } else {
      safetyEl.innerHTML =
        "<li><strong>Run it outdoors, at least 20 feet from the house,</strong> exhaust pointing away — never in a garage or under a porch roof. Carbon monoxide is odorless and kills every storm season.</li>" +
        "<li><strong>Never backfeed into a wall outlet.</strong> Never send generator power into a wall outlet. For whole-home use, have an electrician install a transfer switch.</li>" +
        "<li><strong>Let it cool before refueling.</strong> Never refuel a hot generator — shut it down, wait for it to cool, then fill the tank.</li>";
    }

    $("plan-date").textContent = "Prices and stock checked Nov 22, 2026 — re-check the listing before you buy; prices can change.";
  }

  var printBtn = $("print-btn");
  if (printBtn) {
    printBtn.addEventListener("click", function () { window.print(); });
  }

  render(params());
})();

// ---------------------------------------------------------------------------
// Query-param contract (finder -> plan page)
//   /outage-plan/?product=<roster id>&use=<small|essentials|whole>
//                 &fuel=<gas|solar|either>&budget=<under500|around1000|over1000>
//   /outage-plan/?product=<roster id>&use_case=<small|essentials|whole-home|other>
//                 &fuel=<dual-fuel|solar|any>&budget_max=<number>
//                 &watts=<number>&q=<visitor's plain words>
// Either style works; the plan page normalises them. `product` must be a
// roster id (igen4500df, wgen9500df, igen4000dfc, jackery1000v2, wgen3600c,
// igen2500, g12kbn, delta3classical1000, gxs4300i, ai4000s, wen4750w,
// reliance310crk, g1200sg, wendf472, wgen9500dfc, champion201319, river2pro,
// jackery300v2, jackery300lifepo4, igen12000dfc, igen2800dfc, igen5000c,
// xp13000hx, igen5000, anker-solix-c1000x-gen2, wen-df680ix, wen-df480ix,
// wen-56360i, jackery1000plus-restored, river3plus, bluetti-ac70,
// wgen7500dfc, jackery2000v2, pecron-f1000lfp,
// bluetti-elite-30-v2, oukitel-p2001-plus, greenworks-60v-2000w-inverter,
// bluetti-elite-10, bailibatt-2000w, jackery-homepower-1000-v2,
// champion-6500w-rv-ready-inverter, jackery-explorer-2000-v2-solar-bundle,
// pulsar-pg12000b, pulsar-pgx60bisrco, wen-df451i,
// champion-7250w-open-frame-inverter, pulsar-gd10kbn) —
// anything else shows the empty state. No params at all -> empty state.
// Email delivery is PHASE 2 and is not part of this page.
// ---------------------------------------------------------------------------
