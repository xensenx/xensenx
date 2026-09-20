/**
 * nav.js
 *
 * Smart hide-on-scroll-down, show-on-scroll-up behaviour for
 * the main <header> on all non-index pages (work, contact, about, etc.).
 *
 * Also adds a `.scrolled` class when past 80px so a frosted
 * background appears, preventing text beneath from bleeding through.
 */

(function () {
  "use strict";

  var header   = document.querySelector("header") || document.querySelector(".article-nav");
  if (!header) return;

  var lastY    = 0;
  var ticking  = false;
  var THRESHOLD = 80; // px — below this, nav always shows

  function update() {
    var y = window.scrollY;

    // Frosted background once past threshold
    if (y > THRESHOLD) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
      header.classList.remove("nav-hidden"); // always visible at top
      lastY = y;
      ticking = false;
      return;
    }

    // Hide when scrolling down, show when scrolling up
    if (y > lastY + 4) {
      header.classList.add("nav-hidden");
    } else if (y < lastY - 4) {
      header.classList.remove("nav-hidden");
    }

    lastY   = y;
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  // Initial state
  update();

})();
