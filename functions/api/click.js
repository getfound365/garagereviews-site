// Click + view collector for garagereviews.us (POST /api/click).
//
// Storage: KV namespace bound as CLICK_KV on the Pages project.
//   Dashboard step (one-time): Cloudflare dashboard > Workers & Pages >
//   garagereviews.us project > Settings > Functions > KV namespace bindings:
//   add binding, variable name CLICK_KV, namespace "garage-clicks" (create it
//   if it doesn't exist), then redeploy. Until then this endpoint answers
//   503 {error:"storage_not_bound"} and the collector silently drops events —
//   pages keep working, nothing is faked.
// Event keys: c:<13-digit-ms>:<rand> for clicks, v:<13-digit-ms>:<rand> for
// views. Values are JSON {t, p, u?, r?, ts}. No personal data is stored:
// page path + link URL + retailer only. No IP / user-agent is recorded
// beyond what Cloudflare logs by default.
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'bad_json' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!body || (body.t !== 'c' && body.t !== 'v')) {
    return new Response(JSON.stringify({ ok: false, error: 'bad_event' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (typeof body.p !== 'string' || !body.p.startsWith('/') || body.p.length > 200) {
    return new Response(JSON.stringify({ ok: false, error: 'bad_page' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  let url = null;
  let retailer = null;
  if (body.t === 'c') {
    if (typeof body.u !== 'string' || !/^https?:\/\//i.test(body.u) || body.u.length > 500) {
      return new Response(JSON.stringify({ ok: false, error: 'bad_url' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    url = body.u;
    retailer = typeof body.r === 'string' && body.r.length <= 60 ? body.r : 'Other';
  }
  if (!env.CLICK_KV) {
    return new Response(JSON.stringify({ ok: false, error: 'storage_not_bound' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const key = body.t + ':' + String(ts).padStart(13, '0') + ':' + rand;
  const value = JSON.stringify({ t: body.t, p: body.p, u: url, r: retailer, ts });
  try {
    await env.CLICK_KV.put(key, value);
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'write_failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
