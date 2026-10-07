/**
 * scroll-effects.js
 *
 * Each section has an "in-focus" position: rect.top === 0
 * (section top sits flush with the viewport top, filling the screen).
 *
 * As a section moves AWAY from that position — either scrolling
 * up out of view, or not yet arrived from below — it is penalised:
 *   scale down, blur up, fade.
 *
 * This means:
 *   — exiting section: shrinks and blurs AS IT TRAVELS upward
 *   — entering section: starts small and blurry at the bottom,
 *     grows and clarifies as it rises to fill the viewport
 *
 * No sticky. No deck. Just scroll-driven transforms.
 */

(function () {
  "use strict";

  // Respect OS-level reduced-motion preference — plain scrolling, no transforms.
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const sections = [...document.querySelectorAll(".sticky-section")];

  function update() {
    const vh = window.innerHeight;

    sections.forEach(function (section) {
      const rect = section.getBoundingClientRect();

      // ── Exit progress ────────────────────────────────────────
      // How far has the section scrolled above its in-focus position?
      // But if the section is taller than vh, it shouldn't start exiting until its bottom is near the top.
      const sectionHeight = rect.height;
      const scrollDistance = -rect.top;
      let exitProg = 0;
      
      if (scrollDistance > 0) {
        // We have scrolled past the top of the section.
        // It should remain fully in-focus until the bottom approaches the top of the viewport.
        // Actually, if we just want it to act like a normal section, 
        // we can measure exit relative to its bottom.
        const exitStart = Math.max(0, sectionHeight - vh);
        exitProg = Math.max(0, Math.min(1, (scrollDistance - exitStart) / vh));
      }

      // ── Enter progress ───────────────────────────────────────
      const enterProg = Math.max(0, Math.min(1, rect.top / vh));

      // Deviation: whichever is greater — exiting OR entering
      const dev = Math.max(exitProg, enterProg);

      // At in-focus: dev = 0 → strip all applied styles
      if (dev < 0.005) {
        section.style.transform = "";
        section.style.filter    = "";
        section.style.opacity   = "";
        return;
      }

      // ── Scale ────────────────────────────────────────────────
      // Gentler shrink — 1.0 at focus, 0.92 fully off-screen
      const scale = 1 - dev * 0.08;

      // ── Blur ─────────────────────────────────────────────────
      // Softer curve — peaks ~6px off-screen, barely noticeable near centre
      const blur = dev * dev * 6;

      // ── Opacity ──────────────────────────────────────────────
      // Stays visible longer before fading — fully gone at dev ≈ 1.1
      const opacity = Math.max(0, 1 - dev * 0.9);

      section.style.transform = "scale(" + scale.toFixed(4) + ")";
      section.style.filter    = blur > 0.05
        ? "blur(" + blur.toFixed(2) + "px)"
        : "";
      section.style.opacity   = opacity.toFixed(4);
    });
  }

  // ── rAF-throttled scroll listener ───────────────────────────
  let ticking = false;

  window.addEventListener("scroll", function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        update();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener("resize", update, { passive: true });

  // Initial state
  update();

})();
