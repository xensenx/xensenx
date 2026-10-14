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

  /* ── Memory & behavior for article "back" links ──
     Records the visited section (posts, work, contact, about, index) so
     detail pages (posts, research, about) know where the user arrived from.
     Also handles clean URLs vs .html extensions and utilizes browser history
     when available so returning preserves scroll position. */
  try {
    var rawPath = window.location.pathname.replace(/\\/g, "/");
    var cleanPath = rawPath.replace(/\/+$/, "");
    var file = cleanPath.split("/").pop() || "index.html";
    var section = file.replace(/\.html$/i, "") || "index";
    var inSubfolder = rawPath.indexOf("/posts/") !== -1 ||
                      rawPath.indexOf("/research/") !== -1;
    var isClean = (rawPath.indexOf(".html") === -1 && window.location.protocol !== "file:");

    // If on a top-level section page, record it as the user's previous section
    if (!inSubfolder && (section === "posts" || section === "work" || section === "contact" || section === "about" || section === "index")) {
      sessionStorage.setItem("xsn_prev_section", section);
      var prevPage = isClean ? (section === "index" ? "" : section) : (section === "index" ? "index.html" : (section + ".html"));
      sessionStorage.setItem("xsn_prev_page", prevPage);
    }

    var backLink = document.querySelector("a[data-back]");
    if (backLink) {
      var storedSection = sessionStorage.getItem("xsn_prev_section");
      
      // Determine default parent section if no session history exists
      var defaultSection = "index";
      if (rawPath.indexOf("/posts/") !== -1) {
        defaultSection = "posts";
      } else if (rawPath.indexOf("/research/") !== -1) {
        defaultSection = "work";
      }

      var targetSection = storedSection || defaultSection;
      var prefix = inSubfolder ? "../" : "";
      var targetHref;

      if (targetSection === "index") {
        targetHref = inSubfolder ? (isClean ? "../" : "../index.html") : (isClean ? "/" : "index.html");
      } else {
        targetHref = prefix + (isClean ? targetSection : (targetSection + ".html"));
      }

      backLink.setAttribute("href", targetHref);

      // When clicked, if the user navigated here from within the same domain,
      // use history.back() to preserve scroll position and filter state.
      backLink.addEventListener("click", function (e) {
        if (document.referrer && document.referrer.indexOf(window.location.origin) === 0) {
          try {
            var refUrl = new URL(document.referrer);
            var refClean = refUrl.pathname.replace(/\/+$/, "");
            var curClean = window.location.pathname.replace(/\/+$/, "");
            if (refClean && refClean !== curClean) {
              e.preventDefault();
              window.history.back();
              return;
            }
          } catch (_) {}
        }
      });
    }
  } catch (err) { /* storage unavailable - links keep their defaults */ }

  var header   = document.querySelector("header") || document.querySelector(".article-nav");
  if (!header) return;

  var lastY    = 0;
  var ticking  = false;
  var THRESHOLD = 80; // px - below this, nav always shows

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