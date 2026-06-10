const SITE_NAME = 'Somos Eternos';
const DEFAULT_TITLE = 'Somos Eternos | Crie uma página personalizada para a história de vocês';
const DEFAULT_DESCRIPTION =
  'Crie uma página exclusiva para eternizar seu relacionamento com fotos, história, música e contador ao vivo.';
const DEFAULT_IMAGE = '/og-image.png';

type SeoConfig = {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  type?: 'website' | 'article';
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | null;
};

function siteUrl() {
  const envUrl = import.meta.env.VITE_APP_URL as string | undefined;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return (envUrl || origin).replace(/\/+$/, '');
}

export function absoluteUrl(pathOrUrl = '/') {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteUrl()}${path}`;
}

function upsertMeta(selector: string, attrs: Record<string, string>, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    Object.entries(attrs).forEach(([key, value]) => tag?.setAttribute(key, value));
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

function upsertJsonLd(id: string, data: Record<string, unknown> | null) {
  const existing = document.getElementById(id);
  if (!data) {
    existing?.remove();
    return;
  }

  const script = existing ?? document.createElement('script');
  script.id = id;
  script.setAttribute('type', 'application/ld+json');
  script.textContent = JSON.stringify(data);
  if (!existing) document.head.appendChild(script);
}

export function applySeo(config: SeoConfig) {
  const title = config.title ?? DEFAULT_TITLE;
  const description = config.description ?? DEFAULT_DESCRIPTION;
  const canonical = absoluteUrl(config.path ?? window.location.pathname);
  const image = absoluteUrl(config.image || DEFAULT_IMAGE);
  const robots = config.noIndex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large';

  document.title = title;
  upsertMeta('meta[name="description"]', { name: 'description' }, description);
  upsertMeta('meta[name="robots"]', { name: 'robots' }, robots);
  upsertLink('canonical', canonical);

  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, SITE_NAME);
  upsertMeta('meta[property="og:locale"]', { property: 'og:locale' }, 'pt_BR');
  upsertMeta('meta[property="og:type"]', { property: 'og:type' }, config.type ?? 'website');
  upsertMeta('meta[property="og:title"]', { property: 'og:title' }, title);
  upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description);
  upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonical);
  upsertMeta('meta[property="og:image"]', { property: 'og:image' }, image);
  upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, SITE_NAME);

  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, title);
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, image);

  upsertJsonLd('route-jsonld', config.jsonLd ?? null);
}

export function getRouteSeo(pathname: string): SeoConfig {
  if (pathname === '/') {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      path: '/',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: absoluteUrl('/'),
      },
    };
  }

  if (pathname.startsWith('/exemplos/')) {
    return {
      title: 'Exemplos de páginas personalizadas | Somos Eternos',
      description:
        'Veja exemplos de páginas para namoro, casamento, pedido e viagem antes de criar a sua lembrança personalizada.',
      path: pathname,
    };
  }

  if (pathname.startsWith('/p/')) {
    return {
      title: 'Uma história eternizada | Somos Eternos',
      description: 'Veja uma página personalizada criada no Somos Eternos.',
      path: pathname,
    };
  }

  if (pathname === '/404') {
    return {
      title: 'Página não encontrada | Somos Eternos',
      description: 'A página que você tentou acessar não existe ou foi removida.',
      path: pathname,
      noIndex: true,
    };
  }

  return {
    title: 'Área segura | Somos Eternos',
    description: 'Acesse sua conta para criar, editar e publicar sua página personalizada.',
    path: pathname,
    noIndex: true,
  };
}

export const seoDefaults = {
  siteName: SITE_NAME,
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  image: DEFAULT_IMAGE,
};
