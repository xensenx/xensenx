/* ============================================================
   worker/index.js — xensenx Cloudflare Worker
   Handles:
     • Static asset routing to /public/**
     • /private/** — whitelist-gated deep resume
     • /admin/**   — owner-only admin panel
     • /api/auth   — token validation endpoint
     • SEO-friendly redirects & cache headers

   Deploy:  wrangler deploy
   Dev:     wrangler dev
   ============================================================ */

import { validateToken, validateAdminToken, extractToken } from './whitelist.js';

/* ─── CONFIGURATION ───────────────────────────────────────── */
const CONFIG = {
  DEV_MODE:          false,   // ← set true during local dev to allow ?token= param
  COOKIE_NAME:       'xns_token',
  COOKIE_MAX_AGE:    60 * 60 * 24 * 30,   // 30 days (seconds)
  COOKIE_SECURE:     true,                 // always true on Cloudflare edge
  SESSION_TIMEOUT:   60 * 60 * 24 * 7,    // 7 days in seconds

  // Cache durations
  CACHE_HTML:        'no-cache, no-store, must-revalidate',
  CACHE_ASSETS:      'public, max-age=31536000, immutable',  // 1 year for hashed assets
  CACHE_CSS_JS:      'public, max-age=86400, stale-while-revalidate=3600',  // 1 day
};

/* ─── ROUTE TABLE ─────────────────────────────────────────── */
// Maps URL patterns to handler functions
const ROUTES = [
  // Auth API
  { pattern: /^\/api\/auth\/validate$/,  method: 'GET',  handler: handleAuthValidate },
  { pattern: /^\/api\/auth\/logout$/,    method: 'POST', handler: handleAuthLogout  },

  // Protected: Admin
  { pattern: /^\/admin(\/.*)?$/,         method: '*',    handler: handleAdmin   },

  // Protected: Private deep resume
  { pattern: /^\/private(\/.*)?$/,       method: '*',    handler: handlePrivate },

  // Public pages
  { pattern: /^\/$/,                     method: 'GET',  handler: servePublicPage('/index.html')         },
  { pattern: /^\/projects(\/)?$/,        method: 'GET',  handler: servePublicPage('/projects.html')      },
  { pattern: /^\/skills(\/)?$/,          method: 'GET',  handler: servePublicPage('/skills.html')        },
  { pattern: /^\/blog(\/)?$/,            method: 'GET',  handler: servePublicPage('/blog.html')          },
  { pattern: /^\/social(\/)?$/,          method: 'GET',  handler: servePublicPage('/social.html')        },

  // Static assets (CSS, JS, images, fonts)
  { pattern: /^\/(css|js|assets)\//,     method: 'GET',  handler: handleStaticAsset },

  // Sitemap & robots
  { pattern: /^\/sitemap\.xml$/,         method: 'GET',  handler: handleSitemap },
  { pattern: /^\/robots\.txt$/,          method: 'GET',  handler: handleRobots  },
];

/* ════════════════════════════════════════════════════════════
   MAIN FETCH HANDLER
   ════════════════════════════════════════════════════════════ */
export default {
  async fetch(request, env, ctx) {
    const url      = new URL(request.url);
    const pathname = url.pathname;
    const method   = request.method.toUpperCase();

    // Security headers applied to every response
    const securityHeaders = {
      'X-Content-Type-Options':    'nosniff',
      'X-Frame-Options':           'DENY',
      'X-XSS-Protection':          '1; mode=block',
      'Referrer-Policy':           'strict-origin-when-cross-origin',
      'Permissions-Policy':        'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy':   buildCSP(),
    };

    try {
      // Match route
      for (const route of ROUTES) {
        if (route.pattern.test(pathname) &&
           (route.method === '*' || route.method === method)) {

          const response = await route.handler(request, env, ctx, { pathname, url });
          return applyHeaders(response, securityHeaders);
        }
      }

      // 404 fallback
      return applyHeaders(serve404(), securityHeaders);

    } catch (err) {
      console.error('[Worker Error]', err);
      return applyHeaders(serve500(), securityHeaders);
    }
  }
};

/* ════════════════════════════════════════════════════════════
   ROUTE HANDLERS
   ════════════════════════════════════════════════════════════ */

/* ─── PRIVATE SECTION ────────────────────────────────────── */
async function handlePrivate(request, env, ctx, { pathname, url }) {
  const token  = extractToken(request, CONFIG.DEV_MODE);
  const result = validateToken(token);

  if (!result.valid) {
    // Redirect to the token entry page with redirect-back URL
    const loginUrl = new URL('/private/login', url.origin);
    loginUrl.searchParams.set('next', pathname);
    if (result.reason) loginUrl.searchParams.set('reason', result.reason);
    return Response.redirect(loginUrl.toString(), 302);
  }

  // Token valid — serve the private page
  const asset = await env.ASSETS.fetch(
    new Request(`${url.origin}/private/index.html`, request)
  );

  if (!asset.ok) return serve404();

  const body = await asset.text();

  // Inject grantee name into the page (server-side personalisation)
  const personalised = body.replace(
    '{{GRANTEE_NAME}}',
    escapeHtml(result.grantee.name)
  ).replace(
    '{{GRANTEE_ROLE}}',
    escapeHtml(result.grantee.role || 'Guest')
  );

  return new Response(personalised, {
    status: 200,
    headers: {
      'Content-Type':  'text/html; charset=utf-8',
      'Cache-Control': CONFIG.CACHE_HTML,
      // Don't let proxies/CDN cache gated content
      'Surrogate-Control': 'no-store',
    }
  });
}

/* ─── ADMIN PANEL ────────────────────────────────────────── */
async function handleAdmin(request, env, ctx, { pathname, url }) {
  const token  = extractToken(request, CONFIG.DEV_MODE);
  const result = validateAdminToken(token);

  if (!result.valid) {
    const loginUrl = new URL('/admin/login', url.origin);
    loginUrl.searchParams.set('next', pathname);
    return Response.redirect(loginUrl.toString(), 302);
  }

  // Serve admin panel
  const asset = await env.ASSETS.fetch(
    new Request(`${url.origin}/admin/index.html`, request)
  );

  if (!asset.ok) return serve404();

  const body = await asset.text();
  const personalised = body.replace('{{ADMIN_NAME}}', escapeHtml(result.grantee.name));

  return new Response(personalised, {
    status: 200,
    headers: {
      'Content-Type':      'text/html; charset=utf-8',
      'Cache-Control':     CONFIG.CACHE_HTML,
      'Surrogate-Control': 'no-store',
    }
  });
}

/* ─── AUTH: VALIDATE ─────────────────────────────────────── */
async function handleAuthValidate(request, env, ctx, { url }) {
  const token  = extractToken(request, CONFIG.DEV_MODE);
  const result = validateToken(token);

  if (!result.valid) {
    return jsonResponse({ authenticated: false, reason: result.reason }, 401);
  }

  return jsonResponse({
    authenticated: true,
    grantee: {
      name:    result.grantee.name,
      role:    result.grantee.role,
      company: result.grantee.company,
    }
  }, 200);
}

/* ─── AUTH: LOGOUT ───────────────────────────────────────── */
async function handleAuthLogout(request, env, ctx, { url }) {
  const response = Response.redirect(url.origin + '/', 302);
  // Clear the auth cookie
  response.headers.set(
    'Set-Cookie',
    `${CONFIG.COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`
  );
  return response;
}

/* ─── PUBLIC PAGE SERVER ─────────────────────────────────── */
function servePublicPage(htmlPath) {
  return async function (request, env, ctx, { url }) {
    const assetUrl = new URL(htmlPath, url.origin);
    const asset    = await env.ASSETS.fetch(new Request(assetUrl.toString(), request));

    if (!asset.ok) return serve404();

    // Clone response to add our headers
    return new Response(asset.body, {
      status:  200,
      headers: {
        'Content-Type':  'text/html; charset=utf-8',
        'Cache-Control': CONFIG.CACHE_HTML,
      }
    });
  };
}

/* ─── STATIC ASSET HANDLER ───────────────────────────────── */
async function handleStaticAsset(request, env, ctx, { url, pathname }) {
  const asset = await env.ASSETS.fetch(request);

  if (!asset.ok) return serve404();

  // Determine cache strategy by extension
  const ext = pathname.split('.').pop().toLowerCase();
  const cacheControl = ['jpg','jpeg','png','webp','svg','ico','woff','woff2'].includes(ext)
    ? CONFIG.CACHE_ASSETS
    : CONFIG.CACHE_CSS_JS;

  return new Response(asset.body, {
    status:  asset.status,
    headers: {
      ...Object.fromEntries(asset.headers.entries()),
      'Cache-Control': cacheControl,
    }
  });
}

/* ─── SITEMAP ────────────────────────────────────────────── */
async function handleSitemap(request, env, ctx, { url }) {
  const base = url.origin;
  const now  = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc><lastmod>${now}</lastmod><priority>1.0</priority></url>
  <url><loc>${base}/projects</loc><lastmod>${now}</lastmod><priority>0.9</priority></url>
  <url><loc>${base}/skills</loc><lastmod>${now}</lastmod><priority>0.8</priority></url>
  <url><loc>${base}/blog</loc><lastmod>${now}</lastmod><priority>0.8</priority></url>
  <url><loc>${base}/social</loc><lastmod>${now}</lastmod><priority>0.6</priority></url>
</urlset>`;

  // Private/admin pages intentionally omitted from sitemap
  return new Response(xml, {
    headers: {
      'Content-Type':  'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    }
  });
}

/* ─── ROBOTS.TXT ─────────────────────────────────────────── */
async function handleRobots(request, env, ctx, { url }) {
  const txt = `User-agent: *
Allow: /
Disallow: /private/
Disallow: /admin/
Disallow: /api/

Sitemap: ${url.origin}/sitemap.xml`;

  return new Response(txt, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

/* ════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════ */

function applyHeaders(response, headers) {
  const newResponse = new Response(response.body, response);
  for (const [key, val] of Object.entries(headers)) {
    newResponse.headers.set(key, val);
  }
  return newResponse;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function serve404() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>404 — Not Found | xensenx</title>
  <link rel="stylesheet" href="/css/base.css" />
  <style>
    body { display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .error { text-align:center; }
    .error__code { font-family:var(--font-mono); font-size:6rem; font-weight:800;
      color:var(--text-ghost); letter-spacing:-0.05em; line-height:1; }
    .error__title { font-size:var(--text-2xl); margin-block:1rem; }
    .error__sub { color:var(--text-secondary); margin-bottom:2rem; }
  </style>
</head>
<body>
  <div class="bg-grid"></div>
  <div class="error">
    <div class="error__code">404</div>
    <h1 class="error__title">Page not found.</h1>
    <p class="error__sub">This page doesn't exist or was moved.</p>
    <a href="/" class="btn btn--ghost">← Back home</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function serve500() {
  return new Response('Internal Server Error', {
    status: 500,
    headers: { 'Content-Type': 'text/plain' }
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildCSP() {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",    // unsafe-inline for tiny inline scripts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.anthropic.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}
