// Sticky buy banner — garagereviews.us
// Shows the fixed bottom buy banner once the reader scrolls past the page's
// top buy section, hides it when the footer disclaimer scrolls into view
// (so it never covers the disclaimer), and respects a manual dismiss.
(function () {
  var banner = document.querySelector('.sticky-buy');
  if (!banner) return;
  var trigger = document.querySelector('main .buy-row') || document.querySelector('.buy-row');
  if (!trigger) return; // no buy section on this page — no banner
  var dismissed = false;
  var pastTop = false;
  var nearEnd = false;
  function update() {
    banner.classList.toggle('show', !dismissed && pastTop && !nearEnd);
  }
  var closeBtn = banner.querySelector('.sticky-buy-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      dismissed = true;
      update();
    });
  }
  if ('IntersectionObserver' in window) {
    var topObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        pastTop = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        update();
      });
    });
    topObs.observe(trigger);
    var endTargets = [];
    var disclosure = document.querySelector('p.disclosure');
    if (disclosure) endTargets.push(disclosure);
    var footer = document.querySelector('footer');
    if (footer) endTargets.push(footer);
    if (endTargets.length) {
      var endObs = new IntersectionObserver(function (entries) {
        nearEnd = entries.some(function (entry) { return entry.isIntersecting; });
        update();
      }, { rootMargin: '0px 0px 72px 0px' });
      endTargets.forEach(function (el) { endObs.observe(el); });
    }
  } else {
    // No IntersectionObserver: show after scrolling past the buy section.
    window.addEventListener('scroll', function () {
      pastTop = window.scrollY > trigger.offsetTop + trigger.offsetHeight;
      update();
    }, { passive: true });
  }
})();
