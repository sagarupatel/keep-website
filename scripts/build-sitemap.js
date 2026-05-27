const fs = require('fs');
const path = require('path');

const BASE = 'https://buywithkeep.com';
const ROOT = path.join(__dirname, '..');

function build(communitySlugs, articleSlugs) {
  // If called directly (not as module), derive slugs from disk
  if (!communitySlugs) {
    const commDir = path.join(ROOT, 'communities');
    communitySlugs = fs.existsSync(commDir)
      ? fs.readdirSync(commDir).filter(e => fs.statSync(path.join(commDir, e)).isDirectory())
      : [];
  }
  if (!articleSlugs) {
    const artDir = path.join(ROOT, 'articles');
    articleSlugs = fs.existsSync(artDir)
      ? fs.readdirSync(artDir).filter(e => {
          const full = path.join(artDir, e);
          return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'index.html'));
        })
      : [];
  }

  const today = new Date().toISOString().slice(0, 10);

  const urls = [
    `${BASE}/`,
    `${BASE}/faq/`,
    `${BASE}/articles/`,
    ...articleSlugs.map(s => `${BASE}/articles/${s}/`),
    ...communitySlugs.map(s => `${BASE}/communities/${s}/`)
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u}</loc>
    <lastmod>${today}</lastmod>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  console.log(`Sitemap written: ${urls.length} URLs`);
}

module.exports = { build };
if (require.main === module) build();
