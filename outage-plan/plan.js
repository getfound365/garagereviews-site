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
      price: 739, priceDisplay: "$739",
      rating: "4.3 stars from 587 ratings",
      stock: "In stock", inStock: true,
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
      price: 462, priceDisplay: "$462",
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
      rating: "4.9 stars from 70 ratings",
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
      price: 368.88, priceDisplay: "$368.88",
      rating: "4.3 stars from 169 ratings",
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
      stock: "In stock", inStock: true,
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
      price: 149, priceDisplay: "$149",
      rating: "4.0 stars from 321 ratings",
      stock: "Out of stock", inStock: false,
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
      stock: "In stock", inStock: true,
      gasRunningW: 3800, gasPeakW: 4750,
      propaneRunningW: 3500, propanePeakW: 4350,
      runtime: "~11 hours on gasoline at 50% load",
      noiseDba: null, weightLb: 103.2,
      specs: "4,750 peak / 3,800 running watts on gas · 4,350 peak / 3,500 running on propane · 120/240V · 103.2 lb · recoil start only · no CO sensor listed",
      link: "https://walmrt.us/4tadlYD",
      reviewUrl: "/reviews/wen-df472/"
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
    stockEl.textContent = m.stock + " — checked Nov 19, 2026";
    stockEl.className = m.inStock ? "stock in" : "stock out";
    $("buy-link").href = m.link;
    $("buy-link").textContent = "Shop the " + m.short + " — " + m.priceDisplay;
    var alt = $("buy-alt");
    if (m.altLink) {
      alt.hidden = false;
      $("buy-alt-link").href = m.altLink;
      $("buy-alt-link").textContent = "Same " + m.short + " on eBay — " + m.altPriceDisplay + " (" + m.altStock + ", checked Nov 19, 2026)";
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
          (isStation ? "W continuous (" + fmt(m.surgeW) + "W surge for motor starts)" : " running watts on gas") +
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
        "<li><strong>Do not overload it.</strong> Stay under " + fmt(m.continuousW) + "W continuous (" + fmt(m.surgeW) + "W surge for motor starts).</li>";
    } else {
      safetyEl.innerHTML =
        "<li><strong>Run it outdoors, at least 20 feet from the house,</strong> exhaust pointing away — never in a garage or under a porch roof. Carbon monoxide is odorless and kills every storm season.</li>" +
        "<li><strong>Never backfeed into a wall outlet.</strong> Never send generator power into a wall outlet. For whole-home use, have an electrician install a transfer switch.</li>" +
        "<li><strong>Let it cool before refueling.</strong> Never refuel a hot generator — shut it down, wait for it to cool, then fill the tank.</li>";
    }

    $("plan-date").textContent = "Prices and stock checked Nov 19, 2026 — re-check the listing before you buy; prices can change.";
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
// reliance310crk, g1200sg, wendf472) —
// anything else shows the empty state. No params at all -> empty state.
// Email delivery is PHASE 2 and is not part of this page.
// ---------------------------------------------------------------------------
