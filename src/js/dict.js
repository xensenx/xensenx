/**
 * dict.js — Word definition popup
 * NOTE: do NOT add defer/async — document.currentScript must be readable at execution time.
 * Place at end of <body>. Panel slides in from the right on single-word selection.
 */

(function () {
  'use strict';

  /* ── Path resolution ─────────────────────────────────────────
     Use currentScript.src (always available for non-deferred scripts)
     to compute the absolute URL of assets/dict/, regardless of page depth. */
  var scriptSrc = document.currentScript && document.currentScript.src;
  var DICT_BASE;
  if (scriptSrc) {
    // e.g. "http://localhost:5500/src/js/dict.js"  →  "http://localhost:5500/assets/dict/"
    DICT_BASE = scriptSrc.replace(/src\/js\/dict\.js(\?.*)?$/, '') + 'assets/dict/';
  } else {
    // Fallback: derive from current page URL (strips filename, goes to root)
    var origin = window.location.origin !== 'null' ? window.location.origin : '';
    DICT_BASE = origin + '/assets/dict/';
  }

  /* ── Cache: letter → word map ────────────────────────────────── */
  var cache = {};

  function getDefinition(word, cb) {
    var clean = word.toLowerCase().replace(/[^a-z'-]/g, '');
    if (!clean || clean.length < 2) { cb(null); return; }

    var letter = /^[a-z]/.test(clean[0]) ? clean[0] : '_other';

    if (cache[letter]) {
      cb(cache[letter][clean] || null);
      return;
    }

    var url = DICT_BASE + letter + '.json';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          cache[letter] = JSON.parse(xhr.responseText);
          cb(cache[letter][clean] || null);
        } catch (e) { cb(null); }
      } else {
        console.warn('[dict] failed to load:', url, xhr.status);
        cb(null);
      }
    };
    xhr.onerror = function () {
      console.warn('[dict] network error loading:', url);
      cb(null);
    };
    xhr.send();
  }

  /* ── Panel DOM ───────────────────────────────────────────────── */
  var panel = null;

  function buildPanel() {
    var el = document.createElement('div');
    el.id = 'dict-panel';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Word definition');
    el.innerHTML =
      '<button id="dict-close" aria-label="Close">&times;</button>' +
      '<div id="dict-content"></div>';
    document.body.appendChild(el);
    el.querySelector('#dict-close').addEventListener('click', hidePanel);
    return el;
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showPanel(word, data) {
    if (!panel) panel = buildPanel();
    var content = panel.querySelector('#dict-content');

    if (!data || !data.m || data.m.length === 0) {
      content.innerHTML =
        '<p class="dict-word">' + esc(word.toLowerCase()) + '</p>' +
        '<p class="dict-empty">No definition found.</p>';
    } else {
      var defs = data.m.slice(0, 4).map(function (m) {
        var ex = m.ex && m.ex.length
          ? '<p class="dict-ex">\u201c' + esc(m.ex[0]) + '\u201d</p>'
          : '';
        return '<div class="dict-def">' +
          '<span class="dict-pos">' + esc(m.pos) + '</span>' +
          '<p class="dict-deftext">' + esc(m.def) + '</p>' +
          ex + '</div>';
      }).join('');

      var syn = data.syn && data.syn.length
        ? '<div class="dict-section"><span class="dict-label">Synonyms</span>' + esc(data.syn.join(', ')) + '</div>'
        : '';
      var ant = data.ant && data.ant.length
        ? '<div class="dict-section"><span class="dict-label">Antonyms</span>' + esc(data.ant.join(', ')) + '</div>'
        : '';

      content.innerHTML =
        '<p class="dict-word">' + esc(word.toLowerCase()) + '</p>' +
        '<hr class="dict-rule">' +
        defs + syn + ant;
    }

    panel.classList.remove('dict-visible');
    void panel.offsetHeight;
    panel.classList.add('dict-visible');
  }

  function hidePanel() {
    if (panel) panel.classList.remove('dict-visible');
  }

  /* ── Selection listener ──────────────────────────────────────── */
  var lookupTimer = null;

  function onSelectionEnd() {
    clearTimeout(lookupTimer);
    lookupTimer = setTimeout(function () {
      var sel  = window.getSelection();
      var text = sel ? sel.toString().trim() : '';
      if (!text || /\s/.test(text) || text.length < 2 || text.length > 40) return;
      getDefinition(text, function (data) {
        showPanel(text, data);
      });
    }, 280);
  }

  document.addEventListener('mouseup',  onSelectionEnd);
  document.addEventListener('touchend', onSelectionEnd);

  /* ── Dismiss ─────────────────────────────────────────────────── */
  document.addEventListener('mousedown', function (e) {
    if (panel && panel.classList.contains('dict-visible') && !panel.contains(e.target)) {
      hidePanel();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hidePanel();
  });

})();
