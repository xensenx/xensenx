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

  /* ── Configure article "back" links ──
     Ensures articles and subpages reliably return to their parent section:
     - Posts (/posts/*) -> posts section (/posts on production, ../posts.html on localhost)
     - Research (/research/*) -> work section (/work on production, ../work.html on localhost)
     - About (/about) -> mind section (/ on production, index.html on localhost) */
  try {
    var rawPath = window.location.pathname.replace(/\\/g, "/");
    var inPosts = rawPath.indexOf("/posts/") !== -1;
    var inResearch = rawPath.indexOf("/research/") !== -1;
    var isClean = (rawPath.indexOf(".html") === -1 && window.location.protocol !== "file:");

    var backLink = document.querySelector("a[data-back]");
    if (backLink) {
      if (inPosts) {
        // Detect whether this post was opened from the mind section (e.g. featured posts)
        var search = window.location.search || "";
        var isFromMind = /[?&]from=mind(?:&|$)/.test(search);

        // Fallback: inspect document.referrer if opened within same origin
        if (!isFromMind && document.referrer) {
          try {
            var refUrl = new URL(document.referrer);
            if (refUrl.origin === window.location.origin) {
              var refPath = refUrl.pathname.replace(/\\/g, "/");
              var isMindRef = (refPath === "" || refPath === "/" || refPath.slice(-11) === "/index.html" || refPath === "index.html")
                && refPath.indexOf("/posts") === -1
                && refPath.indexOf("/work") === -1
                && refPath.indexOf("/contact") === -1;
              if (isMindRef) {
                isFromMind = true;
              }
            }
          } catch (refErr) {
            if (document.referrer.indexOf("index.html") !== -1 && document.referrer.indexOf("posts") === -1) {
              isFromMind = true;
            }
          }
        }

        if (isFromMind) {
          backLink.setAttribute("href", isClean ? "/" : "../index.html");
          backLink.setAttribute("aria-label", "Back to mind");
        } else {
          backLink.setAttribute("href", isClean ? "/posts" : "../posts.html");
          backLink.setAttribute("aria-label", "Back to posts");
        }

        // Intercept click: if valid history exists matching the intended section,
        // use history.back() for instant scroll & state restoration.
        backLink.addEventListener("click", function (e) {
          // Allow modifier clicks (Cmd/Ctrl/Shift/Alt/middle-click) to open link target naturally
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
            return;
          }

          if (window.history.length > 1 && document.referrer) {
            try {
              var ref = new URL(document.referrer);
              if (ref.origin === window.location.origin) {
                var p = ref.pathname.replace(/\\/g, "/");
                var cameFromMind = (p === "" || p === "/" || p.slice(-11) === "/index.html" || p === "index.html")
                  && p.indexOf("/posts") === -1 && p.indexOf("/work") === -1;
                var cameFromPosts = p.indexOf("/posts") !== -1;

                if ((isFromMind && cameFromMind) || (!isFromMind && cameFromPosts)) {
                  e.preventDefault();
                  window.history.back();
                  return;
                }
              }
            } catch (clickErr) { /* Fall through to default href navigation */ }
          }
        });

      } else if (inResearch) {
        backLink.setAttribute("href", isClean ? "/work" : "../work.html");
      } else {
        backLink.setAttribute("href", isClean ? "/" : "index.html");
      }
    }
  } catch (err) { /* Keep static HTML default */ }

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