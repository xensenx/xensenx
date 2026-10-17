/**
 * mind-waves.js
 *
 * Ambient, organic floating fluid droplets in the right corner of the Mind hero section.
 *
 * Refined and elevated with liquid grace, quiet restraint, physical depth, and gravity physics:
 * - Fixed viewport placement: stays anchored in the top-right corner while page sections
 *   and contents scroll smoothly above it
 * - Scroll-driven gravity & settling physics: scrolling down triggers downward acceleration
 *   ("falling") with fluid vertical elongation & teardrop droop; scrolling up triggers
 *   buoyant lift ("flying"); stopping scroll triggers an organic spring-damper settle with liquid rebound
 * - Truly dynamic fluid morphology: multi-harmonic traveling surface waves with
 *   gentle breathing and natural frequency dispersion, preventing repetitive loops
 * - Volumetric depth and physical realism: soft ambient radial gradients,
 *   warm caustic back-scatter, curved specular crescent sheen with crisp micro-glint,
 *   and directional meniscus contour
 * - Frame-rate independent physics: delta-time based exponential damping for
 *   buttery smooth motion on 60Hz, 120Hz, 144Hz and high-refresh displays
 * - Hydrodynamic responsiveness: smooth liquid deflection, near-side surface indentation,
 *   volume-conserving lateral bulge, and trailing capillary ripple dissipation
 * - Complete absence of phantom mouse kicks or orientation flipping
 * - High performance: dense 64-point smooth B-splines, pre-allocated geometry,
 *   IntersectionObserver auto-pausing when out of viewport, visibility gating,
 *   and full prefers-reduced-motion accessibility support.
 */

(function () {
  "use strict";

  const REDUCED_MOTION = window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Locate or create wrap & canvas
  let wrap = document.querySelector(".mind-art-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "mind-art-wrap";
    wrap.setAttribute("aria-hidden", "true");
    const mainPage = document.getElementById("main-page") || document.body;
    mainPage.insertBefore(wrap, mainPage.firstChild);
  }

  let canvas = document.getElementById("mind-art-canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "mind-art-canvas";
    wrap.appendChild(canvas);
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // ── Sizing & High DPI ───────────────────────────────────────
  let width = 0;
  let height = 0;
  let dpr = 1;

  function resize() {
    const rect = wrap.getBoundingClientRect();
    width = rect.width || (window.innerWidth * 0.50);
    height = rect.height || window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  // ── Palette constants (matches site aesthetic) ───────────────
  const COLOR_BEIGE        = "245, 245, 220"; // #f5f5dc (warm ivory)
  const COLOR_CHAMPAGNE    = "236, 228, 208"; // warm soft champagne
  const COLOR_AMBER_WARM   = "222, 212, 192"; // delicate warm shadow
  const COLOR_BRIGHT_GLINT = "255, 255, 246"; // crisp micro-glint

  // ── Scroll Gravity & Velocity Tracking ──────────────────────
  let lastScrollY = window.scrollY || window.pageYOffset || 0;
  let scrollImpulse = 0;
  let smoothedScrollVelocity = 0;

  window.addEventListener("scroll", function () {
    const currentY = window.scrollY || window.pageYOffset || 0;
    const delta = currentY - lastScrollY;
    lastScrollY = currentY;
    scrollImpulse += delta;
  }, { passive: true });

  // ── Mouse tracking (smooth damped influence, zero phantom kicks) ──
  const mouse = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    influence: 0,
    targetInfluence: 0,
    initialized: false
  };

  window.addEventListener("mousemove", function (e) {
    const rect = wrap.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check if cursor is within or near the art canvas
    if (
      mx >= -140 && mx <= rect.width + 140 &&
      my >= -140 && my <= rect.height + 140
    ) {
      mouse.targetX = mx;
      mouse.targetY = my;
      mouse.targetInfluence = 1;
      if (!mouse.initialized) {
        mouse.x = mx;
        mouse.y = my;
        mouse.initialized = true;
      }
    } else {
      mouse.targetInfluence = 0;
    }
  }, { passive: true });

  window.addEventListener("mouseleave", function () {
    mouse.targetInfluence = 0;
  });

  window.addEventListener("blur", function () {
    mouse.targetInfluence = 0;
  });

  // ── Utility: shortest angular difference ────────────────────
  function angleDiff(a, b) {
    let diff = (a - b) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    return diff;
  }

  // ── Fluid Droplets Definition ───────────────────────────────
  // Balanced asymmetrical constellation of organically morphing fluid droplets
  const droplets = [
    {
      // Primary Hero Droplet
      relX: 0.54, relY: 0.43,
      baseRadiusRel: 0.165, minR: 70, maxR: 108,
      mass: 1.0, stiffness: 20.0, damping: 4.6,
      scrollOffsetY: 0, scrollVelY: 0,
      modes: [
        { k: 2, amp: 0.080, breathSpeed: 0.00028, waveSpeed: 0.00042, dir: 1, phase: 0.4 },
        { k: 3, amp: 0.042, breathSpeed: 0.00038, waveSpeed: 0.00062, dir: -1, phase: 1.8 },
        { k: 4, amp: 0.020, breathSpeed: 0.00052, waveSpeed: 0.00088, dir: 1, phase: 3.1 },
        { k: 5, amp: 0.009, breathSpeed: 0.00070, waveSpeed: 0.00118, dir: -1, phase: 4.5 }
      ],
      driftPeriodX: 20000, driftPeriodY: 24000,
      driftAmpX: 18, driftAmpY: 15,
      subDriftPeriodX: 9500, subDriftPeriodY: 11500,
      subDriftAmpX: 4, subDriftAmpY: 3.5,
      strokeAlpha: 0.16, fillAlpha: 0.022, highlightAlpha: 0.16,
      x: 0, y: 0,
      smoothVx: 0, smoothVy: 0, smoothSpeed: 0, smoothAngle: 0,
      rippleAmp: 0, ripplePhase: 0,
      mouseProximity: 0, mouseAngle: 0
    },
    {
      // Upper Companion Droplet
      relX: 0.77, relY: 0.25,
      baseRadiusRel: 0.098, minR: 41, maxR: 62,
      mass: 0.78, stiffness: 23.0, damping: 4.9,
      scrollOffsetY: 0, scrollVelY: 0,
      modes: [
        { k: 2, amp: 0.090, breathSpeed: 0.00035, waveSpeed: 0.00052, dir: -1, phase: 1.2 },
        { k: 3, amp: 0.046, breathSpeed: 0.00048, waveSpeed: 0.00078, dir: 1, phase: 2.7 },
        { k: 4, amp: 0.022, breathSpeed: 0.00065, waveSpeed: 0.00110, dir: -1, phase: 0.6 }
      ],
      driftPeriodX: 18000, driftPeriodY: 21000,
      driftAmpX: 14, driftAmpY: 12,
      subDriftPeriodX: 8200, subDriftPeriodY: 9800,
      subDriftAmpX: 3, subDriftAmpY: 2.5,
      strokeAlpha: 0.13, fillAlpha: 0.016, highlightAlpha: 0.14,
      x: 0, y: 0,
      smoothVx: 0, smoothVy: 0, smoothSpeed: 0, smoothAngle: 0,
      rippleAmp: 0, ripplePhase: 0,
      mouseProximity: 0, mouseAngle: 0
    },
    {
      // Lower Inner Anchor Droplet
      relX: 0.38, relY: 0.69,
      baseRadiusRel: 0.075, minR: 31, maxR: 47,
      mass: 0.65, stiffness: 26.0, damping: 5.2,
      scrollOffsetY: 0, scrollVelY: 0,
      modes: [
        { k: 2, amp: 0.082, breathSpeed: 0.00040, waveSpeed: 0.00060, dir: 1, phase: 3.5 },
        { k: 3, amp: 0.042, breathSpeed: 0.00055, waveSpeed: 0.00092, dir: -1, phase: 0.9 },
        { k: 4, amp: 0.018, breathSpeed: 0.00075, waveSpeed: 0.00130, dir: 1, phase: 4.2 }
      ],
      driftPeriodX: 22000, driftPeriodY: 18000,
      driftAmpX: 12, driftAmpY: 13,
      subDriftPeriodX: 10200, subDriftPeriodY: 8600,
      subDriftAmpX: 2.5, subDriftAmpY: 3,
      strokeAlpha: 0.12, fillAlpha: 0.014, highlightAlpha: 0.13,
      x: 0, y: 0,
      smoothVx: 0, smoothVy: 0, smoothSpeed: 0, smoothAngle: 0,
      rippleAmp: 0, ripplePhase: 0,
      mouseProximity: 0, mouseAngle: 0
    },
    {
      // Satellite Droplet
      relX: 0.72, relY: 0.67,
      baseRadiusRel: 0.045, minR: 18, maxR: 29,
      mass: 0.45, stiffness: 30.0, damping: 5.6,
      scrollOffsetY: 0, scrollVelY: 0,
      modes: [
        { k: 2, amp: 0.092, breathSpeed: 0.00050, waveSpeed: 0.00080, dir: -1, phase: 2.2 },
        { k: 3, amp: 0.048, breathSpeed: 0.00070, waveSpeed: 0.00120, dir: 1, phase: 4.8 }
      ],
      driftPeriodX: 16000, driftPeriodY: 19000,
      driftAmpX: 9, driftAmpY: 10,
      subDriftPeriodX: 7400, subDriftPeriodY: 8800,
      subDriftAmpX: 2, subDriftAmpY: 2,
      strokeAlpha: 0.10, fillAlpha: 0.012, highlightAlpha: 0.11,
      x: 0, y: 0,
      smoothVx: 0, smoothVy: 0, smoothSpeed: 0, smoothAngle: 0,
      rippleAmp: 0, ripplePhase: 0,
      mouseProximity: 0, mouseAngle: 0
    },
    {
      // Top Micro Dew
      relX: 0.63, relY: 0.15,
      baseRadiusRel: 0.024, minR: 10, maxR: 15,
      mass: 0.30, stiffness: 35.0, damping: 6.2,
      scrollOffsetY: 0, scrollVelY: 0,
      modes: [
        { k: 2, amp: 0.085, breathSpeed: 0.00065, waveSpeed: 0.00100, dir: 1, phase: 1.6 },
        { k: 3, amp: 0.040, breathSpeed: 0.00085, waveSpeed: 0.00145, dir: -1, phase: 3.3 }
      ],
      driftPeriodX: 14000, driftPeriodY: 16000,
      driftAmpX: 7, driftAmpY: 7,
      subDriftPeriodX: 6500, subDriftPeriodY: 7200,
      subDriftAmpX: 1.5, subDriftAmpY: 1.5,
      strokeAlpha: 0.09, fillAlpha: 0.010, highlightAlpha: 0.09,
      x: 0, y: 0,
      smoothVx: 0, smoothVy: 0, smoothSpeed: 0, smoothAngle: 0,
      rippleAmp: 0, ripplePhase: 0,
      mouseProximity: 0, mouseAngle: 0
    }
  ];

  // ── Ambient Suspended Liquid Motes ──────────────────────────
  const motes = [
    { relX: 0.44, relY: 0.32, r: 1.3, speed: 0.00028, phase: 0.8, orbitRx: 16, orbitRy: 12, alphaBase: 0.11, scrollOffsetY: 0 },
    { relX: 0.68, relY: 0.19, r: 1.1, speed: 0.00034, phase: 2.1, orbitRx: 12, orbitRy: 15, alphaBase: 0.09, scrollOffsetY: 0 },
    { relX: 0.82, relY: 0.45, r: 1.6, speed: 0.00024, phase: 4.3, orbitRx: 18, orbitRy: 14, alphaBase: 0.12, scrollOffsetY: 0 },
    { relX: 0.52, relY: 0.58, r: 1.0, speed: 0.00038, phase: 1.5, orbitRx: 14, orbitRy: 10, alphaBase: 0.08, scrollOffsetY: 0 },
    { relX: 0.36, relY: 0.48, r: 1.4, speed: 0.00026, phase: 3.7, orbitRx: 20, orbitRy: 16, alphaBase: 0.10, scrollOffsetY: 0 },
    { relX: 0.74, relY: 0.78, r: 1.2, speed: 0.00031, phase: 5.2, orbitRx: 15, orbitRy: 13, alphaBase: 0.09, scrollOffsetY: 0 },
    { relX: 0.60, relY: 0.82, r: 1.5, speed: 0.00022, phase: 0.3, orbitRx: 17, orbitRy: 15, alphaBase: 0.11, scrollOffsetY: 0 },
    { relX: 0.86, relY: 0.62, r: 0.9, speed: 0.00042, phase: 2.9, orbitRx: 11, orbitRy: 9,  alphaBase: 0.08, scrollOffsetY: 0 }
  ];

  // Pre-allocated perimeter points for 64-point smooth B-splines (zero GC churn)
  const N = 64;
  const pts = new Array(N);
  for (let i = 0; i < N; i++) {
    pts[i] = { x: 0, y: 0 };
  }

  function traceSpline(target) {
    target.beginPath();
    const pLast = pts[N - 1];
    const p0 = pts[0];
    target.moveTo((pLast.x + p0.x) * 0.5, (pLast.y + p0.y) * 0.5);
    for (let i = 0; i < N; i++) {
      const curr = pts[i];
      const next = pts[(i + 1) % N];
      target.quadraticCurveTo(curr.x, curr.y, (curr.x + next.x) * 0.5, (curr.y + next.y) * 0.5);
    }
    target.closePath();
  }

  // ── Render Individual Fluid Droplet ─────────────────────────
  function drawFluidDroplet(d, t, dt) {
    // Base radius scaled to container
    const minDim = Math.min(width, height);
    const R = Math.max(d.minR, Math.min(d.maxR, minDim * d.baseRadiusRel));

    // 1. Scroll-driven gravity & settling physics
    const scrollForce = smoothedScrollVelocity * 0.95;
    const springForce = -d.stiffness * d.scrollOffsetY;
    const dampingForce = -d.damping * d.scrollVelY;
    const netAccel = (springForce + dampingForce + scrollForce) / d.mass;

    d.scrollVelY += netAccel * dt;
    d.scrollVelY = Math.max(-1200, Math.min(1200, d.scrollVelY));
    d.scrollOffsetY += d.scrollVelY * dt;
    d.scrollOffsetY = Math.max(-110, Math.min(130, d.scrollOffsetY));

    // Dynamic vertical stretch & teardrop sag from falling/flying velocity.
    // scrollVelY is in px/s (spring internal units). Scale to shape space [−0.30, +0.30].
    const sagStretch = Math.max(-0.30, Math.min(0.30, d.scrollVelY * 0.00095));

    // Excite subtle ripple when landing or settling sharply
    if (Math.abs(d.scrollVelY) > 50 && Math.abs(netAccel) > 140) {
      d.rippleAmp = Math.min(0.065, d.rippleAmp + Math.min(0.00008 * Math.abs(netAccel), 0.015));
    }

    // 2. Dual-Lissajous calm drift + gravity displacement
    const driftX = Math.sin((t / d.driftPeriodX) * Math.PI * 2) * d.driftAmpX
                 + Math.sin((t / d.subDriftPeriodX) * Math.PI * 2) * d.subDriftAmpX;
    const driftY = Math.cos((t / d.driftPeriodY) * Math.PI * 2) * d.driftAmpY
                 + Math.cos((t / d.subDriftPeriodY) * Math.PI * 2) * d.subDriftAmpY;

    let targetX = width * d.relX + driftX;
    let targetY = height * d.relY + driftY + d.scrollOffsetY;

    // 3. Liquid cursor displacement & interaction
    d.mouseProximity = 0;
    if (mouse.influence > 0.005) {
      const dx = d.x - mouse.x;
      const dy = d.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      d.mouseAngle = Math.atan2(dy, dx);
      const repelDist = R + 130;

      if (dist < repelDist && dist > 1) {
        const prox = 1 - (dist / repelDist);
        d.mouseProximity = prox;
        // Smooth cubic falloff for gentle cushioned repulsion
        const smoothProx = prox * prox * (3 - 2 * prox);
        const repelForce = smoothProx * 20 * mouse.influence;
        targetX += Math.cos(d.mouseAngle) * repelForce;
        targetY += Math.sin(d.mouseAngle) * repelForce;

        // Dynamic fluid flow: if mouse has speed, drag droplet slightly along current
        if (mouse.speed > 5) {
          const flowForce = Math.min(mouse.speed * 0.012, 5) * prox * mouse.influence;
          targetX += (mouse.vx / (mouse.speed || 1)) * flowForce;
          targetY += (mouse.vy / (mouse.speed || 1)) * flowForce;
        }

        // Excite subtle ripple when cursor brushes by
        if (mouse.speed > 25 && dist < (R + 50)) {
          const impulse = Math.min((mouse.speed / 400) * 0.035, 0.045) * prox * mouse.influence;
          d.rippleAmp = Math.min(0.065, d.rippleAmp + impulse);
        }
      }
    }

    // 4. Frame-rate independent smooth liquid inertia
    if (d.x === 0 && d.y === 0) {
      d.x = targetX;
      d.y = targetY;
    } else {
      const prevX = d.x;
      const prevY = d.y;
      const posFactor = 1 - Math.exp(-3.5 * dt);
      d.x += (targetX - d.x) * posFactor;
      d.y += (targetY - d.y) * posFactor;

      const instantVx = (d.x - prevX) / Math.max(dt, 0.001);
      const instantVy = (d.y - prevY) / Math.max(dt, 0.001);
      const velFactor = 1 - Math.exp(-4.5 * dt);
      d.smoothVx += (instantVx - d.smoothVx) * velFactor;
      d.smoothVy += (instantVy - d.smoothVy) * velFactor;
      d.smoothSpeed = Math.hypot(d.smoothVx, d.smoothVy);
      if (d.smoothSpeed > 1) {
        d.smoothAngle = Math.atan2(d.smoothVy, d.smoothVx);
      }
    }

    // Ripple dissipation
    if (d.rippleAmp > 0.0005) {
      d.rippleAmp *= Math.exp(-2.2 * dt);
      d.ripplePhase += 5.5 * dt;
    } else {
      d.rippleAmp = 0;
    }

    // Dynamic elongation along velocity vector (volume-conserving shear)
    let velStretch = 0;
    if (d.smoothSpeed > 2) {
      const normSpeed = Math.min((d.smoothSpeed - 2) / 60, 1);
      velStretch = normSpeed * 0.07;
    }

    // 5. Generate perimeter points via traveling waves + gravity sag
    for (let i = 0; i < N; i++) {
      const angle = (i / N) * Math.PI * 2;
      let dr = 0;

      // Multi-harmonic traveling capillary waves
      for (let m = 0; m < d.modes.length; m++) {
        const mode = d.modes[m];
        const dynamicAmp = mode.amp * (1 + 0.28 * Math.sin(t * mode.breathSpeed + mode.phase));
        const waveAngle = mode.k * angle + (mode.dir * t * mode.waveSpeed) + mode.phase;
        dr += dynamicAmp * Math.sin(waveAngle);
      }

      // Velocity elongation
      if (velStretch > 0.002) {
        dr += velStretch * Math.cos(2 * (angle - d.smoothAngle));
      }

      // Vertical stretch and gravitational sag
      // k=1 asymmetric deformation: trailing edge tapers, leading edge stays round.
      // Falling (sagStretch > 0): sin(angle) pushes bottom out (+) and pulls top in (-) → teardrop.
      // Rising  (sagStretch < 0): sin(angle) pushes top out and pulls bottom in → rising bubble dome.
      if (Math.abs(sagStretch) > 0.003) {
        // Primary teardrop taper — asymmetric k=1
        dr += sagStretch * 1.10 * Math.sin(angle);
        // Slight lateral pinch for volume conservation (keeps the circle feeling full)
        dr -= Math.abs(sagStretch) * 0.22 * Math.cos(angle) * Math.cos(angle);
      }

      // Cursor indentation and volume conservation
      if (d.mouseProximity > 0.02 && mouse.influence > 0.01) {
        const dAngle = angleDiff(angle, d.mouseAngle + Math.PI); // facing cursor
        const indentFactor = Math.exp(-Math.pow(dAngle / 0.72, 2));
        dr -= indentFactor * d.mouseProximity * 0.14 * mouse.influence;
        // Lateral bulge
        const bulgeAngle = angleDiff(angle, d.mouseAngle + Math.PI * 0.5);
        dr += Math.pow(Math.sin(bulgeAngle), 2) * d.mouseProximity * 0.045 * mouse.influence;
      }

      // Transient ripple
      if (d.rippleAmp > 0.001) {
        dr += d.rippleAmp * Math.sin(3 * angle - d.ripplePhase);
      }

      const r = Math.max(R * 0.35, R * (1 + dr));
      pts[i].x = d.x + r * Math.cos(angle);
      pts[i].y = d.y + r * Math.sin(angle);
    }

    // ── PASS 1: Volumetric Translucent Body ────────────────────
    traceSpline(ctx);
    const lightOffset = R * 0.26;
    const lx = d.x - lightOffset;
    const ly = d.y - lightOffset;
    const bodyGrad = ctx.createRadialGradient(
      lx, ly, R * 0.05,
      d.x, d.y, R * 1.12
    );
    bodyGrad.addColorStop(0, "rgba(" + COLOR_BEIGE + ", " + (d.fillAlpha * 1.6) + ")");
    bodyGrad.addColorStop(0.38, "rgba(" + COLOR_CHAMPAGNE + ", " + (d.fillAlpha * 0.75) + ")");
    bodyGrad.addColorStop(0.82, "rgba(" + COLOR_AMBER_WARM + ", " + (d.fillAlpha * 1.25) + ")");
    bodyGrad.addColorStop(1, "rgba(" + COLOR_BEIGE + ", 0)");
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // ── PASS 2: Caustic Back-Scatter / Internal Volume ─────────
    if (R > 28) {
      ctx.save();
      traceSpline(ctx);
      ctx.clip();

      const cx = d.x + lightOffset * 0.85;
      const cy = d.y + lightOffset * 0.85;
      const causticGrad = ctx.createRadialGradient(
        cx, cy, 0,
        cx, cy, R * 0.65
      );
      causticGrad.addColorStop(0, "rgba(" + COLOR_CHAMPAGNE + ", " + (d.fillAlpha * 1.2) + ")");
      causticGrad.addColorStop(0.55, "rgba(" + COLOR_AMBER_WARM + ", " + (d.fillAlpha * 0.4) + ")");
      causticGrad.addColorStop(1, "rgba(" + COLOR_BEIGE + ", 0)");
      ctx.fillStyle = causticGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // ── PASS 3: Soft Micro-Glint (no hard lines) ─────────────
      // Just a diffuse radial glow — no arc strokes
      const glintX = d.x - lightOffset * 1.25;
      const glintY = d.y - lightOffset * 1.25;
      const glintR = Math.max(2.0, R * 0.04);
      const glintGrad = ctx.createRadialGradient(glintX, glintY, 0, glintX, glintY, glintR * 1.8);
      glintGrad.addColorStop(0, "rgba(" + COLOR_BRIGHT_GLINT + ", " + (d.highlightAlpha * 1.15) + ")");
      glintGrad.addColorStop(0.4, "rgba(" + COLOR_BEIGE + ", " + (d.highlightAlpha * 0.45) + ")");
      glintGrad.addColorStop(1, "rgba(" + COLOR_BEIGE + ", 0)");
      ctx.fillStyle = glintGrad;
      ctx.beginPath();
      ctx.arc(glintX, glintY, glintR * 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // ── PASS 4: Directional Meniscus Boundary Rim ─────────────
    ctx.save();
    traceSpline(ctx);

    // Soft ambient glow
    ctx.strokeStyle = "rgba(" + COLOR_BEIGE + ", " + (d.strokeAlpha * 0.22) + ")";
    ctx.lineWidth = R > 60 ? 2.4 : 1.7;
    ctx.stroke();

    // Directional crisp contour
    const rimGrad = ctx.createLinearGradient(
      d.x - R, d.y - R,
      d.x + R, d.y + R
    );
    rimGrad.addColorStop(0, "rgba(" + COLOR_BEIGE + ", " + (d.strokeAlpha * 1.35) + ")");
    rimGrad.addColorStop(0.38, "rgba(" + COLOR_CHAMPAGNE + ", " + (d.strokeAlpha * 0.65) + ")");
    rimGrad.addColorStop(0.72, "rgba(" + COLOR_CHAMPAGNE + ", " + (d.strokeAlpha * 0.65) + ")");
    rimGrad.addColorStop(1, "rgba(" + COLOR_BEIGE + ", " + (d.strokeAlpha * 0.95) + ")");

    traceSpline(ctx);
    ctx.strokeStyle = rimGrad;
    ctx.lineWidth = R > 70 ? 1.25 : 1.05;
    ctx.shadowColor = "rgba(" + COLOR_BEIGE + ", " + (d.strokeAlpha * 0.35) + ")";
    ctx.shadowBlur = 5;
    ctx.stroke();
    ctx.restore();
  }

  // ── Render Suspended Liquid Mote ───────────────────────────
  function drawMote(m, t, dt) {
    const targetMoteOffset = Math.max(-70, Math.min(80, smoothedScrollVelocity * 0.035 * (m.orbitRx / 15)));
    m.scrollOffsetY = m.scrollOffsetY || 0;
    m.scrollOffsetY += (targetMoteOffset - m.scrollOffsetY) * (1 - Math.exp(-6.0 * dt));

    const mx = width * m.relX + Math.cos(t * m.speed + m.phase) * m.orbitRx;
    const my = height * m.relY + Math.sin(t * m.speed * 0.85 + m.phase) * m.orbitRy + m.scrollOffsetY;
    const pulseA = m.alphaBase * (0.75 + Math.sin(t * 0.0009 + m.phase) * 0.25);

    // Soft outer glow
    ctx.beginPath();
    ctx.arc(mx, my, m.r * 2.0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(" + COLOR_BEIGE + ", " + (pulseA * 0.25).toFixed(3) + ")";
    ctx.fill();

    // Core dew
    ctx.beginPath();
    ctx.arc(mx, my, m.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(" + COLOR_BEIGE + ", " + pulseA.toFixed(3) + ")";
    ctx.fill();
  }

  // ── Render Complete Frame ───────────────────────────────────
  function render(time, dt) {
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const t = time || 0;

    // Smooth scroll velocity tracking
    const currentScrollSpeed = scrollImpulse / Math.max(dt, 0.001);
    scrollImpulse = 0;
    smoothedScrollVelocity += (currentScrollSpeed - smoothedScrollVelocity) * (1 - Math.exp(-9.0 * dt));

    // Smooth cursor interpolation
    const mouseInfluenceLambda = 5.0;
    mouse.influence += (mouse.targetInfluence - mouse.influence) * (1 - Math.exp(-mouseInfluenceLambda * dt));

    if (mouse.influence > 0.001) {
      const posLambda = 9.0;
      const prevMx = mouse.x;
      const prevMy = mouse.y;
      mouse.x += (mouse.targetX - mouse.x) * (1 - Math.exp(-posLambda * dt));
      mouse.y += (mouse.targetY - mouse.y) * (1 - Math.exp(-posLambda * dt));
      mouse.vx = (mouse.x - prevMx) / Math.max(dt, 0.001);
      mouse.vy = (mouse.y - prevMy) / Math.max(dt, 0.001);
      mouse.speed = Math.hypot(mouse.vx, mouse.vy);
    } else {
      mouse.vx = 0;
      mouse.vy = 0;
      mouse.speed = 0;
    }

    // 1. Draw floating fluid droplets with gravity & settling
    for (let i = 0; i < droplets.length; i++) {
      drawFluidDroplet(droplets[i], t, dt);
    }

    // 2. Draw ambient floating liquid motes
    for (let j = 0; j < motes.length; j++) {
      drawMote(motes[j], t, dt);
    }

    ctx.restore();
  }

  // ── Reduced motion mode: draw static elegant constellation ──
  if (REDUCED_MOTION) {
    render(2500, 0.016);
    return;
  }

  // ── Animation Loop with Visibility & Intersection Gating ───
  let animId = null;
  let isRunning = false;
  let isIntersecting = true;
  let lastTime = 0;

  function loop(timestamp) {
    if (!isRunning) return;
    if (!lastTime) lastTime = timestamp;
    const rawDt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    const dt = Math.max(0.001, Math.min(rawDt, 0.064));

    render(timestamp, dt);
    animId = requestAnimationFrame(loop);
  }

  function start() {
    if (!isRunning && isIntersecting && !document.hidden) {
      isRunning = true;
      lastTime = 0;
      animId = requestAnimationFrame(loop);
    }
  }

  function stop() {
    if (isRunning) {
      isRunning = false;
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      lastTime = 0;
    }
  }

  // Tab visibility toggle
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  // Resume animation and re-sync canvas on page restore (BFCache / history navigation)
  window.addEventListener("pageshow", function () {
    resize();
    start();
  });

  // IntersectionObserver: pauses animation when main-page is not in view
  let mainPage = document.getElementById("main-page");
  let mainObserver = null;

  function observeMainPage() {
    if (mainObserver) mainObserver.disconnect();
    mainPage = document.getElementById("main-page");
    if ("IntersectionObserver" in window && mainPage) {
      mainObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        isIntersecting = entry.isIntersecting;
        if (isIntersecting) {
          start();
        } else {
          stop();
        }
      });
      }, { threshold: 0.01 });
      mainObserver.observe(mainPage);
    } else {
      isIntersecting = true;
      start();
    }
  }

  observeMainPage();

  // Sync initial start with flash screen reveal if present
  if (mainPage && !mainPage.classList.contains("visible")) {
    const flashObserver = new MutationObserver(function () {
      if (mainPage.classList.contains("visible")) {
        resize();
        start();
        flashObserver.disconnect();
      }
    });
    flashObserver.observe(mainPage, { attributes: true, attributeFilter: ["class"] });
  } else {
    start();
  }

  window.__initMindWaves = function () {
    const canvasEl = document.getElementById("mind-art-canvas");
    if (!canvasEl) return;
    const wrapEl = document.querySelector(".mind-art-wrap");
    if (wrapEl) wrap = wrapEl;
    canvas = canvasEl;
    observeMainPage();
    resize();
    isIntersecting = true;
    start();
  };

  window.__stopMindWaves = function () {
    stop();
  };

})();
