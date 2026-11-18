import type { DocumentHeadValue } from '@builder.io/qwik-city';

export interface SitePage {
  path: string;
  source: string;
  title: string;
  description: string;
  canonical: string;
  body: string;
  styles: string[];
  hasSiteHeader: boolean;
  hasArticleNav: boolean;
  readingMode: boolean;
}

const pageFiles = import.meta.glob<string>('/src/content/pages/**/*.html', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const SITE_ORIGIN = 'https://xensenx.dev';
type HeadMeta = { name: string; content: string } | { property: string; content: string };

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&rsquo;/gi, '’')
    .replace(/&lsquo;/gi, '‘')
    .replace(/&rdquo;/gi, '”')
    .replace(/&ldquo;/gi, '“')
    .replace(/&#x([\da-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)));
}

function attr(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match ? decodeHtmlEntities(match[2]) : undefined;
}

function removeElementById(html: string, tagName: string, id: string): string {
  const opening = new RegExp(`<${tagName}\\b[^>]*\\bid=["']${id}["'][^>]*>`, 'i').exec(html);
  if (!opening) return html;

  const tagPattern = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi');
  tagPattern.lastIndex = opening.index;
  let depth = 0;
  let end = -1;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(html))) {
    if (match[0].startsWith('</')) depth -= 1;
    else if (!match[0].endsWith('/>')) depth += 1;
    if (depth === 0) {
      end = tagPattern.lastIndex;
      break;
    }
  }

  return end === -1 ? html : html.slice(0, opening.index) + html.slice(end);
}

function sourcePathFromUrl(pathname: string): string {
  const path = pathname.replace(/^\/+|\/+$/g, '');
  if (!path || path === 'index' || path === 'index.html') return 'index.html';
  return path.endsWith('.html') ? path : `${path}.html`;
}

function routeFromSourcePath(path: string): string {
  return path === 'index.html' ? '/' : `/${path.slice(0, -5)}/`;
}

function cleanInternalLinks(body: string, sourcePath: string): string {
  const pageUrl = new URL(routeFromSourcePath(sourcePath), SITE_ORIGIN);
  return body.replace(/(<a\b[^>]*\bhref\s*=\s*)(["'])(.*?)\2/gi, (match, prefix: string, quote: string, href: string) => {
    try {
      const target = new URL(href, pageUrl);
      if (target.origin !== SITE_ORIGIN) return match;
      const targetSourcePath = sourcePathFromUrl(target.pathname);
      if (!pageFiles[`/src/content/pages/${targetSourcePath}`]) return match;
      return `${prefix}${quote}${routeFromSourcePath(targetSourcePath)}${target.search}${target.hash}${quote}`;
    } catch {
      return match;
    }
  });
}

function buildPage(path: string, source: string): SitePage {
  const title = decodeHtmlEntities(source.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || 'xensenx');
  const descriptionTag = source.match(/<meta\b[^>]*\bname=["']description["'][^>]*>/i)?.[0] || '';
  const description = attr(descriptionTag, 'content') || 'Sen’s corner of the internet.';
  const canonical = `${SITE_ORIGIN}${routeFromSourcePath(path)}`;
  const styles = Array.from(source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi), (match) => match[1]);
  const bodyMatch = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  let body = bodyMatch?.[1] || '';

  const hasSiteHeader = /<header\b/i.test(body);
  const hasArticleNav = /<nav\b[^>]*class=["'][^"']*article-nav/i.test(body);

  body = body.replace(/<header\b[^>]*>[\s\S]*?<\/header>/i, '');
  body = body.replace(/<nav\b[^>]*class=["'][^"']*article-nav[^"']*["'][^>]*>[\s\S]*?<\/nav>/i, '');
  body = body.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/i, '');
  body = removeElementById(body, 'div', 'settings-modal');
  body = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  body = body.replace(/((?:src|href)=["'])(?:\.\.\/)*assets\//gi, '$1/assets/');
  body = cleanInternalLinks(body, path);
  body = body.trim();

  return {
    path,
    source,
    title,
    description,
    canonical,
    body,
    styles,
    hasSiteHeader,
    hasArticleNav,
    readingMode: /class=["'][^"']*reading-mode/i.test(source.match(/<body\b[^>]*>/i)?.[0] || ''),
  };
}

export function getPage(pathname: string): SitePage | undefined {
  const path = sourcePathFromUrl(pathname);
  const source = pageFiles[`/src/content/pages/${path}`];
  return source ? buildPage(path, source) : undefined;
}

export function getPagePaths(): string[] {
  return Object.keys(pageFiles)
    .map((file) => file.replace('/src/content/pages/', ''))
    .filter((path) => path !== 'index.html')
    .map((path) => path.slice(0, -5));
}

export function getPageHead(page: SitePage | undefined): DocumentHeadValue {
  if (!page) {
    return {
      title: 'Page not found — xensenx',
      meta: [{ name: 'robots', content: 'noindex' }],
    };
  }

  const meta: HeadMeta[] = [];
  const add = (key: string, value: string | undefined) => {
    if (value) meta.push(key.startsWith('og:') ? { property: key, content: value } : { name: key, content: value });
  };

  add('description', page.description);
  add('author', 'Sen (xensenx)');
  add('robots', 'index, follow');
  add('theme-color', '#363636');
  add('og:type', page.path === 'about-me.html' ? 'profile' : 'website');
  add('og:title', page.title);
  add('og:description', page.description);
  add('og:url', page.canonical);
  add('og:site_name', 'xensenx');
  add('og:image', `${SITE_ORIGIN}/assets/site_icons/Site_icon.png`);
  add('twitter:card', 'summary');
  add('twitter:title', page.title);
  add('twitter:description', page.description);
  add('twitter:image', `${SITE_ORIGIN}/assets/site_icons/Site_icon.png`);

  return {
    title: page.title,
    meta,
    links: [{ rel: 'canonical', href: page.canonical }],
  };
}
