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
  { file: 'reviews/westinghouse-wgen3600c/index.html', url: 'https://garagereviews.us/reviews/westinghouse-wgen3600c/', title: 'Westinghouse WGen3600c Review' },
  { file: 'reviews/westinghouse-igen2500/index.html', url: 'https://garagereviews.us/reviews/westinghouse-igen2500/', title: 'Westinghouse iGen2500 Review' },
  { file: 'reviews/pulsar-g12kbn/index.html', url: 'https://garagereviews.us/reviews/pulsar-g12kbn/', title: 'Pulsar G12KBN Review' },
  { file: 'reviews/ecoflow-delta-3-classical-1000/index.html', url: 'https://garagereviews.us/reviews/ecoflow-delta-3-classical-1000/', title: 'EcoFlow DELTA 3 Classical 1000 Review' },
  { file: 'reviews/a-ipower-gxs4300i/index.html', url: 'https://garagereviews.us/reviews/a-ipower-gxs4300i/', title: 'A-iPower GXS4300i Review' },
  { file: 'reviews/aceup-energy-ai4000s/index.html', url: 'https://garagereviews.us/reviews/aceup-energy-ai4000s/', title: 'Aceup Energy AI4000S Review' },
  { file: 'reviews/wen-4750w-56475/index.html', url: 'https://garagereviews.us/reviews/wen-4750w-56475/', title: 'WEN 4750W Generator 56475 Review' },
  { file: 'reviews/reliance-controls-310crk/index.html', url: 'https://garagereviews.us/reviews/reliance-controls-310crk/', title: 'Reliance Controls 310CRK Review' },
  { file: 'reviews/pulsar-g1200sg/index.html', url: 'https://garagereviews.us/reviews/pulsar-g1200sg/', title: 'Pulsar G1200SG Review' },
  { file: 'reviews/wen-df472/index.html', url: 'https://garagereviews.us/reviews/wen-df472/', title: 'WEN DF472 Review' },
  { file: 'reviews/westinghouse-wgen9500dfc/index.html', url: 'https://garagereviews.us/reviews/westinghouse-wgen9500dfc/', title: 'Westinghouse WGen9500DFc Review' },
  { file: 'reviews/champion-201319-4500w-dual-fuel-inverter/index.html', url: 'https://garagereviews.us/reviews/champion-201319-4500w-dual-fuel-inverter/', title: 'Champion 201319 4500W Dual Fuel Inverter Review' },
  { file: 'reviews/ecoflow-river-2-pro/index.html', url: 'https://garagereviews.us/reviews/ecoflow-river-2-pro/', title: 'EcoFlow RIVER 2 Pro Review' },
  { file: 'reviews/jackery-explorer-300-v2-auto-kit/index.html', url: 'https://garagereviews.us/reviews/jackery-explorer-300-v2-auto-kit/', title: 'Jackery Explorer 300 v2 Auto Kit Review' },
  { file: 'reviews/jackery-explorer-300-lifepo4/index.html', url: 'https://garagereviews.us/reviews/jackery-explorer-300-lifepo4/', title: 'Jackery Explorer 300 LiFePO4 Review' },
  { file: 'reviews/westinghouse-igen12000dfc/index.html', url: 'https://garagereviews.us/reviews/westinghouse-igen12000dfc/', title: 'Westinghouse iGen12000DFc Review' },
  { file: 'reviews/westinghouse-igen2800dfc/index.html', url: 'https://garagereviews.us/reviews/westinghouse-igen2800dfc/', title: 'Westinghouse iGen2800DFc Review' },
  { file: 'reviews/westinghouse-igen5000c/index.html', url: 'https://garagereviews.us/reviews/westinghouse-igen5000c/', title: 'Westinghouse iGen5000c Review' },
  { file: 'reviews/duromax-xp13000hx/index.html', url: 'https://garagereviews.us/reviews/duromax-xp13000hx/', title: 'DuroMax XP13000HX Review' },
  { file: 'reviews/westinghouse-igen5000/index.html', url: 'https://garagereviews.us/reviews/westinghouse-igen5000/', title: 'Westinghouse iGen5000 Review' },
  { file: 'reviews/anker-solix-c1000x-gen-2/index.html', url: 'https://garagereviews.us/reviews/anker-solix-c1000x-gen-2/', title: 'Anker SOLIX C1000X Gen 2 Review' },
  { file: 'reviews/wen-df680ix/index.html', url: 'https://garagereviews.us/reviews/wen-df680ix/', title: 'WEN DF680iX Review' },
  { file: 'reviews/wen-df480ix/index.html', url: 'https://garagereviews.us/reviews/wen-df480ix/', title: 'WEN DF480iX Review' },
  { file: 'reviews/wen-56360i/index.html', url: 'https://garagereviews.us/reviews/wen-56360i/', title: 'WEN 56360i Review' },
  { file: 'reviews/moultrie-edge-2-pro/index.html', url: 'https://garagereviews.us/reviews/moultrie-edge-2-pro/', title: 'Moultrie Edge 2 Pro Review' },
  { file: 'reviews/moultrie-edge/index.html', url: 'https://garagereviews.us/reviews/moultrie-edge/', title: 'Moultrie Edge Review' },
  { file: 'reviews/moultrie-edge-solar/index.html', url: 'https://garagereviews.us/reviews/moultrie-edge-solar/', title: 'Moultrie EDGE Solar Review' },
  { file: 'reviews/lifepro-rejuvacure-sauna/index.html', url: 'https://garagereviews.us/reviews/lifepro-rejuvacure-sauna/', title: 'LifePro RejuvaCure Sauna Review' },
  { file: 'reviews/campark-tc35/index.html', url: 'https://garagereviews.us/reviews/campark-tc35/', title: 'Campark TC35 Review' },
  { file: 'reviews/jackery-explorer-1000-plus-restored/index.html', url: 'https://garagereviews.us/reviews/jackery-explorer-1000-plus-restored/', title: 'Jackery Explorer 1000 Plus (Restored) Review' },
  { file: 'reviews/moultrie-edge-4/index.html', url: 'https://garagereviews.us/reviews/moultrie-edge-4/', title: 'Moultrie Edge 4 Review' },
  { file: 'reviews/moultrie-edge-4-solar/index.html', url: 'https://garagereviews.us/reviews/moultrie-edge-4-solar/', title: 'Moultrie Edge 4 Solar Review' },
  { file: 'reviews/ecoflow-river-3-plus/index.html', url: 'https://garagereviews.us/reviews/ecoflow-river-3-plus/', title: 'EcoFlow RIVER 3 Plus Review' },
  { file: 'reviews/lifepro-rejuvacure-duet/index.html', url: 'https://garagereviews.us/reviews/lifepro-rejuvacure-duet/', title: 'LifePro RejuvaCure Duet Review' },
  { file: 'reviews/dynamic-barcelona-sauna/index.html', url: 'https://garagereviews.us/reviews/dynamic-barcelona-sauna/', title: 'Dynamic Barcelona Sauna Review' },
  { file: 'reviews/stealth-cam-deceptor-max/index.html', url: 'https://garagereviews.us/reviews/stealth-cam-deceptor-max/', title: 'Stealth Cam Deceptor Max Review' },
  { file: 'reviews/campark-tc32/index.html', url: 'https://garagereviews.us/reviews/campark-tc32/', title: 'Campark TC32 Review' },
  { file: 'reviews/nepsam-portable-sauna/index.html', url: 'https://garagereviews.us/reviews/nepsam-portable-sauna/', title: 'Nepsam Portable Sauna Review' },
  { file: 'reviews/seville-ultrahd-rolling-cabinet/index.html', url: 'https://garagereviews.us/reviews/seville-ultrahd-rolling-cabinet/', title: 'Seville UltraHD Rolling Cabinet Review' },
  { file: 'reviews/workpro-96-workbench/index.html', url: 'https://garagereviews.us/reviews/workpro-96-workbench/', title: 'WORKPRO 96" Workbench Review' },
  { file: 'reviews/mr-heater-buddy-mh9bx/index.html', url: 'https://garagereviews.us/reviews/mr-heater-buddy-mh9bx/', title: 'Mr. Heater Portable Buddy MH9BX Review' },
  { file: 'reviews/bluetti-ac70/index.html', url: 'https://garagereviews.us/reviews/bluetti-ac70/', title: 'Bluetti AC70 Review' },
  { file: 'reviews/mr-heater-big-buddy-mh18b/index.html', url: 'https://garagereviews.us/reviews/mr-heater-big-buddy-mh18b/', title: 'Mr. Heater Big Buddy MH18B Review' },
  { file: 'reviews/tactacam-reveal-x-3-0/index.html', url: 'https://garagereviews.us/reviews/tactacam-reveal-x-3-0/', title: 'Tactacam Reveal X 3.0 Review' },
  { file: 'reviews/spypoint-flex-m-solar-bundle/index.html', url: 'https://garagereviews.us/reviews/spypoint-flex-m-solar-bundle/', title: 'SPYPOINT Flex-M Solar Bundle Review' },
  { file: 'reviews/workpro-24-5-rolling-tool-chest/index.html', url: 'https://garagereviews.us/reviews/workpro-24-5-rolling-tool-chest/', title: 'WORKPRO 24.5-Inch Rolling Tool Chest Review' },
  { file: 'reviews/tactacam-reveal-x-2-0/index.html', url: 'https://garagereviews.us/reviews/tactacam-reveal-x-2-0/', title: 'Tactacam Reveal X 2.0 Review' },
  { file: 'reviews/campark-tc27/index.html', url: 'https://garagereviews.us/reviews/campark-tc27/', title: 'Campark TC27 Review' },
  { file: 'reviews/dewalt-41-tool-chest/index.html', url: 'https://garagereviews.us/reviews/dewalt-41-tool-chest/', title: 'DeWalt 41-Inch 6-Drawer Tool Chest Review' },
  { file: 'reviews/workpro-20-rolling-tool-chest/index.html', url: 'https://garagereviews.us/reviews/workpro-20-rolling-tool-chest/', title: 'WORKPRO 20-Inch Rolling Tool Chest Review' },
  { file: 'reviews/westinghouse-wgen7500dfc/index.html', url: 'https://garagereviews.us/reviews/westinghouse-wgen7500dfc/', title: 'Westinghouse WGen7500DFc Review' },
  { file: 'reviews/jackery-explorer-2000-v2/index.html', url: 'https://garagereviews.us/reviews/jackery-explorer-2000-v2/', title: 'Jackery Explorer 2000 v2 Review' },
  { file: 'reviews/pecron-f1000lfp/index.html', url: 'https://garagereviews.us/reviews/pecron-f1000lfp/', title: 'Pecron F1000LFP Review' },
  { file: 'reviews/netaje-2-person-spectrum-sauna/index.html', url: 'https://garagereviews.us/reviews/netaje-2-person-spectrum-sauna/', title: 'NETAJE 2-Person Spectrum Sauna Review' },
  { file: 'reviews/tactacam-reveal-x-4-0/index.html', url: 'https://garagereviews.us/reviews/tactacam-reveal-x-4-0/', title: 'Tactacam Reveal X 4.0 Review' },
  { file: 'reviews/spypoint-flex-m-twin-pack/index.html', url: 'https://garagereviews.us/reviews/spypoint-flex-m-twin-pack/', title: 'SPYPOINT Flex-M Twin Pack Review' },
  { file: 'reviews/campark-tc36-2-pack/index.html', url: 'https://garagereviews.us/reviews/campark-tc36-2-pack/', title: 'Campark TC36 2-Pack Review' },
  { file: 'reviews/dewalt-toughsystem-2-0-xl/index.html', url: 'https://garagereviews.us/reviews/dewalt-toughsystem-2-0-xl/', title: 'DeWalt ToughSystem 2.0 XL Review' },
  { file: 'reviews/mr-heater-little-buddy-mh4b/index.html', url: 'https://garagereviews.us/reviews/mr-heater-little-buddy-mh4b/', title: 'Mr. Heater Little Buddy MH4B Review' },
  { file: 'reviews/spypoint-flex-s/index.html', url: 'https://garagereviews.us/reviews/spypoint-flex-s/', title: 'SPYPOINT Flex-S Review' },
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
