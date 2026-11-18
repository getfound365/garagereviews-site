// Ingest the Ask Garage Reviews knowledge base.
//
// Rebuilds ask/kb.json from the LIVE pages on garagereviews.us:
//   1. Fetch the 7 source pages (4 reviews, /compare/,
//      /best-dual-fuel-generators-under-1000/, /videos/)
//   2. Extract clean text from <main>, split into ~1400-char chunks
//   3. Embed each chunk with Workers AI @cf/baai/bge-base-en-v1.5 (768 dims)
//   4. Write ask/kb.json (the bundled KB that functions/api/ask.js reads)
//
// Usage (from the repo root):
//   CLOUDFLARE_ACCOUNT_ID=<id> CLOUDFLARE_API_TOKEN=<token> node scripts/ingest-kb.mjs
//   node scripts/ingest-kb.mjs --local        # parse local HTML files instead of fetching
//   node scripts/ingest-kb.mjs --vectorize    # ALSO upsert into Vectorize index
//                                              # garage-reviews-kb (creates it if missing)
//
// The API token needs Workers AI run permission for embedding, and (only with
// --vectorize) Vectorize Read + Write. No token is ever written to disk.
// Re-run whenever a review, price, stock status, or ranking changes — the KB
// is a snapshot, so stale chunks would serve stale answers.
//
// NOTE (2026-11-18): the Cloudflare API token available to agents on this
// project has Workers AI run permission but NOT vectorize.write, so the
// --vectorize step is currently blocked for agents. The Vectorize index
// (garage-reviews-kb, 768 dims, cosine) still needs creating once, from the
// dashboard (Workers & Pages > Vectorize > Create index) or with a token
// that has Vectorize Write. functions/api/ask.js already prefers a bound
// VECTORIZE index when one exists and falls back to ask/kb.json otherwise.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EMBED_MODEL = '@cf/baai/bge-base-en-v1.5';
const INDEX_NAME = 'garage-reviews-kb';
const INDEX_DIMS = 768;

const PAGES = [
  { file: 'reviews/westinghouse-igen4500df/index.html', url: 'https://garagereviews.us/reviews/westinghouse-igen4500df/', title: 'Westinghouse iGen4500DF Review' },
  { file: 'reviews/westinghouse-wgen9500df/index.html', url: 'https://garagereviews.us/reviews/westinghouse-wgen9500df/', title: 'Westinghouse WGen9500DF Review' },
  { file: 'reviews/westinghouse-igen4000dfc/index.html', url: 'https://garagereviews.us/reviews/westinghouse-igen4000dfc/', title: 'Westinghouse iGen4000DFc Review' },
  { file: 'reviews/jackery-explorer-1000-v2/index.html', url: 'https://garagereviews.us/reviews/jackery-explorer-1000-v2/', title: 'Jackery Explorer 1000 v2 Review' },
  { file: 'compare/index.html', url: 'https://garagereviews.us/compare/', title: 'Compare All Generators' },
  { file: 'best-dual-fuel-generators-under-1000/index.html', url: 'https://garagereviews.us/best-dual-fuel-generators-under-1000/', title: 'Best Dual Fuel Generator Under $1000' },
  { file: 'videos/index.html', url: 'https://garagereviews.us/videos/', title: 'Video Reviews' },
];

const DROP_SECTION = /^(Additional Details|Product Offer|More from the roster|More video reviews coming)$/i;
const DROP_LINE = /^(Links on this page are paid links|As a Walmart Creator|Prices checked|← Back to Garage Reviews|Compare all generators|Best dual-fuel|Find your generator)/i;

function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘').replace(/&rdquo;/g, '”').replace(/&ldquo;/g, '“')
    .replace(/&middot;/g, '·').replace(/&hellip;/g, '…').replace(/&[a-z]+;/g, ' ');
}

function blocksFromMain(html) {
  const main = html.match(/<main>([\s\S]*?)<\/main>/);
  if (!main) throw new Error('no <main> found');
  let h = main[1];
  h = h.replace(/<script[\s\S]*?<\/script>/g, ' ');
  h = h.replace(/<style[\s\S]*?<\/style>/g, ' ');
  h = h.replace(/<iframe[^>]*title="([^"]*)"[^>]*>[\s\S]*?<\/iframe>/g, ' Video: $1. ');
  h = h.replace(/<iframe[^>]*>/g, ' ');
  h = h.replace(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/g, '\n@@H@@$1\n');
  h = h.replace(/<\/tr>/g, '\n');
  h = h.replace(/<\/t[dh]>/g, ' | ');
  h = h.replace(/<\/p>|<\/li>|<\/div>|<br\s*\/?>/g, '\n');
  h = h.replace(/<[^>]+>/g, ' ');
  h = decodeEntities(h);
  const lines = h.split('\n').map(l => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean);
  const blocks = [];
  let current = { heading: '', lines: [] };
  for (const line of lines) {
    if (line.startsWith('@@H@@')) {
      if (current.lines.length) blocks.push(current);
      current = { heading: line.replace('@@H@@', '').trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.length) blocks.push(current);
  return blocks;
}

function splitSentences(text) {
  const protectedText = text.replace(/(\d)\.(\d)/g, '$1<DEC>$2');
  const parts = protectedText.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g)?.map(s => s.trim()).filter(Boolean) || [];
  return parts.map(s => s.replace(/<DEC>/g, '.'));
}

function chunkPage(page, html) {
  const out = [];
  let n = 0;
  for (const b of blocksFromMain(html)) {
    if (DROP_SECTION.test(b.heading)) continue;
    const lines = b.lines.filter(l => !DROP_LINE.test(l) && !/^(\||—\s*$)/.test(l));
    if (!lines.length) continue;
    const body = lines.join(' ').replace(/\s*\|\s*/g, ', ').replace(/,\s*,/g, ',').trim();
    if (body.length < 40) continue;
    let buf = '';
    const flush = () => {
      if (!buf.trim()) return;
      n += 1;
      out.push({
        id: `${page.file.split('/')[0] === 'reviews' ? page.file.split('/')[1] : page.file.split('/')[0]}-${n}`,
        url: page.url,
        title: page.title,
        section: b.heading || page.title,
        text: `${page.title} — ${b.heading ? b.heading + ': ' : ''}${buf.trim()}`,
      });
      buf = '';
    };
    for (const s of splitSentences(body)) {
      if ((buf + ' ' + s).length > 1400 && buf) flush();
      buf += (buf ? ' ' : '') + s;
    }
    flush();
  }
  return out;
}

async function cfApi(path, accountId, token, method = 'GET', body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!data.success) throw new Error(`${method} ${path} failed: ${JSON.stringify(data.errors)}`);
  return data.result;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const useLocal = args.has('--local');
  const useVectorize = args.has('--vectorize');
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    throw new Error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in the environment.');
  }

  // 1-2. Fetch/extract + chunk.
  const chunks = [];
  for (const page of PAGES) {
    const html = useLocal
      ? readFileSync(join(ROOT, page.file), 'utf8')
      : await (await fetch(page.url)).text();
    const pageChunks = chunkPage(page, html);
    console.log(`${page.url}: ${pageChunks.length} chunks`);
    chunks.push(...pageChunks);
  }
  console.log(`total: ${chunks.length} chunks`);

  // 3. Embed in batches of 10.
  const vectors = [];
  for (let i = 0; i < chunks.length; i += 10) {
    const batch = chunks.slice(i, i + 10);
    const result = await cfApi(`/ai/run/${EMBED_MODEL}`, accountId, token, 'POST', {
      text: batch.map(c => c.text),
    });
    vectors.push(...result.data.map(v => v.map(x => Math.round(x * 1000) / 1000)));
    console.log(`embedded ${Math.min(i + 10, chunks.length)}/${chunks.length}`);
  }

  // 4. Write the bundled KB.
  const kb = {
    model: EMBED_MODEL,
    dimensions: INDEX_DIMS,
    metric: 'cosine',
    generated_at: new Date().toISOString().slice(0, 10),
    sources: [...new Set(chunks.map(c => c.url))],
    chunks: chunks.map((c, i) => ({ ...c, values: vectors[i] })),
  };
  writeFileSync(join(ROOT, 'ask/kb.json'), JSON.stringify(kb));
  console.log(`wrote ask/kb.json (${Math.round(Buffer.byteLength(JSON.stringify(kb)) / 1024)} KB)`);

  // 5. Optional Vectorize upsert (needs Vectorize Read + Write on the token).
  if (useVectorize) {
    const indexes = await cfApi('/vectorize/v2/indexes', accountId, token);
    if (!indexes.some(ix => ix.name === INDEX_NAME)) {
      await cfApi('/vectorize/v2/indexes', accountId, token, 'POST', {
        name: INDEX_NAME,
        config: { dimensions: INDEX_DIMS, metric: 'cosine' },
        description: 'Garage Reviews knowledge base: generator reviews, comparisons and guides from garagereviews.us',
      });
      console.log(`created Vectorize index ${INDEX_NAME}`);
    }
    for (let i = 0; i < chunks.length; i += 100) {
      const batch = chunks.slice(i, i + 100);
      await cfApi(`/vectorize/v2/indexes/${INDEX_NAME}/upsert`, accountId, token, 'POST', {
        vectors: batch.map((c, j) => ({
          id: c.id,
          values: vectors[i + j],
          metadata: { id: c.id, url: c.url, title: c.title, section: c.section, text: c.text },
        })),
      });
      console.log(`upserted ${Math.min(i + 100, chunks.length)}/${chunks.length} vectors`);
    }
    console.log('Vectorize upsert complete. Bind it to the Pages project as VECTORIZE, then redeploy.');
  }
}

main().catch((err) => { console.error(err.message); process.exit(1); });
