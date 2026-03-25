/* ============================================================
   whitelist.js — xensenx token/whitelist management
   Loaded by the main Worker (index.js)

   HOW IT WORKS:
   - Each grantee gets a unique opaque token (UUID-style)
   - Tokens are stored as keys in this map:
       token → { name, email, grantedAt, expiresAt | null }
   - The Worker checks the incoming cookie/header against this map
   - To revoke: delete the entry. To grant: add an entry.
   - In production, store this in Cloudflare KV for dynamic updates
     without redeployment. For now, a static map suffices.

   GENERATING A TOKEN:
     node -e "console.log(crypto.randomUUID())"
   ============================================================ */

export const WHITELIST = new Map([

  // ── EXAMPLE ENTRIES (replace with real tokens & names) ──
  // Format: [ 'TOKEN_STRING', { name, email, grantedAt, expiresAt } ]

  [
    'xns_7f3a2b1c-4e5d-6f78-9012-abcdef012345',
    {
      name:      'Sarah Chen',
      email:     'sarah.chen@example.com',
      role:      'Hiring Manager',
      company:   'Acme Corp',
      grantedAt: '2025-06-01T00:00:00Z',
      expiresAt: null,             // null = never expires
    }
  ],

  [
    'xns_a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    {
      name:      'Dev Patel',
      email:     'dev.patel@freelance.io',
      role:      'Client',
      company:   'Patel Design Studio',
      grantedAt: '2025-06-10T00:00:00Z',
      expiresAt: '2025-09-01T00:00:00Z',  // expires after trial
    }
  ],

  // ── ADD MORE ENTRIES HERE ──
  // [
  //   'xns_YOUR_GENERATED_UUID_HERE',
  //   {
  //     name:      'Jane Recruiter',
  //     email:     'jane@company.com',
  //     role:      'Recruiter',
  //     company:   'Tech Corp',
  //     grantedAt: new Date().toISOString(),
  //     expiresAt: null,
  //   }
  // ],

]);

/* ─── ADMIN WHITELIST ─────────────────────────────────────
   Admin tokens have full access to the /admin panel.
   Keep this list strictly minimal.                         */
export const ADMIN_WHITELIST = new Map([

  [
    'xns_admin_REPLACE_THIS_WITH_YOUR_SECRET_TOKEN',
    {
      name:      'Ramaiah',
      email:     'admin@xensenx.com',
      role:      'Owner',
      grantedAt: '2025-01-01T00:00:00Z',
      expiresAt: null,
    }
  ],

]);

/* ─── TOKEN VALIDATION HELPERS ────────────────────────────  */

/**
 * Check if a token exists in the regular whitelist and is not expired.
 * @param {string} token
 * @returns {{ valid: boolean, grantee?: object, reason?: string }}
 */
export function validateToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'No token provided' };
  }

  const entry = WHITELIST.get(token.trim());

  if (!entry) {
    return { valid: false, reason: 'Token not recognised' };
  }

  if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
    return { valid: false, reason: 'Token has expired', grantee: entry };
  }

  return { valid: true, grantee: entry };
}

/**
 * Check if a token exists in the admin whitelist and is not expired.
 * @param {string} token
 * @returns {{ valid: boolean, grantee?: object, reason?: string }}
 */
export function validateAdminToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'No token provided' };
  }

  const entry = ADMIN_WHITELIST.get(token.trim());

  if (!entry) {
    return { valid: false, reason: 'Admin token not recognised' };
  }

  if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
    return { valid: false, reason: 'Admin token has expired' };
  }

  return { valid: true, grantee: entry };
}

/**
 * Extract the auth token from a request.
 * Checks (in order): Cookie → Authorization header → Query param (dev only).
 * @param {Request} request
 * @param {boolean} devMode - allow ?token= query param
 * @returns {string|null}
 */
export function extractToken(request, devMode = false) {
  // 1. Cookie: xns_token=<value>
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookieMatch  = cookieHeader.match(/xns_token=([^;]+)/);
  if (cookieMatch) return decodeURIComponent(cookieMatch[1]);

  // 2. Authorization: Bearer <value>
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  // 3. Query param — ONLY in dev mode (never expose in production)
  if (devMode) {
    const url = new URL(request.url);
    const qp  = url.searchParams.get('token');
    if (qp) return qp;
  }

  return null;
}
