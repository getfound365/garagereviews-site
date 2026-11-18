// Conversational matcher — plain-words mode for /generator-finder/.
// Separate file so the 3-question quiz script in index.html is untouched.
// Sends the visitor's words to POST /api/match and renders the picks with
// the same .option-card markup/classes the quiz uses, so results look native.
(function () {
  var form = document.getElementById("matcher-form");
  var input = document.getElementById("matcher-input");
  var button = document.getElementById("matcher-submit");
  var status = document.getElementById("matcher-status");
  var result = document.getElementById("matcher-result");
  if (!form || !input || !button || !status || !result) return;

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function pickCard(p) {
    var badge = p.status === "reviewed"
      ? '<span class="verdict reviewed">Reviewed</span>'
      : '<span class="verdict coming">Review coming — specs verified from the listing</span>';
    var cardClass = "option-card" + (p.best ? " best" : "") + (p.alternative ? " matcher-alt" : "");
    var heading = p.alternative ? "In-stock alternative: " : (p.best ? "Best match: " : "");
    var html = '<div class="' + cardClass + '">'
      + "<h3>" + heading + esc(p.name) + "</h3>"
      + "<p>" + badge + "</p>"
      + "<p><strong>" + esc(p.price) + "</strong> &middot; " + esc(p.rating) + "</p>"
      + '<p class="meta">' + (p.in_stock
          ? esc(p.stock) + " — checked Nov 18, 2026"
          : '<span class="oos">Out of stock</span> — checked Nov 18, 2026') + "</p>"
      + "<p>" + esc(p.specs) + ".</p>"
      + "<p>" + esc(p.fit) + "</p>"
      + '<ul class="matcher-reasons">'
      + p.reasons.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("")
      + "</ul>";
    if (p.link) {
      html += '<p><a class="btn" href="' + esc(p.link) + '">Shop the ' + esc(p.short) + ' — <span class="price">' + esc(p.price) + '</span><small>Prices checked Nov 18, 2026 and can change</small></a></p>';
    }
    if (p.alt_link) {
      html += '<p><a class="btn secondary" href="' + esc(p.alt_link) + '">Same ' + esc(p.short) + ' on eBay — <span class="price">' + esc(p.alt_price) + '</span><small>' + esc(p.alt_stock) + ' — checked Nov 18, 2026</small></a></p>';
    }
    if (p.video) {
      html += '<p><a class="watch-video" href="' + esc(p.video) + '">&#9654; Watch the full review</a></p>';
    }
    html += '<p class="meta"><a href="' + esc(p.review_url) + '">Read the full ' + esc(p.short) + ' review</a></p>';
    return html + "</div>";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var query = input.value.trim();
    if (!query) {
      result.hidden = false;
      result.innerHTML = '<p class="matcher-error">Describe what you need first — for example, "backup for my sump pump, quiet, under $800".</p>';
      return;
    }
    button.disabled = true;
    status.textContent = "Reading your words and matching them against the roster…";
    result.hidden = true;
    result.innerHTML = "";

    fetch("/api/match", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: query }),
    })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (out) {
        button.disabled = false;
        status.textContent = "";
        if (!out.ok || !out.data.picks) {
          result.hidden = false;
          result.innerHTML = '<p class="matcher-error">' + esc(out.data.error || "Something went wrong — please try the 3-question quiz above instead.") + "</p>";
          return;
        }
        var d = out.data;
        var html = "";
        if (d.needs && d.needs.summary) {
          html += '<p class="matcher-readback">We read that as: <strong>' + esc(d.needs.summary) + "</strong>"
            + (d.parsed_by === "keywords" ? " <span class=\"meta\">(matched from your words)</span>" : "") + "</p>";
        }
        if (d.note) {
          html += '<p class="matcher-note">' + esc(d.note) + "</p>";
        }
        if (!d.picks.length) {
          html += '<p class="matcher-note">Nothing in the roster fits that job yet — check back as we review more, one video a day.</p>';
        }
        d.picks.forEach(function (p) { html += pickCard(p); });
        // Feature 4 — printable outage plan for the best match. Additions
        // only; the matcher above is untouched. Passes the recommended
        // product plus the visitor's parsed needs and own words.
        if (d.picks.length && d.picks[0].best) {
          var planParams = "product=" + encodeURIComponent(d.picks[0].id)
            + "&use_case=" + encodeURIComponent(d.needs.use_case || "other")
            + "&fuel=" + encodeURIComponent(d.needs.fuel || "any");
          if (d.needs.budget_max) planParams += "&budget_max=" + encodeURIComponent(d.needs.budget_max);
          if (d.needs.running_watts_needed) planParams += "&watts=" + encodeURIComponent(d.needs.running_watts_needed);
          if (d.query) planParams += "&q=" + encodeURIComponent(d.query);
          html += '<p><a class="btn secondary" href="' + esc("/outage-plan/?" + planParams) + '">Get your printable outage plan — ' + esc(d.picks[0].short) + '<small>What to buy, what it runs, what it costs — one page, ready to print</small></a></p>';
        }
        html += '<p class="footnote">Out-of-stock flags are as of Nov 18, 2026. <a href="/compare/">Compare all 4 models side by side</a></p>';
        result.innerHTML = html;
        result.hidden = false;
        result.scrollIntoView({ behavior: "smooth", block: "start" });
      })
      .catch(function () {
        button.disabled = false;
        status.textContent = "";
        result.hidden = false;
        result.innerHTML = '<p class="matcher-error">Could not reach the matcher — check your connection and try again, or use the 3-question quiz above.</p>';
      });
  });

  // Example chips fill the box so visitors can see what plain words work.
  document.querySelectorAll(".matcher-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      input.value = chip.getAttribute("data-query") || chip.textContent;
      input.focus();
    });
  });
})();
