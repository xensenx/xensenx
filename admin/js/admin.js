/* ============================================================
   admin.js — xensenx admin panel
   NOTE: In production, whitelist data is read-only (hardcoded
   in worker/whitelist.js). This UI renders a static view of
   the current whitelist for reference and copy-paste workflow.
   When KV is enabled, swap the MOCK_DATA for a real /api/admin/list call.
   ============================================================ */

(function () {
  'use strict';

  /* ─── MOCK DATA ──────────────────────────────────────────
     Mirrors the entries in worker/whitelist.js exactly.
     Keep this in sync manually until KV integration.        */
  const MOCK_WHITELIST = [
    {
      token:     'xns_7f3a2b1c-4e5d-6f78-9012-abcdef012345',
      name:      'Sarah Chen',
      role:      'Hiring Manager',
      company:   'Acme Corp',
      grantedAt: '2025-06-01T00:00:00Z',
      expiresAt: null,
    },
    {
      token:     'xns_a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name:      'Dev Patel',
      role:      'Client',
      company:   'Patel Design Studio',
      grantedAt: '2025-06-10T00:00:00Z',
      expiresAt: '2025-09-01T00:00:00Z',
    },
  ];

  /* ─── HELPERS ────────────────────────────────────────── */
  function isExpired(expiresAt) {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  function formatDate(isoStr) {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  function maskToken(token) {
    // Show prefix + first 8 chars
    const parts = token.split('_');
    if (parts.length >= 2) {
      return `${parts[0]}_${parts.slice(1).join('_').slice(0, 8)}…`;
    }
    return token.slice(0, 12) + '…';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ─── RENDER TABLE ────────────────────────────────────── */
  function renderWhitelist(data) {
    const tbody = document.getElementById('whitelist-body');
    if (!tbody) return;

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem;font-family:var(--font-mono);font-size:var(--text-xs);">No grantees yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map((g, i) => {
      const expired = isExpired(g.expiresAt);
      const statusHtml = expired
        ? `<span class="status-badge status-badge--expired">● Expired</span>`
        : `<span class="status-badge status-badge--active">● Active</span>`;

      return `
        <tr>
          <td>${escapeHtml(g.name)}</td>
          <td>${escapeHtml(g.role)} · ${escapeHtml(g.company)}</td>
          <td><code style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted);">${escapeHtml(maskToken(g.token))}</code></td>
          <td style="font-family:var(--font-mono);font-size:0.75rem;">${formatDate(g.grantedAt)}</td>
          <td style="font-family:var(--font-mono);font-size:0.75rem;">${g.expiresAt ? formatDate(g.expiresAt) : '∞ Never'}</td>
          <td>${statusHtml}</td>
          <td>
            <button class="table-action" onclick="revokeGrant(${i})" aria-label="Revoke ${escapeHtml(g.name)}'s access">
              Revoke
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  /* ─── STATS ──────────────────────────────────────────── */
  function renderStats(data) {
    const total   = data.length;
    const expired = data.filter(g => isExpired(g.expiresAt)).length;
    const active  = total - expired;

    document.getElementById('stat-total')  && (document.getElementById('stat-total').textContent   = total);
    document.getElementById('stat-active') && (document.getElementById('stat-active').textContent  = active);
    document.getElementById('stat-expired')&& (document.getElementById('stat-expired').textContent = expired);
  }

  /* ─── REVOKE (UI only — requires manual whitelist.js edit) ─ */
  window.revokeGrant = function (index) {
    const grantee = MOCK_WHITELIST[index];
    if (!grantee) return;

    const confirmed = window.confirm(
      `Revoke access for ${grantee.name}?\n\n` +
      `You must also remove this token from worker/whitelist.js and redeploy.\n\n` +
      `Token: ${grantee.token}`
    );

    if (confirmed) {
      // Copy token to clipboard for easy editing
      navigator.clipboard?.writeText(grantee.token).then(() => {
        alert(`Token copied to clipboard. Now remove it from worker/whitelist.js and run:\n\nwrangler deploy`);
      });
    }
  };

  /* ─── COPY CODE BLOCKS ───────────────────────────────── */
  window.copyCode = function (btn) {
    const pre  = btn.closest('.code-block')?.querySelector('pre');
    if (!pre) return;

    navigator.clipboard?.writeText(pre.textContent.trim()).then(() => {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    });
  };

  /* ─── ADD MODAL (stub) ───────────────────────────────── */
  window.showAddModal = function () {
    const token = `xns_${Math.random().toString(36).slice(2,10)}-${Math.random().toString(36).slice(2,10)}-${Math.random().toString(36).slice(2,6)}`;
    const snippet = `[\n  '${token}',\n  {\n    name:      'New Grantee',\n    email:     'email@example.com',\n    role:      'Recruiter',\n    company:   'Company Name',\n    grantedAt: '${new Date().toISOString()}',\n    expiresAt: null,\n  }\n],`;

    navigator.clipboard?.writeText(snippet).then(() => {
      alert(
        `New token generated and snippet copied to clipboard!\n\n` +
        `Token: ${token}\n\n` +
        `Paste into worker/whitelist.js → WHITELIST Map, then run:\n\nwrangler deploy`
      );
    });
  };

  /* ─── INIT ───────────────────────────────────────────── */
  function init() {
    // Simulate async load
    setTimeout(() => {
      renderWhitelist(MOCK_WHITELIST);
      renderStats(MOCK_WHITELIST);
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
