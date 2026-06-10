import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outputDir = process.argv[2] || 'dist';
const rawBaseUrl = process.env.VITE_APP_URL || process.env.CF_PAGES_URL || 'https://somoseternos.com.br';
const baseUrl = rawBaseUrl.replace(/\/+$/, '');
const now = new Date().toISOString();

const routes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/exemplos/casamento', priority: '0.8', changefreq: 'monthly' },
  { path: '/exemplos/viagem', priority: '0.8', changefreq: 'monthly' },
  { path: '/exemplos/pedido', priority: '0.8', changefreq: 'monthly' },
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /entrar
Disallow: /criar
Disallow: /editor/
Disallow: /planos/
Disallow: /pagamento/
Disallow: /minhas-paginas

Sitemap: ${baseUrl}/sitemap.xml
`;

mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, 'sitemap.xml'), sitemap);
writeFileSync(join(outputDir, 'robots.txt'), robots);
