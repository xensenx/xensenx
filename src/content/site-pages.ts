import type { Component } from '@builder.io/qwik';
import type { DocumentHeadValue } from '@builder.io/qwik-city';
import { AboutMeContent } from './views/about-me';
import { AboutSiteContent } from './views/about-site';
import { ContactContent } from './views/contact';
import { HomeContent } from './views/home';
import { PostsEverydayAnotherChanceContent } from './views/posts-everyday-another-chance';
import { PostsLiteratureIsNotDataContent } from './views/posts-literature-is-not-data';
import { PostsOneOfMyPoemsContent } from './views/posts-one-of-my-poems';
import { PostsTheLegendOfGobGobletContent } from './views/posts-the-legend-of-gob-goblet';
import { PostsVisualIdentityLicenseV1Content } from './views/posts-visual-identity-license-v1';
import { PostsContent } from './views/posts';
import { PrivacyContent } from './views/privacy';
import { ResearchVectorquoContent } from './views/research-vectorquo';
import { SitemapContent } from './views/sitemap';
import { WorkContent } from './views/work';

export interface SitePage { path: string; title: string; description: string; route: string; component: Component; }

export const sitePages: SitePage[] = [
  {"path": "/about-me/", "title": "About Me - xensenx", "description": "I'm Sen — CS student invested in AI/ML, small and efficient models, digital document reconstruction, writing, and design.", "route": "about-me", "component": AboutMeContent},
  {"path": "/about-site/", "title": "About - xensenx", "description": "About xensenx.", "route": "about-site", "component": AboutSiteContent},
  {"path": "/contact/", "title": "Contact - xensenx", "description": "Get in touch with Sen — developer of xensenx.", "route": "contact", "component": ContactContent},
  {"path": "/", "title": "xensenx", "description": "Sen's corner of the internet. Computer Science student, graphic designer, hobbyist writer. Building meaningful things.", "route": "", "component": HomeContent},
  {"path": "/posts/everyday-another-chance/", "title": "Everyday Another Chance - xensenx", "description": "On difficulty, escapism, hope, and what it means to try again. One of Sen's core life principles.", "route": "posts/everyday-another-chance", "component": PostsEverydayAnotherChanceContent},
  {"path": "/posts/literature-is-not-data/", "title": "Literature is not just Data! - xensenx", "description": "An essay on human narrative, abstraction, and the fundamental role of literature beyond just being data.", "route": "posts/literature-is-not-data", "component": PostsLiteratureIsNotDataContent},
  {"path": "/posts/one-of-my-poems/", "title": "One of my poems - xensenx", "description": "The Source of Me — a poem by Sen about time, boredom, and the quiet cost of losing both.", "route": "posts/one-of-my-poems", "component": PostsOneOfMyPoemsContent},
  {"path": "/posts/the-legend-of-gob-goblet/", "title": "The Legend of Gob Goblet - xensenx", "description": "The origin story of a strange digital creature that protects files, and the pact humanity made with it.", "route": "posts/the-legend-of-gob-goblet", "component": PostsTheLegendOfGobGobletContent},
  {"path": "/posts/visual-identity-license-v1/", "title": "Visual Identity License v1 - xensenx", "description": "The Visual Identity License (VIL) protects brand identity in open-source projects independently of the software license.", "route": "posts/visual-identity-license-v1", "component": PostsVisualIdentityLicenseV1Content},
  {"path": "/posts/", "title": "Posts — xensenx", "description": "Writing by Sen — essays, poems, and ideas. Thoughts on life, technology, and everything in between.", "route": "posts", "component": PostsContent},
  {"path": "/privacy/", "title": "Privacy Policy - xensenx", "description": "Privacy policy for xensenx.dev. A personal space for writing, projects, and ideas without unnecessary tracking or data collection.", "route": "privacy", "component": PrivacyContent},
  {"path": "/research/vectorquo/", "title": "VectorQuo — Research Note — xensenx", "description": "VectorQuo: a focused research initiative into accurate, efficient, and broadly applicable raster-to-vector conversion.", "route": "research/vectorquo", "component": ResearchVectorquoContent},
  {"path": "/sitemap/", "title": "Sitemap — xensenx", "description": "A complete map of xensenx.dev — every page and where to find it.", "route": "sitemap", "component": SitemapContent},
  {"path": "/work/", "title": "Work - xensenx", "description": "Notable projects and research by Sen — Secure Smart Sync, Project Quagmire, Gob-Goblet, and ongoing research including VectorQuo.", "route": "work", "component": WorkContent}
];

export function getSitePage(pathname: string): SitePage | undefined {
  const normalized = pathname.replace(/^\/+|\/+$/g, '');
  return sitePages.find((page) => page.route === normalized);
}

export function getStaticPageSlugs(): string[] {
  return sitePages.filter((page) => page.route).map((page) => page.route);
}

export function getSitePageHead(pathname: string): DocumentHeadValue {
  const page = getSitePage(pathname);
  if (!page) return { title: 'Page not found — xensenx', meta: [{ name: 'robots', content: 'noindex' }] };
  const canonical = `https://xensenx.dev${page.path}`;
  return { title: page.title, meta: [{ name: 'description', content: page.description }, { name: 'theme-color', content: '#0D1117' }, { property: 'og:title', content: page.title }, { property: 'og:description', content: page.description }, { property: 'og:url', content: canonical }, { property: 'og:site_name', content: 'xensenx' }], links: [{ rel: 'canonical', href: canonical }] };
}
