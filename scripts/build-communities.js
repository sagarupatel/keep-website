const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// ── Paths ──
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

// ── Registration warning block ──
function regWarn(policy, notes, builder) {
  if (policy === 'In-person') {
    const text = notes
      ? notes
      : `${builder} requires in-person broker registration before your first visit. <a href="tel:6029356585">Call us</a> before you go. We'll tell you exactly what to do to protect your rebate.`;
    return `<div class="reg-warn">${text}</div>`;
  }
  return '';
}

// ── Builder link block ──
function builderLink(builderUrl, builder, communityName) {
  if (!builderUrl || builderUrl.trim() === '') return '';
  return `
<div class="builder-link-block">
  <div class="builder-link-block-inner">
    <a href="${builderUrl}" target="_blank" rel="noopener">&nearr; View ${communityName} on ${builder}'s website</a>
  </div>
</div>`;
}

// ── Read template ──
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

// ── Read and parse CSV ──
if (!fs.existsSync(CSV_PATH)) {
  console.error('ERROR: data/communities.csv not found. Create it first.');
  process.exit(1);
}

const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

console.log(`Found ${records.length} communities in CSV.`);

// ── Delete existing community subdirectories (full replace) ──
const existing = fs.readdirSync(OUTPUT_DIR);
existing.forEach(item => {
  if (item.startsWith('_') || item === 'eastmark') return; // keep template, remove sample later
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
    community_name,
    builder,
    location,
    price_range,
    commission_rate,
    registration_policy,
    registration_notes,
    status,
    builder_url
  } = row;

  if (!community_name) return;

  const slug = slugify(community_name);
  slugs.push(slug);

  const dir = path.join(OUTPUT_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });

  const rate = parseFloat(commission_rate) || 3.0;

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
    .replace(/{{BUILDER_LINK}}/g, builderLink(builder_url, builder, community_name));

  const outPath = path.join(dir, 'index.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`Generated: communities/${slug}/`);
});

// ── Save slug list for sitemap script ──
fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
fs.writeFileSync(SITEMAP_COMMUNITIES, JSON.stringify(slugs, null, 2));

console.log(`\nDone. ${slugs.length} community pages generated.`);
console.log('Run "node scripts/build-sitemap.js" to update the sitemap.');
