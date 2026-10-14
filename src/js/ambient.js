/**
 * ambient.js
 *
 * Site-wide quiet layer:
 *   1. Rare "shooting mote" — a slow beige streak drifting across the
 *      viewport every ~25–50 seconds. Easy to miss. That's the point.
 *   2. Konami code (↑↑↓↓←→←→BA) — a brief dust flurry and a small
 *      note in the site's voice.
 *   3. A note in the devtools console for the curious.
 *
 * Everything is decorative: pointer-events: none, no layout impact,
 * and fully disabled under prefers-reduced-motion (except the console
 * note and the toast text, which move nothing).
 */

(function () {
  'use strict';

  var REDUCED = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 3. Console note ─────────────────────────────────────────── */
  try {
    console.log(
      '%c /\\_/\\  \n( o.o )   xensenx\n > ^ <   ',
      'color:#f5f5dc;background:#363636;font-size:13px;line-height:1.5;padding:8px 12px;border-radius:8px;'
    );
    console.log(
      '%cyou found the quiet console. curious minds: try \u2191 \u2191 \u2193 \u2193 \u2190 \u2192 \u2190 \u2192 B A',
      'color:#9a9282;font-style:italic;font-size:12px;'
    );
  } catch (e) { /* console unavailable */ }

  /* ── Easter-egg toast ────────────────────────────────────────── */
  var toastEl = null;
  var toastTimer = null;

  function showToast() {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'easter-toast';
      toastEl.setAttribute('aria-hidden', 'true');
      toastEl.textContent = '\u00b7 everyday, another chance \u00b7';
      document.body.appendChild(toastEl);
    }
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 3400);
  }

  /* ── Konami sequence ─────────────────────────────────────────── */
  var SEQ = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown',
             'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  var typed = [];

  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    if (!k) return;
    typed.push(k);
    if (typed.length > SEQ.length) typed.shift();
    if (typed.join('|') === SEQ.join('|')) {
      typed = [];
      showToast();
      if (!REDUCED) burstDust();
    }
  });

  /* Below this point everything moves — stop for reduced motion. */
  if (REDUCED) return;

  /* ── Canvas ──────────────────────────────────────────────────── */
  var canvas = document.createElement('canvas');
  canvas.id = 'ambient-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '44'
  });
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var W = 0, H = 0;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    /* Pin CSS size to the viewport — a canvas buffer is its intrinsic
       layout size otherwise, which overflows on high-DPI screens. */
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* ── Shooting motes ──────────────────────────────────────────── */
  var stars = [];
  var nextStar = performance.now() + 9000 + Math.random() * 8000;

  function spawnStar(now) {
    var fromLeft = Math.random() < 0.5;
    stars.push({
      x: fromLeft ? -90 : W + 90,
      y: 40 + Math.random() * H * 0.42,
      vx: (fromLeft ? 1 : -1) * (2.4 + Math.random() * 1.6),
      vy: 0.7 + Math.random() * 0.8,
      born: now,
      dur: 1500 + Math.random() * 800
    });
  }

  /* ── Dust flurry (konami reward) ─────────────────────────────── */
  var dust = [];

  function burstDust() {
    for (var i = 0; i < 110; i++) {
      dust.push({
        x: Math.random() * W,
        y: H * 0.12 + Math.random() * H * 0.85,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.1 - Math.random() * 0.45,
        life: 1,
        decay: 0.0022 + Math.random() * 0.0022,
        r: 0.8 + Math.random() * 1.9,
        peak: 0.12 + Math.random() * 0.2
      });
    }
  }

  /* ── Render loop ─────────────────────────────────────────────── */
  var last = performance.now();

  function frame(now) {
    var dt = Math.min(now - last, 50);
    last = now;
    ctx.clearRect(0, 0, W, H);

    if (now >= nextStar && !document.hidden) {
      spawnStar(now);
      nextStar = now + 24000 + Math.random() * 26000;
    }

    var i, s, p, env, tailX, tailY, grad, easeIn, a;

    for (i = stars.length - 1; i >= 0; i--) {
      s = stars[i];
      p = (now - s.born) / s.dur;
      if (p >= 1) { stars.splice(i, 1); continue; }
      s.x += s.vx * (dt / 16.7);
      s.y += s.vy * (dt / 16.7);

      env = Math.sin(Math.PI * p);
      tailX = s.x - s.vx * 15;
      tailY = s.y - s.vy * 15;

      grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
      grad.addColorStop(0, 'rgba(250,247,235,' + (0.65 * env).toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(250,247,235,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      ctx.fillStyle = 'rgba(250,247,235,' + (0.8 * env).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    for (i = dust.length - 1; i >= 0; i--) {
      s = dust[i];
      s.life -= s.decay * (dt / 16.7);
      if (s.life <= 0) { dust.splice(i, 1); continue; }
      s.x += s.vx * (dt / 16.7);
      s.y += s.vy * (dt / 16.7);

      easeIn = Math.min(1, (1 - s.life) * 6);
      a = s.peak * easeIn * s.life;
      if (a < 0.004) continue;
      ctx.fillStyle = 'rgba(245,245,220,' + a.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* Test hook — lets automated checks summon a mote without waiting. */
  window.__xsnAmbientTest = {
    spawnStarNow: function () {
      spawnStar(performance.now());
      nextStar = performance.now() + 60000;
    }
  };

})();
