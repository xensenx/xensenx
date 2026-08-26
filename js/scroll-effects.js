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

  const sections = [...document.querySelectorAll(".sticky-section")];

  function update() {
    const vh = window.innerHeight;

    sections.forEach(function (section) {
      const rect = section.getBoundingClientRect();

      // ── Exit progress ────────────────────────────────────────
      // How far has the section scrolled above its in-focus position?
      // 0 = in-focus (rect.top === 0)
      // 1 = one full viewport above (rect.top === -vh), completely gone
      const exitProg = Math.max(0, Math.min(1, -rect.top / vh));

      // ── Enter progress ───────────────────────────────────────
      // How far is the section below its in-focus position?
      // 0 = in-focus (rect.top === 0)
      // 1 = one full viewport below (rect.top === vh), not yet visible
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
      // 1.0 at in-focus → 0.88 fully off-screen.
      // Deliberate and slow — not a snap.
      const scale = 1 - dev * 0.12;

      // ── Blur ─────────────────────────────────────────────────
      // Quadratic: very gentle near centre, heavier toward the edges.
      // Peaks at ~10px when the section is fully off-screen.
      const blur = dev * dev * 10;

      // ── Opacity ──────────────────────────────────────────────
      // Fades out as the section moves away. Fully gone at dev ≈ 0.9.
      const opacity = Math.max(0, 1 - dev * 1.1);

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
