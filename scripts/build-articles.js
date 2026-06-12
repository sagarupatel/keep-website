const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// ── Paths ──
const SRC_DIR = path.join(__dirname, '../articles-src');
const OUTPUT_DIR = path.join(__dirname, '../articles');
const TEMPLATE_PATH = path.join(__dirname, '../articles/_template.html');
const INDEX_PATH = path.join(OUTPUT_DIR, 'index.html');
const SITEMAP_ARTICLES = path.join(__dirname, '../data/article-slugs.json');

// ── Topic labels ──
const TOPIC_LABELS = {
  'registration': 'Registration',
  'rebate': 'The rebate',
  'how-keep-works': 'How keep works',
  'builder-guides': 'Builder guides',
  'financing': 'Financing',
  'phoenix-market': 'Phoenix market'
};

// ── Parse frontmatter ──
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  match[1].split('\n').forEach(line => {
    const [key, ...val] = line.split(':');
    if (key && val.length) {
      meta[key.trim()] = val.join(':').trim().replace(/^["']|["']$/g, '');
    }
  });

  return { meta, body: match[2] };
}

// ── Read template ──
if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error('ERROR: articles/_template.html not found.');
  process.exit(1);
}
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

// ── Ensure source dir exists ──
fs.mkdirSync(SRC_DIR, { recursive: true });
fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });

// ── Read all markdown files ──
const files = fs.existsSync(SRC_DIR)
  ? fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.md'))
  : [];

if (files.length === 0) {
  console.log('No articles found in articles-src/. Add .md files to generate pages.');
  process.exit(0);
}

console.log(`Found ${files.length} articles.`);

// ── Parse and sort by date descending ──
const articles = files.map(file => {
  const content = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
  const { meta, body } = parseFrontmatter(content);
  return { ...meta, body, file };
}).sort((a, b) => new Date(b.date) - new Date(a.date));

// ── Generate individual article pages ──
const slugs = [];

articles.forEach(article => {
  const { title, description, date, slug, topic, body } = article;

  if (!slug) {
    console.warn(`Skipping ${article.file} — no slug defined.`);
    return;
  }

  slugs.push(slug);

  const dir = path.join(OUTPUT_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });

  const topicLabel = TOPIC_LABELS[topic] || topic || '';
  const bodyHtml = marked(body);

  const html = template
    .replace(/{{TITLE}}/g, title || '')
    .replace(/{{DESCRIPTION}}/g, description || '')
    .replace(/{{DATE}}/g, date || '')
    .replace(/{{SLUG}}/g, slug)
    .replace(/{{TOPIC_LABEL}}/g, topicLabel)
    .replace(/{{ARTICLE_BODY}}/g, bodyHtml);

  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  console.log(`Generated: articles/${slug}/`);
});

// ── Generate article index ──
const indexTemplate = fs.readFileSync(INDEX_PATH, 'utf8');

const listItems = articles.map(article => {
  const topicLabel = TOPIC_LABELS[article.topic] || article.topic || '';
  return `    <div class="article-list-item" data-topic="${article.topic || 'all'}">
      <div class="article-list-topic">${topicLabel}</div>
      <div class="article-list-title"><a href="/articles/${article.slug}/">${article.title}</a></div>
    </div>`;
}).join('\n');

const indexHtml = indexTemplate.replace('  <!-- Articles injected by build-articles.js -->\n  {{ARTICLE_LIST}}', listItems);
fs.writeFileSync(INDEX_PATH, indexHtml, 'utf8');
console.log(`Updated: articles/index.html (${articles.length} articles)`);

// ── Save slug list for sitemap ──
fs.writeFileSync(SITEMAP_ARTICLES, JSON.stringify(slugs, null, 2));

console.log(`\nDone. ${slugs.length} article pages generated.`);
console.log('Run "node scripts/build-sitemap.js" to update the sitemap.');
