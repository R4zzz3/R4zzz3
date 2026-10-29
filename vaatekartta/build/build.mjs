// Merges the research files, enforces the scope rules and writes the self-contained page.
// Usage: node build.mjs  ->  ../artifact.html, ../index.html, ../data/brands.json
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMap } from './map.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

// Euros per unit. GBP: Bank of England reference rate 19.10.2026 (1.1872).
const RATES = { EUR: 1, GBP: 1.19, SEK: 0.091, NOK: 0.086, DKK: 0.134, CHF: 1.07, PLN: 0.235, CZK: 0.04 };
const PRICE_MIN = 50;
const PRICE_MAX = 150;
const TYPES = ['farkut', 'housut', 'neuleet', 'paidat', 't-paidat', 'collegit', 'takit', 'asusteet'];
const VAT = ['eu', 'ioss', 'ddp', 'buyer'];
const HELSINKI = [24.94, 60.17];
const CHECKED = '2026-10-29';

const warnings = [];
const warn = (msg) => warnings.push(msg);

function toEur(amount, currency = 'EUR') {
  if (amount == null || Number.isNaN(Number(amount))) return null;
  const rate = RATES[(currency || 'EUR').toUpperCase()];
  if (!rate) {
    warn(`unknown currency ${currency}`);
    return null;
  }
  return Math.round(Number(amount) * rate * 100) / 100;
}

function loadRaw() {
  const dir = join(root, 'data', 'raw');
  const brands = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const raw = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    for (const b of raw.brands ?? []) brands.push({ ...b, region: raw.region ?? file.replace('.json', '') });
  }
  return brands;
}

// data/coupons*.json: { "brands": { "<brand id>": [coupon, ...] } }
function loadCoupons() {
  const dir = join(root, 'data');
  const out = {};
  for (const file of readdirSync(dir).filter((f) => /^coupons.*\.json$/.test(f)).sort()) {
    const data = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    for (const [id, list] of Object.entries(data.brands ?? {})) out[id] = [...(out[id] ?? []), ...list];
  }
  return out;
}

const COUPON_RANK = { code: 0, firstorder: 1, newsletter: 2, app: 3, student: 4, sale: 5 };

function normaliseCoupons(list) {
  const seen = new Set();
  return (list ?? [])
    .filter((c) => c && c.deal)
    .filter((c) => {
      const key = `${c.code ?? ''}|${c.deal}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((c) => ({
      code: c.code || null,
      deal: c.deal,
      type: c.type in COUPON_RANK ? c.type : 'sale',
      source: c.source || null,
      checked: c.checked || CHECKED,
      verified: Boolean(c.verified),
    }))
    .sort((a, b) => Number(b.verified) - Number(a.verified) || COUPON_RANK[a.type] - COUPON_RANK[b.type]);
}

function speedClass(days) {
  const max = days?.[1] ?? days?.[0];
  if (max == null) return 'unknown';
  if (max <= 3) return 'fast';
  if (max <= 6) return 'mid';
  return 'slow';
}

function normaliseBrand(b, map, extraCoupons) {
  const id = b.id || b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const products = [];
  for (const p of b.products ?? []) {
    const price = toEur(p.price, p.currency);
    if (price == null || price < PRICE_MIN || price > PRICE_MAX) {
      warn(`${b.name}: dropped "${p.name}" (${p.price} ${p.currency ?? 'EUR'} = ${price} €)`);
      continue;
    }
    const type = TYPES.includes(p.type) ? p.type : null;
    if (!type) warn(`${b.name}: unknown type "${p.type}" on ${p.name}`);
    products.push({
      name: p.name,
      type: type ?? 'asusteet',
      price: Math.round(price),
      origPrice: (p.currency ?? 'EUR') === 'EUR' ? null : `${p.price} ${p.currency}`,
      url: p.url || b.url,
      image: p.image || null,
      color: /^#[0-9a-f]{6}$/i.test(p.color ?? '') ? p.color : '#5b6470',
      sig: Boolean(p.signature),
      why: p.why ?? '',
    });
  }
  if (products.length < 2) {
    warn(`${b.name}: excluded, only ${products.length} product(s) in ${PRICE_MIN}-${PRICE_MAX} €`);
    return null;
  }

  const s = b.ship ?? {};
  const xy = s.lat != null && s.lng != null ? map.project(s.lng, s.lat) : null;
  if (!xy) warn(`${b.name}: no shipping coordinates`);
  const vat = VAT.includes(s.vat) ? s.vat : 'eu';
  const days = Array.isArray(s.days) && s.days.length ? [s.days[0], s.days[1] ?? s.days[0]] : null;

  return {
    id,
    name: b.name,
    country: b.country,
    city: b.city ?? null,
    url: b.url,
    parent: b.parent ?? null,
    style: b.style ?? '',
    tags: [...new Set(products.map((p) => p.type).concat((b.tags ?? []).filter((t) => TYPES.includes(t))))],
    ship: {
      from: s.from ?? null,
      fromCountry: /,\s*([A-Z]{2})\s*$/.exec(s.from ?? '')?.[1] ?? b.country,
      xy,
      cost: toEur(s.cost, s.currency),
      freeOver: toEur(s.freeOver, s.currency),
      days,
      speed: speedClass(days),
      vat,
      returns: s.returns ?? null,
    },
    products,
    coupons: normaliseCoupons([...(extraCoupons ?? []), ...(b.coupons ?? [])]),
    confidence: b.confidence ?? 'medium',
    sources: b.sources ?? [],
  };
}

function svgMap(map) {
  return map.paths
    .map((p) => `<path d="${p.d}"${p.id === '246' ? ' class="fi"' : ''}/>`)
    .join('');
}

function main() {
  const map = buildMap();
  const coupons = loadCoupons();
  const seen = new Set();
  const brands = [];
  for (const raw of loadRaw()) {
    const b = normaliseBrand(raw, map, coupons[raw.id] ?? coupons[raw.name]);
    if (!b) continue;
    if (seen.has(b.id)) {
      warn(`duplicate brand ${b.id} skipped`);
      continue;
    }
    seen.add(b.id);
    brands.push(b);
  }
  brands.sort((a, b) => a.name.localeCompare(b.name, 'fi'));

  const data = {
    checked: CHECKED,
    rates: { GBP: RATES.GBP },
    dest: map.project(...HELSINKI),
    view: [map.width, map.height],
    brands,
  };
  writeFileSync(join(root, 'data', 'brands.json'), JSON.stringify(data, null, 2) + '\n');

  const template = readFileSync(join(here, 'template.html'), 'utf8');
  const silhouettes = readFileSync(join(root, 'design', 'silhouettes.js'), 'utf8');
  const app = readFileSync(join(here, 'app.js'), 'utf8');
  const html = template
    .replace('<!--MAP_PATHS-->', () => svgMap(map))
    .replace('/*DATA*/null', () => JSON.stringify(data).replace(/</g, '\\u003c'))
    .replace('/*SILHOUETTES*/', () => silhouettes)
    .replace('/*APP*/', () => app)
    .replaceAll('__VIEWBOX__', `0 0 ${map.width} ${map.height}`);
  // artifact.html is page content only (the Artifact host adds the document skeleton);
  // index.html is the same page as a standalone document for opening from the repo.
  writeFileSync(join(root, 'artifact.html'), html);
  writeFileSync(
    join(root, 'index.html'),
    '<!doctype html>\n<html lang="fi">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
      '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}</style>\n' +
      '</head>\n<body>\n' + html + '</body>\n</html>\n'
  );

  const productCount = brands.reduce((n, b) => n + b.products.length, 0);
  console.log(`brands: ${brands.length}, products: ${productCount}, html: ${(html.length / 1024).toFixed(0)} KB`);
  if (warnings.length) console.log(`warnings (${warnings.length}):\n  ` + warnings.join('\n  '));
}

main();
