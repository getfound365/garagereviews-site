// Click report for the dashboard (GET /api/clicks).
// Reads the raw click/view events written by POST /api/click (KV CLICK_KV)
// and aggregates them: totals, per page, per link, per retailer, per day,
// plus CTR (clicks / views). CTR definition: per page = that page's clicks
// divided by that page's views; per link = the link's clicks divided by the
// views of the pages where the link was clicked (denominator shown in the
// response so the dashboard can label it honestly).
// If CLICK_KV is not bound yet, answers {ok:false, error:"storage_not_bound"}
// and the dashboard shows the one-time setup step instead of fake numbers.
// Read cap: 10,000 events per report call (far above current traffic).
export async function onRequest(context) {
  const { request, env } = context;
  const json = (obj, status) => new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  if (request.method !== 'GET') return json({ ok: false, error: 'method_not_allowed' }, 405);
  if (!env.CLICK_KV) return json({ ok: false, error: 'storage_not_bound' }, 200);

  const MAX_EVENTS = 10000;
  const events = [];
  for (const prefix of ['c:', 'v:']) {
    let cursor = undefined;
    let guard = 0;
    while (events.length < MAX_EVENTS && guard < 20) {
      guard++;
      const page = await env.CLICK_KV.list({ prefix, limit: 1000, cursor });
      const keys = page.keys.map((k) => k.name);
      for (let i = 0; i < keys.length; i += 100) {
        const chunk = keys.slice(i, i + 100);
        const vals = await Promise.all(chunk.map((k) => env.CLICK_KV.get(k, 'json')));
        for (const v of vals) if (v && (v.t === 'c' || v.t === 'v')) events.push(v);
      }
      if (page.list_complete || !page.cursor) break;
      cursor = page.cursor;
    }
    if (events.length >= MAX_EVENTS) break;
  }

  const now = Date.now();
  const dayMs = 86400000;
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const todayStart = startOfToday.getTime();

  const byPage = {};   // path -> {views, clicks}
  const byLink = {};   // url -> {retailer, clicks, pages:{path:clicks}}
  const byRetailer = {}; // retailer -> {clicks}
  const byDay = {};    // YYYY-MM-DD -> {views, clicks}
  let totalClicks = 0, totalViews = 0, clicksToday = 0, clicks7d = 0, clicks30d = 0;

  const dayKey = (ts) => new Date(ts).toISOString().slice(0, 10);
  for (const e of events) {
    const p = e.p || '(unknown)';
    if (!byPage[p]) byPage[p] = { views: 0, clicks: 0 };
    const dk = dayKey(e.ts || now);
    if (!byDay[dk]) byDay[dk] = { views: 0, clicks: 0 };
    if (e.t === 'v') {
      totalViews++;
      byPage[p].views++;
      byDay[dk].views++;
    } else {
      totalClicks++;
      byPage[p].clicks++;
      byDay[dk].clicks++;
      const r = e.r || 'Other';
      if (!byRetailer[r]) byRetailer[r] = { clicks: 0 };
      byRetailer[r].clicks++;
      const u = e.u || '(unknown)';
      if (!byLink[u]) byLink[u] = { retailer: r, clicks: 0, pages: {} };
      byLink[u].clicks++;
      byLink[u].pages[p] = (byLink[u].pages[p] || 0) + 1;
      if (e.ts >= todayStart) clicksToday++;
      if (e.ts >= now - 7 * dayMs) clicks7d++;
      if (e.ts >= now - 30 * dayMs) clicks30d++;
    }
  }

  // Last 30 days, newest first, zero-filled.
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    const k = d.toISOString().slice(0, 10);
    const row = byDay[k] || { views: 0, clicks: 0 };
    days.push({ date: k, views: row.views, clicks: row.clicks });
  }

  const pageRows = Object.entries(byPage).map(([path, v]) => ({
    page: path, views: v.views, clicks: v.clicks,
    ctr: v.views ? +(v.clicks / v.views).toFixed(4) : null,
  })).sort((a, b) => b.clicks - a.clicks || b.views - a.views);

  const linkRows = Object.entries(byLink).map(([url, v]) => {
    const pages = Object.keys(v.pages);
    const denomViews = pages.reduce((sum, p) => sum + (byPage[p] ? byPage[p].views : 0), 0);
    return {
      url, retailer: v.retailer, clicks: v.clicks, pages,
      viewsOnPages: denomViews,
      ctr: denomViews ? +(v.clicks / denomViews).toFixed(4) : null,
    };
  }).sort((a, b) => b.clicks - a.clicks);

  const retailerRows = Object.entries(byRetailer).map(([retailer, v]) => ({ retailer, clicks: v.clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  return json({
    ok: true,
    generatedAt: new Date(now).toISOString(),
    eventsRead: events.length,
    totals: {
      clicks: totalClicks, views: totalViews,
      ctr: totalViews ? +(totalClicks / totalViews).toFixed(4) : null,
      clicksToday, clicks7d, clicks30d,
    },
    byRetailer: retailerRows,
    byPage: pageRows,
    byLink: linkRows,
    byDay: days,
  });
}
