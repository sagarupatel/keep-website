const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const CSV_PATH = path.join(__dirname, '../data/communities.csv');
const TEMPLATE_PATH = path.join(__dirname, '../communities/_template.html');
const OUTPUT_DIR = path.join(__dirname, '../communities');
const SITEMAP_COMMUNITIES = path.join(__dirname, '../data/community-slugs.json');

// ── Slug generator ──
function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ── Status label ──
function statusLabel(status) {
  if (status === 'Coming soon') return '&#9679; Coming soon';
  if (status === 'Sold out') return '&#9679; Sold out';
  return '&#9679; Active &mdash; accepting registrations';
}

// ── Parse price range → default slider value ──
function parseStartingPrice(priceRange) {
  const DEFAULT = 650000;
  const STEP = 10000;
  if (!priceRange || priceRange.trim() === '') return DEFAULT;

  const str = priceRange.toLowerCase().trim();

  // Rule C: unclear values
  if (str.includes('contact') || str.includes('tbd') || str.includes('varies')) return DEFAULT;

  // Extract all dollar amounts
  const matches = str.match(/\$?([\d,]+\.?\d*)\s*(k|m|million|thousand)?/gi);
  if (!matches || matches.length === 0) return DEFAULT;

  function parseAmount(m) {
    const cleaned = m.replace(/\$/g, '').replace(/,/g, '').trim();
    const numMatch = cleaned.match(/([\d.]+)\s*(k|m|million|thousand)?/i);
    if (!numMatch) return null;
    let num = parseFloat(numMatch[1]);
    const unit = (numMatch[2] || '').toLowerCase();
    if (unit === 'k' || unit === 'thousand') num *= 1000;
    else if (unit === 'm' || unit === 'million') num *= 1000000;
    else if (num < 1000) num *= 1000; // bare number like "700" = 700K
    return Math.round(num);
  }

  const amounts = matches.map(parseAmount).filter(n => n && n > 50000);
  if (amounts.length === 0) return DEFAULT;

  let target;

  // Rule A: "starting at" / "from" → use that value
  if (str.includes('starting at') || str.includes('from the') || str.includes('from $') || str.includes('low')) {
    target = Math.min(...amounts);
  }
  // Rule B: range like "$515K-$619K" → use max
  else if (amounts.length >= 2) {
    target = Math.max(...amounts);
  }
  // Single value
  else {
    target = amounts[0];
  }

  // Round to nearest step
  return Math.round(target / STEP) * STEP;
}

// ── Determine if community needs high-value calculator (>$2M) ──
function needsHighCalc(priceRange) {
  if (!priceRange) return false;
  const str = priceRange.toLowerCase().replace(/,/g, '');
  const matches = str.match(/[\d.]+\s*(k|m|million)?/gi);
  if (!matches) return false;
  for (const m of matches) {
    const numMatch = m.match(/([\d.]+)\s*(k|m|million)?/i);
    if (!numMatch) continue;
    let num = parseFloat(numMatch[1]);
    const unit = (numMatch[2] || '').toLowerCase();
    if (unit === 'm' || unit === 'million') num *= 1000000;
    else if (unit === 'k') num *= 1000;
    else if (num < 1000) num *= 1000;
    if (num > 2000000) return true;
  }
  return false;
}

// ── Registration warning block ──
function regWarn(policy, notes, builder) {
  if (policy === 'In-person') {
    const text = notes && notes.trim()
      ? notes.trim()
      : `${builder} requires in-person broker registration before your first visit. <a href="tel:6029356585">Call us</a> before you go. We'll tell you exactly what to do to protect your rebate.`;
    return `<div class="reg-warn">${text}</div>`;
  }
  return '';
}

// ── Builder link block ──
function builderLink(builderUrl, builder, communityName) {
  if (!builderUrl || builderUrl.trim() === '') return '';
  return `
<div class="builder-link">
  <div class="wrap">
    <a href="${builderUrl}" target="_blank" rel="noopener">&nearr; View ${communityName} on ${builder}'s website</a>
  </div>
</div>`;
}

// ── Read template ──
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

// ── Read and parse CSV ──
if (!fs.existsSync(CSV_PATH)) {
  console.error('ERROR: data/communities.csv not found.');
  process.exit(1);
}

const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
console.log(`Found ${records.length} communities in CSV.`);

// ── Delete existing community subdirectories ──
const existing = fs.readdirSync(OUTPUT_DIR);
existing.forEach(item => {
  if (item.startsWith('_')) return;
  const itemPath = path.join(OUTPUT_DIR, item);
  if (fs.statSync(itemPath).isDirectory()) {
    fs.rmSync(itemPath, { recursive: true });
    console.log(`Deleted: communities/${item}`);
  }
});

// ── Generate pages ──
const slugs = [];

records.forEach(row => {
  const {
    community_name, builder, location, price_range,
    commission_rate, registration_policy, registration_notes,
    status, builder_url, slug: csvSlug
  } = row;

  if (!community_name) return;

  const slug = (csvSlug && csvSlug.trim()) ? csvSlug.trim() : slugify(community_name);
  slugs.push(slug);

  const dir = path.join(OUTPUT_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });

  const rate = parseFloat(commission_rate) || 3.0;
  const startPrice = parseStartingPrice(price_range);
  const highCalc = needsHighCalc(price_range);
  const sliderMax = highCalc ? 5000000 : 2000000;
  const sliderStep = highCalc ? 500000 : 10000;

  // Meta title with builder
  const metaTitle = `${community_name} by ${builder} | New Homes in ${location} | keep`;
  const metaDesc = `Buying at ${community_name} by ${builder} in ${location}? keep gives back up to 2/3 of the buyer's commission at closing. Call before your first visit.`;

  let html = template
    .replace(/{{COMMUNITY_NAME}}/g, community_name)
    .replace(/{{BUILDER}}/g, builder)
    .replace(/{{LOCATION}}/g, location)
    .replace(/{{PRICE_RANGE}}/g, price_range)
    .replace(/{{COMMISSION_RATE}}/g, rate.toFixed(1))
    .replace(/{{SLUG}}/g, slug)
    .replace(/{{STATUS_LABEL}}/g, statusLabel(status))
    .replace(/{{REGISTRATION_POLICY}}/g, registration_policy)
    .replace(/{{REGISTRATION_WARN}}/g, regWarn(registration_policy, registration_notes, builder))
    .replace(/{{BUILDER_LINK}}/g, builderLink(builder_url, builder, community_name))
    .replace(/{{META_TITLE}}/g, metaTitle)
    .replace(/{{META_DESC}}/g, metaDesc)
    .replace(/{{START_PRICE}}/g, startPrice)
    .replace(/{{SLIDER_MAX}}/g, sliderMax)
    .replace(/{{SLIDER_STEP}}/g, sliderStep);

  const outPath = path.join(dir, 'index.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`Generated: communities/${slug}/ (start: $${startPrice.toLocaleString()}, max: $${(sliderMax/1000000).toFixed(1)}M${highCalc ? ' HIGH' : ''})`);
});

fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
fs.writeFileSync(SITEMAP_COMMUNITIES, JSON.stringify(slugs, null, 2));
console.log(`\nDone. ${slugs.length} community pages generated.`);
