// Ask Garage Reviews — Pages Function (POST /api/ask).
//
// RAG over the site's own verified content only. Retrieval runs against the
// bundled knowledge base (ask/kb.json: 73 chunks from the 7 live pages,
// embedded with @cf/baai/bge-base-en-v1.5) with in-memory cosine similarity.
// If a VECTORIZE binding is ever attached (index garage-reviews-kb, same
// model/dimensions), retrieval prefers it and falls back to the bundle.
// Answers are generated with Workers AI (@cf/meta/llama-3.3-70b-instruct-fp8-fast)
// under a strict grounding prompt: only the retrieved excerpts may be used,
// every answer cites its source pages, and anything unanswerable gets an
// explicit "I don't know" instead of an invented spec, price, or rating.
//
// Bindings required on the Pages project (both environments):
//   AI        — Workers AI binding (attached via API 2026-11-18)
//   VECTORIZE — optional, Vectorize index garage-reviews-kb (not yet created:
//               the API token available to agents lacks vectorize.write)
//
// Cost: Workers AI free tier is 10,000 neurons/day. One question costs
// roughly ~120 neurons (one embedding + one short chat), so ~80 questions a
// day fit inside the free allowance. No paid plan, no billing change.

const EMBED_MODEL = '@cf/baai/bge-base-en-v1.5';
const CHAT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const KB_URL_PATH = '/ask/kb.json';
const TOP_K = 5;
const MIN_SCORE = 0.45; // below this, the KB does not answer the question
const IDK = "I don't know — our reviews don't cover that yet.";

const SYSTEM_PROMPT = [
  'You answer questions about Garage Reviews (garagereviews.us), a generator',
  'review site. Answer ONLY from the excerpts below, which come from the',
  "site's own published pages. Rules:",
  '1. Never invent a spec, price, rating, stock status, runtime, or feature.',
  '   If a figure is not in the excerpts, say so instead of guessing.',
  '2. Keep the answer short (2-5 sentences, or a short list when comparing).',
  '3. Cite every factual claim inline like [1], [2], matching the numbered',
  '   excerpt list. Do not cite anything that is not in the excerpts.',
  '4. Prices and stock were checked Nov 19, 2026 and can change — say that',
  '   whenever you quote a price or stock status.',
  "5. If the excerpts do not answer the question, reply with exactly:",
  `   "${IDK}"`,
  '6. Plain text only — no markdown headings, no links in the answer itself.',
].join('\n');

// ---- KB loading (cached across warm invocations) ----
let kbCache = null;
let kbCacheAt = 0;

async function loadKb(request, env) {
  if (kbCache && Date.now() - kbCacheAt < 10 * 60 * 1000) return kbCache;
  let res = null;
  if (env.ASSETS) {
    try {
      res = await env.ASSETS.fetch(new Request(new URL(KB_URL_PATH, request.url)));
    } catch {
      res = null;
    }
  }
  if (!res || !res.ok) {
    res = await fetch(new URL(KB_URL_PATH, request.url));
  }
  if (!res.ok) throw new Error('KB fetch failed: ' + res.status);
  const kb = await res.json();
  // Precompute unit norms once so per-query cosine is cheap.
  for (const c of kb.chunks) {
    let n = 0;
    for (const v of c.values) n += v * v;
    c._norm = Math.sqrt(n) || 1;
  }
  kbCache = kb;
  kbCacheAt = Date.now();
  return kb;
}

function cosine(a, aNorm, b, bNorm) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot / (aNorm * bNorm);
}

function topChunks(kb, qvec, k) {
  let qn = 0;
  for (const v of qvec) qn += v * v;
  qn = Math.sqrt(qn) || 1;
  const scored = kb.chunks.map((c) => ({
    chunk: c,
    score: cosine(qvec, qn, c.values, c._norm),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

// ---- Retrieval: Vectorize first when bound, bundled KB otherwise ----
async function retrieve(request, env, qvec) {
  const kb = await loadKb(request, env);
  if (env.VECTORIZE) {
    try {
      const res = await env.VECTORIZE.query(qvec, { topK: TOP_K, returnMetadata: 'all' });
      const matches = (res.matches || []).filter((m) => m.score >= MIN_SCORE);
      if (matches.length) {
        const byId = new Map(kb.chunks.map((c) => [c.id, c]));
        return matches.map((m) => {
          const meta = m.metadata || {};
          const chunk = byId.get(meta.id || m.id) || {
            id: String(m.id),
            url: meta.url || '',
            title: meta.title || '',
            section: meta.section || '',
            text: meta.text || '',
          };
          return { chunk, score: m.score, via: 'vectorize' };
        });
      }
      // Bound index returned nothing useful — fall through to the bundle.
    } catch {
      // Vectorize unavailable at runtime — fall through to the bundle.
    }
  }
  return topChunks(kb, qvec, TOP_K)
    .filter((r) => r.score >= MIN_SCORE)
    .map((r) => ({ ...r, via: 'bundled-kb' }));
}

// ---- Light per-IP abuse guard (best effort, per isolate) ----
const seen = new Map();
function rateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const hits = (seen.get(ip) || []).filter((t) => now - t < 60_000);
  hits.push(now);
  seen.set(ip, hits);
  if (seen.size > 500) {
    const oldest = seen.keys().next().value;
    seen.delete(oldest);
  }
  return hits.length > 10; // 10 questions/minute per IP
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function onRequestGet() {
  return json({
    ok: true,
    usage: 'POST {"question": "Which generator is the quietest?"}',
    sources: 'Answers come only from garagereviews.us reviews, comparisons, and videos.',
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.AI) {
      return json(
        { error: 'AI binding not configured on this deployment. Ask the site owner to attach the Workers AI binding (AI) to the garagereviews-site Pages project.' },
        503,
      );
    }
    const ip = request.headers.get('CF-Connecting-IP') || '';
    if (rateLimited(ip)) {
      return json({ error: 'Too many questions — please wait a minute and try again.' }, 429);
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Send JSON: {"question": "..."}' }, 400);
    }
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    if (question.length < 3 || question.length > 500) {
      return json({ error: 'Question must be between 3 and 500 characters.' }, 400);
    }

    const emb = await env.AI.run(EMBED_MODEL, { text: [question] });
    const qvec = emb.data[0];
    const retrieved = await retrieve(request, env, qvec);

    if (!retrieved.length) {
      return json({
        answer: IDK,
        idk: true,
        sources: [],
        retrieved: 0,
        model: CHAT_MODEL,
      });
    }

    const excerpts = retrieved
      .map((r, i) => `[${i + 1}] (${r.chunk.title} — ${r.chunk.section})\n${r.chunk.text}`)
      .join('\n\n');
    const chat = await env.AI.run(CHAT_MODEL, {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Question: ${question}\n\nExcerpts:\n${excerpts}\n\nAnswer the question using only the excerpts above.`,
        },
      ],
    });
    const answer = (chat.response || '').trim() || IDK;

    // Dedupe sources by URL, in retrieval order.
    const sources = [];
    const seenUrls = new Set();
    for (const r of retrieved) {
      if (!r.chunk.url || seenUrls.has(r.chunk.url)) continue;
      seenUrls.add(r.chunk.url);
      sources.push({ title: r.chunk.title, url: r.chunk.url, section: r.chunk.section });
    }
    return json({
      answer,
      idk: answer === IDK,
      sources,
      retrieved: retrieved.length,
      retrieval: retrieved[0].via,
      topScore: Math.round(retrieved[0].score * 1000) / 1000,
      model: CHAT_MODEL,
    });
  } catch (err) {
    return json({ error: 'Ask failed: ' + (err && err.message ? err.message : 'unknown error') }, 500);
  }
}
