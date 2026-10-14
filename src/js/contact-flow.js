/**
 * contact-flow.js — the right side of the contact page
 *
 * Two nodes of "water" connected by a luminous thread. The thread
 * sways, thins, sometimes loosens so far it lets go — then pulls
 * back and re-links, with a soft ripple at each end.
 *
 * Palette-locked: every color derives from #f5f5dc over #363636.
 * Pointer-events: none; hidden below 1000px (mobile keeps the calm).
 */

(function () {
  'use strict';

  if (window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* The piece only makes sense with room to breathe. If the viewport is
     narrow at load (e.g. the window grows later, or a devtools resize),
     wait and activate on the first wide layout instead of giving up. */
  var MIN_WIDTH = 1000;
  if (window.innerWidth < MIN_WIDTH) {
    var bootOnResize = function () {
      if (window.innerWidth >= MIN_WIDTH) {
        window.removeEventListener('resize', bootOnResize);
        boot();
      }
    };
    window.addEventListener('resize', bootOnResize);
    return;
  }
  boot();

  function boot() {

  var host = document.querySelector('.contact-page');
  if (!host) return;

  var canvas = document.createElement('canvas');
  canvas.id = 'contact-flow-canvas';
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '3'
  });
  host.style.position = 'relative';
  host.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var W = 0, H = 0;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    var r = host.getBoundingClientRect();
    W = r.width;
    H = r.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    /* Pin CSS size to the host box — otherwise the DPR-scaled buffer
       becomes the layout size and spills past the footer in flow. */
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  /* ── The two nodes ───────────────────────────────────────────── */
  var A = { x: 0, y: 0, r: 30, phase: Math.random() * 6.28 };
  var B = { x: 0, y: 0, r: 22, phase: Math.random() * 6.28 };

  function placeNodes() {
    A.x = W * 0.62; A.y = H * 0.40;
    B.x = W * 0.85; B.y = H * 0.62;
  }
  placeNodes();
  window.addEventListener('resize', function () {
    resize();
    placeNodes();
  });

  /* ── Helpers ─────────────────────────────────────────────────── */
  function n1(t) { return 0.5 + 0.5 * Math.sin(t); }   /* 0..1, smooth */

  function nodePos(node, now) {
    return {
      x: node.x + Math.sin(now * 0.00023 + node.phase) * 9,
      y: node.y + Math.sin(now * 0.00031 + node.phase * 1.7) * 13
    };
  }

  function rgba(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')';
  }
  var LIGHT = [245, 245, 220];

  /* Slow two-frequency cycle: 1 = taut and bright, 0 = slack and dim */
  function threadTension(now) {
    return n1(now * 0.00008) * 0.62 + n1(now * 0.00023 + 2) * 0.38;
  }

  /* Point along the thread; sags more when tension is low */
  function threadPoint(t, now, tension) {
    var pa = nodePos(A, now);
    var pb = nodePos(B, now);
    var x = pa.x + (pb.x - pa.x) * t;
    var y = pa.y + (pb.y - pa.y) * t;
    var bow = Math.sin(t * Math.PI) * (10 + (1 - tension) * 40);
    var shimmer = Math.sin(now * 0.0009 + t * 9) * 2.2;
    return { x: x, y: y + bow + shimmer };
  }

  /* ── Draw one water node ─────────────────────────────────────── */
  function drawNode(pos, r, now) {
    var breathe = 1 + 0.06 * Math.sin(now * 0.0012 + pos.x * 0.01);

    /* soft outer haze */
    var haze = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r * 3.1);
    haze.addColorStop(0, rgba(LIGHT, 0.10));
    haze.addColorStop(0.6, rgba(LIGHT, 0.03));
    haze.addColorStop(1, rgba(LIGHT, 0));
    ctx.fillStyle = haze;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r * 3.1, 0, Math.PI * 2);
    ctx.fill();

    /* glassy sphere: bright north-light, fading south */
    var ball = ctx.createRadialGradient(
      pos.x - r * 0.35, pos.y - r * 0.35, r * 0.1,
      pos.x, pos.y, r * breathe
    );
    ball.addColorStop(0, rgba(LIGHT, 0.75));
    ball.addColorStop(0.45, rgba(LIGHT, 0.18));
    ball.addColorStop(1, rgba(LIGHT, 0.02));
    ctx.fillStyle = ball;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r * breathe, 0, Math.PI * 2);
    ctx.fill();

    /* rim light */
    ctx.strokeStyle = rgba(LIGHT, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r * breathe, 0, Math.PI * 2);
    ctx.stroke();

    /* highlight dot */
    ctx.fillStyle = rgba(LIGHT, 0.85);
    ctx.beginPath();
    ctx.arc(pos.x - r * 0.38, pos.y - r * 0.38, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ── Droplets that travel the thread ─────────────────────────── */
  var drops = [];
  var nextDrop = 900;
  var ripples = [];

  function spawnRipple(x, y) {
    ripples.push({ x: x, y: y, r: 2, a: 0.35 });
  }

  /* ── Render loop ─────────────────────────────────────────────── */
  var last = performance.now();

  function loop(now) {
    var dt = Math.min(now - last, 50);
    last = now;
    ctx.clearRect(0, 0, W, H);

    var pa = nodePos(A, now);
    var pb = nodePos(B, now);
    var tension = threadTension(now);

    /* droplet spawns */
    if (now > nextDrop && drops.length < 4 && !document.hidden) {
      drops.push({
        fromA: Math.random() < 0.5,
        p: 0,
        speed: (0.00016 + Math.random() * 0.00011) * dt,
        r: 1.6 + Math.random() * 1.4,
        alive: true
      });
      nextDrop = now + 2600 + Math.random() * 3400;
    }

    /* the thread — drawn as short segments so width/alpha can vary */
    ctx.lineCap = 'round';
    var SEG = 34;
    var prev = threadPoint(0, now, tension);
    for (var i = 1; i <= SEG; i++) {
      var t = i / SEG;
      var pt = threadPoint(t, now, tension);
      var env = Math.sin(t * Math.PI);
      var alpha = (0.30 + 0.32 * tension) * env + 0.06;
      var width = (0.8 + 1.1 * tension) * env + 0.35;
      var grad = ctx.createLinearGradient(prev.x, prev.y, pt.x, pt.y);
      grad.addColorStop(0, rgba(LIGHT, alpha * 0.7));
      grad.addColorStop(0.5, rgba(LIGHT, Math.min(0.9, alpha + 0.15)));
      grad.addColorStop(1, rgba(LIGHT, alpha * 0.7));
      ctx.strokeStyle = grad;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      prev = pt;
    }

    /* droplets */
    for (var d = drops.length - 1; d >= 0; d--) {
      var dr = drops[d];
      dr.p += dr.speed * (dt / 16.7) * 60;
      if (dr.p >= 1) {
        var end = dr.fromA ? pb : pa;
        spawnRipple(end.x, end.y);
        drops.splice(d, 1);
        continue;
      }
      var dp = threadPoint(dr.p, now, tension);
      ctx.fillStyle = rgba(LIGHT, 0.85);
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, dr.r, 0, Math.PI * 2);
      ctx.fill();
      /* short trail behind the droplet */
      var bt = Math.max(0, dr.p - 0.06);
      var bp = threadPoint(bt, now, tension);
      ctx.strokeStyle = rgba(LIGHT, 0.30);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bp.x, bp.y);
      ctx.lineTo(dp.x, dp.y);
      ctx.stroke();
    }

    /* ripples where droplets land */
    for (var rr = ripples.length - 1; rr >= 0; rr--) {
      var rp = ripples[rr];
      rp.r += 0.55 * (dt / 16.7);
      rp.a *= 0.96;
      if (rp.a < 0.01) { ripples.splice(rr, 1); continue; }
      ctx.strokeStyle = rgba(LIGHT, rp.a);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* nodes on top */
    drawNode(pa, A.r, now);
    drawNode(pb, B.r, now);

    requestAnimationFrame(loop);
  }

  /* ── Start when the tab is visible ───────────────────────────── */
  function start() {
    last = performance.now();
    requestAnimationFrame(loop);
  }
  if (document.visibilityState === 'visible') {
    start();
  } else {
    document.addEventListener('visibilitychange', function handler() {
      if (document.visibilityState === 'visible') {
        document.removeEventListener('visibilitychange', handler);
        start();
      }
    });
  }

  /* Test hook */
  window.__xsnFlowTest = {
    placeNodes: placeNodes,
    nodes: [A, B],
    canvas: function () { return canvas; }
  };
  }

})();
