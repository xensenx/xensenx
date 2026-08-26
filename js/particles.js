/**
 * particles.js
 *
 * Sparse beige dust motes that materialise near the cursor
 * and drift away from it — slow, deliberate, never intrusive.
 *
 * The canvas sits over all content but pointer-events: none,
 * so every link, button and selectable text still works.
 *
 * Activated only after the flash screen fully dissolves.
 */

(function () {
  "use strict";

  // ── Canvas ──────────────────────────────────────────────────
  const canvas = document.createElement("canvas");
  canvas.id    = "particle-canvas";
  Object.assign(canvas.style, {
    position:      "fixed",
    inset:         "0",
    pointerEvents: "none",   // CRITICAL — clicks pass straight through
    zIndex:        "50",
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  // ── Config ───────────────────────────────────────────────────
  const MAX_PARTICLES = 55;    // hard cap — keeps it restrained
  const REPEL_RADIUS  = 95;    // px — cursor influence zone
  const SPAWN_INTERVAL= 42;    // ms — throttle between spawns
  const BEIGE         = [245, 245, 220]; // #f5f5dc components

  // ── State ────────────────────────────────────────────────────
  const pool      = [];
  const mouse     = { x: -9999, y: -9999 };
  let   lastSpawn = 0;
  let   active    = false;   // stays false until main page is live

  // ── Particle ─────────────────────────────────────────────────
  function Particle(ox, oy) {
    // Spawn within a small cloud around the cursor
    this.x  = ox + (Math.random() - 0.5) * 28;
    this.y  = oy + (Math.random() - 0.5) * 28;

    // Very slow random drift — not explosive
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.12 + Math.random() * 0.28;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    // Life 1→0 — each particle lives for ~2.5 – 4 seconds at 60fps
    this.life     = 1.0;
    this.decay    = 0.003 + Math.random() * 0.0025;

    // Size and opacity — kept visually quiet
    this.r        = 0.9  + Math.random() * 1.3;     // 0.9 – 2.2 px
    this.peakA    = 0.16 + Math.random() * 0.16;    // 0.16 – 0.32
  }

  Particle.prototype.update = function () {
    const dx   = this.x - mouse.x;
    const dy   = this.y - mouse.y;
    const dist = Math.hypot(dx, dy);

    // Soft repulsion — particles drift away, not flung away
    if (dist < REPEL_RADIUS && dist > 1) {
      const t  = 1 - dist / REPEL_RADIUS;  // 0 at edge, 1 at centre
      const f  = t * t * 0.22;             // ease-in, very gentle
      this.vx += (dx / dist) * f;
      this.vy += (dy / dist) * f;
    }

    // Dampen — particles naturally slow and stop, never escape
    this.vx *= 0.968;
    this.vy *= 0.968;

    this.x    += this.vx;
    this.y    += this.vy;
    this.life -= this.decay;
  };

  Particle.prototype.draw = function () {
    // Fade in fast (first ~15% of life), fade out slowly
    const easeIn = Math.min(1, (1 - this.life) * 7);
    const alpha  = this.peakA * easeIn * this.life;
    if (alpha < 0.005) return;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle =
      "rgba(" + BEIGE[0] + "," + BEIGE[1] + "," + BEIGE[2] +
      "," + alpha.toFixed(3) + ")";
    ctx.fill();
  };

  Particle.prototype.isDead = function () { return this.life <= 0; };

  // ── Mouse tracking ───────────────────────────────────────────
  document.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    if (!active) return;

    const now = Date.now();
    if (now - lastSpawn < SPAWN_INTERVAL) return;
    lastSpawn = now;

    // Spawn 1 particle; occasionally 2 — never a burst
    const n = pool.length < MAX_PARTICLES
      ? (Math.random() < 0.35 ? 2 : 1)
      : 0;
    for (let i = 0; i < n; i++) {
      pool.push(new Particle(e.clientX, e.clientY));
    }
  }, { passive: true });

  // ── Render loop ──────────────────────────────────────────────
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = pool.length - 1; i >= 0; i--) {
      pool[i].update();
      pool[i].draw();
      if (pool[i].isDead()) pool.splice(i, 1);
    }

    requestAnimationFrame(tick);
  }
  tick();

  // ── Gate: activate only once the flash screen is gone ────────
  // Uses MutationObserver so there's no coupling to main.js timings.
  const mainPage = document.getElementById("main-page");
  const observer = new MutationObserver(function () {
    if (mainPage.classList.contains("visible")) {
      active = true;
      observer.disconnect();
    }
  });
  observer.observe(mainPage, { attributes: true, attributeFilter: ["class"] });

})();
