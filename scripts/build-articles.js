const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'articles-src');
const OUT_DIR = path.join(__dirname, '..', 'articles');

const TOPIC_LABELS = {
  'registration': 'Registration',
  'rebate': 'The rebate',
  'how-keep-works': 'How keep works',
  'builder-guides': 'Builder guides',
  'financing': 'Financing',
  'phoenix-market': 'Phoenix market'
};

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const colon = line.indexOf(':');
    if (colon < 0) return;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
    meta[key] = val;
  });
  return { meta, body: match[2] };
}

function mdToHtml(md) {
  let html = md
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // Bold/italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Blockquotes (becomes callout)
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered lists
    .replace(/((?:^[-*] .+\n?)+)/gm, (match) => {
      const items = match.trim().split('\n').map(l => `<li>${l.replace(/^[-*] /, '')}</li>`).join('\n');
      return `<ul>\n${items}\n</ul>\n`;
    })
    // Ordered lists
    .replace(/((?:^\d+\. .+\n?)+)/gm, (match) => {
      const items = match.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('\n');
      return `<ol>\n${items}\n</ol>\n`;
    })
    // Paragraphs — lines separated by blank lines
    .split(/\n\n+/)
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (/^<(h[1-6]|ul|ol|blockquote)/.test(block)) return block;
      return `<p>${block.replace(/\n/g, ' ')}</p>`;
    })
    .join('\n');
  return html;
}

function renderArticlePage(meta, bodyHtml) {
  const topicLabel = TOPIC_LABELS[meta.topic] || meta.topic || '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title} | keep</title>
  <meta name="description" content="${meta.description}">
  <link rel="canonical" href="https://buywithkeep.com/articles/${meta.slug}/">
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/main.css">
  <link rel="stylesheet" href="/assets/css/article.css">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${meta.title}",
    "description": "${meta.description}",
    "datePublished": "${meta.date}",
    "publisher": {
      "@type": "Organization",
      "name": "keep by Conflux Real Estate",
      "url": "https://buywithkeep.com"
    }
  }
  <\/script>
</head>
<body style="padding-bottom: 80px;">

  <!-- Floating ribbon -->
  <div class="floating-ribbon" id="floating-ribbon">
    <span class="floating-ribbon-text">Buying new construction in Phoenix? Contact keep before your first visit.</span>
    <div class="floating-ribbon-links">
      <a href="tel:6029356585">Call 602-935-6585</a>
      <a href="sms:6029356585">Text us</a>
      <a href="#" data-email>Email</a>
    </div>
    <button class="ribbon-dismiss" id="ribbon-dismiss" aria-label="Dismiss">×</button>
  </div>

  <!-- Nav -->
  <nav class="nav">
    <a href="/" class="nav-brand">
      <span class="nav-logo">keep</span>
      <span class="nav-sub">by Conflux Real Estate</span>
    </a>
    <ul class="nav-links">
      <li class="hide-mobile"><a href="/">How it works</a></li>
      <li class="hide-mobile"><a href="/#calc">Calculator</a></li>
      <li><a href="tel:6029356585" class="btn-call">Call us →</a></li>
    </ul>
  </nav>

  <!-- Article header -->
  <div class="article-header">
    <span class="article-topic-tag">${topicLabel}</span>
    <h1 class="article-h1">${meta.title}</h1>
    <p class="article-deck">${meta.description}</p>
  </div>

  <div class="article-divider"><hr></div>

  <!-- Article body -->
  <div class="article-body">
    ${bodyHtml}
  </div>

  <!-- Footer CTA -->
  <div class="article-footer-cta" id="article-footer-cta">
    <div class="article-footer-cta-inner">
      <h2>Found a community? Call us first.</h2>
      <div class="contact-block">
        <div class="contact-line">
          <span style="color:rgba(255,255,255,0.4); font-size:12px; width:40px;">CALL</span>
          <a href="tel:6029356585" style="font-size:18px; font-weight:500;">602-935-6585</a>
        </div>
        <div class="contact-line">
          <span style="color:rgba(255,255,255,0.4); font-size:12px; width:40px;">TEXT</span>
          <a href="sms:6029356585" style="font-size:18px; font-weight:500;">602-935-6585</a>
        </div>
        <div class="contact-line">
          <span style="color:rgba(255,255,255,0.4); font-size:12px; width:40px;">EMAIL</span>
          <a href="#" data-email data-email-show style="font-size:15px;"></a>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-inner">
      <span>© 2026 Conflux Real Estate, LLC. Licensed Arizona Real Estate Brokerage. All rights reserved.</span>
      <div class="footer-links">
        <a href="/faq/">FAQ</a>
        <a href="/">How keep works</a>
      </div>
    </div>
  </footer>

  <script src="/assets/js/email.js"></script>
  <script>
    // Floating ribbon — dismiss and IntersectionObserver
    (function() {
      var ribbon = document.getElementById('floating-ribbon');
      var dismissBtn = document.getElementById('ribbon-dismiss');
      var footerCta = document.getElementById('article-footer-cta');

      if (dismissBtn) {
        dismissBtn.addEventListener('click', function() {
          ribbon.classList.add('hidden');
        });
      }

      if (footerCta && ribbon) {
        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              ribbon.classList.add('hidden');
            } else {
              if (!sessionStorage.getItem('ribbon-dismissed')) {
                ribbon.classList.remove('hidden');
              }
            }
          });
        }, { threshold: 0.1 });
        observer.observe(footerCta);
      }

      if (dismissBtn) {
        dismissBtn.addEventListener('click', function() {
          sessionStorage.setItem('ribbon-dismissed', '1');
          ribbon.classList.add('hidden');
        });
      }
    })();
  </script>
</body>
</html>`;
}

function renderIndexPage(articles) {
  const topicOptions = [
    { value: 'all', label: 'All' },
    { value: 'registration', label: 'Registration' },
    { value: 'rebate', label: 'The rebate' },
    { value: 'how-keep-works', label: 'How keep works' },
    { value: 'builder-guides', label: 'Builder guides' },
    { value: 'financing', label: 'Financing' },
    { value: 'phoenix-market', label: 'Phoenix market' }
  ];

  const pills = topicOptions.map((t, i) =>
    `<button class="filter-pill${i === 0 ? ' active' : ''}" onclick="filterArticles('${t.value}', this)">${t.label}</button>`
  ).join('\n        ');

  const items = articles.map(a => {
    const label = TOPIC_LABELS[a.topic] || a.topic || '';
    return `      <li class="article-list-item" data-topic="${a.topic}">
        <div class="article-topic-label">${label}</div>
        <a href="/articles/${a.slug}/">${a.title}</a>
      </li>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Articles &amp; guides | keep</title>
  <meta name="description" content="Guides and articles for Phoenix new home buyers — how to protect your rebate, understand your contract, and navigate new construction.">
  <link rel="canonical" href="https://buywithkeep.com/articles/">
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/main.css">
  <link rel="stylesheet" href="/assets/css/article.css">
</head>
<body>

  <!-- Nav -->
  <nav class="nav">
    <a href="/" class="nav-brand">
      <span class="nav-logo">keep</span>
      <span class="nav-sub">by Conflux Real Estate</span>
    </a>
    <ul class="nav-links">
      <li class="hide-mobile"><a href="/">How it works</a></li>
      <li class="hide-mobile"><a href="/#calc">Calculator</a></li>
      <li><a href="tel:6029356585" class="btn-call">Call us →</a></li>
    </ul>
  </nav>

  <section style="padding: 60px 24px 80px;">
    <div class="container">
      <h1 style="font-size:40px; margin-bottom:12px;">Articles &amp; guides.</h1>
      <p style="font-size:15px; color:var(--text-muted); margin-bottom:40px;">Guides for Phoenix new home buyers — registration, rebates, contracts, and more.</p>

      <div class="article-filter-pills">
        ${pills}
      </div>

      <ul class="article-list">
${items}
      </ul>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-inner">
      <span>© 2026 Conflux Real Estate, LLC. Licensed Arizona Real Estate Brokerage. All rights reserved.</span>
      <div class="footer-links">
        <a href="/faq/">FAQ</a>
        <a href="/">How keep works</a>
      </div>
    </div>
  </footer>

  <script src="/assets/js/article-filter.js"></script>
</body>
</html>`;
}

function build() {
  if (!fs.existsSync(SRC_DIR)) {
    console.log('No articles-src/ found — skipping article build.');
    fs.mkdirSync(path.join(OUT_DIR), { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, 'index.html'), renderIndexPage([]), 'utf8');
    return [];
  }

  const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.md'));
  const articles = [];

  files.forEach(file => {
    const text = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
    const { meta, body } = parseFrontmatter(text);
    if (!meta.slug || !meta.title) { console.warn(`Skipping ${file} — missing slug or title`); return; }
    const bodyHtml = mdToHtml(body);
    const dir = path.join(OUT_DIR, meta.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), renderArticlePage(meta, bodyHtml), 'utf8');
    articles.push(meta);
    console.log(`  built: /articles/${meta.slug}/`);
  });

  // Sort by date descending
  articles.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), renderIndexPage(articles), 'utf8');
  console.log(`Articles built: ${articles.length}`);
  return articles.map(a => a.slug);
}

module.exports = { build };
if (require.main === module) build();
